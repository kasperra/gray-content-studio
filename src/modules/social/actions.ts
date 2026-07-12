"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "@/lib/auth";
import type { PostStatus } from "./platforms";

function refreshSocial() {
  revalidatePath("/admin/social");
  revalidatePath("/portal/social");
}

export type SocialPostInput = {
  clientId: string;
  platforms: string[];
  caption: string;
  hashtags: string;
  mediaPaths: string[];
  scheduledFor: string | null; // ISO or null
  status: PostStatus;
};

/** Create or update a post. Admins act on any client; clients only on their own
    (enforced by RLS — the user-scoped Supabase client rejects foreign client_ids). */
export async function saveSocialPost(
  input: SocialPostInput,
  existingId?: string
): Promise<{ ok: boolean; id?: string; message: string }> {
  const session = await requireUser();
  const clientId = session.role === "admin" ? input.clientId : session.clientId;
  if (!clientId) return { ok: false, message: "No client selected." };
  if (!input.caption.trim() && !input.platforms.length)
    return { ok: false, message: "Add a caption or pick a platform first." };

  const supabase = await createSupabaseServer();
  const row = {
    client_id: clientId,
    platforms: input.platforms,
    caption: input.caption,
    hashtags: input.hashtags,
    media_paths: input.mediaPaths,
    scheduled_for: input.scheduledFor,
    status: input.status,
  };

  if (existingId) {
    const { error } = await supabase.from("social_posts").update(row).eq("id", existingId);
    if (error) return { ok: false, message: "Could not update the post." };
    refreshSocial();
    return { ok: true, id: existingId, message: "Post updated." };
  }

  const { data, error } = await supabase.from("social_posts").insert(row).select("id").single();
  if (error) return { ok: false, message: "Could not save the post." };
  refreshSocial();
  return { ok: true, id: data.id, message: "Post saved." };
}

export async function setSocialPostStatus(postId: string, status: PostStatus) {
  await requireUser();
  const supabase = await createSupabaseServer();
  await supabase.from("social_posts").update({ status }).eq("id", postId);
  refreshSocial();
}

export async function deleteSocialPost(postId: string) {
  await requireUser();
  const supabase = await createSupabaseServer();
  await supabase.from("social_posts").delete().eq("id", postId);
  refreshSocial();
}

/* ---------- Content templates ---------- */

export async function saveTemplate(
  input: { kind: string; name: string; body: string; clientId?: string | null },
  existingId?: string
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!input.name.trim() || !input.body.trim())
    return { ok: false, message: "Template needs a name and body." };
  const supabase = await createSupabaseServer();
  const row = {
    kind: input.kind,
    name: input.name.trim(),
    body: input.body,
    client_id: input.clientId ?? null,
  };
  const { error } = existingId
    ? await supabase.from("content_templates").update(row).eq("id", existingId)
    : await supabase.from("content_templates").insert(row);
  if (error) return { ok: false, message: "Could not save the template." };
  revalidatePath("/admin/templates");
  refreshSocial();
  return { ok: true, message: existingId ? "Template updated." : "Template created." };
}

export async function deleteTemplate(templateId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("content_templates").delete().eq("id", templateId);
  revalidatePath("/admin/templates");
  refreshSocial();
}

/* ---------- Analytics ---------- */

export async function recordMetric(input: {
  clientId: string | null;
  module: "production" | "marketing" | "website";
  metric: string;
  value: number;
  capturedOn: string;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!input.metric.trim() || isNaN(input.value))
    return { ok: false, message: "Metric name and a numeric value are required." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("metric_snapshots").insert({
    client_id: input.clientId,
    module: input.module,
    metric: input.metric.trim().toLowerCase().replace(/\s+/g, "_"),
    value: input.value,
    captured_on: input.capturedOn || new Date().toISOString().slice(0, 10),
  });
  if (error) return { ok: false, message: "Could not record the metric." };
  revalidatePath("/admin/analytics");
  revalidatePath("/portal");
  return { ok: true, message: "Metric recorded." };
}

export async function deleteMetric(metricId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("metric_snapshots").delete().eq("id", metricId);
  revalidatePath("/admin/analytics");
}
