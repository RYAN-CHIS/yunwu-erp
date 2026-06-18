import { prisma } from "@/lib/prisma";
import {
  Package,
  Layers,
  DollarSign,
  Warehouse,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

async function getStats() {
  const [
    materialCount,
    seriesCount,
    worksCount,
    skuCount,
    inventoryTotal,
    costTotal,
  ] = await Promise.all([
    prisma.rawMaterial.count(),
    prisma.series.count(),
    prisma.works.count(),
    prisma.productSku.count(),
    prisma.rawMaterial.aggregate({ _sum: { remaining: true } }),
    prisma.productCost.aggregate({ _sum: { totalCost: true } }),
  ]);

  return {
    materialCount,
    seriesCount,
    worksCount,
    skuCount,
    inventoryTotal: inventoryTotal._sum.remaining ?? 0,
    costTotal: costTotal._sum.totalCost ?? 0,
  };
}

async function getRecentPurchases() {
  return prisma.purchaseRecord.findMany({
    include: {
      material: { select: { code: true, name: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

async function getLowInventory() {
  return prisma.rawMaterial.findMany({
    where: { remaining: { lte: 50 } },
    orderBy: { remaining: "asc" },
    take: 5,
  });
}

export default async function DashboardPage() {
  const [stats, recentPurchases, lowInventory] = await Promise.all([
    getStats(),
    getRecentPurchases(),
    getLowInventory(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          让物归物，让心归心
        </h1>
        <p style={{ color: "var(--ink-light)", marginTop: 4 }}>
          东方文化品牌管理系统
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Package size={20} />}
          label="原材料"
          value={stats.materialCount}
          href="/materials"
          color="var(--zhu)"
        />
        <StatCard
          icon={<Layers size={20} />}
          label="七序系列"
          value={stats.seriesCount}
          href="/series"
          color="var(--zhu)"
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="作品数"
          value={stats.worksCount}
          href="/works"
          color="var(--zhu)"
        />
        <StatCard
          icon={<Warehouse size={20} />}
          label="SKU 总数"
          value={stats.skuCount}
          href="/products"
          color="var(--zhu)"
        />
        <StatCard
          icon={<Package size={20} />}
          label="库存总量"
          value={Number(stats.inventoryTotal).toFixed(1)}
          href="/inventory"
          color="var(--jin)"
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="总成本"
          value={`¥${Number(stats.costTotal).toFixed(2)}`}
          href="/costs"
          color="var(--jin)"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Purchases */}
        <div className="bg-[var(--paper)] rounded-xl border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: "var(--ink)" }}>
              最近采购
            </h2>
            <Link href="/materials" className="text-sm flex items-center gap-1" style={{ color: "var(--zhu)" }}>
              查看全部 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentPurchases.length === 0 && (
              <p className="text-sm" style={{ color: "var(--ink-light)" }}>
                暂无采购记录
              </p>
            )}
            {recentPurchases.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                    {p.material?.name ?? "未知材料"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--ink-light)" }}>
                    {p.material?.code} · {p.material?.category || "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: "var(--zhu)" }}>
                    ¥{p.purchasePrice.toFixed(2)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--ink-light)" }}>
                    {p.purchaseQuantity} {p.purchaseUnit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Inventory Alert */}
        <div className="bg-[var(--paper)] rounded-xl border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: "var(--ink)" }}>
              库存预警
            </h2>
            <Link href="/inventory" className="text-sm flex items-center gap-1" style={{ color: "var(--zhu)" }}>
              查看全部 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {lowInventory.length === 0 && (
              <p className="text-sm" style={{ color: "var(--ink-light)" }}>
                库存充足 ✅
              </p>
            )}
            {lowInventory.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                    {inv.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--ink-light)" }}>
                    {inv.code} · {inv.specification || "-"}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(220,38,38,0.08)",
                    color: "#dc2626",
                  }}
                >
                  余 {inv.remaining} {inv.inventoryUnit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="bg-[var(--paper)] rounded-xl border border-[var(--border)] p-5 flex flex-col gap-3 hover:shadow-md transition"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(185,28,28,0.08)" }}>
        {icon}
      </div>
      <p className="text-sm" style={{ color: "var(--ink-light)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
        {value}
      </p>
    </Link>
  );
}
