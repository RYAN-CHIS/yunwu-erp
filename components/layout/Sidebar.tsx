"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Warehouse,
  Gem,
  Upload,
  Menu,
  X,
  Sparkle,
  Layers,
  LogOut,
  Settings,
  Users,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",  label: "总览",     icon: LayoutDashboard },
  { href: "/series",     label: "七序管理", icon: Layers },
  { href: "/works",      label: "作品管理", icon: Sparkle },
  { href: "/products",   label: "产品/SKU",  icon: Gem },
  {
    href: "/materials",
    label: "原材料",
    icon: Package,
    children: [
      { href: "/materials",            label: "全部材料", icon: "📦" },
      { href: "/materials?view=bead",   label: "珠子系统", icon: "🫧" },
      { href: "/materials?view=ceramic",label: "瓷器系统", icon: "🏺" },
      { href: "/materials?view=metal",  label: "金属配件", icon: "⚙️" },
      { href: "/materials?view=seal",   label: "印章系统", icon: "🔖" },
    ],
  },
  { href: "/bom",        label: "BOM",       icon: Layers },
  { href: "/costs",      label: "成本核算", icon: DollarSign },
  { href: "/inventory",  label: "库存池",   icon: Warehouse },
  {
    href: "/orders",
    label: "销售管理",
    icon: ShoppingCart,
    children: [
      { href: "/orders",    label: "订单管理", icon: "📋" },
      { href: "/customers", label: "客户管理", icon: "👤" },
    ],
  },
  { href: "/import",     label: "数据导入", icon: Upload },
  { href: "/settings",   label: "系统设置", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | false>(false);

  // Session
  const { data: session } = useSession();

  // 路由变化时自动展开/收起对应的父级菜单
  useEffect(() => {
    const parentItem = navItems.find(
      (item) => "children" in item && item.children?.some((child) => pathname.startsWith(child.href.split("?")[0]))
    );
    setExpanded(!!parentItem ? parentItem.href : false);
  }, [pathname]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center w-9 h-9 rounded-lg shadow-md"
        style={{ background: "#EDE6DA", color: "#3D3226", border: "1px solid rgba(61,50,38,0.15)" }}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/25 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-60 flex flex-col transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          background: "linear-gradient(175deg, #F7F3EC 0%, #EDE6DA 50%, #F7F3EC 100%)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.06)",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "32px 20px 24px", borderBottom: "1px solid rgba(61,50,38,0.08)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {/* Logo Image - 白色/卡其色滤镜 */}
            <div style={{
              position: "relative",
              width: 72,
              height: 72,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, rgba(180,83,9,0.12), rgba(180,83,9,0.04))",
              border: "1px solid rgba(180,83,9,0.15)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}>
              <img
                src="/logo.png"
                alt="允物"
                style={{
                  width: 56,
                  height: 56,
                  objectFit: "contain",
                  filter: "brightness(0.4)",
                }}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <h1 style={{
                margin: 0,
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "#3D3226",
                letterSpacing: "0.15em",
                fontFamily: "var(--font-serif-zh), serif",
              }}>
                允物
              </h1>
              <p style={{
                margin: "4px 0 0 0",
                fontSize: "0.65rem",
                color: "rgba(61,50,38,0.45)",
                letterSpacing: "0.08em",
              }}>
                让物归物，让心归心
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const hasChildren = "children" in item && item.children;
            const isActive = !hasChildren && pathname === item.href;
            const isParentActive = hasChildren && pathname.startsWith(item.href);

            if (!hasChildren) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    padding: "10px 14px", borderRadius: 10,
                    fontSize: "0.85rem", fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#3D3226" : "rgba(61,50,38,0.55)",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(180,83,9,0.08), rgba(180,83,9,0.03))"
                      : "transparent",
                    border: isActive ? "1px solid rgba(180,83,9,0.18)" : "1px solid transparent",
                    transition: "all 0.2s ease",
                    textDecoration: "none",
                    marginBottom: 3,
                    position: "relative" as const,
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.background = "rgba(61,50,38,0.05)";
                      (e.target as HTMLElement).style.color = "rgba(61,50,38,0.85)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.background = "transparent";
                      (e.target as HTMLElement).style.color = "rgba(61,50,38,0.55)";
                    }
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: "absolute",
                      left: 0, top: "50%",
                      transform: "translateY(-50%)",
                      width: 3, height: 20,
                      borderRadius: "0 2px 2px 0",
                      background: "linear-gradient(180deg, #fbbf24, #b45309)",
                      boxShadow: "0 0 8px rgba(251,191,36,0.3)",
                    }} />
                  )}
                  <item.icon size={17} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.55 }} />
                  {item.label}
                </Link>
              );
            }

            // 有子菜单的项
            return (
              <div key={item.href}>
                <button
                  onClick={() => setExpanded(expanded === item.href ? false : item.href)}
                  style={{
                    display: "flex", alignItems: "center", gap: 11,
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    fontSize: "0.85rem", fontWeight: isParentActive ? 600 : 400,
                    color: isParentActive ? "#3D3226" : "rgba(61,50,38,0.55)",
                    background: isParentActive
                      ? "linear-gradient(135deg, rgba(180,83,9,0.08), rgba(180,83,9,0.03))"
                      : "transparent",
                    border: isParentActive ? "1px solid rgba(180,83,9,0.18)" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    marginBottom: 3,
                    position: "relative" as const,
                  }}
                  onMouseEnter={(e) => {
                    if (!isParentActive) {
                      e.currentTarget.style.background = "rgba(61,50,38,0.05)";
                      e.currentTarget.style.color = "rgba(61,50,38,0.85)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isParentActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(61,50,38,0.55)";
                    }
                  }}
                >
                  {isParentActive && (
                    <div style={{
                      position: "absolute",
                      left: 0, top: "50%",
                      transform: "translateY(-50%)",
                      width: 3, height: 20,
                      borderRadius: "0 2px 2px 0",
                      background: "linear-gradient(180deg, #fbbf24, #b45309)",
                      boxShadow: "0 0 8px rgba(251,191,36,0.3)",
                    }} />
                  )}
                  <item.icon size={17} style={{ flexShrink: 0, opacity: isParentActive ? 1 : 0.55 }} />
                  <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: expanded === item.href ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease",
                      opacity: 0.45,
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                {expanded === item.href && (
                  <div style={{ paddingLeft: 22 }}>
                    {item.children!.map((child) => {
                      const childView = new URLSearchParams(
                        child.href.includes("?") ? child.href.split("?")[1] : ""
                      ).get("view");
                      // "全部材料"：仅在无 view 参数时高亮
                      // 分类项：仅当 view 参数匹配时高亮
                      const childActive = childView
                        ? pathname === "/materials" && currentView === childView
                        : pathname === "/materials" && !currentView;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpen(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: 9,
                            padding: "8px 14px", borderRadius: 8,
                            fontSize: "0.8rem", fontWeight: childActive ? 600 : 400,
                            color: childActive ? "#b45309" : "rgba(61,50,38,0.45)",
                            background: childActive
                              ? "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(180,83,9,0.04))"
                              : "transparent",
                            border: childActive ? "1px solid rgba(251,191,36,0.18)" : "1px solid transparent",
                            transition: "all 0.2s ease",
                            textDecoration: "none",
                            marginBottom: 2,
                          }}
                          onMouseEnter={(e) => {
                            if (!childActive) {
                              (e.target as HTMLElement).style.background = "rgba(61,50,38,0.04)";
                              (e.target as HTMLElement).style.color = "rgba(61,50,38,0.7)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!childActive) {
                              (e.target as HTMLElement).style.background = "transparent";
                              (e.target as HTMLElement).style.color = "rgba(61,50,38,0.45)";
                            }
                          }}
                        >
                          <span style={{ fontSize: "0.8rem" }}>{child.icon}</span>
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          borderTop: "1px solid rgba(61,50,38,0.08)",
        }}>
          {/* User Info */}
          {session?.user && (
            <div style={{
              padding: "12px 20px 8px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                overflow: "hidden",
                flexShrink: 0,
                background: "linear-gradient(135deg, rgba(180,83,9,0.15), rgba(120,60,10,0.06))",
                border: "1px solid rgba(180,83,9,0.15)",
              }}>
                {(session.user as any).avatar ? (
                  <img
                    src={(session.user as any).avatar}
                    alt="头像"
                    style={{
                      width: 32, height: 32, objectFit: "cover",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", fontWeight: 600,
                    color: "#3D3226",
                  }}>
                    {(session.user.name || session.user.email || "A").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: "0.78rem", fontWeight: 500,
                  color: "rgba(61,50,38,0.8)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {session.user.name || session.user.email}
                </p>
                <p style={{
                  margin: 0, fontSize: "0.65rem",
                  color: "rgba(61,50,38,0.4)",
                }}>
                  {(session.user as any).role === "admin" ? "管理员" : "用户"}
                </p>
              </div>
            </div>
          )}

          {/* Logout */}
          <div style={{ padding: "4px 14px 12px" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "8px 10px", borderRadius: 8,
                fontSize: "0.74rem", color: "rgba(246,241,235,0.4)",
                background: "transparent", border: "none", cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(220,38,38,0.08)";
                e.currentTarget.style.color = "rgba(220,38,38,0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(61,50,38,0.35)";
              }}
            >
              <LogOut size={13} />
              退出登录
            </button>
          </div>

          <div style={{
            padding: "0 24px 14px",
            fontSize: "0.62rem", color: "rgba(61,50,38,0.25)", letterSpacing: "0.05em",
          }}>
            © 2026  允物品牌
          </div>
        </div>
      </aside>
    </>
  );
}
