/**
 * Excel → ERP 数据同步脚本 V2
 * 根据 cx001 系统逻辑重写全部映射
 * 
 * cx001 核心公式链:
 *   采购单价(克价) × 单圈克重 = 每串价 → 8.0 × 8.9 = 71.2
 *   每串价 ÷ 颗数/条 = 单颗成本   → 71.2 ÷ 25 = 2.848
 *   采购数量(串) × 颗数/条 = 入库颗数 → 1 × 25 = 25
 * 
 * 两类材料的处理:
 *   - 珠子类(unit=克): 按克计价，按串采购，入库按颗
 *     inventoryQuantity = purchaseQty × beadsPerStrand
 *   - 配件类(unit=个): 1:1 入库，无换算
 *     inventoryQuantity = purchaseQty
 */

import { PrismaClient } from '@prisma/client';

interface PurchaseRow {
  purchaseDate: string;
  code: string;
  category: string;
  name: string;
  supplier: string;
  spec: string;
  unit: string;           // 单位 (克/个)
  purchaseQty: number;    // 采购数量(串/个)
  totalPrice: number;     // 采购总价
  autoUnitPrice: number;  // 单价(自动)
  shape: string;          // 方糖/圆珠/银镀金
  gramPrice: number;      // 采购单价(克价)
  beadsPerStrand: number; // 颗数/条
  strandWeight: number;   // 单圈克重
  beadCost: number;       // 单颗成本
  storeAddress: string;
  contact: string;
}

