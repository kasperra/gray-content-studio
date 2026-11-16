import { NextResponse, type NextRequest } from "next/server";
import { getObject, isBucket, validPath, verifyFileSignature } from "@/lib/files/server";

/** Serves a private file from VPS storage to a holder of a signed link (see
    getDownloadUrl). Range requests pass through so video playback can seek. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string; path: string[] }> }
) {
  const { bucket, path: segments } = await params;
  const path = segments.map((s) => decodeURIComponent(s)).join("/");
  const sp = request.nextUrl.searchParams;
  if (!isBucket(bucket) || !validPath(path) || !verifyFileSignature(bucket, path, sp.get("exp"), sp.get("sig"))) {
    return new NextResponse("Link expired or invalid", { status: 403 });
  }

  const upstream = await getObject(bucket, path, request.headers.get("range"));
  if (upstream.status === 404) return new NextResponse("Not found", { status: 404 });
  if (!upstream.ok && upstream.status !== 206) return new NextResponse("Storage error", { status: 502 });

  const headers = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "private, max-age=600");
  if (sp.get("download") === "1") {
    const name = path.split("/").pop() ?? "file";
    headers.set("content-disposition", `attachment; filename="${name.replace(/"/g, "")}"`);
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
