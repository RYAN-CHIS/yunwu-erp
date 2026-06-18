import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// 使用 Node.js runtime 以支持 Prisma 数据库查询
export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow NextAuth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo")
  ) {
    return NextResponse.next();
  }

  // Allow login, forgot-password, reset-password pages
  if (pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password") {
    return NextResponse.next();
  }

  // Check authentication
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 验证用户是否仍然存在于数据库中
  // 解决删除用户后已登录会话仍然有效的问题
  if (token.id) {
    try {
      const userId = parseInt(token.id as string);
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });

        if (!user) {
          // 用户已被删除，清除会话并重定向到登录页
          const loginUrl = new URL("/login", request.url);
          const response = NextResponse.redirect(loginUrl);

          // 清除 NextAuth session cookie
          response.cookies.set("next-auth.session-token", "", {
            maxAge: 0,
            path: "/",
          });
          response.cookies.set("__Secure-next-auth.session-token", "", {
            maxAge: 0,
            path: "/",
          });

          return response;
        }
      }
    } catch (error) {
      // 数据库查询失败时，为了安全起见仍然拒绝访问
      console.error("Middleware user verification failed:", error);
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/auth/* (NextAuth API routes)
     * - /_next/* (Next.js internals)
     * - /favicon.*, /logo.* (static assets)
     */
    "/((?!api/auth|_next|favicon\\.svg|logo\\.png).*)",
  ],
};
