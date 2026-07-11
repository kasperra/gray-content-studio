import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { money } from "@/modules/pricing/data";
import type { LineItem } from "@/modules/pricing/compute";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "Project Proposal",
  robots: { index: false, follow: false },
};

/* Public proposal view — fetched by unguessable public_id via the service role
   (proposals are not publicly readable under RLS). */
async function getProposal(publicId: string) {
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("proposals").select("*").eq("public_id", publicId).single();
  return data;
}

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await getProposal((await params).id);
  if (!p) notFound();

  const items = (p.items as LineItem[]) ?? [];
  const byCat = items.reduce<Record<string, LineItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-svh bg-[#faf8f4] text-[#1c1a17] font-body">
      <article className="max-w-[820px] mx-auto my-0 sm:my-10 bg-white sm:border border-black/10 sm:rounded-xl overflow-hidden sm:shadow-[0_20px_60px_rgba(28,26,23,0.08)] print:my-0 print:border-0 print:shadow-none print:max-w-none">
        {/* Dark branded header */}
        <header className="bg-bg text-ink px-6 sm:px-13 py-12 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
          <p className="font-display text-[0.95rem] font-semibold uppercase tracking-[0.22em]">
            Gray<span className="text-accent">·</span>Content<span className="text-accent">·</span>Studio
          </p>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent mt-10">
            Project Proposal
          </p>
          <h1 className="font-display font-semibold leading-[1.12] text-[clamp(1.9rem,5vw,2.8rem)] mt-2">
            {p.title || "Video Production Proposal"}
          </h1>
          <dl className="flex flex-wrap gap-x-9 gap-y-4 mt-7 text-[0.85rem] text-muted">
            {(p.client_name || p.company) && (
              <div>
                <dt>Prepared for</dt>
                <dd className="text-ink font-medium">
                  {p.client_name}
                  {p.company ? ` · ${p.company}` : ""}
                </dd>
              </div>
            )}
            <div>
              <dt>Date</dt>
              <dd className="text-ink font-medium">
                {new Date(p.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </dd>
            </div>
            {p.valid_until && (
              <div>
                <dt>Valid until</dt>
                <dd className="text-ink font-medium">
                  {new Date(p.valid_until + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </dd>
              </div>
            )}
          </dl>
        </header>

        <div className="px-6 sm:px-13 py-10">
          {p.notes && <p className="text-[#6f6a62] max-w-[60ch] mb-9">{p.notes}</p>}

          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#b5842e] mb-4">
            Included Services
          </p>
          <table className="w-full border-collapse text-[0.93rem]">
            <thead>
              <tr className="text-left text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#6f6a62]">
                <th className="py-2.5 pr-2 border-b-2 border-[#1c1a17]">Service</th>
                <th className="py-2.5 px-2 border-b-2 border-[#1c1a17] text-right hidden sm:table-cell">Unit Price</th>
                <th className="py-2.5 px-2 border-b-2 border-[#1c1a17] text-right">Qty</th>
                <th className="py-2.5 pl-2 border-b-2 border-[#1c1a17] text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCat).map(([cat, catItems]) => (
                <ProposalCategory key={cat} category={cat} items={catItems} />
              ))}
            </tbody>
          </table>

          <div className="ml-auto max-w-[340px] mt-8 text-[0.95rem]">
            <TRow label="Subtotal" value={money(Number(p.subtotal))} />
            {Number(p.rush_amt) > 0 && (
              <TRow label={`${p.rush_name} (+${Number(p.rush_pct)}%)`} value={money(Number(p.rush_amt))} />
            )}
            {Number(p.travel_amt) > 0 && (
              <TRow label={`Travel (${Number(p.travel_miles)} mi)`} value={money(Number(p.travel_amt))} />
            )}
            {Number(p.discount_amt) > 0 && (
              <TRow label="Discount" value={`−${money(Number(p.discount_amt))}`} />
            )}
            <div className="flex justify-between gap-6 border-t-2 border-[#1c1a17] mt-2.5 pt-3 items-baseline">
              <span className="font-semibold text-[1.1rem]">Total Investment</span>
              <span className="font-display text-[1.45rem] text-[#b5842e] tabular-nums">
                {money(Number(p.total))}
              </span>
            </div>
          </div>

          <div className="mt-10 bg-[#faf8f4] border border-black/10 rounded-lg px-7 py-6 flex flex-wrap gap-x-12 gap-y-5">
            <div>
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[#6f6a62]">
                Deposit to book ({Number(p.deposit_pct)}%)
              </span>
              <strong className="block font-display text-[1.3rem] mt-0.5">{money(Number(p.deposit))}</strong>
            </div>
            <div>
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[#6f6a62]">
                Balance on delivery
              </span>
              <strong className="block font-display text-[1.3rem] mt-0.5">{money(Number(p.balance))}</strong>
            </div>
          </div>
        </div>

        <footer className="px-6 sm:px-13 py-8 border-t border-black/10 flex flex-wrap items-center justify-between gap-6">
          <p className="text-[0.85rem] text-[#6f6a62]">
            Gray Content Studio — Video Production · Editing · Animation
          </p>
          <PrintButton />
        </footer>
      </article>
    </div>
  );
}

function ProposalCategory({ category, items }: { category: string; items: LineItem[] }) {
  return (
    <>
      <tr>
        <td colSpan={4} className="font-display text-[1.02rem] font-semibold pt-6 pb-1.5">
          {category}
        </td>
      </tr>
      {items.map((i) => (
        <tr key={i.id} className="border-b border-black/10">
          <td className="py-3 pr-2">
            {i.name}
            <span className="block text-[#6f6a62] text-[0.8rem]">per {i.unit}</span>
          </td>
          <td className="py-3 px-2 text-right tabular-nums hidden sm:table-cell">{money(i.price)}</td>
          <td className="py-3 px-2 text-right tabular-nums">{i.qty}</td>
          <td className="py-3 pl-2 text-right tabular-nums">{money(i.total)}</td>
        </tr>
      ))}
    </>
  );
}

function TRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 py-1.5 text-[#6f6a62] tabular-nums">
      <span>{label}</span>
      <span className="text-[#1c1a17]">{value}</span>
    </div>
  );
}
