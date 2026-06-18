"use client";
import { useState } from "react";
import { Pencil, Trash2, Plus, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface BomItem {
  id: number;
  skuId: number;
  materialId: number;
  quantity: number;
  unitPrice: number | null;
  lineCost: number | null;
  materialCodeSnapshot: string;
  materialNameSnapshot: string;
  sku?: { code: string; name: string; product?: { name: string } };
  material?: { code: string; name: string; unitCost: number | null; inventoryUnit: string };
}
interface Sku {
  id: number;
  code: string;
  name: string;
  product?: { name: string; work?: { name: string } };
}
interface Material {
  id: number;
  code: string;
  name: string;
  unitCost: number | null;
  inventoryUnit: string;
}

export default function BomClient({ list: init, skus, materials }: { list: BomItem[]; skus: Sku[]; materials: Material[] }) {
  const [rows] = useState(init);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BomItem | null>(null);
  const [form, setForm] = useState({
    skuId: 0,
    materialId: 0,
    quantity: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  function handleSearch(q: string) { setSearchQuery(q); setCurrentPage(1); }

  function openNew() {
    setEditing(null);
    setForm({ skuId: skus[0]?.id ?? 0, materialId: materials[0]?.id ?? 0, quantity: 0 });
    setOpen(true);
  }
  function handleExport() { window.open("/api/export?type=bom", "_blank"); }
  function openEdit(r: BomItem) {
    setEditing(r);
    setForm({ skuId: r.skuId, materialId: r.materialId, quantity: r.quantity });
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      skuId: Number(form.skuId),
      materialId: Number(form.materialId),
      quantity: Number(form.quantity),
    };
    await fetch(editing ? `/api/bom/${editing.id}` : "/api/bom", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    location.reload();
  }
  async function remove(id: number) {
    if (!confirm("确认删除该BOM项？")) return;
    await fetch(`/api/bom/${id}`, { method: "DELETE" });
    location.reload();
  }

  // 搜索过滤
  const filteredList = searchQuery
    ? rows.filter((r) => {
        const q = searchQuery.toLowerCase();
        return (r.sku?.code ?? "").toLowerCase().includes(q)
          || (r.sku?.name ?? "").toLowerCase().includes(q)
          || (r.sku?.product?.name ?? "").toLowerCase().includes(q)
          || r.materialCodeSnapshot.toLowerCase().includes(q)
          || r.materialNameSnapshot.toLowerCase().includes(q);
      })
    : rows;

  // 按SKU分组
  const grouped: Record<number, { skuCode: string; skuName: string; productName: string; items: BomItem[]; totalCost: number }> = {};
  filteredList.forEach((r) => {
    if (!grouped[r.skuId]) {
      grouped[r.skuId] = {
        skuCode: r.sku?.code ?? String(r.skuId),
        skuName: r.sku?.name ?? "",
        productName: r.sku?.product?.name ?? "",
        items: [],
        totalCost: 0,
      };
    }
    grouped[r.skuId].items.push(r);
    grouped[r.skuId].totalCost += r.lineCost ?? 0;
  });

  // 分组分页
  const groupEntries = Object.entries(grouped);
  const totalGroupPages = Math.max(1, Math.ceil(groupEntries.length / PAGE_SIZE));
  const safeGroupPage = Math.min(currentPage, totalGroupPages);
  const paginatedGroups = groupEntries.slice((safeGroupPage - 1) * PAGE_SIZE, safeGroupPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>作品 BOM 库</h1>
        <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-light)" }} />
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索SKU或材料…"
                className="w-48 pl-9 pr-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--border)" }}>
            <Download size={16} />导出
          </button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#b45309" }}>
            <Plus size={16} />新增BOM
          </button>
        </div>
      </div>

      {paginatedGroups.map(([skuId, group]) => (
        <div key={skuId} className="bg-[var(--paper)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(245,240,230,0.6)" }}>
            <div>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white" style={{ color: "var(--ink-light)" }}>{group.skuCode}</span>
              <span className="ml-2 font-medium text-sm" style={{ color: "var(--ink)" }}>{group.skuName}</span>
              {group.productName && (
                <span className="ml-2 text-xs" style={{ color: "var(--ink-light)" }}>← {group.productName}</span>
              )}
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--zhu)" }}>
              合计：¥{group.totalCost.toFixed(2)}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--ink-light)" }}>
                <th className="text-left p-3">材料编号</th>
                <th className="text-left p-3">材料名称</th>
                <th className="text-right p-3">用量</th>
                <th className="text-right p-3">单位成本</th>
                <th className="text-right p-3">行成本</th>
                <th className="text-center p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[rgba(245,240,230,0.4)]">
                  <td className="p-3 font-mono text-xs">{r.materialCodeSnapshot}</td>
                  <td className="p-3">{r.materialNameSnapshot}</td>
                  <td className="p-3 text-right font-mono">{r.quantity}</td>
                  <td className="p-3 text-right font-mono">¥{r.unitPrice?.toFixed(2) ?? "-"}</td>
                  <td className="p-3 text-right font-mono font-medium" style={{ color: "var(--zhu)" }}>¥{r.lineCost?.toFixed(2) ?? "-"}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded-md hover:bg-[rgba(180,83,9,0.08)]" style={{ color: "#b45309" }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(r.id)} className="p-1.5 rounded-md hover:bg-red-50" style={{ color: "#dc2626" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {filteredList.length === 0 && (
        <div className="bg-[var(--paper)] rounded-xl border border-[var(--border)] p-8 text-center">
          <p className="text-sm" style={{ color: "var(--ink-light)" }}>
            {searchQuery ? `未找到匹配"${searchQuery}"的BOM记录` : "暂无BOM数据，点击「新增BOM」录入"}
          </p>
        </div>
      )}
      {totalGroupPages > 1 && (
        <div className="bg-[var(--paper)] rounded-xl border border-[var(--border)] flex items-center justify-between px-4 py-3">
          <span className="text-xs" style={{ color: "var(--ink-light)" }}>共 {groupEntries.length} 组 · 第 {safeGroupPage}/{totalGroupPages} 页</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={safeGroupPage <= 1} className="p-2 rounded-md text-xs disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]">首页</button>
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeGroupPage <= 1} className="p-2 rounded-md disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]"><ChevronLeft size={14} /></button>
            {Array.from({ length: totalGroupPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setCurrentPage(p)} className="w-8 h-8 rounded-md text-xs font-mono" style={safeGroupPage === p ? { background: "#b45309", color: "#fff" } : { color: "var(--ink)" }}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalGroupPages, p + 1))} disabled={safeGroupPage >= totalGroupPages} className="p-2 rounded-md disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]"><ChevronRight size={14} /></button>
            <button onClick={() => setCurrentPage(totalGroupPages)} disabled={safeGroupPage >= totalGroupPages} className="p-2 rounded-md text-xs disabled:opacity-30 hover:bg-[rgba(245,240,230,0.6)]">末页</button>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "编辑BOM" : "新增BOM"}>
        <form onSubmit={save} className="space-y-4">
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "var(--ink-light)" }}>SKU *</span>
            <select
              value={String(form.skuId)}
              onChange={(e) => setForm({ ...form, skuId: Number(e.target.value) })}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="">请选择SKU</option>
              {skus.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name} {s.product?.name ? `(${s.product.name})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "var(--ink-light)" }}>材料 *</span>
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
                  {m.name}（{m.code}）· 单价¥{m.unitCost?.toFixed(2) ?? "0"}/{m.inventoryUnit}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs" style={{ color: "var(--ink-light)" }}>用量 *</span>
            <input
              name="quantity"
              type="number"
              step="0.01"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              style={{ borderColor: "var(--border)" }}
            />
            {form.materialId > 0 && (
              <p className="text-xs mt-1" style={{ color: "var(--ink-light)" }}>
                单位：{materials.find((m) => m.id === form.materialId)?.inventoryUnit ?? ""}
              </p>
            )}
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--border)" }}>取消</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: "#b45309" }}>保存</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
