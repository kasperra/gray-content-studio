import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { money } from "@/modules/pricing/data";
import type { LineItem } from "@/modules/pricing/compute";
import { phasesFor } from "@/modules/proposals/sow-phases";
import { PrintButton } from "@/app/p/[id]/PrintButton";

export const metadata: Metadata = {
  title: "Scope of Work",
  robots: { index: false, follow: false },
};

const dateFmt: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };

export default async function ScopeOfWorkPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data: p } = await supabase.from("proposals").select("*").eq("id", id).single();
  if (!p) notFound();

  const items = (p.items as LineItem[]) ?? [];
  const byCat = items.reduce<Record<string, LineItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const revisionRounds = items.find((i) => i.id === "revision")?.qty ?? 1;
  const phases = phasesFor(Object.keys(byCat));
  const created = new Date(p.created_at);

  return (
    <>
      {/* Admin-only toolbar — never printed */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/admin/proposals"
            className="text-muted text-[0.85rem] hover:text-ink transition-colors"
          >
            ← Proposals
          </Link>
          <h1 className="font-display text-[1.6rem] font-semibold mt-2">Scope of Work</h1>
          <p className="text-muted text-[0.88rem] mt-1">
            Generated from the proposal — print or save as PDF to send for signature.
          </p>
        </div>
        <Link
          href={`/admin/proposals/new?edit=${p.id}`}
          className="rounded-full border border-rule text-[0.8rem] font-semibold uppercase tracking-[0.08em] px-5 py-2 text-muted hover:text-accent hover:border-accent transition-colors"
        >
          Edit Proposal
        </Link>
      </div>

      <article className="bg-white text-[#1c1a17] font-body rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)] print:rounded-none print:shadow-none">
        {/* Dark branded header */}
        <header className="bg-bg text-ink px-6 sm:px-13 py-12 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
          <p className="font-display text-[0.95rem] font-semibold uppercase tracking-[0.22em]">
            Gray<span className="text-accent">·</span>Content<span className="text-accent">·</span>Studio
          </p>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent mt-10">
            Scope of Work
          </p>
          <h2 className="font-display font-semibold leading-[1.12] text-[clamp(1.9rem,5vw,2.8rem)] mt-2">
            {p.title || "Video Production Scope of Work"}
          </h2>
          <dl className="flex flex-wrap gap-x-9 gap-y-4 mt-7 text-[0.85rem] text-muted">
            {(p.client_name || p.company) && (
              <div>
                <dt>Client</dt>
                <dd className="text-ink font-medium">
                  {p.client_name}
                  {p.company ? ` · ${p.company}` : ""}
                </dd>
              </div>
            )}
            <div>
              <dt>Date</dt>
              <dd className="text-ink font-medium">{created.toLocaleDateString("en-US", dateFmt)}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd className="text-ink font-medium tabular-nums">
                SOW-{created.getFullYear()}-{String(p.public_id ?? p.id).slice(0, 6).toUpperCase()}
              </dd>
            </div>
          </dl>
        </header>

        <div className="px-6 sm:px-13 py-10">
          <Section n="1" title="Project Overview">
            <p className="text-[#4a453d] max-w-[68ch]">
              {p.notes ||
                `Gray Content Studio will produce the deliverables listed in this scope of work for ${
                  p.company || p.client_name || "the client"
                }.`}
            </p>
          </Section>

          <Section n="2" title="Deliverables">
            <p className="text-[#6f6a62] text-[0.9rem] max-w-[68ch] mb-5">
              The following is the complete list of work included. Anything not listed here is out of
              scope and quoted separately.
            </p>
            {Object.entries(byCat).map(([cat, catItems]) => (
              <div key={cat} className="mb-6 break-inside-avoid">
                <h4 className="font-display text-[1.02rem] font-semibold border-b border-black/10 pb-1.5 mb-2.5">
                  {cat}
                </h4>
                <ul className="grid gap-1.5">
                  {catItems.map((i) => (
                    <li key={i.id} className="flex justify-between gap-6 text-[0.93rem]">
                      <span>
                        {i.name}
                        <span className="text-[#6f6a62] text-[0.82rem]"> — per {i.unit}</span>
                      </span>
                      <span className="tabular-nums text-[#6f6a62] whitespace-nowrap">
                        ×&nbsp;{i.qty}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>

          <Section n="3" title="Process & Phases">
            <ol className="grid gap-3.5">
              {phases.map((s, i) => (
                <li key={s.title} className="flex gap-3.5 break-inside-avoid">
                  <span className="font-display text-[#b5842e] font-semibold tabular-nums shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.93rem]">
                    <strong className="font-semibold">{s.title}</strong>
                    <span className="block text-[#6f6a62] text-[0.88rem] mt-0.5">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section n="4" title="Investment & Payment Schedule">
            <div className="max-w-[420px] text-[0.95rem]">
              <Row label="Services subtotal" value={money(Number(p.subtotal))} />
              {Number(p.rush_amt) > 0 && (
                <Row
                  label={`${p.rush_name} (+${Number(p.rush_pct)}%)`}
                  value={money(Number(p.rush_amt))}
                />
              )}
              {Number(p.travel_amt) > 0 && (
                <Row label={`Travel (${Number(p.travel_miles)} mi)`} value={money(Number(p.travel_amt))} />
              )}
              {Number(p.discount_amt) > 0 && (
                <Row label="Discount" value={`−${money(Number(p.discount_amt))}`} />
              )}
              <div className="flex justify-between gap-6 border-t-2 border-[#1c1a17] mt-2.5 pt-3 items-baseline">
                <span className="font-semibold">Total project investment</span>
                <span className="font-display text-[1.3rem] text-[#b5842e] tabular-nums">
                  {money(Number(p.total))}
                </span>
              </div>
            </div>
            <div className="mt-6 bg-[#faf8f4] border border-black/10 rounded-lg px-6 py-5 flex flex-wrap gap-x-12 gap-y-4 break-inside-avoid">
              <div>
                <span className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[#6f6a62]">
                  Deposit to book ({Number(p.deposit_pct)}%)
                </span>
                <strong className="block font-display text-[1.25rem] mt-0.5">
                  {money(Number(p.deposit))}
                </strong>
                <span className="block text-[#6f6a62] text-[0.8rem] mt-0.5">
                  Due on signature — reserves production dates
                </span>
              </div>
              <div>
                <span className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[#6f6a62]">
                  Balance
                </span>
                <strong className="block font-display text-[1.25rem] mt-0.5">
                  {money(Number(p.balance))}
                </strong>
                <span className="block text-[#6f6a62] text-[0.8rem] mt-0.5">
                  Due on delivery of final masters
                </span>
              </div>
            </div>
          </Section>

          <Section n="5" title="Assumptions & Exclusions">
            <ul className="grid gap-2 text-[0.91rem] text-[#4a453d] max-w-[68ch]">
              {[
                `Includes ${revisionRounds} round${revisionRounds === 1 ? "" : "s"} of revisions per deliverable. Additional rounds are billed at the rate-card rate.`,
                "Quantities above are the agreed scope. Added deliverables, shoot days, or platforms are quoted as a change order before work begins.",
                "Client provides timely access to locations, participants, brand assets, and approvals. Delays to these may shift the delivery schedule.",
                "Client is responsible for securing rights to any client-supplied footage, music, or logos.",
                "Licensed music and stock are selected from royalty-free libraries unless a specific license is quoted as a line item.",
                "Raw footage and project files are not delivered unless listed as a deliverable above.",
                "Travel beyond the mileage quoted above, permits, talent fees, and paid media spend are not included unless listed.",
                p.valid_until
                  ? `Pricing is valid until ${new Date(p.valid_until + "T00:00:00").toLocaleDateString("en-US", dateFmt)}.`
                  : "Pricing is valid for 30 days from the date above.",
              ].map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span className="text-[#b5842e] shrink-0">—</span>
                  {line}
                </li>
              ))}
            </ul>
          </Section>

          <Section n="6" title="Acceptance">
            <p className="text-[#4a453d] text-[0.91rem] max-w-[68ch] mb-7">
              Signing below confirms the deliverables, investment, and terms in this scope of work.
              Production dates are reserved once the deposit is received.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-9 break-inside-avoid">
              <SignBlock role="Client" name={p.client_name || ""} org={p.company || ""} />
              <SignBlock role="Gray Content Studio" name="Laila Gray" org="Founder & Creative Director" />
            </div>
          </Section>
        </div>

        <footer className="px-6 sm:px-13 py-8 border-t border-black/10 flex flex-wrap items-center justify-between gap-6">
          <p className="text-[0.85rem] text-[#6f6a62]">
            Gray Content Studio — Video Production · Editing · Animation
          </p>
          <PrintButton />
        </footer>
      </article>
    </>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#b5842e] mb-3.5">
        {n}. {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 py-1.5 text-[#6f6a62] tabular-nums">
      <span>{label}</span>
      <span className="text-[#1c1a17]">{value}</span>
    </div>
  );
}

function SignBlock({ role, name, org }: { role: string; name: string; org: string }) {
  return (
    <div>
      <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#6f6a62]">
        {role}
      </span>
      <div className="border-b border-[#1c1a17] mt-9" />
      <span className="block text-[0.82rem] text-[#6f6a62] mt-1.5">
        {name || "Name"}
        {org ? ` · ${org}` : ""}
      </span>
      <div className="border-b border-black/25 mt-8" />
      <span className="block text-[0.82rem] text-[#6f6a62] mt-1.5">Date</span>
    </div>
  );
}
