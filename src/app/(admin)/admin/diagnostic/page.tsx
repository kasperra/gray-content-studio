import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { DIMENSIONS, DIMENSION_LABELS, type Dimension } from "@/modules/diagnostic/types";
import { STAGES } from "@/modules/diagnostic/content";
import { optionLabel } from "@/modules/diagnostic/questions";
import { ConfigEditor } from "./ConfigEditor";

/* Diagnostic leads + funnel. Every completed diagnostic is a segmented lead:
   stage, bottleneck, intent and urgency are all stored as columns so they can
   be filtered here and used for follow-up. */

type Row = {
  id: string;
  public_id: string;
  name: string | null;
  email: string | null;
  business_name: string | null;
  website: string | null;
  business_type: string | null;
  stage: number;
  stage_name: string;
  primary_bottleneck: string;
  secondary_bottlenecks: string[] | null;
  overall_score: number;
  purchase_intent: string | null;
  urgency: string | null;
  created_at: string;
  email_captured_at: string | null;
};

const HOT_INTENT = new Set(["partner", "full_operation"]);
const HOT_URGENCY = new Set(["30_days", "asap"]);

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-rule bg-surface p-5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="font-display text-[1.6rem] font-semibold mt-1.5 tabular-nums">{value}</p>
      {sub && <p className="text-muted text-[0.8rem] mt-0.5">{sub}</p>}
    </div>
  );
}

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total ? Math.round((100 * count) / total) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[0.85rem]">
        <span>{label}</span>
        <span className="text-muted tabular-nums">
          {count} · {pct}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full bg-accent rounded-full" style={{ width: `${Math.max(pct, count ? 2 : 0)}%` }} />
      </div>
    </div>
  );
}

