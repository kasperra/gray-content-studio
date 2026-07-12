"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATE_KINDS } from "@/modules/social/platforms";
import { saveTemplate, deleteTemplate } from "@/modules/social/actions";

type Template = { id: string; kind: string; name: string; body: string; clientId: string | null };

const fieldCls =
  "w-full font-body text-[0.92rem] text-ink bg-bg border border-rule rounded px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors";
const labelCls = "text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted";

const empty = { kind: "social_post", name: "", body: "", clientId: "" };

export function TemplateManager({
  templates,
  clients,
}: {
  templates: Template[];
  clients: { id: string; company: string }[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [showEditor, setShowEditor] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  const openEditor = (t?: Template) => {
    setForm(t ? { kind: t.kind, name: t.name, body: t.body, clientId: t.clientId ?? "" } : empty);
    setEditingId(t?.id ?? null);
    setMsg("");
    setShowEditor(true);
  };

  const save = () => {
    startTransition(async () => {
      const res = await saveTemplate(
        { kind: form.kind, name: form.name, body: form.body, clientId: form.clientId || null },
        editingId ?? undefined
      );
      setMsg(res.message);
      if (res.ok) {
        setShowEditor(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      {!showEditor && (
        <button
          onClick={() => openEditor()}
          className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:bg-transparent hover:text-accent transition-all cursor-pointer mb-8"
        >
          + New Template
        </button>
      )}

      {showEditor && (
        <div className="bg-surface border border-accent/40 rounded-lg p-6 mb-8 max-w-176">
          <h2 className="font-display text-[1.2rem] font-semibold mb-4">
            {editingId ? "Edit Template" : "New Template"}
          </h2>
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="t-kind" className={labelCls}>Kind</label>
                <select id="t-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={fieldCls}>
                  {TEMPLATE_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>{k.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <label htmlFor="t-name" className={labelCls}>Name</label>
                <input id="t-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Before/After Reveal Reel" className={fieldCls} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="t-scope" className={labelCls}>Available to</label>
              <select id="t-scope" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={fieldCls}>
                <option value="">All clients (studio-wide)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company} only</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="t-body" className={labelCls}>Body</label>
              <textarea id="t-body" rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder={"Hook line…\n\nStructure the content with [PLACEHOLDERS] to fill per project."} className={`${fieldCls} resize-y font-mono text-[0.85rem]`} />
            </div>
            {msg && <p className="text-[#d98a7a] text-[0.85rem]" role="status">{msg}</p>}
            <div className="flex gap-3">
              <button disabled={pending} onClick={save} className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:bg-transparent hover:text-accent transition-all disabled:opacity-60 cursor-pointer">
                {pending ? "Saving…" : "Save Template"}
              </button>
              <button onClick={() => setShowEditor(false)} className="rounded-full border border-rule text-muted font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:text-ink transition-colors cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {templates.length === 0 && !showEditor && <p className="text-muted">No templates yet.</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <article key={t.id} className="bg-surface border border-rule rounded-lg p-5 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-accent-soft text-accent text-[0.7rem] font-semibold uppercase tracking-[0.1em] px-2.5 py-0.5">
                {TEMPLATE_KINDS.find((k) => k.id === t.kind)?.label ?? t.kind}
              </span>
              <span className="text-muted text-[0.75rem]">
                {t.clientId ? clients.find((c) => c.id === t.clientId)?.company ?? "Client-specific" : "Studio-wide"}
              </span>
            </div>
            <h3 className="font-display text-[1.1rem] font-semibold mt-2">{t.name}</h3>
            <p className="text-muted text-[0.85rem] mt-2 whitespace-pre-wrap line-clamp-4 grow">{t.body}</p>
            <div className="flex gap-2 mt-4 pt-3 border-t border-rule">
              <button onClick={() => openEditor(t)} className="rounded border border-rule text-[0.78rem] px-3 py-1.5 text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer">
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete template "${t.name}"?`))
                    startTransition(async () => {
                      await deleteTemplate(t.id);
                      router.refresh();
                    });
                }}
                className="rounded border border-rule text-[0.78rem] px-3 py-1.5 text-muted hover:text-[#d98a7a] hover:border-[#d98a7a] transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
