"use client";

import { useState, useTransition } from "react";
import { saveConfig } from "@/modules/diagnostic/actions";
import { STAGES } from "@/modules/diagnostic/content";

/* Copy and links Gray can change without a deploy. Questions and scoring
   weights deliberately stay in code — they're covered by scoring.test.ts, and a
   mistyped weight in a form would silently change every future diagnosis. */

const FIELDS: { key: string; label: string; help?: string; long?: boolean }[] = [
  { key: "booking_url", label: "CTA destination", help: "Where every result-page call to action sends people." },
  ...STAGES.map((s) => ({
    key: `cta_stage_${s.id}`,
    label: `Stage ${s.id} CTA — ${s.name}`,
    help: s.cta,
  })),
  {
    key: "result_footer",
    label: "Result page footer copy",
    long: true,
    help: "Shown above the call to action on every result.",
  },
];

export function ConfigEditor({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  const save = () => {
    setMessage("");
    start(async () => {
      const res = await saveConfig(values);
      setMessage(res.ok ? "Saved." : "Could not save — check that the migration has been applied.");
    });
  };

  return (
    <section className="mt-14" aria-labelledby="config">
      <h2 id="config" className="font-display text-[1.2rem] font-semibold">
        Diagnostic settings
      </h2>
      <p className="text-muted text-[0.9rem] mt-2 max-w-[62ch]">
        Result-page copy and links. Changes apply immediately, no deploy needed.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        {FIELDS.map((f) => (
          <div key={f.key} className={`grid gap-1.5 ${f.long ? "sm:col-span-2" : ""}`}>
            <label htmlFor={`cfg-${f.key}`} className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
              {f.label}
            </label>
            {f.long ? (
              <textarea
                id={`cfg-${f.key}`}
                rows={3}
                value={values[f.key] ?? ""}
                placeholder={f.help}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="w-full font-body text-[0.9rem] text-ink bg-bg border border-rule rounded px-3 py-2 resize-y focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
              />
            ) : (
              <input
                id={`cfg-${f.key}`}
                value={values[f.key] ?? ""}
                placeholder={f.help}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="w-full font-body text-[0.9rem] text-ink bg-bg border border-rule rounded px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-6">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-full bg-accent text-bg border border-accent text-[0.8rem] font-semibold uppercase tracking-[0.08em] px-5 py-2.5 hover:bg-transparent hover:text-accent transition-colors disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
        {message && (
          <p role="status" className={`text-[0.88rem] ${message === "Saved." ? "text-[#8ec98e]" : "text-[#d98a7a]"}`}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
