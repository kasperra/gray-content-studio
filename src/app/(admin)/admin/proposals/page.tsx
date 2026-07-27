import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { money } from "@/modules/pricing/data";
import { BUNDLES } from "@/modules/pricing/bundles";
import { ProposalRowActions } from "./ProposalRowActions";

export default async function ProposalsPage() {
  const supabase = await createSupabaseServer();
  const { data: proposals } = await supabase
    .from("proposals")
    .select("id, public_id, client_name, company, title, total, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-[1.6rem] font-semibold">Proposals</h1>
        <Link
          href="/admin/proposals/new"
          className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 transition-all hover:bg-transparent hover:text-accent"
        >
          New Proposal
        </Link>
      </div>

      {/* One-click starts from the three public packages */}
      <div className="flex flex-wrap items-center gap-2.5 mb-8">
        <span className="text-muted text-[0.78rem] font-semibold uppercase tracking-[0.14em] mr-1">
          Start from
        </span>
        {BUNDLES.map((b) => (
          <Link
            key={b.id}
            href={`/admin/proposals/new?bundle=${b.id}`}
            className="rounded-full border border-rule text-[0.82rem] font-medium px-4 py-1.5 text-muted hover:text-accent hover:border-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {b.name}
            <span className="text-muted/60"> · {Object.keys(b.selections).length} services</span>
          </Link>
        ))}
      </div>

      {!proposals?.length ? (
        <p className="text-muted">No proposals yet — build your first one.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.92rem]">
            <thead>
              <tr className="text-left text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted border-b border-rule">
                <th className="py-2.5 pr-4">Client / Project</th>
                <th className="py-2.5 pr-4 hidden sm:table-cell">Date</th>
                <th className="py-2.5 pr-4">Total</th>
                <th className="py-2.5 pr-4">Status</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id} className="border-b border-rule align-middle">
                  <td className="py-3.5 pr-4">
                    <span className="font-medium">{p.client_name || "Untitled"}</span>
                    {p.title && <span className="text-muted"> — {p.title}</span>}
                  </td>
                  <td className="py-3.5 pr-4 hidden sm:table-cell text-muted">
                    {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="py-3.5 pr-4 text-accent font-semibold tabular-nums">{money(Number(p.total))}</td>
                  <ProposalRowActions id={p.id} publicId={p.public_id} status={p.status} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
