"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { visibleQuestions, plannedTotal } from "@/modules/diagnostic/questions";
import { submitDiagnostic, captureLead } from "@/modules/diagnostic/actions";
import { beacon } from "@/modules/diagnostic/beacon";
import { ResultReport } from "@/modules/diagnostic/ResultReport";
import { stageMeta } from "@/modules/diagnostic/scoring";
import type { Answers, Result } from "@/modules/diagnostic/types";

type Phase = "quiz" | "analyzing" | "result" | "error";

const ANALYSIS_STEPS = [
  "Content maturity analyzed",
  "Primary bottleneck identified",
  "Growth stage calculated",
  "Next-stage opportunities identified",
  "Personalized roadmap generated",
];

const fieldCls =
  "w-full font-body text-base text-ink bg-bg border border-rule rounded px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors";

export function DiagnosticFlow({
  ctaByStage,
  bookingUrl,
  footerCopy,
}: {
  ctaByStage: Record<number, string>;
  bookingUrl: string;
  footerCopy: string;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("quiz");
  const [result, setResult] = useState<Result | null>(null);
  const [publicId, setPublicId] = useState<string>();
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState("");
  const [captured, setCaptured] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2) + Date.now().toString(36));
  const startedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The list changes as adaptive branches open and close, so it is derived
  // from the current answers rather than snapshotted.
  const questions = useMemo(() => visibleQuestions(answers), [answers]);
  // Total counts branches that haven't opened yet, so the denominator is stable.
  const total = useMemo(() => plannedTotal(answers), [answers]);
  const step = Math.min(index, questions.length - 1);
  const question = questions[step];
  const progress = Math.round((step / total) * 100);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    beacon("start", { sessionId });
  }, [sessionId]);

  // Move focus to the new question so keyboard and screen-reader users follow
  // the change of screen.
  useEffect(() => {
    if (phase === "quiz") headingRef.current?.focus();
  }, [step, phase]);

  const runAnalysis = useCallback(async (finalAnswers: Answers) => {
    setPhase("analyzing");
    setError("");
    setAnalysisStep(0);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = reduce ? 120 : 620;

    // The checkmarks pace while the request is genuinely in flight.
    const pacer = setInterval(() => setAnalysisStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length)), tick);
    try {
      // A hung request must surface as a retryable error, never as a screen that
      // sits on "Your diagnosis is ready" forever.
      const res = await Promise.race([
        submitDiagnostic(finalAnswers),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 25_000)
        ),
      ]);

      if (!reduce) await new Promise((r) => setTimeout(r, 900));
      setAnalysisStep(ANALYSIS_STEPS.length);

      if (!res.ok || !res.result) {
        setError(res.message || "We couldn't complete your diagnosis.");
        setPhase("error");
        return;
      }
      setResult(res.result);
      setPublicId(res.publicId);
      setTimeout(() => setPhase("result"), reduce ? 0 : 500);
    } catch {
      setError("We couldn't reach the diagnostic service. Your answers are safe — try again.");
      setPhase("error");
    } finally {
      clearInterval(pacer);
    }
  }, []);

  const choose = useCallback(
    (optionId: string) => {
      if (!question) return;
      const next = { ...answers, [question.id]: optionId };
      setAnswers(next);
      beacon("question", { sessionId, step: question.id });

      const remaining = visibleQuestions(next);
      const at = remaining.findIndex((q) => q.id === question.id);
      if (at + 1 < remaining.length) {
        setIndex(at + 1);
      } else {
        void runAnalysis(next);
      }
    },
    [answers, question, sessionId, runAnalysis]
  );

  // Number keys pick an answer; Backspace steps back.
  useEffect(() => {
    if (phase !== "quiz" || !question) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const n = Number(e.key);
      if (n >= 1 && n <= question.options.length) {
        e.preventDefault();
        choose(question.options[n - 1].id);
      }
      if (e.key === "Backspace" && step > 0) {
        e.preventDefault();
        setIndex(step - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, question, step, choose]);

  if (phase === "error") {
    return (
      <div className="w-[min(560px,92vw)] mx-auto py-24 sm:py-32">
        <p className="font-display text-[1.4rem] font-semibold">We couldn&apos;t finish your diagnosis.</p>
        <p role="alert" className="text-muted text-[0.97rem] mt-3 leading-relaxed">{error}</p>
        <button
          type="button"
          onClick={() => void runAnalysis(answers)}
          className="mt-7 rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.85rem] tracking-[0.08em] px-[2em] py-[0.85em] transition-all duration-200 hover:bg-transparent hover:text-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Try again
        </button>
      </div>
    );
  }

  if (phase === "analyzing") {
    return (
      <div className="w-[min(560px,92vw)] mx-auto py-24 sm:py-32" aria-live="polite" aria-busy="true">
        <p className="font-display text-[1.4rem] font-semibold">Analyzing your responses…</p>
        <ul className="mt-9 space-y-4">
          {ANALYSIS_STEPS.map((label, i) => {
            const done = i < analysisStep;
            return (
              <li
                key={label}
                className={`flex items-center gap-3.5 text-[0.97rem] transition-opacity duration-500 ${
                  done ? "opacity-100" : "opacity-30"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[0.72rem] ${
                    done ? "border-accent text-accent" : "border-rule text-muted"
                  }`}
                >
                  {done ? "✓" : ""}
                </span>
                <span className={done ? "text-ink" : "text-muted"}>{label}</span>
              </li>
            );
          })}
        </ul>
        {analysisStep >= ANALYSIS_STEPS.length && (
          <p className="text-accent font-display text-[1.1rem] font-semibold mt-9">
            Your diagnosis is ready.
          </p>
        )}
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="py-14 sm:py-20">
        <ResultReport
          result={result}
          full={captured}
          ctaLabel={ctaByStage[result.stage] ?? stageMeta(result.stage).cta}
          bookingUrl={bookingUrl}
          footerCopy={footerCopy}
          onCtaClick={() => beacon("cta_click", { sessionId, resultPublicId: publicId })}
          publicId={publicId}
          canRequest={captured}
        />

        {!captured && (
          <CaptureForm
            publicId={publicId}
            onDone={() => setCaptured(true)}
          />
        )}

        {captured && publicId && (
          <div className="w-[min(880px,92vw)] mx-auto mt-12 text-center">
            <p className="text-muted text-[0.88rem]">
              Your diagnosis is saved at{" "}
              <Link href={`/diagnostic/results/${publicId}`} className="text-accent hover:underline underline-offset-4">
                a private link
              </Link>{" "}
              you can return to any time.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="w-[min(660px,92vw)] mx-auto py-10 sm:py-16">
      {/* Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between gap-4 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
          <span>{question.section}</span>
          <span aria-hidden="true">
            {step + 1} / {total}
          </span>
        </div>
        <div
          className="mt-3 h-1 rounded-full bg-surface-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Question ${step + 1} of ${total}`}
        >
          <div
            className="h-full bg-accent rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(progress, 3)}%` }}
          />
        </div>
      </div>

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display font-semibold leading-[1.2] tracking-[-0.01em] text-[clamp(1.5rem,3.6vw,2.1rem)] outline-none"
      >
        {question.prompt}
      </h1>
      {question.help && <p className="text-muted text-[0.95rem] mt-3">{question.help}</p>}

      <div className="mt-8 grid gap-3" role="group" aria-labelledby={undefined}>
        {question.options.map((o, i) => {
          const selected = answers[question.id] === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => choose(o.id)}
              aria-pressed={selected}
              className={`group w-full text-left rounded-lg border px-5 py-4 min-h-[3.5rem] flex items-center gap-4 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                selected
                  ? "border-accent bg-accent-soft"
                  : "border-rule bg-surface hover:border-accent/60 hover:bg-surface-2"
              }`}
            >
              <span
                aria-hidden="true"
                className={`hidden sm:grid h-7 w-7 shrink-0 place-items-center rounded-md border text-[0.75rem] font-semibold ${
                  selected ? "border-accent text-accent" : "border-rule text-muted group-hover:text-ink"
                }`}
              >
                {i + 1}
              </span>
              <span className="flex-1">
                <span className="block text-[1rem] leading-snug">{o.label}</span>
                {o.hint && <span className="block text-muted text-[0.85rem] mt-0.5">{o.hint}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-[#d98a7a] text-[0.9rem] mt-6">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 mt-9">
        <button
          type="button"
          onClick={() => setIndex(Math.max(0, step - 1))}
          disabled={step === 0}
          className="text-muted text-[0.88rem] hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          ← Back
        </button>
        <p className="text-muted text-[0.82rem]">There are no wrong answers.</p>
      </div>
    </div>
  );
}

function CaptureForm({ publicId, onDone }: { publicId?: string; onDone: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", businessName: "", website: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicId) return;
    setError("");
    setPending(true);
    try {
      const res = await captureLead(publicId, form);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onDone();
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="w-[min(880px,92vw)] mx-auto mt-14">
      <div className="rounded-lg border border-rule bg-surface p-7 sm:p-9">
        <h2 className="font-display text-[1.5rem] font-semibold">
          Want your complete personalized roadmap?
        </h2>
        <p className="text-muted text-[0.97rem] mt-3 leading-relaxed max-w-[58ch]">
          We&apos;ll send your full diagnostic report, including your current stage, biggest
          bottlenecks, next-stage requirements, and personalized recommendations.
        </p>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4 mt-7">
          <div className="grid gap-1.5">
            <label htmlFor="d-name" className="text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted">
              Name
            </label>
            <input
              id="d-name"
              className={fieldCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="name"
              placeholder="Jane Smith"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="d-email" className="text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted">
              Email
            </label>
            <input
              id="d-email"
              type="email"
              required
              className={fieldCls}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              placeholder="jane@company.com"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="d-business" className="text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted">
              Business name
            </label>
            <input
              id="d-business"
              className={fieldCls}
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              autoComplete="organization"
              placeholder="Company"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="d-website" className="text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted">
              Website
            </label>
            <input
              id="d-website"
              className={fieldCls}
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              autoComplete="url"
              placeholder="company.com"
            />
          </div>
          <div className="sm:col-span-2">
            {error && (
              <p role="alert" className="text-[#d98a7a] text-[0.88rem] mb-3">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full sm:w-auto rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.85rem] tracking-[0.08em] px-[2em] py-[0.85em] transition-all duration-200 hover:bg-transparent hover:text-accent active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {pending ? "Sending…" : "Send My Roadmap"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
