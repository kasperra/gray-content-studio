"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { sendMail } from "@/lib/mail";
import { renderCouponEmail } from "./email";
import {
  CONSENT_VERSION,
  OFFER_DEFAULTS,
  EMAIL_RE,
  choiceById,
  expiresAt,
  normalizePhone,
  parseSettings,
  randomCode,
  serializeSettings,
  type OfferSettings,
} from "./config";

/* Every offer-popup write happens here, server-side, through the service-role
   client — the same pattern the contact form and the diagnostic use. The browser
   never holds a key and never chooses its own coupon code. */

const CONFIG_TABLE = "diagnostic_config"; // shared site config store, see 0004

function connected() {
  return supabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Outbound mail is opt-in on env, so skip the render entirely when it's off. */
function mailerReady() {
  return Boolean(
    process.env.RESEND_API_KEY && (process.env.MAIL_FROM_EMAIL || process.env.DIAGNOSTIC_FROM_EMAIL)
  );
}

/** Crude per-IP throttle, same shape as the diagnostic's. Resets on cold start:
    it exists to stop a loop minting coupons, not as a security boundary. */
const hits = new Map<string, { n: number; resetAt: number }>();

async function rateLimited(limit = 8, windowMs = 60_000): Promise<boolean> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { n: 1, resetAt: now + windowMs });
    return false;
  }
  rec.n += 1;
  return rec.n > limit;
}

/** Editable popup rules, with code defaults when a key (or the table) is absent. */
export async function getOfferSettings(): Promise<OfferSettings> {
  try {
    if (!connected()) return OFFER_DEFAULTS;
    const { data } = await createSupabaseAdmin().from(CONFIG_TABLE).select("key, value");
    return parseSettings(Object.fromEntries((data ?? []).map((r) => [r.key, r.value])));
  } catch {
    return OFFER_DEFAULTS;
  }
}

