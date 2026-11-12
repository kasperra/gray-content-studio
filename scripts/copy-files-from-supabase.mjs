// One-time copy of every file in the old Supabase Storage buckets
// (deliverables, assets, documents) into VPS storage, keeping the same paths.
// Read-only on the source. Safe to re-run: files already copied with the same
// size are skipped, so an interrupted run just continues.
//
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   the old project (read only)
//   S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY   the VPS store
//
// Usage: node scripts/copy-files-from-supabase.mjs [--dry-run]
import { AwsClient } from "aws4fetch";

const need = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY", "S3_SECRET_KEY"];
for (const k of need) if (!process.env[k]) throw new Error(`set ${k}`);
const dry = process.argv.includes("--dry-run");
const SB = process.env.SUPABASE_URL.replace(/\/+$/, "");
const auth = { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: process.env.SUPABASE_SERVICE_ROLE_KEY };
const s3 = new AwsClient({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  service: "s3",
  region: process.env.S3_REGION ?? "us-east-1",
});
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const s3url = (bucket, path) => `${process.env.S3_ENDPOINT.replace(/\/+$/, "")}/${process.env.S3_BUCKET}/${bucket}/${enc(path)}`;

async function list(bucket, prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${SB}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
    });
    if (!res.ok) throw new Error(`list ${bucket}/${prefix}: ${res.status} ${await res.text()}`);
    const items = await res.json();
    for (const it of items) {
      const full = prefix ? `${prefix}/${it.name}` : it.name;
      if (it.id === null) out.push(...(await list(bucket, full))); // a folder
      else out.push({ path: full, size: it.metadata?.size ?? null, type: it.metadata?.mimetype ?? "application/octet-stream" });
    }
    if (items.length < 1000) return out;
  }
}

async function existingSize(bucket, path) {
  const req = await s3.sign(s3url(bucket, path), { method: "HEAD", headers: { "x-amz-content-sha256": "UNSIGNED-PAYLOAD" } });
  const res = await fetch(req.url, { method: "HEAD", headers: req.headers });
  return res.ok ? Number(res.headers.get("content-length")) : null;
}

let copied = 0, skipped = 0, failed = 0, bytes = 0;
for (const bucket of ["deliverables", "assets", "documents"]) {
  const files = await list(bucket);
  const total = files.reduce((s, f) => s + (f.size ?? 0), 0);
  console.log(`${bucket}: ${files.length} files, ${(total / 1e6).toFixed(1)} MB`);
  if (dry) continue;
  for (const f of files) {
    try {
      if (f.size !== null && (await existingSize(bucket, f.path)) === f.size) {
        skipped++;
        continue;
      }
      const src = await fetch(`${SB}/storage/v1/object/${bucket}/${enc(f.path)}`, { headers: auth });
      if (!src.ok) throw new Error(`download ${src.status}`);
      const len = src.headers.get("content-length");
      const headers = { "content-type": f.type, "x-amz-content-sha256": "UNSIGNED-PAYLOAD" };
      if (len) headers["content-length"] = len;
      const req = await s3.sign(s3url(bucket, f.path), { method: "PUT", headers });
      const put = await fetch(req.url, { method: "PUT", headers: req.headers, body: src.body, duplex: "half" });
      if (!put.ok) throw new Error(`upload ${put.status} ${await put.text()}`);
      copied++;
      bytes += Number(len ?? f.size ?? 0);
      console.log(`  copied ${bucket}/${f.path}`);
    } catch (e) {
      failed++;
      console.error(`  FAILED ${bucket}/${f.path}: ${e.message}`);
    }
  }
}
console.log(`done: ${copied} copied (${(bytes / 1e6).toFixed(1)} MB), ${skipped} already there, ${failed} failed`);
if (failed) process.exitCode = 1;
