/**
 * 补录最后 2 个 SKU 的 BOM（老山檀 + 沉香）
 */

import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

const p = new PrismaClient();

const BOM_DATA = [
  {
    skuName: '既明·守拙（老山檀）',
    bom: [
      { materialCode: 'LS-10-TY-260616', qty: 16 },
      { materialCode: 'DQ-10-TY-260616', qty: 1 },
      { materialCode: 'GZ-08-PG-260616', qty: 2 },
    ],
  },
  {
    skuName: '既明·定境（沉香）',
    bom: [
      { materialCode: 'CX-10-SG-260616-1', qty: 16 },
      { materialCode: 'DQ-10-TY-260616', qty: 1 },
      { materialCode: 'XY-07-PG-260616', qty: 1 },
    ],
  },
];

async function main() {
  console.log('📋 补录最后 2 个 SKU 的 BOM...\n');

  for (const def of BOM_DATA) {
    const sku = await p.productSku.findFirst({
      where: { name: def.skuName },
    });

    if (!sku) {
      console.log(`  ❌ SKU 未找到: ${def.skuName}`);
      continue;
    }

    // 删除旧的 BOM（如果有不完整的）
    await p.bom.deleteMany({ where: { skuId: sku.id } });
    console.log(`  🔧 录入 BOM: ${sku.code} ${sku.name}`);

    let totalMaterialCost = 0;

    for (const item of def.bom) {
      const material = await p.rawMaterial.findFirst({
        where: { code: item.materialCode },
      });

      if (!material) {
        console.log(`    ❌ 材料未找到: ${item.materialCode}`);
        continue;
      }

      const itemCost = (material.unitCost || 0) * item.qty;
      totalMaterialCost += itemCost;

      await p.bom.create({
        data: {
          skuId: sku.id,
          materialId: material.id,
          quantity: item.qty,
          unitPrice: material.unitCost || 0,
          lineCost: itemCost,
          materialCodeSnapshot: material.code,
          materialNameSnapshot: material.name,
        },
      });

      console.log(`    ✅ ${material.name} × ${item.qty} = ¥${itemCost.toFixed(2)}`);
    }

    const laborCost = Math.round(totalMaterialCost * 0.3);
    const totalCost = totalMaterialCost + laborCost;

    const existingCost = await p.productCost.findFirst({
      where: { skuId: sku.id },
    });

    if (existingCost) {
      await p.productCost.update({
        where: { id: existingCost.id },
        data: {
          materialCost: totalMaterialCost,
          laborCost: laborCost,
          totalCost: totalCost,
        },
      });
    } else {
      await p.productCost.create({
        data: {
          skuId: sku.id,
          materialCost: totalMaterialCost,
          laborCost: laborCost,
          totalCost: totalCost,
        },
      });
    }

    console.log(`    💰 成本: 材料¥${totalMaterialCost.toFixed(2)} + 人工¥${laborCost} = ¥${totalCost.toFixed(2)}\n`);
  }

  console.log('✅ 完成！');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });
