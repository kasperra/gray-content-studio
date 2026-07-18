import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { computeFollowUps } from "@/modules/crm/actions";
import { money } from "@/modules/pricing/data";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServer();

  const [
    { data: leads },
    { data: proposals },
    { count: activeProjects },
    { data: invoices },
    { data: activities },
    followUps,
  ] = await Promise.all([
    supabase.from("leads").select("id, status"),
    supabase.from("proposals").select("total, status"),
    supabase.from("projects").select("id", { count: "exact", head: true }).neq("stage", "completed"),
    supabase.from("invoices").select("amount, status"),
    supabase.from("activities").select("body, kind, created_at").order("created_at", { ascending: false }).limit(15),
    computeFollowUps(),
  ]);

  const newLeads = (leads ?? []).filter((l) => l.status === "new").length;
  const sentValue = (proposals ?? []).filter((p) => p.status === "sent").reduce((s, p) => s + Number(p.total || 0), 0);
  const acceptedValue = (proposals ?? []).filter((p) => p.status === "accepted").reduce((s, p) => s + Number(p.total || 0), 0);
  const outstanding = (invoices ?? []).filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + Number(i.amount || 0), 0);

  return (
    <>
      <h1 className="font-display text-[1.6rem] font-semibold mb-6">Studio Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <Stat label="New Leads" value={String(newLeads)} href="/admin/crm" />
        <Stat label="Active Projects" value={String(activeProjects ?? 0)} href="/admin/clients" />
        <Stat label="Proposals Out" value={money(sentValue)} href="/admin/proposals" />
        <Stat label="Won" value={money(acceptedValue)} href="/admin/proposals" />
        <Stat label="Invoices Outstanding" value={money(outstanding)} href="/admin/invoices" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <section className="bg-surface border border-rule rounded-lg p-6">
          <h2 className="font-display text-[1.25rem] font-semibold mb-1.5">Follow-ups Needed</h2>
          <p className="text-muted text-[0.82rem] mb-4">
            Computed automatically — stale leads, quiet proposals, and overdue invoices.
          </p>
          {!followUps.length ? (
            <p className="text-[#8ec98e] text-[0.92rem]">All caught up — nothing needs a nudge. 🎉</p>
          ) : (
            <ul className="space-y-3">
              {followUps.map((f, i) => (
                <li key={i}>
                  <Link
                    href={f.href}
                    className="block border border-rule rounded-md px-4 py-3 hover:border-accent/60 transition-colors"
                  >
                    <span className="flex items-center gap-2.5 font-medium text-[0.92rem]">
                      <span aria-hidden="true">
                        {f.kind === "overdue_invoice" ? "🔴" : f.kind === "quiet_proposal" ? "🟡" : "🔵"}
                      </span>
                      {f.label}
                    </span>
                    <span className="block text-muted text-[0.82rem] mt-1">{f.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface border border-rule rounded-lg p-6">
          <h2 className="font-display text-[1.25rem] font-semibold mb-4">Recent Activity</h2>
          {!activities?.length ? (
            <p className="text-muted text-[0.9rem]">
              Notes, stage changes, and system events will appear here.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {activities.map((a, i) => (
                <li key={i} className="text-[0.88rem] text-muted flex gap-3">
                  <span className="text-accent shrink-0">{a.kind === "note" ? "✎" : "·"}</span>
                  <span>
                    {a.body}
                    <span className="block text-[0.75rem] opacity-70">
                      {new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="bg-surface border border-rule rounded-md px-4 py-3.5 sm:px-5 sm:py-4 hover:border-accent/60 transition-colors">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="font-display text-[1.2rem] sm:text-[1.45rem] tabular-nums mt-1 break-words">{value}</p>
    </Link>
  );
}
