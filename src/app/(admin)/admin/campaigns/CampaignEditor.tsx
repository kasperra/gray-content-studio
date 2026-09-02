"use client";

import { useState, useTransition } from "react";
import { saveCampaign } from "@/modules/campaigns/actions";
import type { Campaign } from "@/modules/campaigns/campaign";

/* The offer, the price, the copy, the CTA and both emails for one season —
   all editable without a deploy. Structural content (gallery slots, audience
   cards, booking steps) stays in modules/campaigns/campaigns.ts, where it is
   reviewed and versioned alongside the layout that renders it. */

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
      <label className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </label>
      {children}
      {help && <p className="text-muted text-[0.76rem] leading-relaxed">{help}</p>}
    </div>
  );
}

export function CampaignEditor({ initial }: { initial: Campaign }) {
  const [c, setC] = useState<Campaign>(initial);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  const set = <K extends keyof Campaign>(k: K, v: Campaign[K]) => setC({ ...c, [k]: v });

  const save = () => {
    setMessage("");
    start(async () => {
      const res = await saveCampaign(c);
      setMessage(res.message);
    });
  };

  return (
    <section className="mt-10" aria-labelledby={`cfg-${c.slug}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id={`cfg-${c.slug}`} className="font-display text-[1.2rem] font-semibold">
          {c.title}
        </h2>
        <a
          href={`/${c.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-accent text-[0.82rem] hover:underline underline-offset-4"
        >
          View /{c.slug} →
        </a>
      </div>
      <p className="text-muted text-[0.9rem] mt-2 max-w-[62ch]">
        Changes go live within about five minutes. Blank a field to fall back to the wording that
        ships in the code — nothing here can publish an empty page.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Field
          label="Published"
          wide
          help="Off takes the page down immediately — it returns 404 and drops out of search. The site footer links to running campaigns from campaigns.ts, so ending a season for good also means setting published: false there."
        >
          <select
            value={String(c.published)}
            onChange={(e) => set("published", e.target.value === "true")}
            className={inputCls}
          >
            <option value="true">Live</option>
            <option value="false">Off</option>
          </select>
        </Field>

        <Field label="Eyebrow" help="The small line above the headline.">
          <input value={c.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Title">
          <input value={c.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
        </Field>

        <Field label="Price" help="Shown as typed, e.g. “$150”.">
          <input value={c.price} onChange={(e) => set("price", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Call to action" help="The button label, everywhere on the page.">
          <input value={c.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} className={inputCls} />
        </Field>

        <Field label="Hero paragraph" wide>
          <textarea
            value={c.lede}
            onChange={(e) => set("lede", e.target.value)}
            rows={3}
            className={`${inputCls} resize-y`}
          />
        </Field>

        <Field
          label="What's included"
          wide
          help="One line per item. These are the promises the page makes — keep them to what the studio actually delivers."
        >
          <textarea
            value={c.includes.join("\n")}
            onChange={(e) => set("includes", e.target.value.split("\n"))}
            rows={8}
            className={`${inputCls} resize-y font-mono text-[0.82rem]`}
          />
        </Field>

        <Field label="Form heading" help="The eyebrow above the request form.">
          <input value={c.formTitle} onChange={(e) => set("formTitle", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Date field label">
          <input value={c.dateLabel} onChange={(e) => set("dateLabel", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Form paragraph" wide>
          <textarea
            value={c.formLede}
            onChange={(e) => set("formLede", e.target.value)}
            rows={2}
            className={`${inputCls} resize-y`}
          />
        </Field>

        <Field label="Confirmation heading" help="Replaces the form after a request is sent.">
          <input
            value={c.confirmationTitle}
            onChange={(e) => set("confirmationTitle", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Confirmation message">
          <textarea
            value={c.confirmationBody}
            onChange={(e) => set("confirmationBody", e.target.value)}
            rows={3}
            className={`${inputCls} resize-y`}
          />
        </Field>

        <Field label="Closing heading">
          <input value={c.closingTitle} onChange={(e) => set("closingTitle", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Closing paragraph">
          <textarea
            value={c.closingLede}
            onChange={(e) => set("closingLede", e.target.value)}
            rows={3}
            className={`${inputCls} resize-y`}
          />
        </Field>

        <Field
          label="Customer email — subject"
          wide
          help="Sent to the customer as soon as a request comes in."
        >
          <input
            value={c.emailSubject}
            onChange={(e) => set("emailSubject", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Customer email — opening" wide>
          <textarea
            value={c.emailIntro}
            onChange={(e) => set("emailIntro", e.target.value)}
            rows={2}
            className={`${inputCls} resize-y`}
          />
        </Field>
        <Field
          label="Customer email — what happens next"
          wide
          help="Also worth keeping accurate: this is the studio's promise about when it makes contact."
        >
          <textarea
            value={c.emailNextSteps}
            onChange={(e) => set("emailNextSteps", e.target.value)}
            rows={3}
            className={`${inputCls} resize-y`}
          />
        </Field>

        <Field label="Search title" help="Browser tab and search result heading.">
          <input value={c.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Search description">
          <textarea
            value={c.metaDescription}
            onChange={(e) => set("metaDescription", e.target.value)}
            rows={3}
            className={`${inputCls} resize-y`}
          />
        </Field>
      </div>

      <div className="flex items-center gap-4 mt-6">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.8rem] tracking-[0.08em] px-6 py-2.5 transition-all hover:bg-transparent hover:text-accent disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <p role="status" aria-live="polite" className="text-[0.85rem] text-muted">
          {message}
        </p>
      </div>
    </section>
  );
}
