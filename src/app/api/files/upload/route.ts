import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { filesConfigured, isBucket, putObject, validPath } from "@/lib/files/server";

/** Admin upload into VPS storage. The browser POSTs the raw file body with
    ?bucket=&clientId=&subfolder=&name=; the file is streamed straight through
    to storage (no size limit from the app) under `<client_id>/<subfolder>/…`. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  if (!filesConfigured()) return NextResponse.json({ error: "File storage isn't configured" }, { status: 503 });

  const sp = request.nextUrl.searchParams;
  const bucket = sp.get("bucket") ?? "";
  const clientId = sp.get("clientId") ?? "";
  const subfolder = (sp.get("subfolder") ?? "").replace(/[^a-zA-Z0-9/_-]/g, "_");
  const name = (sp.get("name") ?? "file").replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!isBucket(bucket) || !/^[0-9a-f-]{36}$/i.test(clientId)) {
    return NextResponse.json({ error: "Bad upload target" }, { status: 400 });
  }
  const path = [clientId, subfolder, `${Date.now()}-${name}`].filter(Boolean).join("/");
  if (!validPath(path) || !request.body) return NextResponse.json({ error: "Bad upload" }, { status: 400 });

  const len = request.headers.get("content-length");
  try {
    await putObject(bucket, path, request.body, request.headers.get("content-type") ?? "", len ? Number(len) : null);
  } catch (e) {
    console.error("[files] upload failed", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
  return NextResponse.json({ path });
}
