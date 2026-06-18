import { prisma } from "@/lib/prisma";
import CostsClient from "./CostsClient";

export const dynamic = 'force-dynamic';

export default async function CostsPage() {
  const skus = await prisma.productSku.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      product: {
        include: { work: { include: { series: true } } },
      },
      cost: true,
    },
  });

  const list = skus.map((sku) => {
    const totalCost = sku.cost?.totalCost ?? 0;
    const price = sku.price ?? 0;
    const grossProfit = price - totalCost;
    const grossMargin =
      price > 0 ? Math.round((grossProfit / price) * 10000) / 100 : 0;
    return {
      skuId: sku.id,
      skuCode: sku.code,
      skuName: sku.name,
      specification: sku.specification,
      size: sku.size,
      status: sku.status as string,
      seriesName: sku.product.work.series.name,
      workName: sku.product.work.name,
      productName: sku.product.name,
      price,
      totalCost,
      grossProfit,
      grossMargin,
      finishedStock: sku.finishedStock,
      markupRatio: sku.markupRatio ?? 1,
      rarityLevel: sku.rarityLevel ?? 1,
      storyFactor: sku.storyFactor ?? 1,
      materialCost: sku.cost?.materialCost ?? 0,
      laborCost: sku.cost?.laborCost ?? 0,
    };
  });

  return <CostsClient list={list} />;
}
