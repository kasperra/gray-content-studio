import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/* Funnel telemetry endpoint.
   Deliberately NOT a server action: Next serialises action POSTs per client, so
   ~19 fire-and-forget events per session queue up against submitDiagnostic — the
   one call that must not be delayed or dropped. This is a plain route the client
   hits with sendBeacon, which the browser flushes out-of-band and keeps alive
   across navigation. Telemetry must never be able to slow or break a diagnosis. */

const EVENTS = new Set(["view", "start", "question", "complete", "capture", "cta_click"]);

export async function POST(request: NextRequest) {
  try {
    if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new NextResponse(null, { status: 204 });
    }

    const body = await request.json().catch(() => null);
    const event = typeof body?.event === "string" ? body.event : "";
    if (!EVENTS.has(event)) return new NextResponse(null, { status: 204 });

    const admin = createSupabaseAdmin();

    let resultId: string | null = null;
    const publicId = typeof body?.resultPublicId === "string" ? body.resultPublicId : "";
    if (publicId && /^[a-f0-9]{8,64}$/i.test(publicId)) {
      const { data } = await admin
        .from("diagnostic_results")
        .select("id")
        .eq("public_id", publicId)
        .single();
      resultId = data?.id ?? null;
    }

    await admin.from("diagnostic_events").insert({
      event,
      result_id: resultId,
      session_id: typeof body?.sessionId === "string" ? body.sessionId.slice(0, 64) : null,
      step: typeof body?.step === "string" ? body.step.slice(0, 64) : null,
    });
  } catch {
    /* best-effort */
  }
  // Always 204: the client never waits on this and has nothing to do with a failure.
  return new NextResponse(null, { status: 204 });
}
