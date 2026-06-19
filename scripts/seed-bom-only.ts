/**
 * 补录 BOM 配方数据
 * 产品和SKU已存在，只需补充 BOM 表
 */

import { PrismaClient, LifecycleStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

const p = new PrismaClient();

// 10款产品的 BOM 定义（按 SKU 名称匹配）
const BOM_DATA = [
  {
    skuName: '芙初·初见（粉晶）',
    bom: [
      { materialCode: 'fs002', qty: 16 },
      { materialCode: 'DQ-06-PG-260616', qty: 1 },
      { materialCode: '18-02-BZ-260616', qty: 2 },
    ],
  },
  {
    skuName: '芙初·欢颜（草莓晶）',
    bom: [
      { materialCode: 'cm002', qty: 15 },
      { materialCode: 'fs002', qty: 2 },
      { materialCode: 'DQ-06-PG-260616', qty: 1 },
    ],
  },
  {
    skuName: '芙初·月白（月光石）',
    bom: [
      { materialCode: 'yg001', qty: 16 },
      { materialCode: 'DQ-06-PG-260616', qty: 1 },
      { materialCode: 'XZ-09-PG-260616', qty: 2 },
    ],
  },
  {
    skuName: '栖迟·静川（茶晶）',
    bom: [
      { materialCode: 'cj002', qty: 16 },
      { materialCode: 'DQ-06-PG-260616', qty: 1 },
      { materialCode: 'GZ-08-PG-260616', qty: 2 },
    ],
  },
  {
    skuName: '栖迟·归心（白月光+茶晶）',
    bom: [
      { materialCode: 'yg001', qty: 8 },
      { materialCode: 'cj002', qty: 8 },
      { materialCode: 'DQ-06-PG-260616', qty: 1 },
    ],
  },
  {
    skuName: '栖迟·守拙（老山檀）',
    bom: [
      { materialCode: 'st002', qty: 16 },
      { materialCode: 'DQ-06-PG-260616', qty: 1 },
      { materialCode: 'GZ-08-PG-260616', qty: 2 },
    ],
  },
  {
    skuName: '沧溟·定境（沉香）',
    bom: [
      { materialCode: 'cx001', qty: 16 },
      { materialCode: 'DQ-06-PG-260616', qty: 1 },
      { materialCode: 'XY-07-PG-260616', qty: 1 },
    ],
  },
  {
    skuName: '沧溟·和鸣（青金石）',
    bom: [
      { materialCode: 'qj001', qty: 16 },
      { materialCode: 'XZ-11-PG-260616', qty: 2 },
      { materialCode: 'DQ-06-PG-260616', qty: 1 },
    ],
  },
  {
    skuName: '沧溟·九万里（堇青石）',
    bom: [
      { materialCode: 'jq002', qty: 16 },
      { materialCode: '18-02-BZ-260616', qty: 2 },
      { materialCode: 'DQ-06-PG-260616', qty: 1 },
    ],
  },
  {
    skuName: '沧溟·观山（南红）',
    bom: [
      { materialCode: 'nh001', qty: 16 },
      { materialCode: 'NH-08-PG-260616', qty: 1 },
      { materialCode: 'DQ-06-PG-260616', qty: 1 },
    ],
  },
  {
    skuName: '沧溟·归藏（蜜蜡）',
    bom: [
      { materialCode: 'ml002', qty: 16 },
      { materialCode: 'YM-85-PG-260616', qty: 1 },
      { materialCode: 'DQ-06-PG-260616', qty: 1 },
    ],
  },
];

async function main() {
  console.log('📋 开始补录 BOM 配方数据...\n');

  let successCount = 0;
  let skipCount = 0;

  for (const def of BOM_DATA) {
    // 查找 SKU
    const sku = await p.productSku.findFirst({
      where: { name: def.skuName },
    });

    if (!sku) {
      console.log(`  ❌ SKU 未找到: ${def.skuName}`);
      continue;
    }

    // 检查是否已有 BOM
    const existingBom = await p.bom.findMany({
      where: { skuId: sku.id },
    });

    if (existingBom.length > 0) {
      console.log(`  ⚠️  已存在 BOM: ${sku.code} ${sku.name} (${existingBom.length}条)`);
      skipCount++;
      continue;
    }

    console.log(`  🔧 录入 BOM: ${sku.code} ${sku.name}`);

    let totalMaterialCost = 0;

    for (const bomItem of def.bom) {
      // 查找材料（按 code）
      const material = await p.rawMaterial.findFirst({
        where: { code: bomItem.materialCode },
      });

      if (!material) {
        console.log(`    ❌ 材料未找到: ${bomItem.materialCode}`);
        continue;
      }

      const itemCost = (material.unitCost || 0) * bomItem.qty;
      totalMaterialCost += itemCost;

      await p.bom.create({
        data: {
          skuId: sku.id,
          materialId: material.id,
          quantity: bomItem.qty,
          unitPrice: material.unitCost || 0,
          lineCost: itemCost,
          materialCodeSnapshot: material.code,
          materialNameSnapshot: material.name,
        },
      });

      console.log(`    ✅ ${material.name} × ${bomItem.qty} = ¥${itemCost.toFixed(2)}`);
    }

    // 创建或更新成本记录
    const laborCost = Math.round(totalMaterialCost * 0.3);
    const skuData = await p.productSku.findUnique({ where: { id: sku.id } });
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
      console.log(`    💰 更新成本: 材料¥${totalMaterialCost.toFixed(2)} + 人工¥${laborCost} = ¥${totalCost.toFixed(2)}`);
    } else {
      await p.productCost.create({
        data: {
          skuId: sku.id,
          materialCost: totalMaterialCost,
          laborCost: laborCost,
          totalCost: totalCost,
        },
      });
      console.log(`    💰 创建成本: 材料¥${totalMaterialCost.toFixed(2)} + 人工¥${laborCost} = ¥${totalCost.toFixed(2)}`);
    }

    console.log('');
    successCount++;
  }

  console.log(`\n✅ BOM 补录完成！`);
  console.log(`   成功: ${successCount} 个 SKU`);
  console.log(`   跳过: ${skipCount} 个 SKU（已有 BOM）`);
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });
