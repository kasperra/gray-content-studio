import { DIMENSIONS, DIMENSION_LABELS, type Dimension, type Result } from "./types";
import { BOTTLENECK_COPY, STAGES } from "./content";
import { stageMeta } from "./scoring";

/* Presentational only — no hooks, so it renders identically from the client
   flow and from the server-rendered permanent result page. */

/** Stage 5 has cleared every structural gate, so naming a single dimension as
    "the bottleneck" would misread the diagnosis: the work there is leverage. */
function primaryLabel(result: Result) {
  return result.stage === 5 ? "Optimization & Leverage" : DIMENSION_LABELS[result.primaryBottleneck];
}

function primaryCopy(result: Result) {
  if (result.stage === 5) {
    return {
      what: "No structural gap is holding you back — the constraint is now efficiency and leverage.",
      cost: `Your lowest-scoring area is ${DIMENSION_LABELS[result.primaryBottleneck].toLowerCase()}, which is where additional gains are cheapest to win.`,
    };
  }
  return BOTTLENECK_COPY[result.primaryBottleneck];
}

export function ScoreBar({ dimension, value }: { dimension: Dimension; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.82rem] font-medium">{DIMENSION_LABELS[dimension]}</span>
        <span className="text-[0.82rem] tabular-nums text-muted">{value}</span>
      </div>
      <div
        className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden"
        role="img"
        aria-label={`${DIMENSION_LABELS[dimension]}: ${value} out of 100`}
      >
        <div
          className={`h-full rounded-full ${value < 50 ? "bg-[#d98a7a]" : value < 70 ? "bg-accent" : "bg-[#8ec98e]"}`}
          style={{ width: `${Math.max(value, 2)}%` }}
        />
      </div>
    </div>
  );
}

