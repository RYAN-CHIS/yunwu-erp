/**
 * 补录 BOM 配方数据 V3（正确的 SKU 名称）
 */

import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

const p = new PrismaClient();

const BOM_DATA = [
  {
    skuName: '既明·守拙（老山檀）',
    bom: [
      { materialCode: 'LS-10-TY-260616-1', qty: 16 },
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
  {
    skuName: '观复·观山（南红）',
    bom: [
      { materialCode: 'NH-10-XD-260616-1', qty: 16 },
      { materialCode: 'NH-08-PG-260616', qty: 1 },
      { materialCode: 'DQ-10-TY-260616', qty: 1 },
    ],
  },
  {
    skuName: '观复·归藏（蜜蜡）',
    bom: [
      { materialCode: 'ML-12-ZY-260616', qty: 16 },
      { materialCode: 'YM-85-PG-260616', qty: 1 },
      { materialCode: 'DQ-10-TY-260616', qty: 1 },
    ],
  },
];

async function main() {
  console.log('📋 开始补录 BOM（V3）...\n');

  let success = 0;
  let skipped = 0;
  let errors: string[] = [];

  for (const def of BOM_DATA) {
    const sku = await p.productSku.findFirst({
      where: { name: def.skuName },
    });

    if (!sku) {
      errors.push(`SKU 未找到: ${def.skuName}`);
      continue;
    }

    const existing = await p.bom.findMany({ where: { skuId: sku.id } });
    if (existing.length > 0) {
      console.log(`  ⚠️  已存在 BOM: ${sku.code} ${sku.name} (${existing.length}条)`);
      skipped++;
      continue;
    }

    console.log(`  🔧 录入 BOM: ${sku.code} ${sku.name}`);
    let totalMaterialCost = 0;

    for (const item of def.bom) {
      const material = await p.rawMaterial.findFirst({
        where: { code: item.materialCode },
      });

      if (!material) {
        errors.push(`  材料未找到: ${item.materialCode}`);
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
    success++;
  }

  console.log(`\n✅ 完成！成功: ${success}，跳过: ${skipped}`);
  if (errors.length > 0) {
    console.log(`\n⚠️  错误:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });
