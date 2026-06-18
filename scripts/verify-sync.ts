import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const series = await p.series.findMany({ orderBy: { sortOrder: 'asc' } });
  console.log('=== Series (七序) ===');
  series.forEach(s => console.log('  ', s.code, s.name, '| sort:', s.sortOrder));

  console.log('\n=== RawMaterial 抽查 ===');
  const samples = ['cx001','cx008','ml001','ml003','qj001','pj001','pj023'];
  for (const code of samples) {
    const m = await p.rawMaterial.findUnique({ where: { code } });
    if (!m) { console.log('  ', code, 'NOT FOUND'); continue; }
    console.log(`  ${m.code} | ${m.category} | ${m.name} | unit:${m.inventoryUnit} | spec:${m.specification} | rem:${m.remaining} | beadCost:${m.unitCost} | beads/strand:${m.beadsPerStrand} | strandWt:${m.weightPerStrand} | supplier:${m.supplier} | remark:${m.remark}`);
  }

  console.log('\n=== PurchaseRecord 抽查 ===');
  for (const code of samples) {
    const m = await p.rawMaterial.findUnique({ where: { code } });
    if (!m) continue;
    const rec = await p.purchaseRecord.findFirst({ where: { materialId: m.id }, orderBy: { id: 'asc' } });
    if (!rec) { console.log('  ', code, 'NO RECORD'); continue; }
    console.log(`  ${code} | unit:${rec.purchaseUnit} | unitPrice:${rec.purchaseUnitPrice} | convRate:${rec.conversionRate} | qty:${rec.purchaseQuantity} | totalPrice:${rec.purchasePrice} | invQty:${rec.inventoryQuantity} | beadCost:${rec.unitCost}`);
  }

  await p.$disconnect();
}

main();
