/**
 * 修复不完整的 BOM（补充缺失的材料）
 */

import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

const p = new PrismaClient();

const FIX_DATA = [
  {
    skuName: '芙初·初见（粉晶）',
    bom: [
      { materialCode: 'FS-10-XL-260616', qty: 16 },
      { materialCode: 'DQ-10-TY-260616', qty: 1 },
      { materialCode: '18-02-BZ-260616', qty: 2 },
    ],
  },
  {
    skuName: '芙初·月白（月光石）',
    bom: [
      { materialCode: 'BY-10-YW-260616', qty: 16 },
      { materialCode: 'DQ-10-TY-260616', qty: 1 },
      { materialCode: 'XZ-09-PG-260616', qty: 2 },
    ],
  },
  {
    skuName: '栖迟·静川（茶晶）',
    bom: [
      { materialCode: 'CJ-10-XY-260616', qty: 16 },
      { materialCode: 'DQ-10-TY-260616', qty: 1 },
      { materialCode: 'GZ-08-PG-260616', qty: 2 },
    ],
  },
  {
    skuName: '沧溟·和鸣（青金石）',
    bom: [
      { materialCode: 'QJ-10-QY-260616', qty: 16 },
      { materialCode: 'XZ-11-PG-260616', qty: 2 },
      { materialCode: 'DQ-10-TY-260616', qty: 1 },
    ],
  },
  {
    skuName: '沧溟·九万里（堇青石）',
    bom: [
      { materialCode: 'JQ-10-XY-260616', qty: 16 },
      { materialCode: '18-02-BZ-260616', qty: 2 },
      { materialCode: 'DQ-10-TY-260616', qty: 1 },
    ],
  },
];

async function main() {
  console.log('🔧 修复不完整的 BOM...\n');

  for (const def of FIX_DATA) {
    const sku = await p.productSku.findFirst({
      where: { name: def.skuName },
    });

    if (!sku) {
      console.log(`❌ SKU 未找到: ${def.skuName}`);
      continue;
    }

    // 删除现有 BOM
    await p.bom.deleteMany({ where: { skuId: sku.id } });
    console.log(`🗑️  删除旧 BOM: ${sku.code} ${sku.name}`);

    // 重新创建 BOM
    let totalMaterialCost = 0;

    for (const item of def.bom) {
      const material = await p.rawMaterial.findFirst({
        where: { code: item.materialCode },
      });

      if (!material) {
        console.log(`   ❌ 材料未找到: ${item.materialCode}`);
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

      console.log(`   ✅ ${material.name} × ${item.qty} = ¥${itemCost.toFixed(2)}`);
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
    }

    console.log(`   💰 成本: 材料¥${totalMaterialCost.toFixed(2)} + 人工¥${laborCost} = ¥${totalCost.toFixed(2)}\n`);
  }

  console.log('✅ 修复完成！');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });
