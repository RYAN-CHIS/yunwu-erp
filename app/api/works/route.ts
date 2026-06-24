import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const list = await prisma.works.findMany({
    orderBy: { createdAt: "desc" },
    include: { series: true, assets: true, products: true },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const data = await req.json();
  const work = await prisma.works.create({
    data: {
      code: data.code,
      name: data.name,
      seriesId: data.seriesId,
      status: data.status ?? "DESIGNING",
      // 器物履历字段
      materialOrigin: data.materialOrigin ?? null,
      craftMethod: data.craftMethod ?? null,
      completionDate: data.completionDate ? new Date(data.completionDate) : null,
      serialNumber: data.serialNumber ?? null,
      creationStory: data.creationStory ?? null,
      emotionalState: data.emotionalState ?? null,
      // 时间性缓存字段
      companionsCount: data.companionsCount ?? 0,
      remainingQuantity: data.remainingQuantity ?? null,
    },
  });
  return NextResponse.json(work);
}
