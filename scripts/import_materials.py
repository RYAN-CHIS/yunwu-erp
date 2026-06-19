#!/usr/bin/env python3
"""
从 Excel「允物品牌经营系统_V1.xlsx」导入材料数据到 PostgreSQL
使用 psycopg2 直连 Neon，绕过 Prisma 连接池问题

运行：python3 scripts/import_materials.py
"""
import re
import sys
import psycopg2
import pandas as pd

# ── 读取 DATABASE_URL ──
env_path = "/Users/ryan/yunwu-brand-os/.env"
with open(env_path) as f:
    content = f.read()
m = re.search(r'DATABASE_URL="(.+?)"', content)
if not m:
    m = re.search(r"DATABASE_URL=(.+?)(?:\n|\r|$)", content)
dsn = m.group(1)

# ── 读取 Excel ──
excel_path = "/Users/ryan/Desktop/允物品牌经营系统_V1.xlsx"
df = pd.read_excel(excel_path, sheet_name="01原料采购库")

print(f"📊 Excel 总行数: {len(df)}")

# ── 过滤有效行 ──
df = df[df["原料编码"].notna()]
df = df[df["原料编码"].astype(str).str.strip() != ""]
print(f"📊 有效行: {len(df)}")

# ── 枚举映射 ──
def map_material_type(cat):
    m = {
        "沉香": "INCENSE", "老山檀": "INCENSE",
        "配件": "METAL",
        "大漆珠": "CERAMIC",
        "蜜蜡": "BEAD", "青金石": "BEAD", "猛犸": "BEAD", "南红": "BEAD",
        "白水晶": "BEAD", "白兔毛": "BEAD", "月光石": "BEAD", "草莓晶": "BEAD",
        "粉水晶": "BEAD", "紫水晶": "BEAD", "堇青石": "BEAD", "茶晶": "BEAD",
    }
    return m.get(cat, "BEAD")

def extract_shape(remark):
    r = str(remark).strip()
    keywords = [
        "方糖", "圆珠", "老型", "桶珠", "随形", "三通", "挂饰", "方块",
        "汉堡珠", "配珠", "隔珠", "盖珠", "镭光珠", "花纹圆珠", "镶钻圆珠",
    ]
    for kw in keywords:
        if kw in r:
            return kw
    if r in ("银镀金", "18K金"):
        return "配件"
    if r == "孔道差":
        return "圆珠"
    if r in ("乌拉圭", "巴西"):
        return "圆珠"
    return r if r else None

# ── 连接数据库 ──
conn = psycopg2.connect(dsn, connect_timeout=30)
conn.autocommit = False
cur = conn.cursor()

