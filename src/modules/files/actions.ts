"use server";

import { getSession } from "@/lib/auth";
import { canRead, isBucket, signedFileUrl, validPath } from "@/lib/files/server";

/** Short-lived links to private files, for whoever is allowed to read them:
    admins any file, clients only files under their own `<client_id>/` prefix.
    Entries the caller can't read come back as null. */
export async function getDownloadUrls(bucket: string, paths: string[], ttlSeconds = 600): Promise<(string | null)[]> {
  const session = await getSession();
  if (!session || !isBucket(bucket)) return paths.map(() => null);
  const ttl = Math.min(Math.max(60, ttlSeconds), 60 * 60 * 6);
  return paths.map((p) => (validPath(p) && canRead(session, p) ? signedFileUrl(bucket, p, ttl) : null));
}
