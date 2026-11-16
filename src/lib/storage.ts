"use client";

import { getDownloadUrls } from "@/modules/files/actions";

type Bucket = "deliverables" | "documents" | "assets";

/** Upload a file from the browser (admin session) into a client-scoped folder.
    Paths follow `<client_id>/...` — client read access keys off that first
    segment, so never break that convention or clients lose their own files. */
export async function uploadClientFile(
  bucket: Bucket,
  clientId: string,
  file: File,
  subfolder?: string
): Promise<{ path: string | null; error: string | null }> {
  const qs = new URLSearchParams({ bucket, clientId, subfolder: subfolder ?? "", name: file.name });
  try {
    const res = await fetch(`/api/files/upload?${qs}`, {
      method: "POST",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: file,
    });
    const json = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
    if (!res.ok || !json.path) return { path: null, error: json.error ?? `Upload failed (${res.status})` };
    return { path: json.path, error: null };
  } catch (e) {
    return { path: null, error: e instanceof Error ? e.message : "Upload failed" };
  }
}

/** Short-lived link for downloading a private file (only if the viewer may read it). */
export async function getDownloadUrl(bucket: Bucket, path: string, ttlSeconds = 600): Promise<string | null> {
  const [url] = await getDownloadUrls(bucket, [path], ttlSeconds);
  return url ?? null;
}
