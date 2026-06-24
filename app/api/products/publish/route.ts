/**
 * Publish Status API
 * POST /api/products/publish
 * Body: { id: number, action: "submit_review"|"approve"|"return_to_draft"|"publish"|"unpublish"|"archive", reason?: string }
 *
 * Delegates to product-os.publish.ts for all state transitions.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import {
  submitProductForReview,
  approveProduct,
  returnProductToDraft,
  publishProduct,
  unpublishProduct,
  archiveProduct,
} from "@/lib/product-os/product-os.publish";

export const runtime = "nodejs";

type Action =
  | "submit_review"
  | "approve"
  | "return_to_draft"
  | "publish"
  | "unpublish"
  | "archive";

const ACTION_MAP: Record<Action, Function> = {
  submit_review: submitProductForReview,
  approve: approveProduct,
  return_to_draft: returnProductToDraft,
  publish: publishProduct,
  unpublish: unpublishProduct,
  archive: archiveProduct,
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const actorId = (session.user as any).id ?? null;

  let body: { id: number; action: Action; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  if (!body.id || !body.action) {
    return NextResponse.json({ error: "缺少 id 或 action" }, { status: 400 });
  }

  const actionFn = ACTION_MAP[body.action];
  if (!actionFn) {
    return NextResponse.json({ error: `不支持的操作: ${body.action}` }, { status: 400 });
  }

  try {
    const result = await actionFn(
      { id: body.id },
      actorId,
      body.reason,
    );
    return NextResponse.json({ success: true, product: result });
  } catch (e: any) {
    const message = e.message || "操作失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
