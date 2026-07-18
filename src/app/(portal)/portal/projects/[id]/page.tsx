import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { STAGES, stageIndex } from "@/modules/projects/stages";
import { PortalHeader } from "../../PortalHeader";
import { DeliverableList } from "./DeliverableList";

export const metadata: Metadata = {
  title: "Project — Client Portal",
  robots: { index: false, follow: false },
};

export default async function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const supabase = await createSupabaseServer();

  // RLS scopes this query to the client's own projects (admins see all)
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  const [{ data: deliverables }, { data: activities }] = await Promise.all([
    supabase
      .from("deliverables")
      .select("id, title, status, storage_path, review_versions(id)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("activities").select("body, created_at").eq("project_id", id).order("created_at", { ascending: false }).limit(15),
  ]);

  const currentIdx = stageIndex(project.stage);

  return (
    <main className="min-h-svh">
      <PortalHeader email={session.email} />

      <div className="w-[min(1200px,92vw)] mx-auto py-12">
        <Link href="/portal" className="text-muted text-[0.85rem] hover:text-ink transition-colors">
          ← All projects
        </Link>
        <h1 className="font-display font-semibold text-[clamp(1.8rem,4vw,2.6rem)] mt-2">{project.title}</h1>
        {project.description && <p className="text-muted mt-2 max-w-136">{project.description}</p>}
        {project.due_date && <p className="text-muted text-[0.88rem] mt-1">Target delivery: {project.due_date}</p>}

        {/* Stage timeline */}
        <section className="mt-8" aria-label="Production progress">
          <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {STAGES.map((s, i) => (
              <li
                key={s.id}
                className={`rounded-md border px-3 py-2.5 text-[0.78rem] font-semibold ${
                  i < currentIdx
                    ? "border-accent/30 text-accent/70 bg-accent-soft"
                    : i === currentIdx
                      ? "border-accent text-bg bg-accent"
                      : "border-rule text-muted"
                }`}
              >
                <span className="block text-[0.65rem] font-normal opacity-70">Step {i + 1}</span>
                {s.label}
                {i === currentIdx && <span className="block text-[0.65rem] font-normal mt-0.5">← You are here</span>}
              </li>
            ))}
          </ol>
        </section>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 mt-10 items-start">
          <section className="bg-surface border border-rule rounded-lg p-6">
            <h2 className="font-display text-[1.25rem] font-semibold mb-4">Deliverables</h2>
            <DeliverableList
              deliverables={(deliverables ?? []).map((d) => ({
                id: d.id,
                title: d.title,
                status: d.status,
                storagePath: d.storage_path,
                hasReview: ((d.review_versions as unknown as { id: string }[]) ?? []).length > 0,
              }))}
            />
          </section>

          <section className="bg-surface border border-rule rounded-lg p-6">
            <h2 className="font-display text-[1.15rem] font-semibold mb-4">Project Updates</h2>
            {!activities?.length ? (
              <p className="text-muted text-[0.88rem]">No updates yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {activities.map((a, i) => (
                  <li key={i} className="text-[0.86rem] text-muted flex gap-3">
                    <span className="text-accent shrink-0">·</span>
                    <span>
                      {a.body}
                      <span className="block text-[0.73rem] opacity-70">
                        {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
