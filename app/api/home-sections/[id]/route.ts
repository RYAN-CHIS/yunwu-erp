import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * PUT /api/home-sections/[id] — 更新首页区块
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    const section = await prisma.homeSection.update({
      where: { id: Number(id) },
      data: {
        type: data.type,
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        workId: data.workId ?? null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
    return NextResponse.json(section);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "更新失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/home-sections/[id] — 删除首页区块
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.homeSection.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "删除失败" }, { status: 500 });
  }
}
