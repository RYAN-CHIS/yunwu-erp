import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/home-sections — 获取所有首页区块配置
 */
export async function GET() {
  const sections = await prisma.homeSection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { work: { select: { id: true, name: true, code: true } } },
  });
  return NextResponse.json(sections);
}

/**
 * POST /api/home-sections — 创建首页区块
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const section = await prisma.homeSection.create({
      data: {
        type: data.type,
        title: data.title ?? "",
        subtitle: data.subtitle ?? "",
        content: data.content ?? "",
        workId: data.workId ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
    return NextResponse.json(section);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "创建失败" }, { status: 500 });
  }
}
