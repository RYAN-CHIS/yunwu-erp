/**
 * 从 Excel「允物品牌经营系统_V1.xlsx」导入材料数据到 ERP 数据库
 *
 * 功能：
 * 1. Upsert raw_material（按 code 更新或创建）
 * 2. 创建 purchase_record（每次采购一条记录）
 *
 * 运行：npx tsx scripts/import-materials-from-excel.ts
 */
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

// Excel 列类型
interface ExcelRow {
  原料编码?: string;
  品类?: string;
  名称?: string;
  供应商?: string;
  规格mm?: number | string;
  单位?: string;
  采购数量?: number;
  采购总价?: number;
  "单价(自动)"?: number;
  备注?: string;
  采购单价?: number;
  "颗数/条"?: number;
  单圈克重?: number;
  单颗成本?: number;
  合计单数?: number;
}

function extractShape(remark: string): string {
  const r = remark.trim();
  if (r.includes("方糖")) return "方糖";
  if (r.includes("圆珠")) return "圆珠";
  if (r.includes("老型")) return "老型珠";
  if (r.includes("桶珠")) return "桶珠";
  if (r.includes("随形")) return "随形";
  if (r.includes("三通")) return "三通";
  if (r.includes("挂饰")) return "挂饰";
  if (r.includes("方块")) return "方块";
  if (r.includes("汉堡珠")) return "汉堡珠";
  if (r.includes("配珠")) return "配珠";
  if (r.includes("隔珠")) return "隔片";
  if (r.includes("盖珠")) return "盖珠";
  if (r.includes("镭光珠")) return "镭光珠";
  if (r.includes("花纹圆珠")) return "花纹圆珠";
  if (r.includes("镶钻圆珠")) return "镶钻圆珠";
  // 通用分类备注
  if (r === "银镀金") return "配件";
  if (r === "18K金") return "配件";
  if (r === "孔道差") return "圆珠";
  if (r === "乌拉圭") return "圆珠";
  if (r === "巴西") return "圆珠";
  return r;
}

// 映射品类到 Prisma MaterialType 枚举
// BEAD | METAL | CERAMIC | LEATHER | INCENSE | CORD | PACKAGING | OTHER
function mapMaterialType(category: string): string {
  switch (category) {
    case "沉香":
    case "老山檀":
      return "INCENSE";
    case "配件":
      return "METAL";
    case "大漆珠":
      return "CERAMIC";
    case "蜜蜡":
    case "青金石":
    case "猛犸":
    case "南红":
    case "白水晶":
    case "白兔毛":
    case "月光石":
    case "草莓晶":
    case "粉水晶":
    case "紫水晶":
    case "堇青石":
    case "茶晶":
      return "BEAD";
    default:
      return "BEAD";
  }
}

function isValidRow(row: ExcelRow): boolean {
  if (!row["原料编码"]) return false;
  const code = String(row["原料编码"]).trim();
  if (code === "" || code === "nan" || code === "NaN") return false;
  return true;
}

