import { createSupabaseServer } from "@/lib/supabase/server";
import { PipelineBoard } from "./PipelineBoard";

export default async function CrmPage() {
  const supabase = await createSupabaseServer();
  const [{ data: leads }, { data: notes }] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(300),
    supabase
      .from("activities")
      .select("lead_id, body, kind, created_at")
      .not("lead_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const notesByLead: Record<string, { body: string; kind: string; createdAt: string }[]> = {};
  for (const n of notes ?? []) {
    if (!n.lead_id) continue;
    (notesByLead[n.lead_id] ??= []).push({ body: n.body ?? "", kind: n.kind, createdAt: n.created_at });
  }

  return (
    <>
      <h1 className="font-display text-[1.6rem] font-semibold mb-6">Lead Pipeline</h1>
      <PipelineBoard
        leads={(leads ?? []).map((l) => ({
          id: l.id,
          name: l.name,
          email: l.email,
          company: l.company,
          projectType: l.project_type,
          message: l.message,
          status: l.status,
          clientId: l.client_id,
          createdAt: l.created_at,
          notes: notesByLead[l.id] ?? [],
        }))}
      />
    </>
  );
}
