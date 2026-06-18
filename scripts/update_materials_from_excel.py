#!/usr/bin/env python3
"""根据Excel数据，按照cx001/cx002逻辑批量更新材料库

逻辑：
- BEAD材料（沉香/蜜蜡/青金石）：核算单位=颗, 采购单位=串, 库存=采购数量×颗数/条, 成本=单颗成本
- METAL配件：库存=采购数量, 成本=采购单价
"""

import sqlite3
import openpyxl
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "prisma", "prisma", "yunwu.db")
EXCEL_PATH = "/Users/ryan/Desktop/允物品牌经营系统_V1.xlsx"

def main():
    # 1. 读取Excel
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    ws = wb["01原料采购库"]
    
    # 解析Excel数据（跳过表头）
    excel_data = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row[1]:  # 无编码跳过
            continue
        code = str(row[1]).strip()
        excel_data[code] = {
            "purchase_date": row[0],
            "code": code,
            "category": str(row[2] or ""),
            "name": str(row[3] or ""),
            "supplier": str(row[4] or ""),
            "specs": row[5],           # 规格 (mm)
            "unit": str(row[6] or ""), # 采购单位
            "quantity": float(row[7] or 0),   # 采购数量
            "total_price": float(row[8] or 0), # 采购总价
            "unit_price": row[9],      # 单价(自动)
            "notes": str(row[10] or ""), # 备注/形状
            "purchase_price": row[11], # 采购单价
            "count_per_strand": int(row[12] or 0), # 颗数/条
            "weight_per_piece": row[13], # 单圈克重
            "cost_per_piece": row[14],   # 单颗成本
            "shop_address": str(row[15] or ""),
            "contact": str(row[16] or ""),
        }
    
    print(f"从Excel读取了 {len(excel_data)} 条材料数据")
    
    # 2. 连接数据库
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 获取现有材料
    cur.execute("SELECT code, materialType, inventoryUnit, remaining, unitCost, default_purchase_unit, default_conversion_rate, beads_per_strand FROM raw_materials")
    db_materials = {row[0]: row for row in cur.fetchall()}
    
    updates = []
    skip_codes = []
    no_change = []
    
    for code, ex in excel_data.items():
        if code not in db_materials:
            print(f"  ⚠ {code} 不在数据库中，跳过")
            skip_codes.append(code)
            continue
        
        db = db_materials[code]
        material_type = db[1]  # materialType
        
        if material_type == "BEAD" and ex["count_per_strand"] > 0:
            # BEAD材料：应用cx001/cx002逻辑
            # 核算库存 = 采购数量 × 颗数/条
            new_remaining = round(ex["quantity"] * ex["count_per_strand"], 2)
            # 单颗成本（保留2位小数）
            new_unit_cost = round(ex["cost_per_piece"], 2) if ex["cost_per_piece"] else None
            # 形状
            new_shape = ex["notes"]
            
            new_inventory_unit = "颗"
            new_purchase_unit = "串"
            new_conversion_rate = ex["count_per_strand"]
            
            # 检查是否有变化
            if (abs(db[3] - new_remaining) < 0.01 and
                (db[4] is None and new_unit_cost is None or
                 db[4] is not None and new_unit_cost is not None and abs(db[4] - new_unit_cost) < 0.01) and
                db[2] == new_inventory_unit and
                db[5] == new_purchase_unit and
                abs((db[6] or 1) - new_conversion_rate) < 0.01):
                no_change.append(code)
                continue
            
            updates.append({
                "code": code,
                "inventoryUnit": new_inventory_unit,
                "remaining": new_remaining,
                "unitCost": new_unit_cost,
                "default_purchase_unit": new_purchase_unit,
                "default_conversion_rate": new_conversion_rate,
                "shape": new_shape,
            })
            print(f"  ✓ {code} ({ex['name']}): "
                  f"库存 {db[3]}{db[2]} → {new_remaining}{new_inventory_unit}, "
                  f"成本 {db[4]} → {new_unit_cost}, "
                  f"采购单位 {db[5]} → {new_purchase_unit}, "
                  f"换算率 {db[6]} → {new_conversion_rate}")
        
        elif material_type == "METAL":
            # 配件：库存=采购数量, 成本=采购单价
            new_remaining = ex["quantity"]
            new_unit_cost = round(float(ex["purchase_price"]), 2) if ex["purchase_price"] else None
            
            if (abs(db[3] - new_remaining) < 0.01 and
                (db[4] is None and new_unit_cost is None or
                 db[4] is not None and new_unit_cost is not None and abs(db[4] - new_unit_cost) < 0.01)):
                no_change.append(code)
                continue
            
            updates.append({
                "code": code,
                "inventoryUnit": db[2],
                "remaining": new_remaining,
                "unitCost": new_unit_cost,
                "default_purchase_unit": db[5],
                "default_conversion_rate": db[6],
                "shape": db[7],
            })
            print(f"  ✓ {code} ({ex['name']}): 库存 {db[3]} → {new_remaining}, 成本 {db[4]} → {new_unit_cost}")
    
    # 3. 执行更新
    if updates:
        print(f"\n共 {len(updates)} 条需要更新")
        for u in updates:
            cur.execute("""
                UPDATE raw_materials 
                SET inventoryUnit = ?, remaining = ?, unitCost = ?, 
                    default_purchase_unit = ?, default_conversion_rate = ?, 
                    shape = ?, updated_at = datetime('now')
                WHERE code = ?
            """, (
                u["inventoryUnit"], u["remaining"], u["unitCost"],
                u["default_purchase_unit"], u["default_conversion_rate"],
                u["shape"], u["code"]
            ))
        conn.commit()
        print("✅ 数据库更新完成")
    else:
        print("\n✅ 所有数据已是最新，无需更新")
    
    if no_change:
        print(f"  无需变更: {', '.join(no_change)}")
    
    # 4. 特殊处理：pj005 类型修正
    cur.execute("SELECT materialType FROM raw_materials WHERE code='pj005'")
    pj005_type = cur.fetchone()
    if pj005_type and pj005_type[0] == "BEAD":
        cur.execute("UPDATE raw_materials SET materialType='METAL', updated_at=datetime('now') WHERE code='pj005'")
        conn.commit()
        print("  ✓ pj005 materialType: BEAD → METAL")
    
    # 5. 验证
    print("\n=== 更新后数据 ===")
    cur.execute("""
        SELECT code, name, materialType, inventoryUnit, remaining, unitCost, 
               default_purchase_unit, default_conversion_rate
        FROM raw_materials ORDER BY id
    """)
    for row in cur.fetchall():
        print(f"  {row[0]:8s} | {row[1]:12s} | {row[2]:6s} | {row[3]:4s} | 库存={row[4]:6.1f} | 成本={row[5]} | 采购={row[6]} | 换算={row[7]}")
    
    conn.close()

if __name__ == "__main__":
    main()
