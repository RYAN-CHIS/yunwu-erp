import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MaterialsClient from "./MaterialsClient";

// view → API 过滤参数映射
const VIEW_FILTER: Record<string, { materialType?: string; category?: string }> = {
  bead: { materialType: "BEAD" },
  ceramic: { materialType: "CERAMIC" },
  metal: { materialType: "METAL,CORD" },
  seal: { category: "印章" },
};

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const filter = view ? VIEW_FILTER[view] : undefined;

  const where: any = {};
  if (filter?.materialType) {
    const types = filter.materialType.split(",").map((t) => t.trim()).filter(Boolean);
    if (types.length === 1) {
      where.materialType = types[0];
    } else if (types.length > 1) {
      where.materialType = { in: types };
    }
  }
  if (filter?.category) {
    where.category = { contains: filter.category };
  }

  const materials = await prisma.rawMaterial.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return <MaterialsClient materials={materials} activeView={view || ""} />;
}
