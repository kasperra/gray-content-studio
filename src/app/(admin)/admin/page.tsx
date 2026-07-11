import { createSupabaseServer } from "@/lib/supabase/server";
import { LeadRow } from "./LeadRow";

export default async function AdminLeadsPage() {
  const supabase = await createSupabaseServer();

  const [{ data: leads }, { count: proposalCount }, { data: accepted }] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("proposals").select("id", { count: "exact", head: true }),
    supabase.from("proposals").select("total").eq("status", "accepted"),
  ]);

  const pipeline = (accepted ?? []).reduce((s, p) => s + Number(p.total || 0), 0);
  const newLeads = (leads ?? []).filter((l) => l.status === "new").length;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat label="New Leads" value={String(newLeads)} />
        <Stat label="Total Leads" value={String(leads?.length ?? 0)} />
        <Stat label="Proposals" value={String(proposalCount ?? 0)} />
        <Stat label="Accepted Value" value={`$${Math.round(pipeline).toLocaleString("en-US")}`} />
      </div>

      <h1 className="font-display text-[1.6rem] font-semibold mb-5">Leads Inbox</h1>
      {!leads?.length ? (
        <p className="text-muted">
          No leads yet — submissions from the website contact form will appear here automatically.
        </p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-rule rounded-md px-5 py-4">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="font-display text-[1.6rem] mt-1">{value}</p>
    </div>
  );
}
