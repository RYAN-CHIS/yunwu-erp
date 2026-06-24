"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, GripVertical, Save, X } from "lucide-react";

const SECTION_TYPES = [
  { value: "JIAN_WU", label: "Section 01｜见物" },
  { value: "ZHI_QI_LAI", label: "Section 02｜知其来" },
  { value: "ZHI_QI_YI", label: "Section 03｜知其意" },
  { value: "JIE_QI_YUAN", label: "Section 04｜结其缘" },
];

interface HomeSection {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  content: string;
  workId: number | null;
  sortOrder: number;
  isActive: boolean;
  work?: { id: number; name: string; code: string } | null;
}

interface Work {
  id: number;
  name: string;
  code: string;
}

export default function HomeSectionsClient({ sections: initialSections, works }: { sections: HomeSection[]; works: Work[] }) {
  const [sections, setSections] = useState<HomeSection[]>(initialSections);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<HomeSection>>({});
  const [showNew, setShowNew] = useState(false);

  const blank: Partial<HomeSection> = {
    type: "JIAN_WU",
    title: "",
    subtitle: "",
    content: "",
    workId: null,
    sortOrder: sections.length,
    isActive: true,
  };

  function startEdit(s: HomeSection) {
    setEditId(s.id);
    setForm({ ...s });
    setShowNew(false);
  }

  function startNew() {
    setShowNew(true);
    setEditId(null);
    setForm({ ...blank, sortOrder: sections.length });
  }

  function cancelEdit() {
    setEditId(null);
    setShowNew(false);
    setForm({});
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.type) return;
    try {
      const isNew = showNew || !editId;
      const url = isNew ? "/api/home-sections" : `/api/home-sections/${editId}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("保存失败");
      // 刷新列表
      const refreshed = await fetch("/api/home-sections").then((r) => r.json());
      setSections(refreshed);
      cancelEdit();
    } catch (err) {
      console.error("保存失败:", err);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确认删除该区块？")) return;
    await fetch(`/api/home-sections/${id}`, { method: "DELETE" });
    const refreshed = await fetch("/api/home-sections").then((r) => r.json());
    setSections(refreshed);
  }

  async function moveSection(id: number, direction: "up" | "down") {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const a = sections[idx], b = sections[targetIdx];
    await fetch(`/api/home-sections/${a.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...a, sortOrder: b.sortOrder }),
    });
    await fetch(`/api/home-sections/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...b, sortOrder: a.sortOrder }),
    });
    const refreshed = await fetch("/api/home-sections").then((r) => r.json());
    setSections(refreshed);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>首页结构管理</h1>
          <p className="text-xs mt-1" style={{ color: "var(--ink-light)" }}>管理首页四段展览结构（见物 → 知其来 → 知其意 → 结其缘）</p>
        </div>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#b45309" }}>
          <Plus size={16} />新增区块
        </button>
      </div>

      {/* 新建表单 */}
      {showNew && (
        <SectionForm
          form={form}
          setForm={setForm}
          works={works}
          onSave={handleSave}
          onCancel={cancelEdit}
          isNew
        />
      )}

      {/* 区块列表 */}
      <div className="space-y-2">
        {sections.map((s, idx) => (
          <div key={s.id}>
            {editId === s.id ? (
              <SectionForm
                form={form}
                setForm={setForm}
                works={works}
                onSave={handleSave}
                onCancel={cancelEdit}
              />
            ) : (
              <div className="flex items-center gap-3 bg-[var(--paper)] border border-[var(--border)] rounded-xl p-4 hover:shadow-sm transition">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveSection(s.id, "up")} disabled={idx === 0} className="p-0.5 hover:bg-[rgba(0,0,0,0.04)] rounded disabled:opacity-20">
                    <GripVertical size={14} style={{ color: "var(--ink-light)" }} />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "#fef3c7", color: "#92400e" }}>
                      {SECTION_TYPES.find((t) => t.value === s.type)?.label || s.type}
                    </span>
                    <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{s.title}</span>
                    {!s.isActive && <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600">已隐藏</span>}
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--ink-light)" }}>
                    {s.subtitle || "（无副标题）"}
                    {s.work && <> · 关联作品：{s.work.name}（{s.work.code}）</>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-[rgba(245,240,230,0.8)]" style={{ color: "var(--ink-light)" }}>
                    排序 {s.sortOrder}
                  </span>
                  <button onClick={() => startEdit(s)} className="p-1.5 rounded-md hover:bg-[rgba(185,28,28,0.08)]" style={{ color: "var(--zhu)" }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-md hover:bg-red-50" style={{ color: "#dc2626" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {sections.length === 0 && (
          <p className="text-center py-8 text-sm" style={{ color: "var(--ink-light)" }}>暂无首页区块配置，点击「新增区块」开始</p>
        )}
      </div>
    </div>
  );
}

/**
 * 编辑/新建表单组件
 */
function SectionForm({
  form, setForm, works, onSave, onCancel, isNew,
}: {
  form: Partial<HomeSection>;
  setForm: (f: Partial<HomeSection>) => void;
  works: Work[];
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  return (
    <form onSubmit={onSave} className="bg-[var(--paper)] border border-[var(--border)] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{isNew ? "新增区块" : "编辑区块"}</p>
        <button type="button" onClick={onCancel} className="p-1 rounded hover:bg-gray-100">
          <X size={16} style={{ color: "var(--ink-muted)" }} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs" style={{ color: "var(--ink-light)" }}>区块类型 *</span>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          >
            {SECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs" style={{ color: "var(--ink-light)" }}>排序序号</span>
          <input
            type="number" min="0"
            value={form.sortOrder ?? 0}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </label>
      </div>
      <label className="space-y-1">
        <span className="text-xs" style={{ color: "var(--ink-light)" }}>标题 *</span>
        <input
          value={form.title ?? ""}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="如：见物"
          className="w-full border rounded-lg px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs" style={{ color: "var(--ink-light)" }}>副标题</span>
        <input
          value={form.subtitle ?? ""}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          placeholder="如：一物，一句，一气"
          className="w-full border rounded-lg px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs" style={{ color: "var(--ink-light)" }}>内容（Markdown）</span>
        <textarea
          value={form.content ?? ""}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={4}
          placeholder="支持 Markdown 格式…"
          className="w-full border rounded-lg px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs" style={{ color: "var(--ink-light)" }}>关联作品（仅 Section 01 需要）</span>
          <select
            value={form.workId ?? ""}
            onChange={(e) => setForm({ ...form, workId: e.target.value ? Number(e.target.value) : null })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <option value="">不关联</option>
            {works.map((w) => <option key={w.id} value={w.id}>{w.name}（{w.code}）</option>)}
          </select>
        </label>
        <label className="space-y-1 flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm" style={{ color: "var(--ink)" }}>显示在前台</span>
          </label>
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--border)" }}>取消</button>
        <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white" style={{ background: "#b45309" }}>
          <Save size={14} />保存
        </button>
      </div>
    </form>
  );
}
