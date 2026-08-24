"use client";

import { useState, useTransition } from "react";
import { saveOfferSettings } from "@/modules/offer/actions";
import type { OfferSettings } from "@/modules/offer/config";

/* Everything the popup does — whether it runs, what it gives away, how long the
   code lives, when it appears, and how long a dismissal suppresses it — is set
   here. None of it is hard-coded in the popup. */

const inputCls =
  "w-full font-body text-[0.9rem] text-ink bg-bg border border-rule rounded px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors";

function Field({
  label,
  help,
  wide,
  children,
}: {
  label: string;
  help?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">{label}</label>
      {children}
      {help && <p className="text-muted text-[0.76rem] leading-relaxed">{help}</p>}
    </div>
  );
}

export function OfferSettingsEditor({ initial }: { initial: OfferSettings }) {
  const [s, setS] = useState<OfferSettings>(initial);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  const set = <K extends keyof OfferSettings>(k: K, v: OfferSettings[K]) => setS({ ...s, [k]: v });

  const save = () => {
    setMessage("");
    start(async () => {
      const res = await saveOfferSettings(s);
      setMessage(res.ok ? "Saved." : "Could not save — check that migration 0004 has been applied.");
    });
  };

  return (
    <section className="mt-14" aria-labelledby="offercfg">
      <h2 id="offercfg" className="font-display text-[1.2rem] font-semibold">
        Offer settings
      </h2>
      <p className="text-muted text-[0.9rem] mt-2 max-w-[62ch]">
        Changes apply immediately, no deploy needed. Codes already issued keep the discount and
        expiry they were created with.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Field label="Popup" wide help="Turn the whole first-visit popup on or off.">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={s.enabled}
              onChange={(e) => set("enabled", e.target.checked)}
              className="h-4 w-4 accent-[#fac748] cursor-pointer"
            />
            <span className="text-[0.9rem]">{s.enabled ? "Running" : "Off"}</span>
          </label>
        </Field>

        <Field label="Question" wide help="The one question the popup asks.">
          <textarea rows={2} value={s.headline} onChange={(e) => set("headline", e.target.value)} className={`${inputCls} resize-y`} />
        </Field>

        <Field label="Discount" help="Shown to the visitor and stored on every code issued.">
          <input value={s.discountLabel} onChange={(e) => set("discountLabel", e.target.value)} className={inputCls} />
        </Field>

        <Field label="Discount note" help="One line of context under the discount.">
          <input value={s.discountNote} onChange={(e) => set("discountNote", e.target.value)} className={inputCls} />
        </Field>

        <Field label="Valid for (days)" help="How long a new code lasts.">
          <input type="number" min={1} max={365} value={s.couponDays} onChange={(e) => set("couponDays", Number(e.target.value))} className={inputCls} />
        </Field>

        <Field label="Code prefix" help="Codes look like PREFIX-A7K2QM. Letters and digits only.">
          <input value={s.codePrefix} onChange={(e) => set("codePrefix", e.target.value.toUpperCase())} className={inputCls} />
        </Field>

        <Field label="Eligibility & offer rules" wide help="Shown on the success screen and published on the Coupon Terms page.">
          <textarea rows={3} value={s.eligibility} onChange={(e) => set("eligibility", e.target.value)} className={`${inputCls} resize-y`} />
        </Field>

        <Field label="Delay (seconds)" help="Minimum 3s — the popup never interrupts on load.">
          <input type="number" min={0} max={600} value={s.delaySeconds} onChange={(e) => set("delaySeconds", Number(e.target.value))} className={inputCls} />
        </Field>

        <Field label="Scroll trigger (%)" help="Also opens at this scroll depth. 0 disables it.">
          <input type="number" min={0} max={100} value={s.scrollPercent} onChange={(e) => set("scrollPercent", Number(e.target.value))} className={inputCls} />
        </Field>

        <Field label="Exit intent" help="Desktop only — never fires on touch devices.">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={s.exitIntent}
              onChange={(e) => set("exitIntent", e.target.checked)}
              className="h-4 w-4 accent-[#fac748] cursor-pointer"
            />
            <span className="text-[0.9rem]">{s.exitIntent ? "On" : "Off"}</span>
          </label>
        </Field>

        <Field label="Suppress after dismissal (days)" help="How long before someone who closed it can see it again. Anyone who claimed never sees it again.">
          <input type="number" min={0} max={365} value={s.suppressDays} onChange={(e) => set("suppressDays", Number(e.target.value))} className={inputCls} />
        </Field>

        <Field
          label="SMS marketing consent box"
          wide
          help="Leave off unless the studio actually sends marketing texts. With it off the box isn't shown and no SMS consent is ever recorded as granted."
        >
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={s.smsEnabled}
              onChange={(e) => set("smsEnabled", e.target.checked)}
              className="h-4 w-4 accent-[#fac748] cursor-pointer"
            />
            <span className="text-[0.9rem]">{s.smsEnabled ? "Asking for SMS consent" : "Not asking"}</span>
          </label>
        </Field>
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