const PURCHASE_DATA: PurchaseRow[] = [
  // ─── 沉香 cx001-cx008 ───
  { purchaseDate:'2026-06-16', code:'cx001', category:'沉香', name:'沉香', supplier:'三哥沉香', spec:'7', unit:'克', purchaseQty:1, totalPrice:71.0, autoUnitPrice:71.0, shape:'方糖', gramPrice:8.0, beadsPerStrand:25, strandWeight:8.9, beadCost:2.848, storeAddress:'2-2F-A-050', contact:'微信' },
  { purchaseDate:'2026-06-16', code:'cx002', category:'沉香', name:'沉香', supplier:'三哥沉香', spec:'10', unit:'克', purchaseQty:2, totalPrice:241.8, autoUnitPrice:120.9, shape:'圆珠', gramPrice:13.0, beadsPerStrand:20, strandWeight:9.3, beadCost:6.045, storeAddress:'2-2F-A-050', contact:'微信' },
  { purchaseDate:'2026-06-16', code:'cx003', category:'沉香', name:'沉香', supplier:'三哥沉香', spec:'12', unit:'克', purchaseQty:2, totalPrice:351.0, autoUnitPrice:175.5, shape:'圆珠', gramPrice:13.0, beadsPerStrand:18, strandWeight:13.5, beadCost:9.75, storeAddress:'2-2F-A-050', contact:'微信' },
  { purchaseDate:'2026-06-16', code:'cx004', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'8', unit:'克', purchaseQty:1, totalPrice:58.8, autoUnitPrice:58.8, shape:'方糖', gramPrice:7.0, beadsPerStrand:23, strandWeight:8.4, beadCost:2.5565, storeAddress:'', contact:'a37336096' },
  { purchaseDate:'2026-06-16', code:'cx005', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'10', unit:'克', purchaseQty:1, totalPrice:90.3, autoUnitPrice:90.3, shape:'方糖', gramPrice:7.0, beadsPerStrand:20, strandWeight:12.8, beadCost:4.48, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'cx006', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'8', unit:'克', purchaseQty:1, totalPrice:301.0, autoUnitPrice:301.0, shape:'圆珠', gramPrice:14.0, beadsPerStrand:108, strandWeight:21.5, beadCost:2.787, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'cx007', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'10', unit:'克', purchaseQty:2, totalPrice:193.2, autoUnitPrice:96.6, shape:'圆珠', gramPrice:14.0, beadsPerStrand:20, strandWeight:6.95, beadCost:4.865, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'cx008', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'12', unit:'克', purchaseQty:1, totalPrice:159.6, autoUnitPrice:159.6, shape:'圆珠', gramPrice:14.0, beadsPerStrand:18, strandWeight:11.4, beadCost:8.8667, storeAddress:'', contact:'' },
  // ─── 蜜蜡 ml001-ml003 ───
  { purchaseDate:'2026-06-16', code:'ml001', category:'蜜蜡', name:'蜜蜡', supplier:'紫嫣珠宝', spec:'8', unit:'克', purchaseQty:2, totalPrice:2180.0, autoUnitPrice:1090.0, shape:'圆珠', gramPrice:30.0, beadsPerStrand:108, strandWeight:36.35, beadCost:10.0972, storeAddress:'2-3F-ET-02-1', contact:'ziyanzhubao888' },
  { purchaseDate:'2026-06-16', code:'ml002', category:'蜜蜡', name:'蜜蜡', supplier:'紫嫣珠宝', spec:'12', unit:'克', purchaseQty:2, totalPrice:1864.0, autoUnitPrice:932.0, shape:'圆珠', gramPrice:55.0, beadsPerStrand:17, strandWeight:17.0, beadCost:55.0, storeAddress:'2-3F-ET-02-1', contact:'ziyanzhubao888' },
  { purchaseDate:'2026-06-16', code:'ml003', category:'蜜蜡', name:'蜜蜡', supplier:'紫嫣珠宝', spec:'10', unit:'克', purchaseQty:4, totalPrice:2002.5, autoUnitPrice:500.625, shape:'圆珠', gramPrice:45.0, beadsPerStrand:19, strandWeight:11.125, beadCost:26.3487, storeAddress:'2-3F-ET-02-1', contact:'ziyanzhubao888' },
  // ─── 青金石 qj001-qj002 ───
  { purchaseDate:'2026-06-16', code:'qj001', category:'青金石', name:'青金石', supplier:'千叶青金', spec:'10', unit:'克', purchaseQty:3, totalPrice:1617.0, autoUnitPrice:539.0, shape:'圆珠', gramPrice:15.0, beadsPerStrand:19, strandWeight:35.9333, beadCost:28.3684, storeAddress:'2-3F-DT-13', contact:'A15161352697' },
  { purchaseDate:'2026-06-16', code:'qj002', category:'青金石', name:'青金石', supplier:'千叶青金', spec:'8', unit:'克', purchaseQty:2, totalPrice:564.0, autoUnitPrice:282.0, shape:'圆珠', gramPrice:13.0, beadsPerStrand:22, strandWeight:21.7, beadCost:12.8227, storeAddress:'2-3F-DT-13', contact:'A15161352697' },
  // ─── 配件 pj001-pj023 ───
  { purchaseDate:'2026-06-16', code:'pj001', category:'配件', name:'圆蜜蜡挂饰', supplier:'蒲公英', spec:'8.5', unit:'个', purchaseQty:18, totalPrice:387.0, autoUnitPrice:21.5, shape:'银镀金', gramPrice:21.5, beadsPerStrand:18, strandWeight:18.0, beadCost:21.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj002', category:'配件', name:'隔珠片', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:62, totalPrice:731.6, autoUnitPrice:11.8, shape:'银镀金', gramPrice:11.8, beadsPerStrand:62, strandWeight:62.0, beadCost:11.8, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj003', category:'配件', name:'隔珠片', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:35, totalPrice:234.5, autoUnitPrice:6.7, shape:'银镀金', gramPrice:6.7, beadsPerStrand:35, strandWeight:35.0, beadCost:6.7, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj004', category:'配件', name:'镶钻方块', supplier:'蒲公英', spec:'3.5', unit:'个', purchaseQty:37, totalPrice:703.0, autoUnitPrice:19.0, shape:'银镀金', gramPrice:19.0, beadsPerStrand:37, strandWeight:37.0, beadCost:19.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj005', category:'配件', name:'南红汉堡珠', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:6, totalPrice:192.0, autoUnitPrice:32.0, shape:'银镀金', gramPrice:32.0, beadsPerStrand:6, strandWeight:6.0, beadCost:32.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj006', category:'配件', name:'镶钻青金圆珠', supplier:'蒲公英', spec:'11*6', unit:'个', purchaseQty:8, totalPrice:176.0, autoUnitPrice:22.0, shape:'银镀金', gramPrice:22.0, beadsPerStrand:8, strandWeight:8.0, beadCost:22.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj007', category:'配件', name:'青金盖珠', supplier:'蒲公英', spec:'5.7', unit:'个', purchaseQty:12, totalPrice:108.0, autoUnitPrice:9.0, shape:'银镀金', gramPrice:9.0, beadsPerStrand:12, strandWeight:12.0, beadCost:9.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj008', category:'配件', name:'翡翠祥云挂饰', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:12, totalPrice:108.0, autoUnitPrice:9.0, shape:'银镀金', gramPrice:9.0, beadsPerStrand:12, strandWeight:12.0, beadCost:9.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj009', category:'配件', name:'蜜蜡配珠', supplier:'蒲公英', spec:'10', unit:'个', purchaseQty:10, totalPrice:315.0, autoUnitPrice:31.5, shape:'银镀金', gramPrice:31.5, beadsPerStrand:10, strandWeight:10.0, beadCost:31.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj010', category:'配件', name:'绿松小挂饰', supplier:'蒲公英', spec:'3', unit:'个', purchaseQty:22, totalPrice:198.0, autoUnitPrice:9.0, shape:'银镀金', gramPrice:9.0, beadsPerStrand:22, strandWeight:22.0, beadCost:9.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj011', category:'配件', name:'绿松银杏叶挂饰', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:23, totalPrice:172.5, autoUnitPrice:7.5, shape:'银镀金', gramPrice:7.5, beadsPerStrand:23, strandWeight:23.0, beadCost:7.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj012', category:'配件', name:'蜜蜡葫芦单挂饰', supplier:'蒲公英', spec:'5', unit:'个', purchaseQty:21, totalPrice:315.0, autoUnitPrice:15.0, shape:'银镀金', gramPrice:15.0, beadsPerStrand:21, strandWeight:21.0, beadCost:15.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj013', category:'配件', name:'绿松盾牌挂饰', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:8, totalPrice:128.0, autoUnitPrice:16.0, shape:'银镀金', gramPrice:16.0, beadsPerStrand:8, strandWeight:8.0, beadCost:16.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj014', category:'配件', name:'蜜蜡葫芦双挂饰', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:17, totalPrice:365.5, autoUnitPrice:21.5, shape:'银镀金', gramPrice:21.5, beadsPerStrand:17, strandWeight:17.0, beadCost:21.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj015', category:'配件', name:'海纹石配珠', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:13, totalPrice:188.5, autoUnitPrice:14.5, shape:'银镀金', gramPrice:14.5, beadsPerStrand:13, strandWeight:13.0, beadCost:14.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj016', category:'配件', name:'绿松圆方配珠', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:17, totalPrice:255.0, autoUnitPrice:15.0, shape:'银镀金', gramPrice:15.0, beadsPerStrand:17, strandWeight:17.0, beadCost:15.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj017', category:'配件', name:'镶钻圆珠', supplier:'蒲公英', spec:'9', unit:'个', purchaseQty:11, totalPrice:220.0, autoUnitPrice:20.0, shape:'银镀金', gramPrice:20.0, beadsPerStrand:11, strandWeight:11.0, beadCost:20.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj018', category:'配件', name:'花纹圆珠', supplier:'蒲公英', spec:'9', unit:'个', purchaseQty:8, totalPrice:240.0, autoUnitPrice:30.0, shape:'银镀金', gramPrice:30.0, beadsPerStrand:8, strandWeight:8.0, beadCost:30.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj019', category:'配件', name:'雕佛三通', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:3, totalPrice:78.0, autoUnitPrice:26.0, shape:'银镀金', gramPrice:26.0, beadsPerStrand:3, strandWeight:3.0, beadCost:26.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-17', code:'pj020', category:'配件', name:'祥云纹三通', supplier:'蒲公英', spec:'7', unit:'个', purchaseQty:3, totalPrice:54.0, autoUnitPrice:18.0, shape:'银镀金', gramPrice:18.0, beadsPerStrand:3, strandWeight:3.0, beadCost:18.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-18', code:'pj021', category:'配件', name:'佛符号三通', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:3, totalPrice:70.5, autoUnitPrice:23.5, shape:'银镀金', gramPrice:23.5, beadsPerStrand:3, strandWeight:3.0, beadCost:23.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-19', code:'pj022', category:'配件', name:'莲花三通', supplier:'蒲公英', spec:'10', unit:'个', purchaseQty:2, totalPrice:64.0, autoUnitPrice:32.0, shape:'银镀金', gramPrice:32.0, beadsPerStrand:2, strandWeight:2.0, beadCost:32.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-20', code:'pj023', category:'配件', name:'挂耳三通', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:2, totalPrice:72.0, autoUnitPrice:36.0, shape:'银镀金', gramPrice:36.0, beadsPerStrand:2, strandWeight:2.0, beadCost:36.0, storeAddress:'', contact:'' },
];

