/**
 * Excel → ERP 数据同步脚本
 * 来源: /Users/ryan/Desktop/允物品牌经营系统_V1.xlsx
 * 
 * 处理逻辑:
 * - 01原料采购库 → RawMaterial + PurchaseRecord (修正已有数据的字段映射错误)
 * - 02材料换算库 → 补充 RawMaterial 换算信息
 * - 03-05 → 空模板，跳过
 * - 06七序作品库 → 空，跳过
 * - 下拉菜单 → Series (七序)
 */

import { PrismaClient } from '@prisma/client';

// ---- 手动定义 Excel 数据（确保完整可控） ----

interface PurchaseRow {
  purchaseDate: string;
  code: string;          // 原料编码
  category: string;       // 品类
  name: string;           // 名称
  supplier: string;       // 供应商
  spec: string;           // 规格
  unit: string;           // 单位（克/个）
  purchaseQty: number;    // 采购数量
  totalPrice: number;     // 采购总价
  autoUnitPrice: number;  // 单价(自动) = 总价/数量
  remark: string;         // 备注（方糖/圆珠/银镀金）
  unitCost: number;       // 采购单价（供应商单价）
  beadsPerStrand: number; // 颗数/条
  strandWeight: number;   // 单圈克重
  beadCost: number;       // 单颗成本
  storeAddress: string;   // 店铺地址
  contact: string;        // 联系方式
}

