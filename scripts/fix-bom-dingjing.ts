/**
 * 修复「既明·定境（沉香）」BOM
 * 删除不完整的 BOM，重新录入
 */

import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

const p = new PrismaClient();

async function main() {
  const skuName = '既明·定境（沉香）';

  const sku = await p.productSku.findFirst({
    where: { name: skuName },
  });

  if (!sku) {
    console.log('❌ SKU 未找到:', skuName);
    return;
  }

  console.log(`🔧 修复 BOM: ${sku.code} ${sku.name}\n`);

  // 删除旧 BOM
  const deleted = await p.bom.deleteMany({
    where: { skuId: sku.id },
  });
  console.log(`  🗑️  删除旧 BOM: ${deleted.count} 条`);

  // 重新录入
  const bomItems = [
    { materialCode: 'CX-10-SG-260616', qty: 16 },  // 沉香10mm
    { materialCode: 'DQ-10-TY-260616', qty: 1 },   // 大漆珠
    { materialCode: 'XY-07-PG-260616', qty: 1 },   // 祥云纹三通
  ];

  let totalMaterialCost = 0;

  for (const item of bomItems) {
    const material = await p.rawMaterial.findFirst({
      where: { code: item.materialCode },
    });

    if (!material) {
      console.log(`  ❌ 材料未找到: ${item.materialCode}`);
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

    console.log(`  ✅ ${material.name} × ${item.qty} = ¥${itemCost.toFixed(2)}`);
  }

  // 更新成本
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

  console.log(`\n  💰 成本: 材料¥${totalMaterialCost.toFixed(2)} + 人工¥${laborCost} = ¥${totalCost.toFixed(2)}`);
  console.log('\n✅ 修复完成！');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });
