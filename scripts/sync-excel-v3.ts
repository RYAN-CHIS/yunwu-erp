/**
 * Excel → ERP 数据同步脚本 V3
 * 全量同步65条数据（V2只有36条，新增29条）
 * 
 * 珠子类(unit=克/串): remaining = 采购数量 × 颗数/条
 * 配件类(unit=个): remaining = 采购数量
 */

import { PrismaClient } from '@prisma/client';

interface Row {
  code: string; category: string; name: string; supplier: string;
  spec: string; unit: string; purchaseQty: number; totalPrice: number;
  autoUnitPrice: number; shape: string; gramPrice: number;
  beadsPerStrand: number; strandWeight: number; beadCost: number;
  totalBeads: number;
}

const DATA: Row[] = [
  // 沉香 cx001-cx008
  { code:'cx001', category:'沉香', name:'沉香', supplier:'三哥沉香', spec:'7', unit:'克', purchaseQty:1, totalPrice:71, autoUnitPrice:71, shape:'方糖', gramPrice:8, beadsPerStrand:25, strandWeight:8.9, beadCost:2.848, totalBeads:25 },
  { code:'cx002', category:'沉香', name:'沉香', supplier:'三哥沉香', spec:'10', unit:'克', purchaseQty:2, totalPrice:241.8, autoUnitPrice:120.9, shape:'圆珠', gramPrice:13, beadsPerStrand:20, strandWeight:9.3, beadCost:6.045, totalBeads:40 },
  { code:'cx003', category:'沉香', name:'沉香', supplier:'三哥沉香', spec:'12', unit:'克', purchaseQty:2, totalPrice:351, autoUnitPrice:175.5, shape:'圆珠', gramPrice:13, beadsPerStrand:18, strandWeight:13.5, beadCost:9.75, totalBeads:36 },
  { code:'cx004', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'8', unit:'克', purchaseQty:1, totalPrice:58.8, autoUnitPrice:58.8, shape:'方糖', gramPrice:7, beadsPerStrand:23, strandWeight:8.4, beadCost:2.5565, totalBeads:23 },
  { code:'cx005', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'10', unit:'克', purchaseQty:1, totalPrice:90.3, autoUnitPrice:90.3, shape:'方糖', gramPrice:7, beadsPerStrand:20, strandWeight:12.8, beadCost:4.48, totalBeads:20 },
  { code:'cx006', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'8', unit:'克', purchaseQty:1, totalPrice:301, autoUnitPrice:301, shape:'圆珠', gramPrice:14, beadsPerStrand:108, strandWeight:21.5, beadCost:2.787, totalBeads:108 },
  { code:'cx007', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'10', unit:'克', purchaseQty:2, totalPrice:193.2, autoUnitPrice:96.6, shape:'圆珠', gramPrice:14, beadsPerStrand:20, strandWeight:6.95, beadCost:4.865, totalBeads:40 },
  { code:'cx008', category:'沉香', name:'沉香', supplier:'天韵沉香', spec:'12', unit:'克', purchaseQty:1, totalPrice:159.6, autoUnitPrice:159.6, shape:'圆珠', gramPrice:14, beadsPerStrand:18, strandWeight:11.4, beadCost:8.8667, totalBeads:18 },
  // 蜜蜡 ml001-ml003
  { code:'ml001', category:'蜜蜡', name:'蜜蜡', supplier:'紫嫣珠宝', spec:'8', unit:'克', purchaseQty:2, totalPrice:2180, autoUnitPrice:1090, shape:'圆珠', gramPrice:30, beadsPerStrand:108, strandWeight:36.35, beadCost:10.0972, totalBeads:216 },
  { code:'ml002', category:'蜜蜡', name:'蜜蜡', supplier:'紫嫣珠宝', spec:'12', unit:'克', purchaseQty:2, totalPrice:1864, autoUnitPrice:932, shape:'圆珠', gramPrice:55, beadsPerStrand:17, strandWeight:17, beadCost:55, totalBeads:34 },
  { code:'ml003', category:'蜜蜡', name:'蜜蜡', supplier:'紫嫣珠宝', spec:'10', unit:'克', purchaseQty:4, totalPrice:2002.5, autoUnitPrice:500.625, shape:'圆珠', gramPrice:45, beadsPerStrand:19, strandWeight:11.125, beadCost:26.3487, totalBeads:76 },
  // 青金石 qj001-qj002
  { code:'qj001', category:'青金石', name:'青金石', supplier:'千叶青金', spec:'10', unit:'克', purchaseQty:3, totalPrice:1617, autoUnitPrice:539, shape:'圆珠', gramPrice:15, beadsPerStrand:19, strandWeight:35.9333, beadCost:28.4211, totalBeads:57 },
  { code:'qj002', category:'青金石', name:'青金石', supplier:'千叶青金', spec:'8', unit:'克', purchaseQty:2, totalPrice:564, autoUnitPrice:282, shape:'圆珠', gramPrice:13, beadsPerStrand:22, strandWeight:21.7, beadCost:12.8227, totalBeads:44 },
  // 猛犸 mm001-mm004
  { code:'mm001', category:'猛犸', name:'猛犸老型珠', supplier:'天韵沉香', spec:'10', unit:'克', purchaseQty:1, totalPrice:334.9, autoUnitPrice:334.9, shape:'猛犸', gramPrice:17, beadsPerStrand:22, strandWeight:19.7, beadCost:15.2227, totalBeads:22 },
  { code:'mm002', category:'猛犸', name:'猛犸圆珠10', supplier:'天韵沉香', spec:'10', unit:'克', purchaseQty:1, totalPrice:1295.4, autoUnitPrice:1295.4, shape:'猛犸', gramPrice:17, beadsPerStrand:88, strandWeight:76.2, beadCost:14.7205, totalBeads:88 },
  { code:'mm003', category:'猛犸', name:'猛犸圆珠12', supplier:'天韵沉香', spec:'12', unit:'克', purchaseQty:2, totalPrice:952, autoUnitPrice:476, shape:'猛犸', gramPrice:17, beadsPerStrand:18, strandWeight:28, beadCost:26.4444, totalBeads:36 },
  { code:'mm004', category:'猛犸', name:'猛犸圆珠7.5', supplier:'天韵沉香', spec:'7.7', unit:'克', purchaseQty:1, totalPrice:882.3, autoUnitPrice:882.3, shape:'猛犸', gramPrice:17, beadsPerStrand:108, strandWeight:51.9, beadCost:8.1694, totalBeads:108 },
  // 南红 nh001-nh003
  { code:'nh001', category:'南红', name:'南红圆珠10', supplier:'小丁水晶', spec:'10', unit:'克', purchaseQty:2, totalPrice:1062, autoUnitPrice:531, shape:'南红', gramPrice:18, beadsPerStrand:20, strandWeight:29.5, beadCost:26.55, totalBeads:40 },
  { code:'nh002', category:'南红', name:'南红圆珠火焰', supplier:'小丁水晶', spec:'10', unit:'克', purchaseQty:5, totalPrice:2235.9, autoUnitPrice:447.18, shape:'南红', gramPrice:14.5, beadsPerStrand:19, strandWeight:30.84, beadCost:23.5358, totalBeads:95 },
  { code:'nh003', category:'南红', name:'南红三通', supplier:'小丁水晶', spec:'11', unit:'克', purchaseQty:3, totalPrice:84.81, autoUnitPrice:28.27, shape:'南红', gramPrice:11, beadsPerStrand:3, strandWeight:2.57, beadCost:9.4233, totalBeads:9 },
  // 白水晶 bs001-bs005
  { code:'bs001', category:'白水晶', name:'白水晶8', supplier:'妍雯水晶', spec:'8', unit:'串', purchaseQty:17, totalPrice:1139, autoUnitPrice:67, shape:'白水晶', gramPrice:67, beadsPerStrand:50, strandWeight:1, beadCost:1.34, totalBeads:850 },
  { code:'bs002', category:'白水晶', name:'白水晶10', supplier:'妍雯水晶', spec:'10', unit:'串', purchaseQty:10, totalPrice:1320, autoUnitPrice:132, shape:'白水晶', gramPrice:132, beadsPerStrand:39, strandWeight:1, beadCost:3.3846, totalBeads:390 },
  { code:'bs003', category:'白水晶', name:'白水晶10', supplier:'小兰水晶', spec:'10', unit:'串', purchaseQty:5, totalPrice:575, autoUnitPrice:115, shape:'孔道差', gramPrice:115, beadsPerStrand:38, strandWeight:1, beadCost:3.0263, totalBeads:190 },
  { code:'bs004', category:'白水晶', name:'白水晶12', supplier:'新意水晶', spec:'12', unit:'串', purchaseQty:5, totalPrice:800, autoUnitPrice:160, shape:'白水晶', gramPrice:160, beadsPerStrand:32, strandWeight:1, beadCost:5, totalBeads:160 },
  { code:'bs005', category:'白水晶', name:'白水晶10', supplier:'新意水晶', spec:'10', unit:'串', purchaseQty:6, totalPrice:570, autoUnitPrice:95, shape:'白水晶', gramPrice:95, beadsPerStrand:38, strandWeight:1, beadCost:2.5, totalBeads:228 },
  // 白兔毛 bt001-bt002
  { code:'bt001', category:'白兔毛', name:'白兔毛8', supplier:'妍雯水晶', spec:'8', unit:'克', purchaseQty:2, totalPrice:882.5, autoUnitPrice:441.25, shape:'白兔毛', gramPrice:25, beadsPerStrand:23, strandWeight:17.65, beadCost:19.1848, totalBeads:46 },
  { code:'bt002', category:'白兔毛', name:'白兔毛10', supplier:'妍雯水晶', spec:'10', unit:'克', purchaseQty:1, totalPrice:732.5, autoUnitPrice:732.5, shape:'白兔毛', gramPrice:25, beadsPerStrand:20, strandWeight:29.3, beadCost:36.625, totalBeads:20 },
  // 月光石 yg001-yg002
  { code:'yg001', category:'月光石', name:'白月光10', supplier:'妍雯水晶', spec:'10', unit:'串', purchaseQty:5, totalPrice:390, autoUnitPrice:78, shape:'月光石', gramPrice:78, beadsPerStrand:31, strandWeight:1, beadCost:2.5161, totalBeads:155 },
  { code:'yg002', category:'月光石', name:'白月光8', supplier:'妍雯水晶', spec:'8', unit:'串', purchaseQty:6, totalPrice:318, autoUnitPrice:53, shape:'月光石', gramPrice:53, beadsPerStrand:46, strandWeight:1, beadCost:1.1522, totalBeads:276 },
  // 草莓晶 cm001-cm002
  { code:'cm001', category:'草莓晶', name:'草莓晶8', supplier:'妍雯水晶', spec:'8', unit:'串', purchaseQty:8, totalPrice:208, autoUnitPrice:26, shape:'草莓晶', gramPrice:26, beadsPerStrand:50, strandWeight:1, beadCost:0.52, totalBeads:400 },
  { code:'cm002', category:'草莓晶', name:'草莓晶10', supplier:'妍雯水晶', spec:'10', unit:'串', purchaseQty:6, totalPrice:228, autoUnitPrice:38, shape:'草莓晶', gramPrice:38, beadsPerStrand:40, strandWeight:1, beadCost:0.95, totalBeads:240 },
  // 粉水晶 fs001-fs003
  { code:'fs001', category:'粉水晶', name:'粉水晶8', supplier:'妍雯水晶', spec:'8', unit:'串', purchaseQty:5, totalPrice:290, autoUnitPrice:58, shape:'粉水晶', gramPrice:58, beadsPerStrand:46, strandWeight:1, beadCost:1.2609, totalBeads:230 },
  { code:'fs002', category:'粉水晶', name:'粉水晶10', supplier:'小兰水晶', spec:'10', unit:'克', purchaseQty:6, totalPrice:579.6, autoUnitPrice:96.6, shape:'粉水晶', gramPrice:3.5, beadsPerStrand:19, strandWeight:27.6, beadCost:5.0842, totalBeads:114 },
  { code:'fs003', category:'粉水晶', name:'粉水晶10', supplier:'新意水晶', spec:'10', unit:'克', purchaseQty:5, totalPrice:675, autoUnitPrice:135, shape:'粉水晶', gramPrice:4.5, beadsPerStrand:20, strandWeight:30, beadCost:6.75, totalBeads:100 },
  // 紫水晶 zs001-zs003
  { code:'zs001', category:'紫水晶', name:'紫水晶8', supplier:'小兰水晶', spec:'8', unit:'克', purchaseQty:4, totalPrice:483.6, autoUnitPrice:120.9, shape:'乌拉圭', gramPrice:6, beadsPerStrand:21, strandWeight:20.15, beadCost:5.7571, totalBeads:84 },
  { code:'zs002', category:'紫水晶', name:'紫水晶12', supplier:'亚轩水晶', spec:'12', unit:'克', purchaseQty:6, totalPrice:3038.4, autoUnitPrice:506.4, shape:'巴西', gramPrice:12, beadsPerStrand:17, strandWeight:42.2, beadCost:29.7882, totalBeads:102 },
  { code:'zs003', category:'紫水晶', name:'紫水晶10', supplier:'亚轩水晶', spec:'10', unit:'克', purchaseQty:2, totalPrice:664.8, autoUnitPrice:332.4, shape:'巴西', gramPrice:12, beadsPerStrand:19, strandWeight:27.7, beadCost:17.4947, totalBeads:38 },
  // 堇青石 jq001-jq002
  { code:'jq001', category:'堇青石', name:'堇青石8', supplier:'新意水晶', spec:'8', unit:'克', purchaseQty:2, totalPrice:153, autoUnitPrice:76.5, shape:'堇青石', gramPrice:4.5, beadsPerStrand:23, strandWeight:17, beadCost:3.3261, totalBeads:46 },
  { code:'jq002', category:'堇青石', name:'堇青石10', supplier:'新意水晶', spec:'10', unit:'克', purchaseQty:3, totalPrice:391.5, autoUnitPrice:130.5, shape:'堇青石', gramPrice:4.5, beadsPerStrand:20, strandWeight:29, beadCost:6.525, totalBeads:60 },
  // 茶晶 cj001-cj002
  { code:'cj001', category:'茶晶', name:'茶晶8', supplier:'新意水晶', spec:'8', unit:'串', purchaseQty:2, totalPrice:110, autoUnitPrice:49.5, shape:'茶晶', gramPrice:55, beadsPerStrand:47, strandWeight:1, beadCost:1.1702, totalBeads:94 },
  { code:'cj002', category:'茶晶', name:'茶晶10', supplier:'新意水晶', spec:'10', unit:'串', purchaseQty:3, totalPrice:285, autoUnitPrice:85.5, shape:'茶晶', gramPrice:95, beadsPerStrand:39, strandWeight:1, beadCost:2.4359, totalBeads:117 },
  // 配件 pj001-pj024
  { code:'pj001', category:'配件', name:'圆蜜蜡挂饰', supplier:'蒲公英', spec:'8.5', unit:'个', purchaseQty:18, totalPrice:387, autoUnitPrice:21.5, shape:'银镀金', gramPrice:21.5, beadsPerStrand:18, strandWeight:18, beadCost:21.5, totalBeads:18 },
  { code:'pj002', category:'配件', name:'隔珠片', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:62, totalPrice:731.6, autoUnitPrice:11.8, shape:'银镀金', gramPrice:11.8, beadsPerStrand:62, strandWeight:62, beadCost:11.8, totalBeads:62 },
  { code:'pj003', category:'配件', name:'隔珠片', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:35, totalPrice:234.5, autoUnitPrice:6.7, shape:'银镀金', gramPrice:6.7, beadsPerStrand:35, strandWeight:35, beadCost:6.7, totalBeads:35 },
  { code:'pj004', category:'配件', name:'镶钻方块', supplier:'蒲公英', spec:'3.5', unit:'个', purchaseQty:37, totalPrice:703, autoUnitPrice:19, shape:'银镀金', gramPrice:19, beadsPerStrand:37, strandWeight:37, beadCost:19, totalBeads:37 },
  { code:'pj005', category:'配件', name:'南红汉堡珠', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:6, totalPrice:192, autoUnitPrice:32, shape:'银镀金', gramPrice:32, beadsPerStrand:6, strandWeight:6, beadCost:32, totalBeads:6 },
  { code:'pj006', category:'配件', name:'镶钻青金圆珠', supplier:'蒲公英', spec:'11*6', unit:'个', purchaseQty:8, totalPrice:176, autoUnitPrice:22, shape:'银镀金', gramPrice:22, beadsPerStrand:8, strandWeight:8, beadCost:22, totalBeads:8 },
  { code:'pj007', category:'配件', name:'青金盖珠', supplier:'蒲公英', spec:'5.7', unit:'个', purchaseQty:12, totalPrice:108, autoUnitPrice:9, shape:'银镀金', gramPrice:9, beadsPerStrand:12, strandWeight:12, beadCost:9, totalBeads:12 },
  { code:'pj008', category:'配件', name:'翡翠祥云挂饰', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:12, totalPrice:108, autoUnitPrice:9, shape:'银镀金', gramPrice:9, beadsPerStrand:12, strandWeight:12, beadCost:9, totalBeads:12 },
  { code:'pj009', category:'配件', name:'蜜蜡配珠', supplier:'蒲公英', spec:'10', unit:'个', purchaseQty:10, totalPrice:315, autoUnitPrice:31.5, shape:'银镀金', gramPrice:31.5, beadsPerStrand:10, strandWeight:10, beadCost:31.5, totalBeads:10 },
  { code:'pj010', category:'配件', name:'绿松小挂饰', supplier:'蒲公英', spec:'3', unit:'个', purchaseQty:22, totalPrice:198, autoUnitPrice:9, shape:'银镀金', gramPrice:9, beadsPerStrand:22, strandWeight:22, beadCost:9, totalBeads:22 },
  { code:'pj011', category:'配件', name:'绿松银杏叶挂饰', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:23, totalPrice:172.5, autoUnitPrice:7.5, shape:'银镀金', gramPrice:7.5, beadsPerStrand:23, strandWeight:23, beadCost:7.5, totalBeads:23 },
  { code:'pj012', category:'配件', name:'蜜蜡葫芦单挂饰', supplier:'蒲公英', spec:'5', unit:'个', purchaseQty:21, totalPrice:315, autoUnitPrice:15, shape:'银镀金', gramPrice:15, beadsPerStrand:21, strandWeight:21, beadCost:15, totalBeads:21 },
  { code:'pj013', category:'配件', name:'绿松盾牌挂饰', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:8, totalPrice:128, autoUnitPrice:16, shape:'银镀金', gramPrice:16, beadsPerStrand:8, strandWeight:8, beadCost:16, totalBeads:8 },
  { code:'pj014', category:'配件', name:'蜜蜡葫芦双挂饰', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:17, totalPrice:365.5, autoUnitPrice:21.5, shape:'银镀金', gramPrice:21.5, beadsPerStrand:17, strandWeight:17, beadCost:21.5, totalBeads:17 },
  { code:'pj015', category:'配件', name:'海纹石配珠', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:13, totalPrice:188.5, autoUnitPrice:14.5, shape:'银镀金', gramPrice:14.5, beadsPerStrand:13, strandWeight:13, beadCost:14.5, totalBeads:13 },
  { code:'pj016', category:'配件', name:'绿松圆方配珠', supplier:'蒲公英', spec:'6', unit:'个', purchaseQty:17, totalPrice:255, autoUnitPrice:15, shape:'银镀金', gramPrice:15, beadsPerStrand:17, strandWeight:17, beadCost:15, totalBeads:17 },
  { code:'pj017', category:'配件', name:'镶钻圆珠', supplier:'蒲公英', spec:'9', unit:'个', purchaseQty:11, totalPrice:220, autoUnitPrice:20, shape:'银镀金', gramPrice:20, beadsPerStrand:11, strandWeight:11, beadCost:20, totalBeads:11 },
  { code:'pj018', category:'配件', name:'花纹圆珠', supplier:'蒲公英', spec:'9', unit:'个', purchaseQty:8, totalPrice:240, autoUnitPrice:30, shape:'银镀金', gramPrice:30, beadsPerStrand:8, strandWeight:8, beadCost:30, totalBeads:8 },
  { code:'pj019', category:'配件', name:'雕佛三通', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:3, totalPrice:78, autoUnitPrice:26, shape:'银镀金', gramPrice:26, beadsPerStrand:3, strandWeight:3, beadCost:26, totalBeads:3 },
  { code:'pj020', category:'配件', name:'祥云纹三通', supplier:'蒲公英', spec:'7', unit:'个', purchaseQty:3, totalPrice:54, autoUnitPrice:18, shape:'银镀金', gramPrice:18, beadsPerStrand:3, strandWeight:3, beadCost:18, totalBeads:3 },
  { code:'pj021', category:'配件', name:'佛符号三通', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:3, totalPrice:70.5, autoUnitPrice:23.5, shape:'银镀金', gramPrice:23.5, beadsPerStrand:3, strandWeight:3, beadCost:23.5, totalBeads:3 },
  { code:'pj022', category:'配件', name:'莲花三通', supplier:'蒲公英', spec:'10', unit:'个', purchaseQty:2, totalPrice:64, autoUnitPrice:32, shape:'银镀金', gramPrice:32, beadsPerStrand:2, strandWeight:2, beadCost:32, totalBeads:2 },
  { code:'pj023', category:'配件', name:'挂耳三通', supplier:'蒲公英', spec:'8', unit:'个', purchaseQty:2, totalPrice:72, autoUnitPrice:36, shape:'银镀金', gramPrice:36, beadsPerStrand:2, strandWeight:2, beadCost:36, totalBeads:2 },
  { code:'pj024', category:'配件', name:'18k金镭光珠', supplier:'宝珠', spec:'0.2', unit:'个', purchaseQty:100, totalPrice:660, autoUnitPrice:6.6, shape:'18K金', gramPrice:6.6, beadsPerStrand:100, strandWeight:100, beadCost:6.6, totalBeads:100 },
];

function isBeaded(row: Row): boolean {
  return row.unit === '克' || row.unit === '串';
}

function mapMaterialType(category: string): string {
  const beadCats = ['沉香','蜜蜡','青金石','猛犸','南红','白水晶','白兔毛','月光石','草莓晶','粉水晶','紫水晶','堇青石','茶晶'];
  if (beadCats.includes(category)) return 'BEAD';
  if (category === '配件') return 'METAL';
  return 'OTHER';
}

async function main() {
  const prisma = new PrismaClient();
  console.log('═══════════════════════════════════════');
  console.log('  允物 ERP Excel 数据同步 V3 (全量65条)');
  console.log('═══════════════════════════════════════\n');

  // ── Step 1: 同步原料库 ──
  console.log('[1/3] 同步原料库 (RawMaterial)...\n');
  let matNew = 0, matUpdate = 0;

  for (const row of DATA) {
    const beaded = isBeaded(row);
    const materialType = mapMaterialType(row.category);

    const inventoryUnit = beaded ? '颗' : '个';
    const remaining = beaded ? row.totalBeads : row.purchaseQty;
    const defaultPurchaseUnit = beaded ? row.unit : '个'; // 克 or 串
    const defaultConversionRate = beaded ? row.beadsPerStrand : 1;

    const createData = {
      code: row.code,
      name: row.name,
      category: row.category,
      materialType: materialType as any,
      specification: String(row.spec),
      inventoryUnit,
      remaining,
      unitCost: Math.round(row.beadCost * 100) / 100,
      shape: row.shape,
      beadsPerStrand: row.beadsPerStrand,
      weightPerStrand: Math.round(row.strandWeight * 100) / 100,
      defaultPurchaseUnit,
      defaultConversionRate,
      supplier: row.supplier,
      remark: row.shape,
      status: 'READY' as const,
    };

    const existing = await prisma.rawMaterial.findUnique({ where: { code: row.code } });
    if (existing) {
      const { code, status, ...updateData } = createData;
      await prisma.rawMaterial.update({ where: { code: row.code }, data: updateData });
      matUpdate++;
    } else {
      await prisma.rawMaterial.create({ data: createData });
      matNew++;
    }
  }
  console.log(`  ✓ 新增: ${matNew} 条, 更新: ${matUpdate} 条\n`);

  // ── Step 2: 采购记录 ──
  console.log('[2/3] 重建采购记录 (PurchaseRecord)...\n');
  const deleted = await prisma.purchaseRecord.deleteMany();
  console.log(`  → 已清除 ${deleted.count} 条旧记录\n`);

  let recCount = 0;
  for (const row of DATA) {
    const material = await prisma.rawMaterial.findUnique({ where: { code: row.code } });
    if (!material) continue;

    const beaded = isBeaded(row);
    const purchaseUnit = row.unit;
    const conversionRate = beaded ? row.beadsPerStrand : 1;
    const inventoryQuantity = beaded ? row.totalBeads : row.purchaseQty;
    const purchaseUnitPrice = beaded
      ? (row.unit === '克' ? row.gramPrice : row.autoUnitPrice)
      : row.autoUnitPrice;

    await prisma.purchaseRecord.create({
      data: {
        materialId: material.id,
        supplier: row.supplier,
        purchaseUnit,
        conversionRate,
        purchaseQuantity: row.purchaseQty,
        purchaseUnitPrice,
        purchasePrice: row.totalPrice,
        inventoryQuantity,
        unitCost: Math.round(row.beadCost * 100) / 100,
      },
    });
    recCount++;
  }
  console.log(`  ✓ 采购记录: ${recCount} 条\n`);

  // ── Step 3: 库存事务 ──
  console.log('[3/3] 重建库存事务 (InventoryTransaction)...\n');
  const delTxn = await prisma.inventoryTransaction.deleteMany();
  console.log(`  → 已清除 ${delTxn.count} 条旧事务\n`);

  let txnCount = 0;
  for (const row of DATA) {
    const material = await prisma.rawMaterial.findUnique({ where: { code: row.code } });
    if (!material) continue;

    const beaded = isBeaded(row);
    const qty = beaded ? row.totalBeads : row.purchaseQty;

    await prisma.inventoryTransaction.create({
      data: {
        materialId: material.id,
        type: 'IN',
        quantity: qty,
        beforeQty: 0,
        afterQty: qty,
        remark: 'Excel初始导入',
      },
    });
    txnCount++;
  }
  console.log(`  ✓ 库存事务: ${txnCount} 条\n`);

  // ── 统计 ──
  const totalMats = await prisma.rawMaterial.count();
  const totalRecords = await prisma.purchaseRecord.count();
  const totalTxns = await prisma.inventoryTransaction.count();

  const beadCount = await prisma.rawMaterial.count({ where: { materialType: 'BEAD' } });
  const metalCount = await prisma.rawMaterial.count({ where: { materialType: 'METAL' } });

  const beadStock = await prisma.rawMaterial.aggregate({
    where: { materialType: 'BEAD' },
    _sum: { remaining: true },
  });
  const metalStock = await prisma.rawMaterial.aggregate({
    where: { materialType: 'METAL' },
    _sum: { remaining: true },
  });

  console.log('═══════════════════════════════════════');
  console.log('  同步完成');
  console.log(`  RawMaterials:     ${totalMats} 条 (珠子 ${beadCount} / 配件 ${metalCount})`);
  console.log(`  PurchaseRecords:  ${totalRecords} 条`);
  console.log(`  InventoryTxns:    ${totalTxns} 条`);
  console.log(`  珠子总颗数:       ${beadStock._sum.remaining ?? 0} 颗`);
  console.log(`  配件总数量:       ${metalStock._sum.remaining ?? 0} 个`);
  console.log('═══════════════════════════════════════');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('同步失败:', e);
  process.exit(1);
});
