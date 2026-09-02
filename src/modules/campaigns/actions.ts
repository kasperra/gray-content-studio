"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { LEGAL } from "@/content/legal";
import { envStr } from "@/lib/mail";
import { campaignBySlug, CAMPAIGNS } from "./campaigns";
import {
  campaignFrom,
  renderCustomerEmail,
  renderStudioEmail,
  sendCustomerEmail,
  sendStudioEmail,
} from "./email";
import {
  applyOverrides,
  formatDate,
  sessionTypeLabel,
  serializeOverrides,
  validateInquiry,
  type Campaign,
  type InquiryErrors,
} from "./campaign";

/* Every campaign write happens here, server-side, through the service-role
   client — the same pattern the contact form, the diagnostic and the offer
   popup use. The browser never holds a key. */

const CONFIG_TABLE = "diagnostic_config"; // shared site config store, see 0004/0006

function connected() {
  return supabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Outbound mail is opt-in on env, so skip the render entirely when it's off.
    Reads campaignFrom() rather than the shared sender directly: a deployment
    that sets only CAMPAIGN_FROM_EMAIL can still send, and would otherwise be
    skipped here despite being correctly configured. */
function mailerReady() {
  return Boolean(process.env.RESEND_API_KEY && campaignFrom());
}

/** Where the studio's copy of an inquiry goes. Falls back to the address the
    legal pages already publish, so this works without new configuration. */
function studioInbox(): string {
  return envStr("CAMPAIGN_NOTIFY_EMAIL") ?? envStr("DIAGNOSTIC_REPLY_TO") ?? LEGAL.email;
}

/** What Admin → Campaigns shows about mail routing. Both values resolve through
    fallbacks, so the only reliable way to know what a deployment will actually
    do is to ask it — reading the Vercel dashboard doesn't show the fallback. */
export async function getMailRouting(): Promise<{ from: string | null; to: string }> {
  return { from: campaignFrom() ?? null, to: studioInbox() };
}

/** Crude per-IP throttle, same shape as the offer popup's. Resets on cold
    start: it exists to stop a loop hammering the mailer, not as a security
    boundary. */
const hits = new Map<string, { n: number; resetAt: number }>();

async function rateLimited(limit = 6, windowMs = 60_000): Promise<boolean> {
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

/** Read the whole shared config table once. Returns {} when the store is absent
    so every caller falls back to the defaults in campaigns.ts. */
async function readConfig(): Promise<Record<string, string>> {
  try {
    if (!connected()) return {};
    const { data } = await createSupabaseAdmin().from(CONFIG_TABLE).select("key, value");
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

/** A campaign with the studio's runtime edits applied. This is what the public
    page, both emails and the admin editor all read. */
export async function getCampaign(slug: string): Promise<Campaign | null> {
  const base = campaignBySlug(slug);
  if (!base) return null;
  return applyOverrides(base, await readConfig());
}

/** Every campaign, edits applied — for the admin list and the sitemap. */
export async function getCampaigns(): Promise<Campaign[]> {
  const kv = await readConfig();
  return CAMPAIGNS.map((c) => applyOverrides(c, kv));
}

/* ------------------------------------------------------------- inquiries -- */

export type InquiryState = {
  ok: boolean;
  message: string;
  errors?: InquiryErrors;
} | null;

/** Take a session request: record it, put it on the CRM board, confirm to the
    customer and notify the studio.
 *
 * Saving is what must not fail. Both emails are best-effort and are reported
 * back through the DB flags rather than the visitor's success message — a
 * delivery problem can never cost the studio the inquiry that triggered it. */
export async function submitCampaignInquiry(
  _prev: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  // Honeypot: silently accept bots without recording anything.
  if (formData.get("_gotcha")) {
    return { ok: true, message: "Thank you — your request is in." };
  }

  const slug = String(formData.get("campaign") ?? "");
  const campaign = await getCampaign(slug);
  if (!campaign || !campaign.published) {
    return { ok: false, message: "This session isn't taking requests right now." };
  }

  const { values, errors } = validateInquiry(
    {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      preferredDate: String(formData.get("preferred_date") ?? ""),
      sessionType: String(formData.get("session_type") ?? ""),
      ideas: String(formData.get("ideas") ?? ""),
    },
    campaign
  );

  if (Object.keys(errors).length) {
    return { ok: false, message: "Please check the highlighted fields.", errors };
  }

  if (await rateLimited()) {
    return { ok: false, message: "Too many requests. Please try again shortly." };
  }

  if (!connected()) {
    return {
      ok: false,
      message: "We couldn't save your request. Please try again, or email us directly.",
    };
  }

  const admin = createSupabaseAdmin();
  const typeLabel = sessionTypeLabel(campaign, values.sessionType);

  const note = [
    `${campaign.title} request from the website.`,
    `Preferred date: ${formatDate(values.preferredDate)}`,
    `Session type: ${typeLabel}`,
    ...(values.ideas ? ["", `Inspiration / ideas:`, values.ideas] : []),
  ].join("\n");

  // 1) CRM record, so a campaign inquiry lands on the same board as everything
  //    else. Tolerates the `phone` column being absent the way lead inserts
  //    tolerate a missing estimate column — migrations are applied by hand.
  const leadRow = {
    name: values.name,
    email: values.email,
    phone: values.phone,
    project_type: typeLabel,
    message: note,
    source: `campaign_${campaign.slug}`,
  };

  let leadId: string | null = null;
  {
    let { data, error } = await admin.from("leads").insert(leadRow).select("id").single();
    if (error) {
      ({ data, error } = await admin
        .from("leads")
        .insert({ ...leadRow, phone: undefined })
        .select("id")
        .single());
    }
    leadId = data?.id ?? null;
  }

  // 2) The structured inquiry. This is the record that must survive, so a
  //    failure here is the only one the visitor is told about.
  const { data: inquiry, error: inquiryError } = await admin
    .from("campaign_inquiries")
    .insert({
      campaign_slug: campaign.slug,
      lead_id: leadId,
      name: values.name,
      email: values.email,
      phone: values.phone,
      preferred_date: values.preferredDate,
      session_type: values.sessionType,
      ideas: values.ideas || null,
    })
    .select("id")
    .single();

  if (inquiryError && !leadId) {
    return {
      ok: false,
      message: "We couldn't save your request. Please try again, or email us directly.",
    };
  }

  // 3) Confirm to the customer and notify the studio. Both best-effort.
  if (mailerReady()) {
    const sentAt = new Date().toISOString();

    const customerSent = await sendCustomerEmail(
      values.email,
      renderCustomerEmail({ campaign, inquiry: values })
    ).catch(() => false);

    // Reply-to is the inquirer, so Reply in the studio inbox answers them.
    const studioSent = await sendStudioEmail(
      studioInbox(),
      renderStudioEmail({ campaign, inquiry: values, leadId }),
      values.email
    ).catch(() => false);

    if (inquiry?.id && (customerSent || studioSent)) {
      // Tolerates the 0006 columns being absent, like the offer popup's
      // coupon_emailed_at — the inquiry is already saved either way.
      await admin
        .from("campaign_inquiries")
        .update({
          ...(customerSent ? { customer_emailed_at: sentAt } : {}),
          ...(studioSent ? { studio_emailed_at: sentAt } : {}),
        })
        .eq("id", inquiry.id)
        .then(undefined, () => undefined);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/crm");
  revalidatePath("/admin/campaigns");

  return { ok: true, message: campaign.confirmationBody };
}

/* ----------------------------------------------------------------- admin -- */

/** Persist a campaign's editable copy. Round-tripped through applyOverrides so
    a blank or malformed field falls back to the code default rather than
    publishing an empty page. */
export async function saveCampaign(next: Campaign): Promise<{ ok: boolean; message: string }> {
  const { requireAdmin } = await import("@/lib/auth");
  await requireAdmin();

  const base = campaignBySlug(next.slug);
  if (!base) return { ok: false, message: "Unknown campaign." };

  try {
    const rows = Object.entries(serializeOverrides(applyOverrides(base, serializeOverrides(next))))
      .map(([key, value]) => ({
        key,
        value: String(value).slice(0, 2000),
        updated_at: new Date().toISOString(),
      }));
    const { error } = await createSupabaseAdmin().from(CONFIG_TABLE).upsert(rows);
    if (error) return { ok: false, message: "Could not save. Is migration 0006 applied?" };
  } catch {
    return { ok: false, message: "Could not save these changes." };
  }

  revalidatePath("/admin/campaigns");
  revalidatePath(`/${next.slug}`);
  return { ok: true, message: "Saved. The live page updates within a few minutes." };
}

/** Delete one inquiry. The CRM lead it created is left alone — the person still
    inquired, the structured record is just being cleared. */
export async function deleteCampaignInquiry(id: string): Promise<{ ok: boolean; message: string }> {
  const { requireAdmin } = await import("@/lib/auth");
  await requireAdmin();
  if (!id) return { ok: false, message: "Missing inquiry." };

  const { error } = await createSupabaseAdmin().from("campaign_inquiries").delete().eq("id", id);
  if (error) return { ok: false, message: "Could not delete this inquiry." };

  revalidatePath("/admin/campaigns");
  return { ok: true, message: "Inquiry deleted." };
}
