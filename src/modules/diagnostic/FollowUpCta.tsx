"use client";

import { useState, useTransition } from "react";
import { requestFollowUp } from "./actions";

/* The result-page call to action.
   When we already hold their details (the normal path, straight after capture)
   this books the request in one click rather than sending them to a form to
   retype what they just gave us. Someone opening an old result link who never
   captured has nothing to submit, so they get the contact form instead. */

const btn =
  "inline-block rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.85rem] tracking-[0.08em] px-[2em] py-[0.85em] transition-all duration-200 hover:bg-transparent hover:text-accent hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export function FollowUpCta({
  label,
  publicId,
  canRequest,
  fallbackUrl,
  onClicked,
}: {
  label: string;
  publicId?: string;
  /** True once we hold their email — i.e. the capture step is done. */
  canRequest: boolean;
  fallbackUrl: string;
  onClicked?: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (!canRequest || !publicId) {
    return (
      <a href={fallbackUrl} onClick={onClicked} className={`mt-7 ${btn}`}>
        {label}
      </a>
    );
  }

  if (sent) {
    return (
      <div className="mt-7" role="status">
        <p className="font-display text-[1.15rem] font-semibold text-accent">
          Request sent.
        </p>
        <p className="text-[0.95rem] text-ink/90 mt-1.5 max-w-[52ch] leading-relaxed">
          We&apos;ll reply within one business day. Your diagnosis came with it, so there&apos;s
          nothing else to send us.
        </p>
      </div>
    );
  }

  const go = () => {
    setError("");
    start(async () => {
      const res = await requestFollowUp(publicId);
      // No email on the record — fall back to the form rather than dead-ending.
      if (res.needsForm) {
        window.location.href = fallbackUrl;
        return;
      }
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onClicked?.();
      setSent(true);
    });
  };

  return (
    <div className="mt-7">
      <button type="button" onClick={go} disabled={pending} className={btn}>
        {pending ? "Sending…" : label}
      </button>
      <p className="text-muted text-[0.85rem] mt-3">
        One click — we already have your details from the diagnostic.
      </p>
      {error && (
        <p role="alert" className="text-[#d98a7a] text-[0.88rem] mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
