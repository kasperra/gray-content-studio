import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Wordmark } from "@/components/Nav";
import { SignOutButton } from "./SignOutButton";

export const metadata: Metadata = {
  title: "Client Portal",
  robots: { index: false, follow: false },
};

/* Phase 2 modules land here — this shell gives clients a real login destination on day one. */
const UPCOMING = [
  { title: "Projects & Timeline", text: "Live production status for every project." },
  { title: "Deliverables & Downloads", text: "Review cuts and download final masters." },
  { title: "Proposals & Invoices", text: "Everything commercial, in one place." },
  { title: "Asset Library", text: "Your brand's videos, photos, and files — searchable." },
];

export default async function PortalPage() {
  const session = await requireUser();
  const supabase = await createSupabaseServer();

  let projects: { id: string; title: string; stage: string }[] = [];
  if (session.clientId) {
    const { data } = await supabase
      .from("projects")
      .select("id, title, stage")
      .order("created_at", { ascending: false })
      .limit(10);
    projects = data ?? [];
  }

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
        <p className="text-[0.78rem] font-medium uppercase tracking-[0.32em] text-accent">Client Portal</p>
        <h1 className="font-display font-semibold text-[clamp(1.9rem,4.5vw,3rem)] mt-2">
          Welcome{session.name ? `, ${session.name.split(" ")[0]}` : ""}
        </h1>

        {projects.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-[1.3rem] font-semibold mb-4">Your Projects</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="bg-surface border border-rule rounded-lg p-6">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
                    {p.stage.replace(/_/g, " ")}
                  </span>
                  <p className="font-display text-[1.15rem] font-semibold mt-1.5">{p.title}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <p className="text-muted mt-4 max-w-136">
            Your workspace is ready. As your projects kick off, production status, deliverables,
            and documents will appear here.
          </p>
        )}

        <section className="mt-12">
          <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted mb-4">
            Coming to your portal
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {UPCOMING.map((m) => (
              <div key={m.title} className="border border-rule border-dashed rounded-lg p-6 opacity-70">
                <p className="font-display text-[1.05rem] font-semibold">{m.title}</p>
                <p className="text-muted text-[0.85rem] mt-1.5">{m.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
