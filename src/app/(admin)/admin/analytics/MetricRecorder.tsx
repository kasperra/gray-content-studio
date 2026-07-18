"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordMetric } from "@/modules/social/actions";

const fieldCls =
  "w-full font-body text-[0.92rem] text-ink bg-bg border border-rule rounded px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors";
const labelCls = "text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted";

const COMMON_METRICS = ["views", "reach", "engagement", "ctr", "watch_time", "website_traffic", "conversions"];

export function MetricRecorder({ clients }: { clients: { id: string; company: string }[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [metric, setMetric] = useState("views");
  const [customMetric, setCustomMetric] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const res = await recordMetric({
        clientId: clientId || null,
        module: "marketing",
        metric: metric === "custom" ? customMetric : metric,
        value: parseFloat(value),
        capturedOn: date,
      });
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        setValue("");
        router.refresh();
      }
    });
  };

  return (
    <div className="@container bg-surface border border-rule rounded-lg p-5 sm:p-6">
      <h3 className="font-display text-[1.05rem] font-semibold mb-4">Record a metric</h3>
      <div className="grid gap-3.5">
        <div className="grid gap-1.5">
          <label htmlFor="m-client" className={labelCls}>Client</label>
          <select id="m-client" value={clientId} onChange={(e) => setClientId(e.target.value)} className={fieldCls}>
            <option value="">Studio-wide</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.company}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="m-metric" className={labelCls}>Metric</label>
          <select id="m-metric" value={metric} onChange={(e) => setMetric(e.target.value)} className={fieldCls}>
            {COMMON_METRICS.map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
            ))}
            <option value="custom">custom…</option>
          </select>
          {metric === "custom" && (
            <input
              value={customMetric}
              onChange={(e) => setCustomMetric(e.target.value)}
              placeholder="Metric name"
              aria-label="Custom metric name"
              className={fieldCls}
            />
          )}
        </div>
        <div className="grid grid-cols-1 @[19rem]:grid-cols-2 gap-3.5">
          <div className="grid gap-1.5">
            <label htmlFor="m-value" className={labelCls}>Value</label>
            <input id="m-value" type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder="12500" className={fieldCls} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="m-date" className={labelCls}>Date</label>
            <input id="m-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
          </div>
        </div>
        {msg && (
          <p className={`text-[0.85rem] ${msg.ok ? "text-[#8ec98e]" : "text-[#d98a7a]"}`} role="status">{msg.text}</p>
        )}
        <button
          disabled={pending}
          onClick={submit}
          className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:bg-transparent hover:text-accent transition-all disabled:opacity-60 cursor-pointer justify-self-start"
        >
          {pending ? "Saving…" : "Record"}
        </button>
      </div>
    </div>
  );
}
