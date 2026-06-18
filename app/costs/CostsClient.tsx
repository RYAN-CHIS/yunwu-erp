"use client";
import { useState } from "react";
import { TrendingUp, TrendingDown, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Cost {
  skuId: number;
  skuCode: string;
  skuName: string;
  specification: string | null;
  size: string | null;
  status: string;
  seriesName: string;
  workName: string;
  productName: string;
  price: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  finishedStock: number;
  markupRatio: number;
  rarityLevel: number;
  storyFactor: number;
  materialCost: number;
  laborCost: number;
}

export default function CostsClient({ list }: { list: Cost[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [laborInput, setLaborInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const filtered = searchQuery
    ? list.filter((r) => {
        const q = searchQuery.toLowerCase();
        return r.skuCode.toLowerCase().includes(q) || r.skuName.toLowerCase().includes(q)
          || r.productName.toLowerCase().includes(q) || r.seriesName.toLowerCase().includes(q);
      })
    : list;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleSearch(q: string) { setSearchQuery(q); setCurrentPage(1); }

  function handleExport() { window.open("/api/export?type=costs", "_blank"); }

  // 汇总统计（使用过滤后数据）
  const totalMaterialCost = filtered.reduce((s, r) => s + r.materialCost, 0);
  const totalLaborCost = filtered.reduce((s, r) => s + r.laborCost, 0);
  const totalRevenue = filtered.reduce((s, r) => s + r.price * r.finishedStock, 0);
  const totalProfit = filtered.reduce((s, r) => s + r.grossProfit * r.finishedStock, 0);

  async function saveLaborCost(skuId: number) {
    setSaving(true);
    await fetch("/api/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skuId, laborCost: Number(laborInput) }),
    });
    setSaving(false);
    setEditingId(null);
    window.location.reload();
  }

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT:      { bg: "rgba(107,114,128,0.1)",  text: "#6b7280", label: "草稿" },
    DESIGNING:  { bg: "rgba(59,130,246,0.1)",   text: "#3b82f6", label: "设计中" },
    READY:      { bg: "rgba(245,158,11,0.1)",   text: "#d97706", label: "就绪" },
    ACTIVE:     { bg: "rgba(34,197,94,0.1)",    text: "#16a34a", label: "上架" },
    PAUSED:     { bg: "rgba(249,115,22,0.1)",   text: "#ea580c", label: "暂停" },
    ARCHIVED:   { bg: "rgba(107,114,128,0.08)", text: "#9ca3af", label: "归档" },
  };

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] p-6 gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>利润分析</h1>
        <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-light)" }} />
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索SKU或产品…"
                className="w-48 pl-9 pr-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--border)" }}>
            <Download size={16} />导出
          </button>
          <p className="text-xs" style={{ color: "var(--ink-light)" }}>
            共 {filtered.length} 个 SKU · 点击行可编辑人工成本
          </p>
        </div>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-[var(--paper)] rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs" style={{ color: "var(--ink-light)" }}>材料总成本</p>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--ink)" }}>¥{totalMaterialCost.toFixed(2)}</p>
        </div>
        <div className="bg-[var(--paper)] rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs" style={{ color: "var(--ink-light)" }}>人工总成本</p>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--ink)" }}>¥{totalLaborCost.toFixed(2)}</p>
        </div>
        <div className="bg-[var(--paper)] rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs" style={{ color: "var(--ink-light)" }}>预计总收入</p>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--jin)" }}>¥{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-[var(--paper)] rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs" style={{ color: "var(--ink-light)" }}>预计总毛利</p>
          <p className="text-xl font-bold mt-1" style={{ color: totalProfit >= 0 ? "#16a34a" : "#dc2626" }}>
            ¥{totalProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 明细表格 */}
      <div className="flex-1 min-h-0 bg-[var(--paper)] rounded-xl border border-[var(--border)] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="relative z-10">
            <tr style={{ background: "rgba(245,240,230,0.95)", color: "var(--ink-light)", position: "sticky", top: 0 }}>
              <th className="text-left p-3 whitespace-nowrap sticky left-0 z-20" style={{ background: "rgba(245,240,230,0.95)" }}>SKU</th>
              <th className="text-left p-3">系列·作品</th>
              <th className="text-left p-3">状态</th>
              <th className="text-right p-3">材料成本</th>
              <th className="text-right p-3">人工成本</th>
              <th className="text-right p-3">总成本</th>
              <th className="text-right p-3">售价</th>
              <th className="text-right p-3">单件毛利</th>
              <th className="text-right p-3">毛利率</th>
              <th className="text-right p-3">库存</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r) => {
              const isEditing = editingId === r.skuId;
              const sc = statusColors[r.status] ?? statusColors.DRAFT;
              return (
                <tr key={r.skuId} className="border-t border-[var(--border)] hover:bg-[rgba(245,240,230,0.4)]">
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs">{r.skuCode}</span>
                      <span className="text-xs" style={{ color: "var(--ink-light)" }}>
                        {r.skuName}{r.specification ? ` · ${r.specification}` : ""}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-xs" style={{ color: "var(--ink-light)" }}>
                    {r.seriesName} · {r.workName}
                  </td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                      {sc.label}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono">¥{r.materialCost.toFixed(2)}</td>
                  <td
                    className="p-3 text-right font-mono cursor-pointer"
                    onClick={() => { setEditingId(r.skuId); setLaborInput(String(r.laborCost)); }}
                  >
                    {isEditing ? (
                      <span className="inline-flex items-center gap-1">
                        <input
                          autoFocus
                          type="number"
                          min={0}
                          value={laborInput}
                          onChange={e => setLaborInput(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="w-16 px-1 py-0.5 text-right border rounded text-xs"
                          style={{ borderColor: "var(--jin)" }}
                        />
                        <button
                          disabled={saving}
                          onClick={e => { e.stopPropagation(); saveLaborCost(r.skuId); }}
                          className="text-xs px-1.5 py-0.5 rounded text-white"
                          style={{ background: "var(--jin)" }}
                        >✓</button>
                        <button
                          onClick={e => { e.stopPropagation(); setEditingId(null); }}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "var(--border)" }}
                        >✕</button>
                      </span>
                    ) : (
                      <span style={{ color: r.laborCost > 0 ? "var(--ink)" : "var(--ink-light)" }}>
                        ¥{r.laborCost.toFixed(2)}
                        <span className="ml-1 text-xs opacity-40">✏</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono font-medium">¥{r.totalCost.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono" style={{ color: "var(--jin)" }}>¥{r.price.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono" style={{ color: r.grossProfit >= 0 ? "#16a34a" : "#dc2626" }}>
                    <span className="inline-flex items-center gap-1">
                      {r.grossProfit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      ¥{r.grossProfit.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: r.grossMargin >= 60 ? "rgba(22,163,74,0.1)" : r.grossMargin >= 30 ? "rgba(217,119,6,0.1)" : "rgba(220,38,38,0.1)",
                        color: r.grossMargin >= 60 ? "#16a34a" : r.grossMargin >= 30 ? "#d97706" : "#dc2626",
                      }}
                    >
                      {r.grossMargin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono">{r.finishedStock}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="p-6 text-center" style={{ color: "var(--ink-light)" }}>
                  {searchQuery ? `未找到匹配"${searchQuery}"的SKU` : "暂无成本数据，请先在 BOM 模块录入材料用量"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--ink-light)" }}>共 {filtered.length} 条 · 第 {safePage}/{totalPages} 页</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={safePage <= 1} className="p-2 rounded-md text-xs disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]">首页</button>
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-2 rounded-md disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]"><ChevronLeft size={14} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setCurrentPage(p)} className="w-8 h-8 rounded-md text-xs font-mono" style={safePage === p ? { background: "#b45309", color: "#fff" } : { color: "var(--ink)" }}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-2 rounded-md disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]"><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={safePage >= totalPages} className="p-2 rounded-md text-xs disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]">末页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
