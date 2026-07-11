"use client";

import { createSupabaseBrowser } from "./supabase/client";

/** Upload a file from the browser (admin session) into a client-scoped folder.
    Paths follow `<client_id>/...` — the storage RLS policies key off that first segment. */
export async function uploadClientFile(
  bucket: "deliverables" | "documents" | "assets",
  clientId: string,
  file: File,
  subfolder?: string
): Promise<{ path: string | null; error: string | null }> {
  const supabase = createSupabaseBrowser();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = [clientId, subfolder, `${Date.now()}-${safeName}`].filter(Boolean).join("/");
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

/** Short-lived signed URL for downloading a private file (works for any user whose
    RLS lets them read the object). */
export async function getDownloadUrl(
  bucket: "deliverables" | "documents" | "assets",
  path: string
): Promise<string | null> {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
