import { createHmac, timingSafeEqual } from "node:crypto";
import { AwsClient } from "aws4fetch";
import type { SessionInfo } from "@/lib/auth";

/* Private file storage on the VPS: an S3-compatible store (SeaweedFS) that is
   only reachable from inside the server. The browser never talks to it.

   - Uploads go to POST /api/files/upload (admin only) and are streamed through.
   - Downloads use short-lived signed links to /api/files/<bucket>/<path>,
     handed out by getDownloadUrl() only after an access check. Range requests
     pass straight through, so videos seek normally.

   Access rule (same as before): admins read and write everything; a client
   reads only paths under their own `<client_id>/…` prefix. The three "buckets"
   are key prefixes in one S3 bucket. */

export const BUCKETS = ["deliverables", "assets", "documents"] as const;
export type Bucket = (typeof BUCKETS)[number];

export function isBucket(b: string): b is Bucket {
  return (BUCKETS as readonly string[]).includes(b);
}

export function filesConfigured(): boolean {
  return Boolean(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
}

let client: AwsClient | null = null;
function s3(): AwsClient {
  if (!client) {
    client = new AwsClient({
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
      service: "s3",
      region: process.env.S3_REGION ?? "us-east-1",
    });
  }
  return client;
}

/** Path-style object URL: <endpoint>/<bucket>/<prefix>/<path>. */
function objectUrl(bucket: Bucket, path: string): string {
  const base = process.env.S3_ENDPOINT!.replace(/\/+$/, "");
  const key = `${bucket}/${path}`.split("/").map(encodeURIComponent).join("/");
  return `${base}/${process.env.S3_BUCKET}/${key}`;
}

/** Reject anything that could escape the bucket prefix. */
export function validPath(path: string): boolean {
  return Boolean(path) && !path.startsWith("/") && !path.split("/").some((seg) => seg === "" || seg === "." || seg === "..");
}

export function canRead(session: SessionInfo, path: string): boolean {
  if (session.role === "admin") return true;
  return Boolean(session.clientId) && path.split("/")[0] === session.clientId;
}

export async function putObject(
  bucket: Bucket,
  path: string,
  body: ReadableStream<Uint8Array> | Uint8Array,
  contentType: string,
  contentLength: number | null
): Promise<void> {
  const headers: Record<string, string> = {
    "content-type": contentType || "application/octet-stream",
    // Streamed bodies can't be hashed up front.
    "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
  };
  if (contentLength !== null) headers["content-length"] = String(contentLength);
  const req = await s3().sign(objectUrl(bucket, path), { method: "PUT", headers });
  const res = await fetch(req.url, {
    method: "PUT",
    headers: req.headers,
    body: body as BodyInit,
    // Required by Node's fetch for a streamed request body.
    ...({ duplex: "half" } as object),
  });
  if (!res.ok) throw new Error(`Storage upload failed (${res.status}): ${await res.text().catch(() => "")}`);
}

export async function getObject(bucket: Bucket, path: string, range: string | null): Promise<Response> {
  const headers: Record<string, string> = { "x-amz-content-sha256": "UNSIGNED-PAYLOAD" };
  if (range) headers.range = range;
  const req = await s3().sign(objectUrl(bucket, path), { method: "GET", headers });
  return fetch(req.url, { method: "GET", headers: req.headers });
}

/** Best-effort delete; a missing object is not an error. */
export async function removeObjects(bucket: Bucket, paths: string[]): Promise<void> {
  if (!filesConfigured()) return;
  await Promise.all(
    paths.filter(validPath).map(async (p) => {
      try {
        const req = await s3().sign(objectUrl(bucket, p), {
          method: "DELETE",
          headers: { "x-amz-content-sha256": "UNSIGNED-PAYLOAD" },
        });
        await fetch(req.url, { method: "DELETE", headers: req.headers });
      } catch (e) {
        console.error("[files] delete failed", bucket, p, e);
      }
    })
  );
}

// ---------- signed download links ----------

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function signature(bucket: string, path: string, exp: number): string {
  return createHmac("sha256", secret()).update(`${bucket}\n${path}\n${exp}`).digest("base64url");
}

/** A link to /api/files/... that works until `ttlSeconds` from now. */
export function signedFileUrl(bucket: Bucket, path: string, ttlSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `/api/files/${bucket}/${encoded}?exp=${exp}&sig=${signature(bucket, path, exp)}`;
}

export function verifyFileSignature(bucket: string, path: string, exp: string | null, sig: string | null): boolean {
  if (!exp || !sig) return false;
  const e = Number(exp);
  if (!Number.isFinite(e) || e < Date.now() / 1000) return false;
  const want = Buffer.from(signature(bucket, path, e));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}
