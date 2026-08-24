"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { diagnose, stageMeta } from "./scoring";
import { QUESTIONS } from "./questions";
import { DEFAULT_BOOKING_URL } from "./content";
import { renderDiagnosticEmail, sendDiagnosticEmail, checkMailer, type MailerStatus } from "./email";
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

  // Read first: we need the answers to build the email, and email_captured_at
  // tells us whether this is the first capture. Re-submitting the form must not
  // send a second copy.
  const { data: row } = await admin
    .from("diagnostic_results")
    .select("answers, email_captured_at")
    .eq("public_id", publicId)
    .single();
  if (!row) return { ok: false, message: "We couldn't find that diagnosis." };
  const alreadySent = Boolean(row.email_captured_at);

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

  // The lead is already saved at this point. Delivery is best-effort from here:
  // a bounced or unconfigured mailer must never fail the capture, because the
  // roadmap is shown on screen regardless.
  if (!alreadySent) {
    try {
      const result = diagnose((row.answers ?? {}) as Answers);
      const meta = stageMeta(result.stage);
      const config = await getConfig();
      const message = renderDiagnosticEmail({
        result,
        publicId,
        name: trim(contact.name, 120),
        ctaLabel: config[`cta_stage_${result.stage}`] ?? meta.cta,
        bookingUrl: config.booking_url ?? DEFAULT_BOOKING_URL,
      });
      await sendDiagnosticEmail(email, message);
    } catch (err) {
      console.error("[diagnostic] result email failed", err);
    }
  }

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

/** Permanently delete a completed diagnostic. The lead's funnel events are
    removed with it — diagnostic_events.result_id is `on delete cascade` — so no
    orphan rows are left skewing the funnel counts. */
export async function deleteDiagnosticResult(
  id: string
): Promise<{ ok: boolean; message: string }> {
  const { requireAdmin } = await import("@/lib/auth");
  await requireAdmin();
  if (!id) return { ok: false, message: "Missing lead." };

  try {
    const { error } = await createSupabaseAdmin().from("diagnostic_results").delete().eq("id", id);
    if (error) return { ok: false, message: "Could not delete this lead." };
  } catch {
    return { ok: false, message: "Could not delete this lead." };
  }

  revalidatePath("/admin/diagnostic");
  return { ok: true, message: "Lead deleted." };
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

/** Admin-only view of whether the result email is wired up. Returns no secrets. */
export async function getMailerStatus(): Promise<MailerStatus> {
  const { requireAdmin } = await import("@/lib/auth");
  await requireAdmin();
  return checkMailer();
}

/** Turn a completed diagnosis into a CRM lead.
 *
 * At this point the visitor has already given us their name, email, business and
 * website, and the diagnosis knows their stage, bottlenecks, intent and urgency.
 * Sending them to the contact form to retype all of it loses people at peak
 * interest, so the CTA books the request directly instead.
 *
 * Diagnostic results live in their own table; this is what puts the person on
 * the CRM board next to every other inquiry. */
export async function requestFollowUp(
  publicId: string
): Promise<{ ok: boolean; message: string; needsForm?: boolean }> {
  if (await rateLimited()) return { ok: false, message: "Too many attempts. Please try again shortly." };
  if (!publicId || !/^[a-f0-9]{8,64}$/i.test(publicId)) return { ok: false, message: "Missing diagnosis." };

  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, message: "Not connected yet." };
  }

  const admin = createSupabaseAdmin();
  const { data: row } = await admin
    .from("diagnostic_results")
    .select("*")
    .eq("public_id", publicId)
    .single();
  if (!row) return { ok: false, message: "We couldn't find that diagnosis." };

  // Someone opening an old result link who never captured has nothing to send;
  // the UI falls back to the contact form for them.
  if (!row.email) return { ok: false, needsForm: true, message: "We need your email first." };

  // Don't create a second lead if they click again. The public_id in the message
  // is the link back to the report, and doubles as the idempotency marker.
  const { data: existing } = await admin
    .from("leads")
    .select("id")
    .eq("email", row.email)
    .ilike("message", `%${publicId}%`)
    .limit(1);
  if (existing?.length) {
    return { ok: true, message: "You've already asked us to reach out — we'll be in touch shortly." };
  }

  const result = diagnose((row.answers ?? {}) as Answers);
  const meta = stageMeta(result.stage);
  const base = process.env.DIAGNOSTIC_URL || "https://diagnostic.graycontentstudio.co";

  const message = [
    `Requested follow-up from the Content Growth Diagnostic.`,
    ``,
    `Stage ${result.stage} — ${meta.name}`,
    `Primary bottleneck: ${result.primaryBottleneck}`,
    result.secondaryBottlenecks.length
      ? `Secondary: ${result.secondaryBottlenecks.join(", ")}`
      : null,
    `Scores — visibility ${result.scores.visibility}, strategy ${result.scores.strategy}, production ${result.scores.production}, distribution ${result.scores.distribution}, conversion ${result.scores.conversion}, measurement ${result.scores.measurement}`,
    row.purchase_intent ? `Intent: ${row.purchase_intent}` : null,
    row.urgency ? `Urgency: ${row.urgency}` : null,
    row.website ? `Website: ${row.website}` : null,
    ``,
    `Full report: ${base}/results/${publicId}`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const { error } = await admin.from("leads").insert({
    name: row.name || row.business_name || "Diagnostic lead",
    email: row.email,
    company: row.business_name || null,
    project_type: row.business_type || null,
    message,
    source: "diagnostic",
  });

  if (error) return { ok: false, message: "We couldn't send that. Please try again." };

  await track("cta_click", { resultPublicId: publicId });
  revalidatePath("/admin");
  revalidatePath("/admin/crm");
  return { ok: true, message: "Request sent. We'll reply within one business day." };
}
