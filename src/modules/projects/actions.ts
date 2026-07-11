"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { stageLabel, type StageId } from "./stages";

function refresh(projectId?: string) {
  revalidatePath("/admin/projects");
  if (projectId) revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/portal");
}

export async function createProject(input: {
  clientId: string;
  title: string;
  description?: string;
  dueDate?: string;
}): Promise<{ ok: boolean; id?: string; message: string }> {
  await requireAdmin();
  if (!input.clientId || !input.title.trim())
    return { ok: false, message: "Client and title are required." };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: input.clientId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      due_date: input.dueDate || null,
      stage: "lead",
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: "Could not create the project." };

  await supabase.from("activities").insert({
    client_id: input.clientId,
    project_id: data.id,
    kind: "system",
    body: `Project "${input.title.trim()}" created.`,
  });

  refresh(data.id);
  revalidatePath(`/admin/clients/${input.clientId}`);
  return { ok: true, id: data.id, message: "Project created." };
}

export async function updateProjectStage(projectId: string, stage: StageId) {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  const { data: project } = await supabase
    .from("projects")
    .update({ stage })
    .eq("id", projectId)
    .select("client_id, title")
    .single();

  if (project) {
    await supabase.from("activities").insert({
      client_id: project.client_id,
      project_id: projectId,
      kind: "status_change",
      body: `"${project.title}" moved to ${stageLabel(stage)}.`,
    });
  }
  refresh(projectId);
}

export async function addDeliverable(input: {
  projectId: string;
  title: string;
  storagePath: string | null;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!input.title.trim()) return { ok: false, message: "Deliverable needs a title." };
  const supabase = await createSupabaseServer();

  const { data: project } = await supabase
    .from("projects")
    .select("client_id, title")
    .eq("id", input.projectId)
    .single();
  if (!project) return { ok: false, message: "Project not found." };

  const { error } = await supabase.from("deliverables").insert({
    project_id: input.projectId,
    title: input.title.trim(),
    storage_path: input.storagePath,
    status: input.storagePath ? "in_review" : "pending",
  });
  if (error) return { ok: false, message: "Could not add the deliverable." };

  await supabase.from("activities").insert({
    client_id: project.client_id,
    project_id: input.projectId,
    kind: "system",
    body: `New deliverable on "${project.title}": ${input.title.trim()}.`,
  });

  refresh(input.projectId);
  return { ok: true, message: "Deliverable added." };
}

export async function setDeliverableStatus(
  deliverableId: string,
  projectId: string,
  status: "pending" | "in_review" | "approved" | "delivered"
) {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("deliverables").update({ status }).eq("id", deliverableId);
  refresh(projectId);
}

export async function deleteDeliverable(deliverableId: string, projectId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  const { data: d } = await supabase
    .from("deliverables")
    .select("storage_path")
    .eq("id", deliverableId)
    .single();
  if (d?.storage_path) {
    await supabase.storage.from("deliverables").remove([d.storage_path]);
  }
  await supabase.from("deliverables").delete().eq("id", deliverableId);
  refresh(projectId);
}

export async function addDocument(input: {
  clientId: string;
  projectId?: string;
  kind: "contract" | "invoice";
  title: string;
  storagePath: string;
  amount?: number;
  dueDate?: string;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!input.title.trim()) return { ok: false, message: "Document needs a title." };
  const supabase = await createSupabaseServer();

  if (input.kind === "contract") {
    const { error } = await supabase.from("contracts").insert({
      client_id: input.clientId,
      title: input.title.trim(),
      storage_path: input.storagePath,
      status: "sent",
    });
    if (error) return { ok: false, message: "Could not save the contract." };
  } else {
    const { error } = await supabase.from("invoices").insert({
      client_id: input.clientId,
      number: input.title.trim(),
      amount: input.amount ?? 0,
      due_date: input.dueDate || null,
      status: "sent",
    });
    if (error) return { ok: false, message: "Could not save the invoice." };
  }

  await supabase.from("activities").insert({
    client_id: input.clientId,
    project_id: input.projectId ?? null,
    kind: "system",
    body: `New ${input.kind}: ${input.title.trim()}.`,
  });

  refresh(input.projectId);
  revalidatePath(`/admin/clients/${input.clientId}`);
  return { ok: true, message: `${input.kind === "contract" ? "Contract" : "Invoice"} saved.` };
}
