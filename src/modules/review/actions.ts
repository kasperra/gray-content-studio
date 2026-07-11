"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "@/lib/auth";

function refreshReview(deliverableId: string) {
  revalidatePath(`/review/${deliverableId}`);
  revalidatePath("/portal");
}

/** Admin uploads a new cut — version number auto-increments per deliverable. */
export async function addReviewVersion(input: {
  deliverableId: string;
  storagePath: string;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const supabase = await createSupabaseServer();

  const { data: deliverable } = await supabase
    .from("deliverables")
    .select("id, title, project_id, projects(client_id, title)")
    .eq("id", input.deliverableId)
    .single();
  if (!deliverable) return { ok: false, message: "Deliverable not found." };

  const { data: latest } = await supabase
    .from("review_versions")
    .select("version")
    .eq("deliverable_id", input.deliverableId)
    .order("version", { ascending: false })
    .limit(1);
  const nextVersion = (latest?.[0]?.version ?? 0) + 1;

  const { error } = await supabase.from("review_versions").insert({
    deliverable_id: input.deliverableId,
    version: nextVersion,
    storage_path: input.storagePath,
    status: "in_review",
  });
  if (error) return { ok: false, message: "Could not create the review version." };

  await supabase.from("deliverables").update({ status: "in_review" }).eq("id", input.deliverableId);

  const project = deliverable.projects as unknown as { client_id: string; title: string } | null;
  if (project) {
    await supabase.from("activities").insert({
      client_id: project.client_id,
      project_id: deliverable.project_id,
      kind: "system",
      body: `"${deliverable.title}" — Version ${nextVersion} is ready for your review.`,
    });
  }

  refreshReview(input.deliverableId);
  revalidatePath(`/admin/projects/${deliverable.project_id}`);
  return { ok: true, message: `Version ${nextVersion} uploaded and ready for review.` };
}

/** Both roles comment; RLS enforces access (clients only on their own projects). */
export async function addReviewComment(input: {
  versionId: string;
  deliverableId: string;
  body: string;
  timestampSeconds: number | null;
}): Promise<{ ok: boolean; message: string }> {
  const session = await requireUser();
  if (!input.body.trim()) return { ok: false, message: "Write a comment first." };
  const supabase = await createSupabaseServer();

  const { error } = await supabase.from("review_comments").insert({
    version_id: input.versionId,
    author: session.userId,
    body: input.body.trim(),
    timestamp_seconds: input.timestampSeconds,
  });
  if (error) return { ok: false, message: "Could not post the comment." };
  refreshReview(input.deliverableId);
  return { ok: true, message: "Comment posted." };
}

export async function toggleCommentResolved(commentId: string, deliverableId: string, resolved: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("review_comments").update({ resolved }).eq("id", commentId);
  refreshReview(deliverableId);
}

/** Approve / request changes. Clients act on their own projects (verified through
    an RLS-scoped read, then applied with the service role since clients have no
    UPDATE policy on review_versions). */
export async function setVersionStatus(input: {
  versionId: string;
  deliverableId: string;
  status: "approved" | "changes_requested";
}): Promise<{ ok: boolean; message: string }> {
  const session = await requireUser();
  const supabase = await createSupabaseServer();

  // RLS-scoped: returns a row only if this user may see this version
  const { data: version } = await supabase
    .from("review_versions")
    .select("id, version, deliverables(id, title, project_id, projects(client_id, title))")
    .eq("id", input.versionId)
    .single();
  if (!version) return { ok: false, message: "Version not found." };

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("review_versions")
    .update({ status: input.status })
    .eq("id", input.versionId);
  if (error) return { ok: false, message: "Could not update the version." };

  const deliverable = version.deliverables as unknown as {
    id: string;
    title: string;
    project_id: string;
    projects: { client_id: string; title: string } | null;
  } | null;

  if (deliverable) {
    await admin
      .from("deliverables")
      .update({ status: input.status === "approved" ? "approved" : "in_review" })
      .eq("id", deliverable.id);

    if (deliverable.projects) {
      const who = session.role === "admin" ? "The studio" : session.name || "The client";
      await admin.from("activities").insert({
        client_id: deliverable.projects.client_id,
        project_id: deliverable.project_id,
        kind: "status_change",
        body:
          input.status === "approved"
            ? `${who} approved "${deliverable.title}" (Version ${version.version}). 🎉`
            : `${who} requested changes on "${deliverable.title}" (Version ${version.version}).`,
      });
    }
    revalidatePath(`/admin/projects/${deliverable.project_id}`);
  }

  refreshReview(input.deliverableId);
  return {
    ok: true,
    message: input.status === "approved" ? "Version approved." : "Changes requested — the studio has been notified.",
  };
}
