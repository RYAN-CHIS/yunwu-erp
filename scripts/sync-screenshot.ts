import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

// 截图数据
const rows = [
  {
    code: "st001",
    category: "老山檀",
    name: "老山檀8",
    supplier: "天韵沉香",
    spec: "8mm",
    purchaseQty: 1,       // 采购串数
    strandPrice: 108,     // 采购单价(每串)
    totalPrice: 370,      // 采购总价
    beadsPerStrand: 108,  // 颗数/条
    unitCost: 3.43,       // 单颗成本 = 370/108
    totalBeads: 108,      // 合计单数 = 1×108
  },
  {
    code: "st002",
    category: "老山檀",
    name: "老山檀10",
    supplier: "天韵沉香",
    spec: "10mm",
    purchaseQty: 3,
    strandPrice: 140,
    totalPrice: 420,
    beadsPerStrand: 19,
    unitCost: 7.37,
    totalBeads: 57,
  },
  {
    code: "dq001",
    category: "大漆珠",
    name: "大漆珠",
    supplier: "天韵沉香",
    spec: "10mm",
    purchaseQty: 1,
    strandPrice: 5,
    totalPrice: 135,
    beadsPerStrand: 27,
    unitCost: 5.0,
    totalBeads: 27,
  },
];

async function main() {
  // 清理可能残留的数据
  await p.rawMaterial.deleteMany({
    where: { code: { in: rows.map((r) => r.code) } },
  });
  console.log("Cleaned existing entries");

  for (const r of rows) {
    // 1. 创建原材料
    const mat = await p.rawMaterial.create({
      data: {
        code: r.code,
        name: r.name,
        category: r.category,
        materialType: "BEAD",
        specification: r.spec,
        inventoryUnit: "颗",
        defaultPurchaseUnit: "串",
        beadsPerStrand: r.beadsPerStrand,
        defaultConversionRate: r.beadsPerStrand,
        remaining: r.totalBeads,
        unitCost: r.unitCost,
        supplier: r.supplier,
        remark: r.category,
      },
    });
    console.log(`✅ Material: ${mat.code} ${mat.name} | 库存${mat.remaining}${mat.inventoryUnit}`);

    // 2. 创建采购记录（使用 materialId）
    const pr = await p.purchaseRecord.create({
      data: {
        materialId: mat.id,
        purchaseUnit: "串",
        conversionRate: r.beadsPerStrand,
        purchaseQuantity: r.purchaseQty,
        purchaseUnitPrice: r.strandPrice,
        purchasePrice: r.totalPrice,
        inventoryQuantity: r.totalBeads,
        unitCost: r.unitCost,
        supplier: r.supplier,
        remark: `采购${r.name}`,
      },
    });
    console.log(
      `  ✅ Purchase #${pr.id}: ${r.purchaseQty}串 × ¥${r.strandPrice} = ¥${r.totalPrice} → ${r.totalBeads}颗`
    );

    // 3. 创建库存入库记录
    const tx = await p.inventoryTransaction.create({
      data: {
        materialId: mat.id,
        type: "IN",
        quantity: r.totalBeads,
        beforeQty: 0,
        afterQty: r.totalBeads,
        remark: `初始入库-${r.name}-${r.totalBeads}颗`,
      },
    });
    console.log(`  ✅ Inventory #${tx.id}: +${tx.quantity}颗 (${tx.beforeQty}→${tx.afterQty})`);
  }

  const total = await p.rawMaterial.count();
  const beadCount = await p.rawMaterial.aggregate({
    _sum: { remaining: true },
    where: { materialType: "BEAD" },
  });
  const accCount = await p.rawMaterial.aggregate({
    _sum: { remaining: true },
    where: { materialType: "ACCESSORY" },
  });

  console.log(`\n📊 录入完成！系统总计 ${total} 种材料`);
  console.log(`   珠子系统: ~${Math.round(beadCount._sum.remaining || 0)} 颗`);
  console.log(`   配件系统: ~${Math.round(accCount._sum.remaining || 0)} 个`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
