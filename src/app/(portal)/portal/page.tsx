import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Wordmark } from "@/components/Nav";
import { STAGES, stageIndex, stageLabel } from "@/modules/projects/stages";
import { SignOutButton } from "./SignOutButton";

export const metadata: Metadata = {
  title: "Client Portal",
  robots: { index: false, follow: false },
};

export default async function PortalPage() {
  const session = await requireUser();
  const supabase = await createSupabaseServer();

  const [{ data: projects }, { data: activities }, { data: invoices }] = await Promise.all([
    supabase.from("projects").select("id, title, stage, due_date").order("created_at", { ascending: false }),
    supabase.from("activities").select("body, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("invoices").select("number, amount, status, due_date").order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <main className="min-h-svh">
      <header className="h-[76px] flex items-center border-b border-rule">
        <div className="w-[min(1200px,92vw)] mx-auto flex items-center justify-between gap-6">
          <Wordmark />
          <div className="flex items-center gap-5">
            <span className="text-muted text-[0.85rem] hidden sm:inline">{session.email}</span>
            {session.role === "admin" && (
              <Link href="/admin" className="text-accent text-[0.85rem] font-semibold hover:underline underline-offset-4">
                Studio Admin →
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="w-[min(1200px,92vw)] mx-auto py-14">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[0.78rem] font-medium uppercase tracking-[0.32em] text-accent">Client Portal</p>
            <h1 className="font-display font-semibold text-[clamp(1.9rem,4.5vw,3rem)] mt-2">
              Welcome{session.name ? `, ${session.name.split(" ")[0]}` : ""}
            </h1>
          </div>
          <Link
            href="/portal/assets"
            className="rounded-full border border-accent/50 text-accent font-semibold uppercase text-[0.8rem] tracking-[0.08em] px-5 py-2.5 hover:bg-accent hover:text-bg transition-colors"
          >
            Asset Library →
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 mt-10 items-start">
          <section>
            <h2 className="font-display text-[1.3rem] font-semibold mb-4">Your Projects</h2>
            {!projects?.length ? (
              <p className="text-muted max-w-136">
                Your workspace is ready. As your projects kick off, production status, deliverables,
                and documents will appear here.
              </p>
            ) : (
              <div className="space-y-4">
                {projects.map((p) => {
                  const idx = stageIndex(p.stage);
                  const pct = Math.round((idx / (STAGES.length - 1)) * 100);
                  return (
                    <Link
                      key={p.id}
                      href={`/portal/projects/${p.id}`}
                      className="block bg-surface border border-rule rounded-lg p-6 hover:border-accent/60 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <p className="font-display text-[1.2rem] font-semibold">{p.title}</p>
                        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-accent">
                          {stageLabel(p.stage)}
                        </span>
                      </div>
                      <div className="mt-4 h-1.5 rounded-full bg-bg overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.title} progress`}>
                        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.max(pct, 4)}%` }} />
                      </div>
                      <div className="flex justify-between mt-2 text-[0.78rem] text-muted">
                        <span>{pct}% through production</span>
                        {p.due_date && <span>Due {p.due_date}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="bg-surface border border-rule rounded-lg p-6">
              <h2 className="font-display text-[1.15rem] font-semibold mb-4">Recent Updates</h2>
              {!activities?.length ? (
                <p className="text-muted text-[0.88rem]">Updates about your projects will appear here.</p>
              ) : (
                <ul className="space-y-2.5">
                  {activities.map((a, i) => (
                    <li key={i} className="text-[0.86rem] text-muted flex gap-3">
                      <span className="text-accent shrink-0">·</span>
                      <span>
                        {a.body}
                        <span className="block text-[0.73rem] opacity-70">
                          {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {invoices && invoices.length > 0 && (
              <section className="bg-surface border border-rule rounded-lg p-6">
                <h2 className="font-display text-[1.15rem] font-semibold mb-4">Invoices</h2>
                <ul className="space-y-2 text-[0.88rem]">
                  {invoices.map((inv, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>{inv.number}</span>
                      <span className="text-muted">
                        ${Number(inv.amount).toLocaleString()} ·{" "}
                        <span className={inv.status === "paid" ? "text-[#8ec98e]" : ""}>{inv.status}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
