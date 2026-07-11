"use client";

import { useActionState } from "react";
import { submitLead, type LeadFormState } from "@/modules/leads/actions";

const fieldCls =
  "w-full font-body text-base text-ink bg-surface border border-rule rounded px-4 py-[0.85em] focus:outline-none focus:border-accent transition-colors";
const labelCls = "text-[0.78rem] font-medium uppercase tracking-[0.14em] text-muted";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<LeadFormState, FormData>(submitLead, null);

  return (
    <form action={formAction} className="grid gap-5">
      <p className="text-[0.82rem] font-medium tracking-[0.04em] text-accent">
        Trusted by ExxonMobil, Anthem, iHeartRadio, and more
      </p>
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="grid gap-1.5">
          <label htmlFor="f-name" className={labelCls}>Name</label>
          <input id="f-name" name="name" type="text" required autoComplete="name" placeholder="Jane Smith" className={fieldCls} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="f-email" className={labelCls}>Email</label>
          <input id="f-email" name="email" type="email" required autoComplete="email" placeholder="jane@company.com" className={fieldCls} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="grid gap-1.5">
          <label htmlFor="f-company" className={labelCls}>Company</label>
          <input id="f-company" name="company" type="text" autoComplete="organization" placeholder="Company or campaign" className={fieldCls} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="f-type" className={labelCls}>Project Type</label>
          <select id="f-type" name="project_type" required defaultValue="" className={fieldCls}>
            <option value="" disabled>Select one</option>
            <option>Corporate</option>
            <option>Political</option>
            <option>Real Estate</option>
            <option>Nonprofit</option>
            <option>E-commerce</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="f-details" className={labelCls}>
          Project Details <span className="normal-case tracking-normal font-normal opacity-75">(optional)</span>
        </label>
        <textarea
          id="f-details"
          name="message"
          rows={4}
          placeholder="What are we making? Timeline, goals, references — anything helps."
          className={`${fieldCls} resize-y min-h-[110px]`}
        />
      </div>
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden" />
      <p role="status" aria-live="polite" className={`text-[0.95rem] min-h-[1.4em] ${state ? (state.ok ? "text-[#8ec98e]" : "text-[#d98a7a]") : ""}`}>
        {pending ? "Sending…" : state?.message ?? ""}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.88rem] tracking-[0.08em] px-[1.9em] py-[0.78em] transition-all duration-200 hover:bg-transparent hover:text-accent hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
      >
        Get My Free Project Quote
      </button>
      <p className="text-[0.85rem] text-muted text-center -mt-1.5">
        No spam, ever. We reply personally within one business day.
      </p>
    </form>
  );
}
