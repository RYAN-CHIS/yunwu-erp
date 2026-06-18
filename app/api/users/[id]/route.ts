import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// PUT /api/users/[id] — 更新用户角色
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "无效的用户ID" }, { status: 400 });
    }

    const body = await req.json();
    const { role, permissions } = body;

    const updateData: Record<string, string | null> = {};

    if (role) {
      if (!["admin", "staff", "viewer"].includes(role)) {
        return NextResponse.json({ error: "无效的角色" }, { status: 400 });
      }
      // Cannot change own role
      if (String(userId) === (session.user as any).id) {
        return NextResponse.json({ error: "不能修改自己的角色" }, { status: 400 });
      }
      updateData.role = role;
    }

    if (permissions !== undefined) {
      if (typeof permissions !== "object" || permissions === null) {
        return NextResponse.json({ error: "无效的权限格式" }, { status: 400 });
      }
      updateData.permissions = JSON.stringify(permissions);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "没有需要更新的内容" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        permissions: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("更新用户失败:", error);
    return NextResponse.json({ error: "更新用户失败" }, { status: 500 });
  }
}

// DELETE /api/users/[id] — 删除用户
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "无效的用户ID" }, { status: 400 });
    }

    // Cannot delete self
    if (String(userId) === (session.user as any).id) {
      return NextResponse.json({ error: "不能删除自己的账号" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, message: "用户已删除" });
  } catch (error) {
    console.error("删除用户失败:", error);
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 });
  }
}