const PURCHASE_DATA: PurchaseRow[] = [
  { purchaseDate:'2026-06-16', code:'cx001', category:'沉香', name:'沉香', supplier:'三哥沉香', spec:'7', unit:'克', purchaseQty:1, totalPrice:71.0, autoUnitPrice:71.0, remark:'方糖', unitCost:8.0, beadsPerStrand:25, strandWeight:8.9, beadCost:2.848, storeAddress:'2-2F-A-050', contact:'微信' },
  { purchaseDate:'2026-06-16', code:'cx002', category:'沉香', name:'沉香', supplier:'三哥沉香', spec:'10', unit:'克', purchaseQty:2, totalPrice:241.8, autoUnitPrice:120.9, remark:'圆珠', unitCost:13.0, beadsPerStrand:20, strandWeight:9.3, beadCost:6.045, storeAddress:'2-2F-A-050', contact:'微信' },
  { purchaseDate:'2026-06-16', code:'cx003', category:'沉香', name:'沉香', supplier:'三哥沉香', spec:'12', unit:'克', purchaseQty:2, totalPrice:351.0, autoUnitPrice:175.5, remark:'圆珠', unitCost:13.0, beadsPerStrand:18, strandWeight:13.5, beadCost:9.75, storeAddress:'2-2F-A-050', contact:'微信' },
  { purchaseDate:'2026-06-16', code:'cx004', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'8', unit:'克', purchaseQty:1, totalPrice:58.8, autoUnitPrice:58.8, remark:'方糖', unitCost:7.0, beadsPerStrand:23, strandWeight:8.4, beadCost:2.5565, storeAddress:'', contact:'a37336096' },
  { purchaseDate:'2026-06-16', code:'cx005', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'10', unit:'克', purchaseQty:1, totalPrice:90.3, autoUnitPrice:90.3, remark:'方糖', unitCost:7.0, beadsPerStrand:20, strandWeight:12.8, beadCost:4.48, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'cx006', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'8', unit:'克', purchaseQty:1, totalPrice:301.0, autoUnitPrice:301.0, remark:'圆珠', unitCost:14.0, beadsPerStrand:108, strandWeight:21.5, beadCost:2.787, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'cx007', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'10', unit:'克', purchaseQty:2, totalPrice:193.2, autoUnitPrice:96.6, remark:'圆珠', unitCost:14.0, beadsPerStrand:20, strandWeight:6.95, beadCost:4.865, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'cx008', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'12', unit:'克', purchaseQty:1, totalPrice:159.6, autoUnitPrice:159.6, remark:'圆珠', unitCost:14.0, beadsPerStrand:18, strandWeight:11.4, beadCost:8.8667, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'ml001', category:'蜜蜡', name:'蜜蜡', supplier:'紫嫣珠宝', spec:'8', unit:'克', purchaseQty:2, totalPrice:2180.0, autoUnitPrice:1090.0, remark:'圆珠', unitCost:30.0, beadsPerStrand:108, strandWeight:36.35, beadCost:10.0972, storeAddress:'2-3F-ET-02-1', contact:'ziyanzhubao888' },
  { purchaseDate:'2026-06-16', code:'ml002', category:'蜜蜡', name:'蜜蜡', supplier:'紫嫣珠宝', spec:'12', unit:'克', purchaseQty:2, totalPrice:1864.0, autoUnitPrice:932.0, remark:'圆珠', unitCost:55.0, beadsPerStrand:17, strandWeight:17.0, beadCost:55.0, storeAddress:'2-3F-ET-02-1', contact:'ziyanzhubao888' },
  { purchaseDate:'2026-06-16', code:'ml003', category:'蜜蜡', name:'蜜蜡', supplier:'紫嫣珠宝', spec:'10', unit:'克', purchaseQty:4, totalPrice:2002.5, autoUnitPrice:500.625, remark:'圆珠', unitCost:45.0, beadsPerStrand:19, strandWeight:11.125, beadCost:26.3487, storeAddress:'2-3F-ET-02-1', contact:'ziyanzhubao888' },
  { purchaseDate:'2026-06-16', code:'qj001', category:'青金石', name:'青金石', supplier:'千叶青金', spec:'10', unit:'克', purchaseQty:3, totalPrice:1617.0, autoUnitPrice:539.0, remark:'圆珠', unitCost:15.0, beadsPerStrand:19, strandWeight:35.9333, beadCost:28.3684, storeAddress:'2-3F-DT-13', contact:'A15161352697' },
  { purchaseDate:'2026-06-16', code:'qj002', category:'青金石', name:'青金石', supplier:'千叶青金', spec:'8', unit:'克', purchaseQty:2, totalPrice:564.0, autoUnitPrice:282.0, remark:'圆珠', unitCost:13.0, beadsPerStrand:22, strandWeight:21.7, beadCost:12.8227, storeAddress:'2-3F-DT-13', contact:'A15161352697' },
  { purchaseDate:'2026-06-16', code:'pj001', category:'配件', name:'圆蜜蜡挂饰', supplier:'蒲公英', spec:'8.5', unit:'个', purchaseQty:18, totalPrice:387.0, autoUnitPrice:21.5, remark:'银镀金', unitCost:21.5, beadsPerStrand:18, strandWeight:18.0, beadCost:21.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj002', category:'配件', name:'隔珠片', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:62, totalPrice:731.6, autoUnitPrice:11.8, remark:'银镀金', unitCost:11.8, beadsPerStrand:62, strandWeight:62.0, beadCost:11.8, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj003', category:'配件', name:'隔珠片', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:35, totalPrice:234.5, autoUnitPrice:6.7, remark:'银镀金', unitCost:6.7, beadsPerStrand:35, strandWeight:35.0, beadCost:6.7, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj004', category:'配件', name:'镶钻方块', supplier:'蒲公英', spec:'3.5', unit:'个', purchaseQty:37, totalPrice:703.0, autoUnitPrice:19.0, remark:'银镀金', unitCost:19.0, beadsPerStrand:37, strandWeight:37.0, beadCost:19.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj005', category:'配件', name:'南红汉堡珠', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:6, totalPrice:192.0, autoUnitPrice:32.0, remark:'银镀金', unitCost:32.0, beadsPerStrand:6, strandWeight:6.0, beadCost:32.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj006', category:'配件', name:'镶钻青金圆珠', supplier:'蒲公英', spec:'11*6', unit:'个', purchaseQty:8, totalPrice:176.0, autoUnitPrice:22.0, remark:'银镀金', unitCost:22.0, beadsPerStrand:8, strandWeight:8.0, beadCost:22.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj007', category:'配件', name:'青金盖珠', supplier:'蒲公英', spec:'5.7', unit:'个', purchaseQty:12, totalPrice:108.0, autoUnitPrice:9.0, remark:'银镀金', unitCost:9.0, beadsPerStrand:12, strandWeight:12.0, beadCost:9.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj008', category:'配件', name:'翡翠祥云挂饰', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:12, totalPrice:108.0, autoUnitPrice:9.0, remark:'银镀金', unitCost:9.0, beadsPerStrand:12, strandWeight:12.0, beadCost:9.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj009', category:'配件', name:'蜜蜡配珠', supplier:'蒲公英', spec:'10', unit:'个', purchaseQty:10, totalPrice:315.0, autoUnitPrice:31.5, remark:'银镀金', unitCost:31.5, beadsPerStrand:10, strandWeight:10.0, beadCost:31.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj010', category:'配件', name:'绿松小挂饰', supplier:'蒲公英', spec:'3', unit:'个', purchaseQty:22, totalPrice:198.0, autoUnitPrice:9.0, remark:'银镀金', unitCost:9.0, beadsPerStrand:22, strandWeight:22.0, beadCost:9.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj011', category:'配件', name:'绿松银杏叶挂饰', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:23, totalPrice:172.5, autoUnitPrice:7.5, remark:'银镀金', unitCost:7.5, beadsPerStrand:23, strandWeight:23.0, beadCost:7.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj012', category:'配件', name:'蜜蜡葫芦单挂饰', supplier:'蒲公英', spec:'5', unit:'个', purchaseQty:21, totalPrice:315.0, autoUnitPrice:15.0, remark:'银镀金', unitCost:15.0, beadsPerStrand:21, strandWeight:21.0, beadCost:15.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj013', category:'配件', name:'绿松盾牌挂饰', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:8, totalPrice:128.0, autoUnitPrice:16.0, remark:'银镀金', unitCost:16.0, beadsPerStrand:8, strandWeight:8.0, beadCost:16.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj014', category:'配件', name:'蜜蜡葫芦双挂饰', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:17, totalPrice:365.5, autoUnitPrice:21.5, remark:'银镀金', unitCost:21.5, beadsPerStrand:17, strandWeight:17.0, beadCost:21.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj015', category:'配件', name:'海纹石配珠', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:13, totalPrice:188.5, autoUnitPrice:14.5, remark:'银镀金', unitCost:14.5, beadsPerStrand:13, strandWeight:13.0, beadCost:14.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj016', category:'配件', name:'绿松圆方配珠', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:17, totalPrice:255.0, autoUnitPrice:15.0, remark:'银镀金', unitCost:15.0, beadsPerStrand:17, strandWeight:17.0, beadCost:15.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj017', category:'配件', name:'镶钻圆珠', supplier:'蒲公英', spec:'9', unit:'个', purchaseQty:11, totalPrice:220.0, autoUnitPrice:20.0, remark:'银镀金', unitCost:20.0, beadsPerStrand:11, strandWeight:11.0, beadCost:20.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj018', category:'配件', name:'花纹圆珠', supplier:'蒲公英', spec:'9', unit:'个', purchaseQty:8, totalPrice:240.0, autoUnitPrice:30.0, remark:'银镀金', unitCost:30.0, beadsPerStrand:8, strandWeight:8.0, beadCost:30.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-16', code:'pj019', category:'配件', name:'雕佛三通', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:3, totalPrice:78.0, autoUnitPrice:26.0, remark:'银镀金', unitCost:26.0, beadsPerStrand:3, strandWeight:3.0, beadCost:26.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-17', code:'pj020', category:'配件', name:'祥云纹三通', supplier:'蒲公英', spec:'7', unit:'个', purchaseQty:3, totalPrice:54.0, autoUnitPrice:18.0, remark:'银镀金', unitCost:18.0, beadsPerStrand:3, strandWeight:3.0, beadCost:18.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-18', code:'pj021', category:'配件', name:'佛符号三通', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:3, totalPrice:70.5, autoUnitPrice:23.5, remark:'银镀金', unitCost:23.5, beadsPerStrand:3, strandWeight:3.0, beadCost:23.5, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-19', code:'pj022', category:'配件', name:'莲花三通', supplier:'蒲公英', spec:'10', unit:'个', purchaseQty:2, totalPrice:64.0, autoUnitPrice:32.0, remark:'银镀金', unitCost:32.0, beadsPerStrand:2, strandWeight:2.0, beadCost:32.0, storeAddress:'', contact:'' },
  { purchaseDate:'2026-06-20', code:'pj023', category:'配件', name:'挂耳三通', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:2, totalPrice:72.0, autoUnitPrice:36.0, remark:'银镀金', unitCost:36.0, beadsPerStrand:2, strandWeight:2.0, beadCost:36.0, storeAddress:'', contact:'' },
];

// 七序数据（从下拉菜单 sheet 提取）
const SERIES_DATA = [
  { code: 'fuchu', name: '芙初', sortOrder: 1 },
  { code: 'qichi', name: '栖迟', sortOrder: 2 },
  { code: 'fusu', name: '扶苏', sortOrder: 3 },
  { code: 'cangming', name: '沧溟', sortOrder: 4 },
  { code: 'jiming', name: '既明', sortOrder: 5 },
  { code: 'guanfu', name: '观复', sortOrder: 6 },
  { code: 'cangzhen', name: '藏真', sortOrder: 7 },
];

// ---- 品类 → MaterialType 映射 ----
function mapMaterialType(category: string): string {
  const map: Record<string, string> = {
    '沉香': 'INCENSE',
    '蜜蜡': 'BEAD',
    '青金石': 'BEAD',
    '配件': 'METAL',
  };
  return map[category] || 'OTHER';
}

// ---- 主流程 ----
async function main() {
  const prisma = new PrismaClient();
  
  console.log('=== 允物 ERP Excel 数据同步 ===\n');

  // ---- Step 1: 同步七序 Series ----
  console.log('[1/3] 同步七序 (Series)...');
  let seriesCreated = 0;
  let seriesSkipped = 0;
  
  for (const s of SERIES_DATA) {
    const existing = await prisma.series.findUnique({ where: { code: s.code } });
    if (existing) {
      // 更新以确保数据一致
      await prisma.series.update({
        where: { code: s.code },
        data: { name: s.name, sortOrder: s.sortOrder },
      });
      seriesSkipped++;
    } else {
      await prisma.series.create({ data: s });
      seriesCreated++;
    }
  }
  console.log(`  ✓ Series: ${seriesCreated} 新建, ${seriesSkipped} 已存在\n`);

  // ---- Step 2: 同步 RawMaterial ----
  console.log('[2/3] 同步原料库 (RawMaterial)...');
  let matUpdated = 0;
  let matSkipped = 0;

  for (const row of PURCHASE_DATA) {
    const existing = await prisma.rawMaterial.findUnique({ where: { code: row.code } });
    
    // 构建备注信息：原有备注 + 店铺地址/联系方式
    let fullRemark = row.remark;
    if (row.storeAddress || row.contact) {
      const extras = [row.storeAddress, row.contact].filter(Boolean).join(' / ');
      fullRemark = `${row.remark} | ${extras}`;
    }

    const updateData = {
      name: row.name,
      category: row.category,
      materialType: mapMaterialType(row.category) as any,
      specification: row.spec,
      inventoryUnit: row.unit,
      remaining: row.purchaseQty,
      unitCost: row.beadCost,  // 单颗成本
      shape: row.remark,
      beadsPerStrand: row.beadsPerStrand,
      weightPerStrand: row.strandWeight,
      defaultPurchaseUnit: row.unit,
      defaultConversionRate: row.beadsPerStrand,  // 采购单位 → 库存颗数的换算率
      supplier: row.supplier,
      remark: fullRemark,
    };

    if (existing) {
      await prisma.rawMaterial.update({
        where: { code: row.code },
        data: updateData,
      });
      matUpdated++;
    } else {
      await prisma.rawMaterial.create({
        data: { ...updateData, code: row.code, status: 'READY' },
      });
      matSkipped++;
    }
  }
  console.log(`  ✓ RawMaterial: ${matUpdated} 更新, ${matSkipped} 新建\n`);

  // ---- Step 3: 同步 PurchaseRecord ----
  console.log('[3/3] 同步采购记录 (PurchaseRecord)...');

  // 删除所有旧记录再重新创建（确保数据一致性）
  await prisma.purchaseRecord.deleteMany();
  console.log('  → 已清除旧采购记录');

  let recordsCreated = 0;
  for (const row of PURCHASE_DATA) {
    const material = await prisma.rawMaterial.findUnique({ where: { code: row.code } });
    if (!material) {
      console.log(`  ⚠ 材料 ${row.code} 不存在，跳过`);
      continue;
    }

    await prisma.purchaseRecord.create({
      data: {
        materialId: material.id,
        purchaseDate: new Date(row.purchaseDate),
        supplier: row.supplier,
        purchaseUnit: row.unit,
        conversionRate: row.beadsPerStrand,
        purchaseQuantity: row.purchaseQty,
        purchaseUnitPrice: row.unitCost,    // 供应商采购单价
        purchasePrice: row.totalPrice,       // 采购总价
        inventoryQuantity: row.purchaseQty,  // 入库数量（按采购单位）
        unitCost: row.beadCost,              // 单颗成本
        remark: null,
      },
    });
    recordsCreated++;
  }
  console.log(`  ✓ PurchaseRecord: ${recordsCreated} 条记录\n`);

  // ---- 完成统计 ----
  const totalMats = await prisma.rawMaterial.count();
  const totalRecords = await prisma.purchaseRecord.count();
  const totalSeries = await prisma.series.count();

  console.log('=== 同步完成 ===');
  console.log(`  Series:       ${totalSeries}`);
  console.log(`  RawMaterials:  ${totalMats}`);
  console.log(`  PurchaseRecords: ${totalRecords}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('同步失败:', e);
  process.exit(1);
});
