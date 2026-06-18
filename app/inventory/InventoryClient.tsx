"use client";
import { useState } from "react";
import { Plus, ArrowDown, ArrowUp, RefreshCw, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface Material {
  id: number;
  code: string;
  name: string;
  category: string;
  specification: string | null;
  materialType: string;
  inventoryUnit: string;
  remaining: number;
  unitCost: number | null;
  status: string;
  shape: string | null;
  beadsPerStrand: number | null;
  weightPerStrand: number | null;
  defaultPurchaseUnit: string | null;
  defaultConversionRate: number | null;
}

/** 格式化采购库存显示 */
function purchaseStock(remaining: number, purUnit: string | null, rate: number | null): string {
  if (purUnit && rate && rate > 0 && rate !== 1) {
    const qty = remaining / rate;
    const display = Number.isInteger(qty) ? qty : qty.toFixed(2);
    return `${display} ${purUnit}`;
  }
  return "-";
}

/** 格式化核算库存显示 */
function inventoryStock(remaining: number, invUnit: string): string {
  return `${remaining} ${invUnit}`;
}

/** 格式化采购单价 */
function purchaseUnitPrice(unitCost: number | null, rate: number | null): string {
  if (unitCost == null) return "-";
  if (rate && rate > 0 && rate !== 1) {
    return `¥${(unitCost * rate).toFixed(2)}`;
  }
  return "-";
}

/** 格式化核算单价 */
function inventoryUnitPrice(unitCost: number | null): string {
  if (unitCost == null) return "-";
  return `¥${unitCost.toFixed(2)}`;
}
interface Transaction {
  id: number;
  materialId: number;
  type: string;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  remark: string | null;
  createdAt: Date;
  material?: { code: string; name: string; inventoryUnit: string };
}

const typeMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  IN: { label: "入库", color: "#16a34a", icon: <ArrowDown size={12} /> },
  OUT: { label: "出库", color: "#dc2626", icon: <ArrowUp size={12} /> },
  ADJUST: { label: "调整", color: "#d97706", icon: <RefreshCw size={12} /> },
};

