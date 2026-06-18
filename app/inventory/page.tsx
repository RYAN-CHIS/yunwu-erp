import { prisma } from "@/lib/prisma";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const [materials, transactions] = await Promise.all([
    prisma.rawMaterial.findMany({ orderBy: { id: "asc" } }),
    prisma.inventoryTransaction.findMany({
      include: { material: { select: { code: true, name: true, inventoryUnit: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return <InventoryClient materials={materials} transactions={transactions} />;
}
