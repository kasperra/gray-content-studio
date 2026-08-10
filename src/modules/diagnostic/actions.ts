"use server";

import { headers } from "next/headers";
import { createSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { diagnose, stageMeta } from "./scoring";
import { QUESTIONS } from "./questions";
import type { Answers, Result } from "./types";

/* All diagnostic writes happen here, server-side, through the service-role
   client — the same pattern the public contact form uses. The browser never
   holds a key, and never decides a score: it submits answers, the server
   recomputes the diagnosis, and only the server's numbers are stored. */

type SubmitResult = { ok: boolean; publicId?: string; result?: Result; message: string };

/** Crude per-IP throttle. Resets on cold start, which is fine — it exists to
    stop a loop hammering the endpoint, not as a security boundary. */
const hits = new Map<string, { n: number; resetAt: number }>();
const LIMIT = 12;
const WINDOW_MS = 60_000;

async function rateLimited(): Promise<boolean> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { n: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.n += 1;
  return rec.n > LIMIT;
}

/** Keep only known question ids and known option ids — anything else a client
    sends is discarded before it can reach the scoring engine or the database. */
function sanitize(answers: unknown): Answers {
  const out: Answers = {};
  if (!answers || typeof answers !== "object") return out;
  for (const q of QUESTIONS) {
    const raw = (answers as Record<string, unknown>)[q.id];
    if (typeof raw !== "string") continue;
    if (q.options.some((o) => o.id === raw)) out[q.id] = raw;
  }
  return out;
}

export async function submitDiagnostic(answers: unknown): Promise<SubmitResult> {
  if (await rateLimited()) return { ok: false, message: "Too many attempts. Please try again shortly." };

  const clean = sanitize(answers);
  if (Object.keys(clean).length < 5) {
    return { ok: false, message: "Not enough answers to produce a diagnosis." };
  }

  const result = diagnose(clean);
  const meta = stageMeta(result.stage);

  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, message: "The diagnostic isn't connected to its database yet." };
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("diagnostic_results")
    .insert({
      answers: clean,
      scores: result.scores,
      overall_score: result.overall,
      stage: result.stage,
      stage_name: meta.name,
      primary_bottleneck: result.primaryBottleneck,
      secondary_bottlenecks: result.secondaryBottlenecks,
      recommended_next_step: meta.cta,
      business_type: result.businessType || null,
      purchase_intent: result.purchaseIntent || null,
      urgency: result.urgency || null,
    })
    .select("public_id")
    .single();

  if (error || !data) {
    return { ok: false, message: "We couldn't save your diagnosis. Please try again." };
  }

  await track("complete", { resultPublicId: data.public_id });
  return { ok: true, publicId: data.public_id, result, message: "Diagnosis ready." };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function captureLead(
  publicId: string,
  contact: { name?: string; email?: string; businessName?: string; website?: string }
): Promise<{ ok: boolean; message: string }> {
  if (await rateLimited()) return { ok: false, message: "Too many attempts. Please try again shortly." };

  const email = (contact.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Please enter a valid email address." };
  if (!publicId || publicId.length > 64) return { ok: false, message: "Missing diagnosis." };

  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, message: "The diagnostic isn't connected to its database yet." };
  }

  const trim = (v: string | undefined, max: number) => (v ?? "").trim().slice(0, max) || null;

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("diagnostic_results")
    .update({
      name: trim(contact.name, 120),
      email: email.slice(0, 200),
      business_name: trim(contact.businessName, 160),
      website: trim(contact.website, 300),
      email_captured_at: new Date().toISOString(),
    })
    .eq("public_id", publicId);

  if (error) return { ok: false, message: "We couldn't save your details. Please try again." };

  await track("capture", { resultPublicId: publicId });
  return { ok: true, message: "Sent. Your full roadmap is below." };
}

type TrackOpts = { sessionId?: string; step?: string; resultPublicId?: string };

/** Funnel telemetry. Never throws — analytics must not be able to break the
    diagnostic, and it stays silent if the migration hasn't been applied. */
export async function track(
  event: "view" | "start" | "question" | "complete" | "capture" | "cta_click",
  opts: TrackOpts = {}
): Promise<void> {
  try {
    if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    const admin = createSupabaseAdmin();

    let resultId: string | null = null;
    if (opts.resultPublicId) {
      const { data } = await admin
        .from("diagnostic_results")
        .select("id")
        .eq("public_id", opts.resultPublicId)
        .single();
      resultId = data?.id ?? null;
    }

    await admin.from("diagnostic_events").insert({
      event,
      result_id: resultId,
      session_id: opts.sessionId?.slice(0, 64) ?? null,
      step: opts.step?.slice(0, 64) ?? null,
    });
  } catch {
    /* analytics is best-effort */
  }
}

/** Editable copy/links, with code defaults when the row (or table) is absent. */
export async function getConfig(): Promise<Record<string, string>> {
  try {
    if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return {};
    const { data } = await createSupabaseAdmin().from("diagnostic_config").select("key, value");
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

export async function saveConfig(entries: Record<string, string>): Promise<{ ok: boolean }> {
  const { requireAdmin } = await import("@/lib/auth");
  await requireAdmin();
  try {
    const admin = createSupabaseAdmin();
    const rows = Object.entries(entries).map(([key, value]) => ({
      key,
      value: String(value).slice(0, 2000),
      updated_at: new Date().toISOString(),
    }));
    await admin.from("diagnostic_config").upsert(rows);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Result lookup for the shareable URL. Service-role, because results carry
    lead data and are deliberately not readable under RLS. */
export async function getResultByPublicId(publicId: string) {
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!publicId || !/^[a-f0-9]{8,64}$/i.test(publicId)) return null;
  const { data } = await createSupabaseAdmin()
    .from("diagnostic_results")
    .select("*")
    .eq("public_id", publicId)
    .single();
  return data;
}