export default function InventoryClient({ materials, transactions }: { materials: Material[]; transactions: Transaction[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ materialId: 0, type: "OUT", quantity: 0, remark: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // 库存概览搜索过滤
  const filteredMaterials = searchQuery
    ? materials.filter((m) => {
        const q = searchQuery.toLowerCase();
        return m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
      })
    : materials;
  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMaterials = filteredMaterials.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 库存流水搜索过滤 & 分页
  const [txnSearchQuery, setTxnSearchQuery] = useState("");
  const [txnPage, setTxnPage] = useState(1);
  const filteredTxns = txnSearchQuery
    ? transactions.filter((t) => {
        const q = txnSearchQuery.toLowerCase();
        return t.material?.code.toLowerCase().includes(q) || t.material?.name.toLowerCase().includes(q) || (t.remark || "").toLowerCase().includes(q);
      })
    : transactions;
  const txnTotalPages = Math.max(1, Math.ceil(filteredTxns.length / PAGE_SIZE));
  const safeTxnPage = Math.min(txnPage, txnTotalPages);
  const paginatedTxns = filteredTxns.slice((safeTxnPage - 1) * PAGE_SIZE, safeTxnPage * PAGE_SIZE);

  function handleSearch(q: string) { setSearchQuery(q); setCurrentPage(1); }
  function handleTxnSearch(q: string) { setTxnSearchQuery(q); setTxnPage(1); }

  function openNew() {
    setForm({ materialId: materials[0]?.id ?? 0, type: "OUT", quantity: 0, remark: "" });
    setOpen(true);
  }
  function handleExport() { window.open("/api/export?type=inventory", "_blank"); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {
      materialId: Number(form.materialId),
      type: form.type,
      remark: form.remark,
    };
    if (form.type === "ADJUST") {
      body.newQuantity = Number(form.quantity);
    } else {
      body.quantity = Number(form.quantity);
    }
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>库存中心</h1>
        <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-light)" }} />
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索编码或名称…"
                className="w-48 pl-9 pr-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--border)" }}>
            <Download size={16} />导出
          </button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#b45309" }}>
            <Plus size={16} />库存操作
          </button>
        </div>
      </div>

      {/* 库存概览 */}
      <div>
        <h2 className="text-sm font-medium mb-3" style={{ color: "var(--ink-light)" }}>材料库存</h2>
        <div className="bg-[var(--paper)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 380px)" }}>
          <table className="w-full text-sm">
            <thead className="relative z-10">
              <tr style={{ background: "rgba(245,240,230,0.95)", color: "var(--ink-light)", position: "sticky", top: 0 }}>
                <th className="text-left p-3 whitespace-nowrap sticky left-0 z-20" style={{ background: "rgba(245,240,230,0.95)" }}>编号</th>
                <th className="text-left p-3">名称</th>
                <th className="text-left p-3">规格</th>
                <th className="text-left p-3">形状</th>
                <th className="text-right p-3">颗数/条</th>
                <th className="text-right p-3">克重/条</th>
                <th className="text-right p-3">采购库存</th>
                <th className="text-right p-3">核算库存</th>
                <th className="text-right p-3">采购单价</th>
                <th className="text-right p-3">核算单价</th>
                <th className="text-right p-3">库存总值</th>
                <th className="text-center p-3">状态</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMaterials.map((m) => {
                const totalValue = (m.unitCost ?? 0) * m.remaining;
                const lowStock = m.remaining < 50;
                return (
                  <tr key={m.id} className="border-t border-[var(--border)] hover:bg-[rgba(245,240,230,0.4)]">
                    <td className="p-3 font-mono text-xs">{m.code}</td>
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3 text-xs" style={{ color: "var(--ink-light)" }}>{m.specification || "-"}</td>
                    <td className="p-3 text-xs">{m.shape || "-"}</td>
                    <td className="p-3 text-right font-mono text-xs">{m.beadsPerStrand != null ? m.beadsPerStrand.toFixed(2) : "-"}</td>
                    <td className="p-3 text-right font-mono text-xs">{m.weightPerStrand != null ? `${m.weightPerStrand.toFixed(2)}g` : "-"}</td>
                    <td className="p-3 text-right font-mono font-medium" style={{ color: lowStock ? "#dc2626" : "inherit" }}>
                      {purchaseStock(m.remaining, m.defaultPurchaseUnit, m.defaultConversionRate)}
                    </td>
                    <td className="p-3 text-right font-mono font-medium" style={{ color: lowStock ? "#dc2626" : "inherit" }}>
                      {inventoryStock(m.remaining, m.inventoryUnit)}
                    </td>
                    <td className="p-3 text-right font-mono text-xs" style={{ color: "var(--ink-light)" }}>
                      {purchaseUnitPrice(m.unitCost, m.defaultConversionRate)}
                    </td>
                    <td className="p-3 text-right font-mono">{inventoryUnitPrice(m.unitCost)}</td>
                    <td className="p-3 text-right font-mono" style={{ color: "var(--zhu)" }}>¥{totalValue.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      {lowStock ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
                          库存不足
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>
                          正常
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-6 text-center" style={{ color: "var(--ink-light)" }}>
                    {searchQuery ? `未找到匹配"${searchQuery}"的材料` : "暂无材料数据"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--ink-light)" }}>共 {filteredMaterials.length} 条 · 第 {safePage}/{totalPages} 页</span>
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

      {/* 库存事务流水 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium" style={{ color: "var(--ink-light)" }}>库存流水</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-light)" }} />
            <input
              value={txnSearchQuery}
              onChange={(e) => handleTxnSearch(e.target.value)}
              placeholder="搜索材料或备注…"
              className="w-48 pl-9 pr-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
        </div>
        <div className="bg-[var(--paper)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 380px)" }}>
          <table className="w-full text-sm">
            <thead className="relative z-10">
              <tr style={{ background: "rgba(245,240,230,0.95)", color: "var(--ink-light)", position: "sticky", top: 0 }}>
                <th className="text-left p-3 whitespace-nowrap sticky left-0 z-20" style={{ background: "rgba(245,240,230,0.95)" }}>时间</th>
                <th className="text-left p-3">材料</th>
                <th className="text-center p-3">类型</th>
                <th className="text-right p-3">变动量</th>
                <th className="text-right p-3">变动前</th>
                <th className="text-right p-3">变动后</th>
                <th className="text-left p-3">备注</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTxns.map((t) => {
                const tp = typeMap[t.type] ?? { label: t.type, color: "#78716c", icon: null };
                return (
                  <tr key={t.id} className="border-t border-[var(--border)] hover:bg-[rgba(245,240,230,0.4)]">
                    <td className="p-3 text-xs" style={{ color: "var(--ink-light)" }}>
                      {new Date(t.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-xs">{t.material?.code}</span>
                      <span className="ml-1">{t.material?.name}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: `${tp.color}15`, color: tp.color }}>
                        {tp.icon} {tp.label}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono" style={{ color: t.type === "IN" ? "#16a34a" : t.type === "OUT" ? "#dc2626" : "#d97706" }}>
                      {t.type === "IN" ? "+" : t.type === "OUT" ? "-" : "±"}{t.quantity}
                    </td>
                    <td className="p-3 text-right font-mono text-xs" style={{ color: "var(--ink-light)" }}>{t.beforeQty}</td>
                    <td className="p-3 text-right font-mono font-medium">{t.afterQty}</td>
                    <td className="p-3 text-xs" style={{ color: "var(--ink-light)" }}>{t.remark || "-"}</td>
                  </tr>
                );
              })}
              {filteredTxns.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center" style={{ color: "var(--ink-light)" }}>
                    {txnSearchQuery ? `未找到匹配"${txnSearchQuery}"的流水记录` : "暂无库存流水"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          {txnTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--ink-light)" }}>共 {filteredTxns.length} 条 · 第 {safeTxnPage}/{txnTotalPages} 页</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setTxnPage(1)} disabled={safeTxnPage <= 1} className="p-2 rounded-md text-xs disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]">首页</button>
                <button onClick={() => setTxnPage((p) => Math.max(1, p - 1))} disabled={safeTxnPage <= 1} className="p-2 rounded-md disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]"><ChevronLeft size={14} /></button>
                {Array.from({ length: txnTotalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setTxnPage(p)} className="w-8 h-8 rounded-md text-xs font-mono" style={safeTxnPage === p ? { background: "#b45309", color: "#fff" } : { color: "var(--ink)" }}>{p}</button>
                ))}
                <button onClick={() => setTxnPage((p) => Math.min(txnTotalPages, p + 1))} disabled={safeTxnPage >= txnTotalPages} className="p-2 rounded-md disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]"><ChevronRight size={14} /></button>
                <button onClick={() => setTxnPage(txnTotalPages)} disabled={safeTxnPage >= txnTotalPages} className="p-2 rounded-md text-xs disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]">末页</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 库存操作弹窗 */}
      <Modal open={open} onClose={() => setOpen(false)} title="库存操作">
        <form onSubmit={save} className="space-y-4">
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "var(--ink-light)" }}>选择材料 *</span>
            <select
              value={String(form.materialId)}
              onChange={(e) => setForm({ ...form, materialId: Number(e.target.value) })}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="">请选择材料</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}（{m.code}）· 当前：{inventoryStock(m.remaining, m.inventoryUnit)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "var(--ink-light)" }}>操作类型 *</span>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="OUT">出库（生产消耗）</option>
              <option value="ADJUST">调整（盘点校正）</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "var(--ink-light)" }}>数量 *</span>
            <input
              type="number"
              step="0.01"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              style={{ borderColor: "var(--border)" }}
              placeholder={form.type === "ADJUST" ? "调整后的目标数量" : "正数"}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "var(--ink-light)" }}>备注</span>
            <input
              type="text"
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
              placeholder="如：生产订单#001"
            />
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--border)" }}>取消</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: "#b45309" }}>确认</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