function isBeaded(row: PurchaseRow): boolean {
  return row.unit === '克';
}

function mapMaterialType(category: string): string {
  const map: Record<string, string> = {
    '沉香': 'INCENSE',
    '蜜蜡': 'BEAD',
    '青金石': 'BEAD',
    '配件': 'METAL',
  };
  return map[category] || 'OTHER';
}

async function main() {
  const prisma = new PrismaClient();
  console.log('═══════════════════════════════════════');
  console.log('  允物 ERP Excel 数据同步 V2');
  console.log('  基于 cx001 系统逻辑');
  console.log('═══════════════════════════════════════\n');

  // ── Step 1: 同步原料库 (RawMaterial) ──
  console.log('[1/2] 同步原料库 (RawMaterial)...\n');
  let matUpserted = 0;

  for (const row of PURCHASE_DATA) {
    const beaded = isBeaded(row);

    // 珠子类: inventoryUnit="颗"，配件类: inventoryUnit=unit
    const inventoryUnit = beaded ? '颗' : '个';
    // 珠子类: remaining=串数×颗数/条，配件类: remaining=采购数量
    const remaining = beaded ? row.purchaseQty * row.beadsPerStrand : row.purchaseQty;
    // 珠子类: defaultPurchaseUnit="克" ，配件类: defaultPurchaseUnit="个"
    const defaultPurchaseUnit = beaded ? '克' : '个';
    // 珠子类: defaultConversionRate=颗数/条(1串→N颗)，配件类: 1
    const defaultConversionRate = beaded ? row.beadsPerStrand : 1;

    // 构建备注：形状 | 店铺 / 联系方式
    const extras = [row.storeAddress, row.contact].filter(Boolean);
    const remarkParts = [row.shape, ...extras];
    const remark = remarkParts.join(' | ');

    const createData = {
      code: row.code,
      name: row.name,
      category: row.category,
      materialType: mapMaterialType(row.category) as any,
      specification: row.spec,
      inventoryUnit,
      remaining,
      unitCost: row.beadCost,
      shape: row.shape,
      beadsPerStrand: row.beadsPerStrand,
      weightPerStrand: row.strandWeight,
      defaultPurchaseUnit,
      defaultConversionRate,
      supplier: row.supplier,
      remark,
      status: 'READY' as const,
    };

    const existing = await prisma.rawMaterial.findUnique({ where: { code: row.code } });

    if (existing) {
      const { code, status, ...updateData } = createData;
      await prisma.rawMaterial.update({ where: { code: row.code }, data: updateData });
    } else {
      await prisma.rawMaterial.create({ data: createData });
    }

    const desc = beaded
      ? `${row.purchaseQty}串×${row.beadsPerStrand}颗=${remaining}颗 | 克价¥${row.gramPrice} | 单颗¥${row.beadCost.toFixed(4)}`
      : `${remaining}个 | 单价¥${row.beadCost}`;
    console.log(`  ${existing ? '↻' : '+'} ${row.code} ${row.name.padEnd(8)} ${desc}`);
    matUpserted++;
  }

  console.log(`\n  ✓ 原料库: ${matUpserted} 条同步完成\n`);

  // ── Step 2: 采购记录 (PurchaseRecord) ──
  console.log('[2/2] 同步采购记录 (PurchaseRecord)...\n');

  // 清除所有旧记录
  const deleted = await prisma.purchaseRecord.deleteMany();
  console.log(`  → 已清除 ${deleted.count} 条旧采购记录\n`);

  let created = 0;
  for (const row of PURCHASE_DATA) {
    const material = await prisma.rawMaterial.findUnique({ where: { code: row.code } });
    if (!material) {
      console.log(`  ⚠ ${row.code} 材料不存在，跳过`);
      continue;
    }

    const beaded = isBeaded(row);

    // 采购单价：珠子类=克价(gramPrice)，配件类=单价(beadCost)
    const purchaseUnitPrice = beaded ? row.gramPrice : row.beadCost;
    // 换算率：珠子类=颗数/条(1串→N颗)，配件类=1
    const conversionRate = beaded ? row.beadsPerStrand : 1;
    // 采购价格单位：珠子类="克"，配件类="个"
    const purchaseUnit = row.unit;
    // 入库数量(库存单位)：珠子类=串数×颗数/条，配件类=个数
    const inventoryQuantity = beaded ? row.purchaseQty * row.beadsPerStrand : row.purchaseQty;
    // 单颗成本
    const unitCost = row.beadCost;

    await prisma.purchaseRecord.create({
      data: {
        materialId: material.id,
        purchaseDate: new Date(row.purchaseDate),
        supplier: row.supplier,
        purchaseUnit,
        conversionRate,
        purchaseQuantity: row.purchaseQty,
        purchaseUnitPrice,
        purchasePrice: row.totalPrice,
        inventoryQuantity,
        unitCost,
        remark: null,
      },
    });

    const logic = beaded
      ? `${row.purchaseQty}串 × ${row.beadsPerStrand}颗/串 = ${inventoryQuantity}颗入库`
      : `${inventoryQuantity}个入库`;
    console.log(`  ✓ ${row.code}  ${logic} | 采购单价¥${purchaseUnitPrice}/${purchaseUnit} | 总价¥${row.totalPrice}`);
    created++;
  }

  console.log(`\n  ✓ 采购记录: ${created} 条\n`);

  // ── 验证摘要 ──
  const totalMats = await prisma.rawMaterial.count();
  const totalRecords = await prisma.purchaseRecord.count();
  console.log('═══════════════════════════════════════');
  console.log('  同步完成');
  console.log(`  RawMaterials:     ${totalMats} 条`);
  console.log(`  PurchaseRecords:  ${totalRecords} 条`);
  console.log('═══════════════════════════════════════');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('同步失败:', e);
  process.exit(1);
});
