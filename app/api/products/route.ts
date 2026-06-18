import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * 获取产品列表
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const workId = searchParams.get("workId");

  const where: any = {};
  if (status) where.status = status;
  if (workId) where.workId = parseInt(workId);

  const products = await prisma.products.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      work: { include: { series: true } },
      skus: {
        include: { cost: true },
      },
    },
  });

  return NextResponse.json(products);
}

/**
 * 创建产品
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.code) {
      return NextResponse.json({ error: "产品编码不能为空" }, { status: 400 });
    }
    if (!data.name) {
      return NextResponse.json({ error: "产品名称不能为空" }, { status: 400 });
    }
    if (!data.workId) {
      return NextResponse.json({ error: "作品ID不能为空" }, { status: 400 });
    }

    const product = await prisma.products.create({
      data: {
        code: data.code,
        name: data.name,
        workId: parseInt(data.workId),
        status: data.status ?? "DESIGNING",
        description: data.description ?? "",
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "产品编码已存在" }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "创建产品失败" },
      { status: 500 }
    );
  }
}