try:
    mat_created = 0
    mat_updated = 0
    pr_created = 0
    errors = 0

    for _, row in df.iterrows():
        code = str(row["原料编码"]).strip()
        category = str(row["品类"]).strip()
        name = str(row["名称"]).strip()
        supplier = str(row["供应商"]).strip()
        specification = str(row["规格mm"])
        unit = str(row["单位"]).strip()
        purchase_unit_price = float(row["采购单价"]) if pd.notna(row["采购单价"]) else 0
        purchase_qty = int(row["采购数量"]) if pd.notna(row["采购数量"]) else 0
        purchase_price = float(row["采购总价"]) if pd.notna(row["采购总价"]) else 0
        unit_cost = float(row["单颗成本"]) if pd.notna(row["单颗成本"]) else 0
        beads = int(row["颗数/条"]) if pd.notna(row["颗数/条"]) else 0
        weight = float(row["单圈克重"]) if pd.notna(row["单圈克重"]) else 0
        remark = str(row["备注"]).strip() if pd.notna(row["备注"]) else ""
        inv_qty = int(row["合计单数"]) if pd.notna(row["合计单数"]) else 0

        material_type = map_material_type(category)
        shape = extract_shape(remark)
        inventory_unit = "颗" if unit == "串" else unit

        # 换算率
        default_purchase_unit = "颗"
        conversion_rate = 1.0
        if unit == "克" and weight > 0:
            default_purchase_unit = "颗"
            conversion_rate = beads / weight
        elif unit == "串":
            default_purchase_unit = "串"
        elif unit == "个":
            default_purchase_unit = "个"

        uc = round(unit_cost, 2)
        ws = round(weight, 2)
        cr = round(conversion_rate, 4)

        try:
            # ── Upsert raw_material ──
            cur.execute("SELECT id FROM raw_materials WHERE code = %s", (code,))
            existing = cur.fetchone()

            if existing:
                cur.execute("""
                    UPDATE raw_materials SET
                        name = %s, category = %s, "materialType" = %s,
                        specification = %s, "inventoryUnit" = %s,
                        "unitCost" = %s, status = 'ACTIVE', shape = %s,
                        beads_per_strand = %s, weight_per_strand = %s,
                        default_purchase_unit = %s,
                        default_conversion_rate = %s,
                        supplier = %s, remark = %s, updated_at = NOW()
                    WHERE code = %s
                """, (name, category, material_type, specification, inventory_unit,
                      uc, shape, beads, ws, default_purchase_unit,
                      cr, supplier, remark, code))
                mat_updated += 1
            else:
                cur.execute("""
                    INSERT INTO raw_materials (
                        code, name, category, "materialType", specification,
                        "inventoryUnit", "unitCost", remaining, status, shape,
                        beads_per_strand, weight_per_strand, default_purchase_unit,
                        default_conversion_rate, supplier, remark
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'ACTIVE',%s,%s,%s,%s,%s,%s,%s)
                """, (code, name, category, material_type, specification,
                      inventory_unit, uc, inv_qty, shape, beads, ws,
                      default_purchase_unit, cr, supplier, remark))
                mat_created += 1

            # ── 获取 material id ──
            cur.execute("SELECT id FROM raw_materials WHERE code = %s", (code,))
            mat_id = cur.fetchone()[0]

            # ── 检查已有采购记录 ──
            cur.execute("""
                SELECT id FROM purchase_records
                WHERE "materialId" = %s AND supplier = %s
                  AND purchase_unit_price = %s AND "purchaseQuantity" = %s
            """, (mat_id, supplier, purchase_unit_price, purchase_qty))
            existing_pr = cur.fetchone()

            if existing_pr:
                cur.execute("""
                    UPDATE purchase_records SET
                        "purchasePrice" = %s, inventory_quantity = %s,
                        "unitCost" = %s, remark = %s
                    WHERE id = %s
                """, (purchase_price, inv_qty, uc, remark, existing_pr[0]))
            else:
                cur.execute("""
                    INSERT INTO purchase_records (
                        "materialId", purchase_date, supplier, "purchaseUnit",
                        "conversionRate", "purchaseQuantity", purchase_unit_price,
                        "purchasePrice", inventory_quantity, "unitCost", remark
                    ) VALUES (%s,'2025-01-01',%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (mat_id, supplier, unit, 1, purchase_qty,
                      purchase_unit_price, purchase_price, inv_qty, uc, remark))
            pr_created += 1

        except Exception as e:
            print(f"  ❌ {code}: {e}")
            errors += 1
            conn.rollback()
            continue

    conn.commit()
    print(f"\n✅ 材料: 新建 {mat_created}, 更新 {mat_updated}")
    print(f"✅ 采购记录: {pr_created} 条")
    if errors:
        print(f"⚠️ 失败: {errors} 条")

except Exception as e:
    conn.rollback()
    print(f"💥 导入异常: {e}")
    raise
finally:
    cur.close()
    conn.close()

# ── 最终验证 ──
conn2 = psycopg2.connect(dsn, connect_timeout=10)
cur2 = conn2.cursor()
cur2.execute("SELECT COUNT(*) FROM raw_materials")
rm = cur2.fetchone()[0]
cur2.execute("SELECT COUNT(*) FROM purchase_records")
pr = cur2.fetchone()[0]
print(f"\n📋 最终: raw_materials={rm}, purchase_records={pr}")

# 按品类统计
cur2.execute("""
    SELECT category, COUNT(*) FROM raw_materials
    GROUP BY category ORDER BY COUNT(*) DESC
""")
print("\n按品类分布:")
for cat, cnt in cur2.fetchall():
    print(f"  {cat}: {cnt}")

cur2.close()
conn2.close()