async function main() {
  const excelPath = "/Users/ryan/Desktop/允物品牌经营系统_V1.xlsx";

  // 读取 Excel — 使用 XLSX 库
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets["01原料采购库"];
  const allRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
  console.log(`📊 Excel 总行数: ${allRows.length}`);

  // 过滤空行（原料编码缺失或为空）
  const rows: Record<string, any>[] = [];
  for (const r of allRows) {
    const code = r["原料编码"];
    if (code && String(code).trim().length > 0 && String(code).trim() !== "原料编码") {
      rows.push(r);
    }
  }
  console.log(`📊 有效数据行: ${rows.length}`);

  let materialsCreated = 0;
  let materialsUpdated = 0;
  let purchaseCreated = 0;

  for (const row of rows) {
    const code = String(row["原料编码"]).trim();
    const category = String(row["品类"] || "").trim();
    const name = String(row["名称"] || "").trim();
    const supplier = String(row["供应商"] || "").trim();
    const specification = String(row["规格mm"] || "");
    const unit = String(row["单位"] || "").trim();
    const purchaseUnitPrice = Number(row["采购单价"] || 0);
    const purchaseQuantity = Number(row["采购数量"] || 0);
    const purchasePrice = Number(row["采购总价"] || 0);
    const unitCost = Number(row["单颗成本"] || 0);
    const beadsPerStrand = Number(row["颗数/条"] || 0);
    const weightPerStrand = Number(row["单圈克重"] || 0);
    const remark = String(row["备注"] || "").trim();
    const inventoryQuantity = Number(row["合计单数"] || 0);
    const shape = extractShape(remark) || undefined;
    const materialType = mapMaterialType(category);

    // 库存单位：串→颗；克/个不变
    const inventoryUnit = unit === "串" ? "颗" : unit;

    // 默认采购单位换算
    let defaultPurchaseUnit = "颗";
    let defaultConversionRate = 1;
    if (unit === "克" && weightPerStrand > 0) {
      defaultPurchaseUnit = "颗";
      defaultConversionRate = beadsPerStrand / weightPerStrand;
    } else if (unit === "串") {
      defaultPurchaseUnit = "串";
      defaultConversionRate = 1;
    } else if (unit === "个") {
      defaultPurchaseUnit = "个";
      defaultConversionRate = 1;
    }

    // Round values
    const uc = Math.round(unitCost * 100) / 100;
    const wsRounded = Math.round(weightPerStrand * 100) / 100;
    const cr = Math.round(defaultConversionRate * 10000) / 10000;

    try {
      // Upsert raw_material
      const existing = await prisma.rawMaterial.findUnique({ where: { code } });

      const data: any = {
        name,
        category,
        materialType,
        specification,
        inventoryUnit,
        unitCost: uc,
        status: "ACTIVE",
        beadsPerStrand,
        weightPerStrand: wsRounded,
        defaultPurchaseUnit,
        defaultConversionRate: cr,
        supplier,
        remark,
      };
      if (shape) data.shape = shape;

      if (existing) {
        await prisma.rawMaterial.update({ where: { code }, data });
        materialsUpdated++;
      } else {
        data.code = code;
        data.remaining = inventoryQuantity;
        await prisma.rawMaterial.create({ data });
        materialsCreated++;
      }

      // 创建采购记录
      // 检查是否已有相同记录（避免重复导入）
      const material = await prisma.rawMaterial.findUnique({ where: { code } });
      if (material) {
        const existingPr = await prisma.purchaseRecord.findFirst({
          where: {
            materialId: material.id,
            supplier,
            purchaseUnitPrice,
            purchaseQuantity,
          },
        });

        const prData = {
          purchaseDate: new Date("2025-01-01"),
          supplier,
          purchaseUnit: unit,
          conversionRate: 1,
          purchaseQuantity,
          purchaseUnitPrice,
          purchasePrice,
          inventoryQuantity,
          unitCost: uc,
          remark,
        };

        if (existingPr) {
          await prisma.purchaseRecord.update({
            where: { id: existingPr.id },
            data: prData,
          });
        } else {
          await prisma.purchaseRecord.create({
            data: { materialId: material.id, ...prData },
          });
        }
        purchaseCreated++;
      }
    } catch (err: any) {
      console.error(`  ❌ ${code} 失败:`, err.message);
    }
  }

  console.log(`\n✅ 材料: 新建 ${materialsCreated}，更新 ${materialsUpdated}`);
  console.log(`✅ 采购记录: ${purchaseCreated} 条`);

  const matCount = await prisma.rawMaterial.count();
  const prCount = await prisma.purchaseRecord.count();
  console.log(`\n📋 最终状态: raw_materials=${matCount}, purchase_records=${prCount}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("导入失败:", err);
  prisma.$disconnect();
  process.exit(1);
});
