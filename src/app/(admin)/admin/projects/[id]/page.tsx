import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { deleteProject } from "@/modules/projects/actions";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { ProjectManager } from "./ProjectManager";

export default async function AdminProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data: project } = await supabase
    .from("projects")
    .select("*, clients(id, company)")
    .eq("id", id)
    .single();
  if (!project) notFound();

  const [{ data: deliverables }, { data: activities }] = await Promise.all([
    supabase.from("deliverables").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("activities").select("body, created_at").eq("project_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  const client = project.clients as { id: string; company: string } | null;

  return (
    <>
      <Link
        href={client ? `/admin/clients/${client.id}` : "/admin/clients"}
        className="text-muted text-[0.85rem] hover:text-ink transition-colors"
      >
        ← {client?.company ?? "Clients"}
      </Link>
      <ProjectManager
        project={{
          id: project.id,
          title: project.title,
          stage: project.stage,
          description: project.description,
          dueDate: project.due_date,
          clientId: project.client_id,
        }}
        deliverables={(deliverables ?? []).map((d) => ({
          id: d.id,
          title: d.title,
          status: d.status,
          storagePath: d.storage_path,
        }))}
        activities={(activities ?? []).map((a) => ({
          body: a.body ?? "",
          createdAt: a.created_at,
        }))}
      />

      <div className="mt-10 pt-6 border-t border-rule flex items-center gap-3 flex-wrap">
        <span className="text-muted text-[0.85rem]">
          Delete this project — its deliverables and files are removed permanently.
        </span>
        <ConfirmDeleteButton
          action={deleteProject}
          args={[project.id]}
          itemName={project.title}
          variant="inline"
          redirectTo={client ? `/admin/clients/${client.id}` : "/admin/clients"}
        />
      </div>
    </>
  );
}