export async function saveOfferSettings(next: OfferSettings): Promise<{ ok: boolean }> {
  const { requireAdmin } = await import("@/lib/auth");
  await requireAdmin();
  try {
    const rows = Object.entries(serializeSettings(parseSettings(serializeSettings(next)))).map(
      ([key, value]) => ({ key, value: String(value).slice(0, 2000), updated_at: new Date().toISOString() })
    );
    const { error } = await createSupabaseAdmin().from(CONFIG_TABLE).upsert(rows);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

export type ClaimInput = {
  answerId: string;
  email: string;
  phone: string;
  emailConsent: boolean;
  smsConsent: boolean;
};

export type ClaimResult = {
  ok: boolean;
  message: string;
  code?: string;
  expiresAt?: string;
  discountLabel?: string;
  /** True when the code was also delivered by email, so the success screen can
      say so rather than claiming a send that never happened. */
  emailed?: boolean;
};

/** Issue (or re-issue) this visitor's coupon and put them on the CRM board.
 *
 * Idempotent by email: claiming twice returns the same live coupon rather than
 * minting a second one, and never creates a duplicate lead. */
export async function claimOffer(input: ClaimInput): Promise<ClaimResult> {
  if (await rateLimited()) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  const choice = choiceById(String(input.answerId ?? ""));
  if (!choice) return { ok: false, message: "Please choose an answer first." };

  const email = String(input.email ?? "").trim().toLowerCase().slice(0, 200);
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Please enter a valid email address." };

  const phone = normalizePhone(String(input.phone ?? ""));
  if (!phone) return { ok: false, message: "Please enter a valid phone number." };

  if (!connected()) return { ok: false, message: "The offer isn't connected yet. Please try again later." };

  const settings = await getOfferSettings();
  if (!settings.enabled) return { ok: false, message: "This offer isn't running right now." };

  // Consent is never inferred from someone handing over an address or a number.
  const emailConsent = input.emailConsent === true;
  // With SMS marketing switched off there is nothing a texting consent could
  // authorise, so it is not stored as granted even if a stale client sends it.
  const smsConsent = settings.smsEnabled && input.smsConsent === true;

  const admin = createSupabaseAdmin();
  const now = new Date();

  // An existing live coupon is returned as-is: one coupon per business.
  const { data: prior } = await admin
    .from("offer_claims")
    .select("id, coupon_code, expires_at, lead_id, email_consent, sms_consent")
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const priorLive = prior && (!prior.expires_at || new Date(prior.expires_at) > now) ? prior : null;

  if (priorLive) {
    // Consent can only be added back here, never silently revoked — an unticked
    // box on a repeat visit is an absence of a new grant, not a withdrawal.
    const grants: Record<string, unknown> = {};
    if (emailConsent && !priorLive.email_consent) grants.email_consent = true;
    if (smsConsent && !priorLive.sms_consent) grants.sms_consent = true;
    if (Object.keys(grants).length) {
      grants.consent_version = CONSENT_VERSION;
      grants.consent_at = now.toISOString();
      await admin.from("offer_claims").update(grants).eq("id", priorLive.id);
    }
    return {
      ok: true,
      message: "You already have a coupon — here it is again.",
      code: priorLive.coupon_code,
      expiresAt: priorLive.expires_at ?? undefined,
      discountLabel: settings.discountLabel,
    };
  }

  const expiry = expiresAt(now, settings.couponDays);
  const expiryLabel = expiry.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // Retry on the unique-code collision rather than pre-checking: the index is
  // the only thing that can actually guarantee uniqueness under concurrency.
  let code = "";
  let claimId = "";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = randomCode(settings.codePrefix);
    const { data, error } = await admin
      .from("offer_claims")
      .insert({
        email,
        phone,
        answer_id: choice.id,
        stage: choice.stage,
        bottleneck: choice.bottleneck,
        coupon_code: candidate,
        discount_label: settings.discountLabel,
        expires_at: expiry.toISOString(),
        email_consent: emailConsent,
        sms_consent: smsConsent,
        consent_version: CONSENT_VERSION,
        consent_at: now.toISOString(),
        consent_source: "first_visit_popup",
      })
      .select("id")
      .single();

    if (!error && data) {
      code = candidate;
      claimId = data.id;
      break;
    }
    if (error && error.code !== "23505") {
      return { ok: false, message: "We couldn't create your coupon. Please try again." };
    }
  }
  if (!code) return { ok: false, message: "We couldn't create your coupon. Please try again." };

  const note = [
    `First-visit offer popup — coupon ${code} (${settings.discountLabel}), expires ${expiryLabel}.`,
    `Wants: ${choice.label}`,
    `Email marketing consent: ${emailConsent ? "yes" : "no"} · SMS marketing consent: ${
      settings.smsEnabled ? (smsConsent ? "yes" : "no") : "not offered"
    } (${CONSENT_VERSION})`,
  ].join("\n");

  // One CRM record per person: update the existing lead if we already know this
  // address rather than putting a second card on the board.
  const { data: lead } = await admin
    .from("leads")
    .select("id, name, phone, message")
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let leadId = lead?.id ?? null;

  if (lead) {
    await admin
      .from("leads")
      .update({
        phone: lead.phone || phone,
        message: [lead.message, note].filter(Boolean).join("\n\n"),
      })
      .eq("id", lead.id);
  } else {
    const fallbackName = email.split("@")[0].replace(/[._-]+/g, " ").trim() || "Offer popup lead";
    const { data: created } = await admin
      .from("leads")
      .insert({
        name: fallbackName,
        email,
        phone,
        message: note,
        source: "offer_popup",
      })
      .select("id")
      .single();
    leadId = created?.id ?? null;
  }

  if (leadId) await admin.from("offer_claims").update({ lead_id: leadId }).eq("id", claimId);

  // Deliver the code so it survives the tab being closed. Best-effort: the
  // coupon exists and is on screen regardless, so a mailer problem must never
  // fail the claim.
  //
  // Only ever sent on first issuance — a repeat claim returns above without
  // reaching here. That caps this at one message per address for all time, so
  // it can't be pointed at someone else's inbox more than once.
  let emailed = false;
  if (mailerReady()) {
    try {
      const sent = await sendMail(
        email,
        renderCouponEmail({
          code,
          discountLabel: settings.discountLabel,
          discountNote: settings.discountNote,
          eligibility: settings.eligibility,
          expiresAt: expiry,
          answerLabel: choice.label,
        }),
        "offer"
      );
      // Tolerates the 0005 column being absent, like the estimate column in
      // modules/leads/actions.ts — migrations are applied by hand.
      emailed = sent;
      if (sent) {
        await admin
          .from("offer_claims")
          .update({ coupon_emailed_at: new Date().toISOString() })
          .eq("id", claimId);
      }
    } catch (err) {
      console.error("[offer] coupon email failed", err);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/crm");
  revalidatePath("/admin/offer");

  return {
    ok: true,
    message: "Your discount is ready.",
    code,
    expiresAt: expiry.toISOString(),
    discountLabel: settings.discountLabel,
    emailed,
  };
}

/** Mark a coupon used, or undo that. Redemption is tracked by hand — there is no
    checkout in this app to redeem against. */
export async function setClaimRedeemed(id: string, redeemed: string): Promise<{ ok: boolean; message: string }> {
  const { requireAdmin } = await import("@/lib/auth");
  await requireAdmin();
  if (!id) return { ok: false, message: "Missing coupon." };

  const { error } = await createSupabaseAdmin()
    .from("offer_claims")
    .update({ redeemed_at: redeemed === "true" ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) return { ok: false, message: "Could not update this coupon." };
  revalidatePath("/admin/offer");
  return { ok: true, message: "Updated." };
}

/** Delete a coupon claim. The CRM lead it created is left alone — the person is
    still a lead, they just no longer hold a coupon. */
export async function deleteOfferClaim(id: string): Promise<{ ok: boolean; message: string }> {
  const { requireAdmin } = await import("@/lib/auth");
  await requireAdmin();
  if (!id) return { ok: false, message: "Missing coupon." };

  const { error } = await createSupabaseAdmin().from("offer_claims").delete().eq("id", id);
  if (error) return { ok: false, message: "Could not delete this coupon." };
  revalidatePath("/admin/offer");
  return { ok: true, message: "Coupon deleted." };
}
