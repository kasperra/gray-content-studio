import { createSupabaseServer } from "@/lib/supabase/server";
import { STAGES, stageLabel } from "@/modules/projects/stages";
import { deleteMetric } from "@/modules/social/actions";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { MetricRecorder } from "./MetricRecorder";

const DAY = 24 * 60 * 60 * 1000;

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServer();

  const [{ data: projects }, { data: versions }, { data: metrics }, { data: clients }] =
    await Promise.all([
      supabase.from("projects").select("id, title, stage, created_at, updated_at"),
      supabase.from("review_versions").select("deliverable_id, version"),
      supabase
        .from("metric_snapshots")
        .select("id, metric, module, value, captured_on, clients(company)")
        .order("captured_on", { ascending: false })
        .limit(60),
      supabase.from("clients").select("id, company").order("company"),
    ]);

  /* ---- Production metrics (computed live) ---- */
  const all = projects ?? [];
  const active = all.filter((p) => p.stage !== "completed");
  const completed = all.filter((p) => p.stage === "completed");
  const avgTurnaround = completed.length
    ? Math.round(
        completed.reduce(
          (s, p) => s + (new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()) / DAY,
          0
        ) / completed.length
      )
    : null;

  // Revisions = review versions beyond the first, per deliverable
  const versionsByDeliverable: Record<string, number> = {};
  for (const v of versions ?? []) {
    versionsByDeliverable[v.deliverable_id] = Math.max(versionsByDeliverable[v.deliverable_id] ?? 0, v.version);
  }
  const deliverablesWithReview = Object.keys(versionsByDeliverable).length;
  const totalRevisions = Object.values(versionsByDeliverable).reduce((s, max) => s + Math.max(0, max - 1), 0);
  const avgRevisions = deliverablesWithReview
    ? Math.round((totalRevisions / deliverablesWithReview) * 10) / 10
    : null;

  const stageCounts = STAGES.map((s) => ({
    stage: s.label,
    count: active.filter((p) => p.stage === s.id).length,
  })).filter((s) => s.count > 0);
  const maxStage = Math.max(1, ...stageCounts.map((s) => s.count));

  /* ---- Marketing metrics (recorded snapshots) ---- */
  const marketing = (metrics ?? []).filter((m) => m.module !== "production");
  const byMetric: Record<string, { total: number; count: number }> = {};
  for (const m of marketing) {
    const k = m.metric;
    byMetric[k] = { total: (byMetric[k]?.total ?? 0) + Number(m.value), count: (byMetric[k]?.count ?? 0) + 1 };
  }
  const metricSummaries = Object.entries(byMetric).slice(0, 8);
  const maxMetric = Math.max(1, ...metricSummaries.map(([, v]) => v.total));

  return (
    <>
      <h1 className="font-display text-[1.6rem] font-semibold mb-8">Analytics</h1>

      {/* Production */}
      <section className="mb-10">
        <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-accent mb-4">Production</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Stat label="Active Projects" value={String(active.length)} />
          <Stat label="Completed" value={String(completed.length)} />
          <Stat label="Avg Turnaround" value={avgTurnaround != null ? `${avgTurnaround} days` : "—"} />
          <Stat label="Avg Revisions / Cut" value={avgRevisions != null ? String(avgRevisions) : "—"} />
        </div>

        {stageCounts.length > 0 && (
          <div className="bg-surface border border-rule rounded-lg p-6">
            <h3 className="font-display text-[1.05rem] font-semibold mb-4">Projects by stage</h3>
            <div className="space-y-2.5">
              {stageCounts.map((s) => (
                <div key={s.stage} className="grid grid-cols-[130px_1fr_2rem] items-center gap-3">
                  <span className="text-[0.82rem] text-muted">{s.stage}</span>
                  <div className="h-4 rounded bg-bg overflow-hidden">
                    <div className="h-full bg-accent rounded" style={{ width: `${(s.count / maxStage) * 100}%` }} />
                  </div>
                  <span className="text-[0.85rem] tabular-nums text-right">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Marketing */}
      <section>
        <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-accent mb-4">Marketing</h2>
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="bg-surface border border-rule rounded-lg p-6">
            <h3 className="font-display text-[1.05rem] font-semibold mb-1.5">Recorded metrics</h3>
            <p className="text-muted text-[0.82rem] mb-5">
              Views, reach, engagement, CTR, watch time — record numbers from platform dashboards
              and they chart here and on the client&apos;s portal.
            </p>
            {metricSummaries.length === 0 ? (
              <p className="text-muted text-[0.9rem]">No metrics recorded yet — use the form to log your first.</p>
            ) : (
              <div className="space-y-2.5 mb-6">
                {metricSummaries.map(([name, v]) => (
                  <div key={name} className="grid grid-cols-[130px_1fr_5rem] items-center gap-3">
                    <span className="text-[0.82rem] text-muted capitalize">{name.replace(/_/g, " ")}</span>
                    <div className="h-4 rounded bg-bg overflow-hidden">
                      <div className="h-full bg-accent rounded" style={{ width: `${(v.total / maxMetric) * 100}%` }} />
                    </div>
                    <span className="text-[0.85rem] tabular-nums text-right">{v.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            {marketing.length > 0 && (
              <details>
                <summary className="text-muted text-[0.82rem] cursor-pointer">All entries ({marketing.length})</summary>
                <table className="w-full border-collapse text-[0.85rem] mt-3">
                  <tbody>
                    {marketing.map((m) => (
                      <tr key={m.id} className="border-t border-rule">
                        <td className="py-2 pr-3 capitalize">{m.metric.replace(/_/g, " ")}</td>
                        <td className="py-2 pr-3 text-muted">
                          {(m.clients as unknown as { company: string } | null)?.company ?? "Studio"}
                        </td>
                        <td className="py-2 pr-3 tabular-nums text-accent">{Number(m.value).toLocaleString()}</td>
                        <td className="py-2 pr-3 text-muted">{m.captured_on}</td>
                        <td className="py-2 text-right">
                          <ConfirmDeleteButton
                            action={deleteMetric}
                            args={[m.id]}
                            itemName={`${m.metric.replace(/_/g, " ")} entry`}
                            variant="inline"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>
          <MetricRecorder clients={(clients ?? []).map((c) => ({ id: c.id, company: c.company }))} />
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-rule rounded-md px-5 py-4">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="font-display text-[1.5rem] mt-1">{value}</p>
    </div>
  );
}