export default async function AdminDiagnosticPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const fStage = one("stage");
  const fBottleneck = one("bottleneck");
  const fIntent = one("intent");
  const fUrgency = one("urgency");
  const fQuery = one("q");

  const supabase = await createSupabaseServer();

  let query = supabase
    .from("diagnostic_results")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (fStage) query = query.eq("stage", Number(fStage));
  if (fBottleneck) query = query.eq("primary_bottleneck", fBottleneck);
  if (fIntent) query = query.eq("purchase_intent", fIntent);
  if (fUrgency) query = query.eq("urgency", fUrgency);
  if (fQuery) query = query.or(`email.ilike.%${fQuery}%,business_name.ilike.%${fQuery}%,name.ilike.%${fQuery}%`);

  const [{ data: rows, error }, { data: allRows }, { data: events }, { data: config }] = await Promise.all([
    query,
    supabase.from("diagnostic_results").select("stage, primary_bottleneck, email, purchase_intent, urgency"),
    supabase.from("diagnostic_events").select("event, session_id"),
    supabase.from("diagnostic_config").select("key, value"),
  ]);

  // The migration is applied by hand, so the page explains itself rather than
  // erroring if the tables aren't there yet.
  if (error) {
    return (
      <>
        <h1 className="font-display text-[1.6rem] font-semibold mb-3">Content Diagnostic</h1>
        <div className="rounded-lg border border-accent/40 bg-accent-soft p-6 max-w-[64ch]">
          <p className="font-semibold">The diagnostic tables aren&apos;t set up yet.</p>
          <p className="text-muted text-[0.92rem] mt-2 leading-relaxed">
            Run <code className="text-accent">supabase/migrations/0003_diagnostic.sql</code> in the
            Supabase SQL editor, then reload this page. The public diagnostic will start recording
            results as soon as it exists.
          </p>
        </div>
      </>
    );
  }

  const results = (rows ?? []) as Row[];
  const all = allRows ?? [];
  const totalAll = all.length;

  const countEvent = (e: string) => (events ?? []).filter((x) => x.event === e).length;
  const uniqueSessions = new Set((events ?? []).filter((x) => x.event === "start").map((x) => x.session_id)).size;

  const captured = all.filter((r) => r.email).length;
  const stageCounts = STAGES.map((s) => ({ s, n: all.filter((r) => r.stage === s.id).length }));
  const bottleneckCounts = DIMENSIONS.map((d) => ({
    d,
    n: all.filter((r) => r.primary_bottleneck === d).length,
  }));
  const hot = all.filter(
    (r) => HOT_INTENT.has(r.purchase_intent ?? "") || HOT_URGENCY.has(r.urgency ?? "")
  ).length;

  const filtering = Boolean(fStage || fBottleneck || fIntent || fUrgency || fQuery);

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-7">
        <h1 className="font-display text-[1.6rem] font-semibold">Content Diagnostic</h1>
        <a
          href="/admin/diagnostic/export"
          className="rounded-full border border-rule text-[0.78rem] font-semibold uppercase tracking-[0.08em] px-5 py-2 text-muted hover:text-accent hover:border-accent transition-colors"
        >
          Export CSV
        </a>
      </div>

      {/* Funnel */}
      <section aria-labelledby="funnel">
        <h2 id="funnel" className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted mb-4">
          Diagnostic funnel
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Stat label="Landing views" value={countEvent("view")} />
          <Stat label="Started" value={uniqueSessions} />
          <Stat
            label="Completed"
            value={totalAll}
            sub={uniqueSessions ? `${Math.round((100 * totalAll) / uniqueSessions)}% of starts` : undefined}
          />
          <Stat
            label="Captured email"
            value={captured}
            sub={totalAll ? `${Math.round((100 * captured) / totalAll)}% of completions` : undefined}
          />
          <Stat label="CTA clicks" value={countEvent("cta_click")} />
        </div>
        {hot > 0 && (
          <p className="text-[0.88rem] text-accent mt-4">
            {hot} {hot === 1 ? "lead is" : "leads are"} actively looking for a partner or want help within 30 days.
          </p>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mt-10">
        <section className="rounded-lg border border-rule bg-surface p-6" aria-labelledby="stagedist">
          <h2 id="stagedist" className="font-display text-[1.1rem] font-semibold mb-5">
            Stage distribution
          </h2>
          <div className="space-y-3.5">
            {stageCounts.map(({ s, n }) => (
              <Bar key={s.id} label={`${s.id}. ${s.name}`} count={n} total={totalAll} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-rule bg-surface p-6" aria-labelledby="bottlenecks">
          <h2 id="bottlenecks" className="font-display text-[1.1rem] font-semibold mb-5">
            Primary bottleneck distribution
          </h2>
          <div className="space-y-3.5">
            {bottleneckCounts.map(({ d, n }) => (
              <Bar key={d} label={DIMENSION_LABELS[d]} count={n} total={totalAll} />
            ))}
          </div>
        </section>
      </div>

      {/* Filters */}
      <section className="mt-10" aria-labelledby="leads">
        <h2 id="leads" className="font-display text-[1.2rem] font-semibold mb-4">
          Leads {filtering && <span className="text-muted text-[0.9rem] font-body">({results.length} matching)</span>}
        </h2>

        <form action="/admin/diagnostic" className="flex flex-wrap items-end gap-3 mb-5">
          <div className="grid gap-1.5">
            <label htmlFor="f-q" className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
              Search
            </label>
            <input
              id="f-q"
              name="q"
              defaultValue={fQuery}
              placeholder="Email, name, business"
              className="font-body text-[0.9rem] text-ink bg-bg border border-rule rounded px-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
            />
          </div>
          {[
            { name: "stage", label: "Stage", options: STAGES.map((s) => [String(s.id), `${s.id}. ${s.name}`] as const) },
            { name: "bottleneck", label: "Bottleneck", options: DIMENSIONS.map((d) => [d, DIMENSION_LABELS[d]] as const) },
            {
              name: "intent",
              label: "Intent",
              options: [
                ["exploring", "Exploring"],
                ["diy", "DIY"],
                ["outside_help", "Outside help"],
                ["partner", "Looking for partner"],
                ["full_operation", "Full operation"],
              ] as const,
            },
            {
              name: "urgency",
              label: "Urgency",
              options: [
                ["researching", "Researching"],
                ["six_months", "6 months"],
                ["90_days", "90 days"],
                ["30_days", "30 days"],
                ["asap", "ASAP"],
              ] as const,
            },
          ].map((f) => (
            <div key={f.name} className="grid gap-1.5">
              <label htmlFor={`f-${f.name}`} className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
                {f.label}
              </label>
              <select
                id={`f-${f.name}`}
                name={f.name}
                defaultValue={one(f.name)}
                className="font-body text-[0.9rem] text-ink bg-bg border border-rule rounded px-3 py-2 focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="">Any</option>
                {f.options.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button
            type="submit"
            className="rounded-full bg-accent text-bg border border-accent text-[0.78rem] font-semibold uppercase tracking-[0.08em] px-5 py-2 hover:bg-transparent hover:text-accent transition-colors cursor-pointer"
          >
            Filter
          </button>
          {filtering && (
            <Link href="/admin/diagnostic" className="text-muted text-[0.85rem] hover:text-ink transition-colors">
              Clear
            </Link>
          )}
        </form>

        {!results.length ? (
          <p className="text-muted">
            {totalAll === 0
              ? "No completed diagnostics yet."
              : "No leads match these filters."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[0.9rem]">
              <thead>
                <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted border-b border-rule">
                  <th className="py-2.5 pr-4">Lead</th>
                  <th className="py-2.5 pr-4">Stage</th>
                  <th className="py-2.5 pr-4">Bottleneck</th>
                  <th className="py-2.5 pr-4 hidden md:table-cell">Intent</th>
                  <th className="py-2.5 pr-4 hidden lg:table-cell">Urgency</th>
                  <th className="py-2.5 pr-4 hidden sm:table-cell">Date</th>
                  <th className="py-2.5 text-right">Result</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const isHot =
                    HOT_INTENT.has(r.purchase_intent ?? "") || HOT_URGENCY.has(r.urgency ?? "");
                  return (
                    <tr key={r.id} className="border-b border-rule align-middle">
                      <td className="py-3 pr-4">
                        <span className="font-medium">{r.name || r.business_name || "Anonymous"}</span>
                        {isHot && (
                          <span className="ml-2 rounded-full bg-accent-soft text-accent text-[0.62rem] font-semibold uppercase tracking-[0.1em] px-2 py-0.5">
                            Hot
                          </span>
                        )}
                        <span className="block text-muted text-[0.8rem]">
                          {r.email || "no email captured"}
                          {r.business_type ? ` · ${optionLabel("business_type", r.business_type)}` : ""}
                        </span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {r.stage}. {r.stage_name}
                      </td>
                      <td className="py-3 pr-4">
                        {DIMENSION_LABELS[r.primary_bottleneck as Dimension] ?? r.primary_bottleneck}
                        {r.secondary_bottlenecks?.length ? (
                          <span className="block text-muted text-[0.78rem]">
                            +{" "}
                            {r.secondary_bottlenecks
                              .map((d) => DIMENSION_LABELS[d as Dimension] ?? d)
                              .join(", ")}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell text-muted">
                        {r.purchase_intent ? optionLabel("intent", r.purchase_intent) : "—"}
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell text-muted">
                        {r.urgency ? optionLabel("urgency", r.urgency) : "—"}
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell text-muted whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={`/diagnostic/results/${r.public_id}`}
                          target="_blank"
                          rel="noopener"
                          className="text-accent text-[0.82rem] font-semibold hover:underline underline-offset-4 whitespace-nowrap"
                        >
                          View →
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfigEditor initial={Object.fromEntries((config ?? []).map((c) => [c.key, c.value]))} />
    </>
  );
}
