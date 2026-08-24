"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { claimOffer } from "./actions";
import { EMAIL_CONSENT_COPY, OFFER_CHOICES, SMS_CONSENT_COPY } from "./config";

/* First-visit offer popup.

   One question, then contact details, then a coupon. It is not a newsletter
   modal: the answer is a real signal that feeds the same vocabulary as the
   Content Growth Diagnostic, and the success screen hands people off to it.

   Everything that decides whether this appears — on/off, delay, scroll depth,
   exit intent, how long a dismissal suppresses it — is served from
   /api/offer and edited in the admin panel, never hard-coded here. */

type PublicSettings = {
  enabled: boolean;
  headline: string;
  discountLabel: string;
  discountNote: string;
  delaySeconds: number;
  scrollPercent: number;
  exitIntent: boolean;
  suppressDays: number;
  smsEnabled: boolean;
  eligibility: string;
};

type Phase = "question" | "form" | "done";

const STORAGE_KEY = "gcs_offer_v1";
/** Interrupting someone who is reading the terms of the offer — often because
    the popup itself sent them there — would be absurd. */
const NEVER_ON = ["/privacy", "/terms", "/offer-terms"];
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** `{ done: 1 }` once someone has claimed — they never see it again.
    `{ snooze: <epoch ms> }` after a dismissal, for the configured window. */
function readState(): { done?: number; snooze?: number } {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeState(next: { done?: number; snooze?: number }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readState(), ...next }));
  } catch {
    /* private mode — the popup just behaves as if this were a first visit */
  }
}

const field =
  "w-full font-body text-base text-ink bg-bg border border-rule rounded px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function OfferPopup() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("question");
  const [answerId, setAnswerId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [expiry, setExpiry] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailed, setEmailed] = useState(false);

  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(
    (reason: "dismiss" | "complete") => {
      setOpen(false);
      if (reason === "complete") writeState({ done: Date.now() });
      else if (settings) writeState({ snooze: Date.now() + settings.suppressDays * 86_400_000 });
      restoreFocusRef.current?.focus?.();
    },
    [settings]
  );

  /* -------- eligibility + triggers ------------------------------------- */
  useEffect(() => {
    if (NEVER_ON.some((p) => pathname.startsWith(p))) return;
    const state = readState();
    if (state.done) return;
    if (state.snooze && Date.now() < state.snooze) return;

    let cancelled = false;
    const cleanups: (() => void)[] = [];

    const load = async () => {
      let s: PublicSettings;
      try {
        const res = await fetch("/api/offer");
        s = await res.json();
      } catch {
        return; // an offer that can't load is an offer that doesn't interrupt
      }
      if (cancelled || !s?.enabled) return;
      setSettings(s);

      const fire = () => {
        if (cancelled) return;
        cancelled = true;
        cleanups.forEach((fn) => fn());
        setOpen(true);
      };

      // Never on load — the visitor gets to see the page first.
      const timer = setTimeout(fire, Math.max(s.delaySeconds, 3) * 1000);
      cleanups.push(() => clearTimeout(timer));

      if (s.scrollPercent > 0) {
        const onScroll = () => {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          if (max > 0 && (window.scrollY / max) * 100 >= s.scrollPercent) fire();
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        cleanups.push(() => window.removeEventListener("scroll", onScroll));
      }

      // Exit intent needs a real cursor, so it is desktop-only by construction;
      // touch devices fall back to the delay and scroll triggers above.
      if (s.exitIntent && window.matchMedia("(pointer: fine)").matches) {
        const onLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) fire();
        };
        document.addEventListener("mouseout", onLeave);
        cleanups.push(() => document.removeEventListener("mouseout", onLeave));
      }
    };

    // Off the critical path: nothing about the offer competes with first paint.
    const idle = setTimeout(load, 1200);
    cleanups.push(() => clearTimeout(idle));

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [pathname]);

  /* -------- dialog behaviour ------------------------------------------- */
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close("dismiss");
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  // Each screen is a new screen: move focus to its heading.
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>("h2")?.focus();
  }, [phase, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await claimOffer({ answerId, email, phone, emailConsent, smsConsent });
      if (!res.ok || !res.code) {
        setError(res.message || "Something went wrong. Please try again.");
        return;
      }
      setCode(res.code);
      setExpiry(
        res.expiresAt
          ? new Date(res.expiresAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : ""
      );
      setEmailed(Boolean(res.emailed));
      writeState({ done: Date.now() });
      setPhase("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    setError("");
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      return;
    } catch {
      /* clipboard permission denied or unavailable — fall through */
    }
    // Fallback: select the code so a copy is one keystroke away even where the
    // async clipboard API is blocked. Losing the code is not an acceptable
    // outcome of a button whose only job is handing it over.
    try {
      const node = codeRef.current;
      if (!node) throw new Error("no node");
      const range = document.createRange();
      range.selectNodeContents(node);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      if (document.execCommand("copy")) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
        return;
      }
      setError("Your code is selected above — press Ctrl/Cmd + C to copy it.");
    } catch {
      setError("Couldn't copy automatically — select the code above to copy it.");
    }
  };

  if (!open || !settings) return null;

  return (
    <div
      className="fixed inset-0 z-200 flex items-end sm:items-center justify-center bg-bg/80 p-0 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close("dismiss");
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-heading"
        className="relative w-full sm:w-[min(560px,92vw)] max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-rule bg-surface p-6 sm:p-9 shadow-[0_24px_80px_rgba(0,0,0,0.55)] motion-safe:animate-[offerin_.32s_cubic-bezier(0.22,1,0.36,1)]"
      >
        <button
          type="button"
          onClick={() => close("dismiss")}
          aria-label="Close"
          className={`absolute top-3.5 right-3.5 grid h-9 w-9 place-items-center rounded-full text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer ${focusRing}`}
        >
          <span aria-hidden="true" className="leading-none text-[1.05rem]">✕</span>
        </button>

        {phase === "question" && (
          <>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-accent">
              One question
            </p>
            <h2
              id="offer-heading"
              tabIndex={-1}
              className="font-display font-semibold leading-[1.15] tracking-[-0.015em] text-[clamp(1.35rem,4.2vw,1.75rem)] mt-3 pr-8 outline-none"
            >
              {settings.headline}
            </h2>

            <div className="grid gap-2.5 mt-7">
              {OFFER_CHOICES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setAnswerId(c.id);
                    setPhase("form");
                  }}
                  className={`text-left rounded-lg border border-rule bg-bg px-4 py-3.5 text-[0.95rem] leading-snug hover:border-accent hover:bg-accent-soft transition-colors cursor-pointer ${focusRing}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "form" && (
          <>
            <h2
              id="offer-heading"
              tabIndex={-1}
              className="font-display font-semibold leading-[1.15] tracking-[-0.015em] text-[clamp(1.35rem,4.2vw,1.75rem)] pr-8 outline-none"
            >
              Nice. Let&apos;s get your discount.
            </h2>
            <p className="text-muted text-[0.92rem] mt-2.5 leading-relaxed">
              <span className="text-accent font-medium">{settings.discountLabel}</span>
              {settings.discountNote ? ` — ${settings.discountNote}` : ""}
            </p>

            <form onSubmit={submit} className="grid gap-4 mt-6" noValidate>
              <div className="grid gap-1.5">
                <label htmlFor="offer-email" className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
                  Email <span className="text-accent">*</span>
                </label>
                <input
                  id="offer-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={field}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="offer-phone" className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
                  Phone number <span className="text-accent">*</span>
                </label>
                <input
                  id="offer-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={field}
                />
              </div>

              {/* Consent is asked for separately and starts unticked. Giving us an
                  address or a number is not, on its own, permission to market. */}
              <fieldset className="grid gap-3 mt-1 border-t border-rule pt-4">
                <legend className="sr-only">Marketing preferences</legend>

                <label className="flex gap-3 items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailConsent}
                    onChange={(e) => setEmailConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#fac748] cursor-pointer"
                  />
                  <span className="text-muted text-[0.78rem] leading-relaxed">{EMAIL_CONSENT_COPY}</span>
                </label>

                {settings.smsEnabled && (
                  <label className="flex gap-3 items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsConsent}
                      onChange={(e) => setSmsConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#fac748] cursor-pointer"
                    />
                    <span className="text-muted text-[0.78rem] leading-relaxed">{SMS_CONSENT_COPY}</span>
                  </label>
                )}
              </fieldset>

              {error && (
                <p role="alert" className="text-[0.88rem]" style={{ color: "#d98a7a" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className={`rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.82rem] tracking-[0.08em] px-6 py-3.5 hover:bg-transparent hover:text-accent transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`}
              >
                {busy ? "Creating your code…" : "Get My Discount"}
              </button>

              <p className="text-muted text-[0.72rem] leading-relaxed">
                <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                  Privacy Policy
                </Link>
                {" · "}
                <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
                  Terms
                </Link>
                {" · "}
                <Link href="/offer-terms" className="underline underline-offset-2 hover:text-ink">
                  Coupon Terms
                </Link>
              </p>
            </form>
          </>
        )}

        {phase === "done" && (
          <>
            <h2
              id="offer-heading"
              tabIndex={-1}
              className="font-display font-semibold leading-[1.15] tracking-[-0.015em] text-[clamp(1.35rem,4.2vw,1.75rem)] pr-8 outline-none"
            >
              Your Discount Is Ready.
            </h2>
            <p className="text-muted text-[0.92rem] mt-2.5">
              {settings.discountLabel}
              {expiry ? ` · valid through ${expiry}` : ""}
            </p>
            {emailed && (
              <p className="text-[0.88rem] text-accent mt-2">
                {/* Explicit {" "} — JSX drops the space between an expression and
                    the text that follows it across a line break. */}
                We&apos;ve emailed it to{" "}
                <span className="text-ink">{email.trim().toLowerCase()}</span>{" "}
                as well, so you don&apos;t have to keep this open.
              </p>
            )}

            <div className="mt-6 rounded-lg border border-accent/40 bg-accent-soft p-5 flex items-center justify-between gap-4 flex-wrap">
              <code
                ref={codeRef}
                className="font-display text-[1.35rem] font-semibold tracking-[0.12em] text-accent select-all"
              >
                {code}
              </code>
              <button
                type="button"
                onClick={copy}
                className={`rounded-full border border-accent text-accent text-[0.76rem] font-semibold uppercase tracking-[0.08em] px-4 py-2 hover:bg-accent hover:text-bg transition-colors cursor-pointer ${focusRing}`}
              >
                {copied ? "Copied" : "Copy Code"}
              </button>
              <span role="status" aria-live="polite" className="sr-only">
                {copied ? "Coupon code copied to clipboard" : ""}
              </span>
            </div>
            {error && (
              <p role="alert" className="text-[0.85rem] mt-3" style={{ color: "#d98a7a" }}>
                {error}
              </p>
            )}
            <p className="text-muted text-[0.78rem] mt-3 leading-relaxed">{settings.eligibility}</p>

            <div className="mt-8 border-t border-rule pt-6">
              <p className="font-display text-[1.05rem] font-semibold">
                Want to know what&apos;s actually holding your content back?
              </p>
              <p className="text-muted text-[0.9rem] mt-2 leading-relaxed">
                Your answer gave us an initial signal. The full Gray Content Growth Diagnostic goes
                deeper and identifies your current growth stage, biggest bottleneck, and personalized
                next steps.
              </p>
              <Link
                href="/diagnostic"
                onClick={() => close("complete")}
                className={`inline-block mt-5 rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.8rem] tracking-[0.08em] px-6 py-3 hover:bg-transparent hover:text-accent transition-colors ${focusRing}`}
              >
                Take the Full Diagnostic
              </Link>
              <button
                type="button"
                onClick={() => close("complete")}
                className={`block mt-4 text-muted text-[0.85rem] hover:text-ink transition-colors cursor-pointer rounded-sm ${focusRing}`}
              >
                Maybe later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