export function StageRail({ current }: { current: number }) {
  return (
    <div>
      <ol className="grid grid-cols-5 gap-1.5" aria-label="Content growth stages">
        {STAGES.map((s) => {
          const isCurrent = s.id === current;
          const passed = s.id < current;
          return (
            <li key={s.id} aria-current={isCurrent ? "step" : undefined}>
              <div
                className={`h-1.5 rounded-full ${isCurrent ? "bg-accent" : passed ? "bg-accent/40" : "bg-surface-2"}`}
              />
              <span
                className={`block text-[0.62rem] sm:text-[0.72rem] font-semibold uppercase tracking-[0.08em] mt-2 ${
                  isCurrent ? "text-accent" : "text-muted"
                }`}
              >
                {s.id}. {s.name}
              </span>
              {/* Never signal the current stage with colour alone. */}
              {isCurrent && (
                <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink mt-1">
                  ★ You are here
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ResultReport({
  result,
  full,
  ctaLabel,
  bookingUrl,
  footerCopy,
  onCtaClick,
}: {
  result: Result;
  /** false shows the initial diagnosis only; the roadmap unlocks after capture. */
  full: boolean;
  ctaLabel: string;
  bookingUrl: string;
  footerCopy: string;
  onCtaClick?: () => void;
}) {
  const meta = stageMeta(result.stage);
  const next = result.stage < 5 ? STAGES[result.stage] : null; // STAGES is 0-indexed
  const copy = primaryCopy(result);

  return (
    <div className="w-[min(880px,92vw)] mx-auto">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent">
        Your Content Diagnosis
      </p>
      <p className="font-display text-[1.1rem] font-semibold mt-4">
        Stage {result.stage} — {meta.name}
      </p>
      <h1 className="font-display font-semibold leading-[1.1] tracking-[-0.015em] text-[clamp(1.8rem,4.6vw,3rem)] mt-2">
        {meta.headline}
      </h1>
      <p className="text-muted text-[1.02rem] leading-relaxed max-w-[62ch] mt-5">{meta.positioning}</p>

      {/* Evidence — every line traces to an answer the visitor actually gave. */}
      {result.reasons.length > 0 && (
        <section className="mt-12" aria-labelledby="evidence">
          <h2 id="evidence" className="font-display text-[1.25rem] font-semibold">
            What your answers tell us
          </h2>
          <ul className="mt-5 space-y-3.5">
            {result.reasons.map((r) => (
              <li key={r} className="flex gap-3.5 text-[0.97rem] text-ink/90 leading-relaxed">
                <span className="text-accent shrink-0" aria-hidden="true">
                  —
                </span>
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 grid sm:grid-cols-2 gap-x-10 gap-y-8" aria-labelledby="bottlenecks">
        <div className="sm:col-span-2">
          <h2 id="bottlenecks" className="font-display text-[1.25rem] font-semibold">
            Your primary bottleneck
          </h2>
        </div>
        <div className="sm:col-span-2 rounded-lg border border-accent/40 bg-accent-soft p-6">
          <p className="font-display text-[1.4rem] font-semibold text-accent">{primaryLabel(result)}</p>
          <p className="text-[0.97rem] text-ink/90 mt-2.5 leading-relaxed">{copy.what}</p>
          <p className="text-muted text-[0.92rem] mt-2.5 leading-relaxed">{copy.cost}</p>
        </div>

        {result.secondaryBottlenecks.length > 0 && (
          <div className="sm:col-span-2">
            <h3 className="font-display text-[1.05rem] font-semibold">Your secondary bottlenecks</h3>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {result.secondaryBottlenecks.map((d) => (
                <div key={d} className="rounded-lg border border-rule bg-surface p-5">
                  <p className="font-display text-[1.05rem] font-semibold">{DIMENSION_LABELS[d]}</p>
                  <p className="text-muted text-[0.9rem] mt-2 leading-relaxed">{BOTTLENECK_COPY[d].what}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mt-12" aria-labelledby="dimensions">
        <h2 id="dimensions" className="font-display text-[1.25rem] font-semibold">
          Your content operation, by dimension
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5 mt-6">
          {DIMENSIONS.map((d) => (
            <ScoreBar key={d} dimension={d} value={result.scores[d]} />
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-rule bg-surface p-6 sm:p-8" aria-labelledby="youarehere">
        <h2 id="youarehere" className="font-display text-[1.25rem] font-semibold mb-6">
          Where you are
        </h2>
        <StageRail current={result.stage} />
        {next && (
          <div className="mt-8 pt-6 border-t border-rule">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted">
              Your next milestone
            </p>
            <p className="font-display text-[1.2rem] font-semibold mt-1.5">
              Stage {next.id} — {next.name}
            </p>
            <p className="text-muted text-[0.95rem] mt-2.5 leading-relaxed">{meta.nextStageRequirement}</p>
          </div>
        )}
      </section>

      {full && (
        <>
          <section className="mt-14" aria-labelledby="roadmap">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent">Your next move</p>
            <h2 id="roadmap" className="font-display text-[1.6rem] font-semibold mt-3">
              {next ? `Stage ${result.stage} → Stage ${next.id}` : "Compounding what already works"}
            </h2>
            <ol className="mt-8 space-y-7">
              {result.roadmap.map((item, i) => (
                <li key={item.dimension} className="relative border-t border-rule pt-5 before:content-[''] before:absolute before:-top-px before:left-0 before:w-10 before:h-px before:bg-accent">
                  <span className="font-display italic text-accent text-[0.9rem]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-[1.15rem] font-semibold mt-1">{item.title}</h3>
                  <p className="text-muted text-[0.95rem] mt-2 leading-relaxed max-w-[62ch]">{item.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-14" aria-labelledby="plan30">
            <h2 id="plan30" className="font-display text-[1.6rem] font-semibold">
              Your first 30 days
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-7">
              {result.plan30.map((w) => (
                <div key={w.week} className="rounded-lg border border-rule bg-surface p-5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-accent">
                    Week {w.week}
                  </p>
                  <p className="font-display text-[1.05rem] font-semibold mt-1.5">{w.title}</p>
                  <p className="text-muted text-[0.9rem] mt-2 leading-relaxed">{w.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14 rounded-lg border border-accent/40 bg-accent-soft p-7 sm:p-9">
            <p className="text-[0.95rem] text-ink/90 leading-relaxed max-w-[62ch]">{footerCopy}</p>
            <a
              href={bookingUrl}
              onClick={onCtaClick}
              className="inline-block mt-7 rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.85rem] tracking-[0.08em] px-[2em] py-[0.85em] transition-all duration-200 hover:bg-transparent hover:text-accent hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {ctaLabel}
            </a>
          </section>
        </>
      )}
    </div>
  );
}
