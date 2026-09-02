"use client";

import { useActionState, useId } from "react";
import { submitCampaignInquiry, type InquiryState } from "./actions";
import type { Campaign } from "./campaign";

/* The session request form. Field styling follows components/ContactForm so the
   two inquiry forms on the site feel like the same studio, with the seasonal
   accent (--c-accent, set on the page wrapper) replacing the brand gold on
   focus rings and the submit button. */

const fieldBase =
  "w-full font-body text-base text-ink bg-surface border rounded px-4 py-[0.85em] transition-colors focus:outline-none focus:border-[var(--c-accent)] focus:ring-1 focus:ring-[var(--c-accent)]/50";
const labelCls = "text-[0.78rem] font-medium uppercase tracking-[0.14em] text-muted";
const errorCls = "text-[0.8rem] text-[#e0a08f]";

function fieldCls(invalid: boolean): string {
  return `${fieldBase} ${invalid ? "border-[#e0a08f]" : "border-rule"}`;
}

export function CampaignInquiryForm({
  campaign,
  /** Today in the studio's terms, computed on the server so the rendered `min`
      can't disagree with what the server will accept. */
  minDate,
}: {
  campaign: Campaign;
  minDate: string;
}) {
  const [state, formAction, pending] = useActionState<InquiryState, FormData>(
    submitCampaignInquiry,
    null
  );
  const uid = useId();
  const errors = state?.errors ?? {};

  if (state?.ok) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border border-[var(--c-accent)]/40 bg-[var(--c-warm-soft)] p-8 sm:p-10 text-center"
      >
        <p className="font-display text-[clamp(1.5rem,3.4vw,2rem)] font-semibold leading-tight">
          {campaign.confirmationTitle}
        </p>
        <p className="text-muted text-[1rem] leading-relaxed mt-4 max-w-120 mx-auto">
          {state.message}
        </p>
      </div>
    );
  }

  const id = (name: string) => `${uid}-${name}`;

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <input type="hidden" name="campaign" value={campaign.slug} />

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="grid gap-1.5">
          <label htmlFor={id("name")} className={labelCls}>
            Full name
          </label>
          <input
            id={id("name")}
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Jane Smith"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? id("name-error") : undefined}
            className={fieldCls(Boolean(errors.name))}
          />
          {errors.name && (
            <p id={id("name-error")} className={errorCls}>
              {errors.name}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={id("email")} className={labelCls}>
            Email
          </label>
          <input
            id={id("email")}
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="jane@email.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? id("email-error") : undefined}
            className={fieldCls(Boolean(errors.email))}
          />
          {errors.email && (
            <p id={id("email-error")} className={errorCls}>
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="grid gap-1.5">
          <label htmlFor={id("phone")} className={labelCls}>
            Phone
          </label>
          <input
            id={id("phone")}
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="(555) 123-4567"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? id("phone-error") : undefined}
            className={fieldCls(Boolean(errors.phone))}
          />
          {errors.phone && (
            <p id={id("phone-error")} className={errorCls}>
              {errors.phone}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={id("date")} className={labelCls}>
            {campaign.dateLabel}
          </label>
          <input
            id={id("date")}
            name="preferred_date"
            type="date"
            required
            min={minDate}
            aria-invalid={Boolean(errors.preferredDate)}
            aria-describedby={errors.preferredDate ? id("date-error") : undefined}
            // iOS renders an empty date input at a different height to a text
            // input, which breaks the two-up row on a phone.
            className={`${fieldCls(Boolean(errors.preferredDate))} min-h-[3.25rem] appearance-none`}
          />
          {errors.preferredDate && (
            <p id={id("date-error")} className={errorCls}>
              {errors.preferredDate}
            </p>
          )}
        </div>
      </div>

      <fieldset className="grid gap-2.5 border-0 p-0 m-0">
        <legend className={`${labelCls} p-0`}>Session type</legend>
        <div className="flex flex-wrap gap-2.5 mt-0.5">
          {campaign.sessionTypes.map((t) => (
            <label
              key={t.value}
              className="group relative cursor-pointer rounded-full border border-rule bg-surface px-5 py-2.5 text-[0.9rem] transition-colors hover:border-[var(--c-accent)]/60 has-[:checked]:border-[var(--c-accent)] has-[:checked]:bg-[var(--c-warm-soft)] has-[:checked]:text-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--c-accent)] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg"
            >
              <input
                type="radio"
                name="session_type"
                value={t.value}
                required
                className="absolute h-px w-px opacity-0"
              />
              {t.label}
            </label>
          ))}
        </div>
        {errors.sessionType && <p className={errorCls}>{errors.sessionType}</p>}
      </fieldset>

      <div className="grid gap-1.5">
        <label htmlFor={id("ideas")} className={labelCls}>
          {campaign.ideasLabel}{" "}
          <span className="normal-case tracking-normal font-normal opacity-75">(optional)</span>
        </label>
        <textarea
          id={id("ideas")}
          name="ideas"
          rows={4}
          placeholder={campaign.ideasPlaceholder}
          className={`${fieldCls(false)} resize-y min-h-[110px]`}
        />
      </div>

      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px overflow-hidden"
      />

      <p
        role="status"
        aria-live="polite"
        className={`text-[0.95rem] min-h-[1.4em] ${state && !state.ok ? "text-[#e0a08f]" : ""}`}
      >
        {pending ? "Sending…" : state && !state.ok ? state.message : ""}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--c-accent)] text-bg border border-[var(--c-accent)] font-semibold uppercase text-[0.88rem] tracking-[0.08em] px-[1.9em] py-[0.95em] transition-all duration-200 hover:bg-transparent hover:text-[var(--c-accent)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {campaign.ctaLabel}
      </button>

      <p className="text-[0.85rem] text-muted text-center -mt-1.5">
        No spam, ever. Your request isn&apos;t a booking until we confirm it with you.
      </p>
    </form>
  );
}
