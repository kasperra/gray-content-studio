import { LEGAL } from "@/content/legal";
import { envStr, mailFrom, sendMail } from "@/lib/mail";
import { DIMENSION_LABELS, type Result } from "./types";
import { BOTTLENECK_COPY, STAGES } from "./content";
import { stageMeta } from "./scoring";

/* The result email — a continuation of the diagnostic, not a newsletter.

   Sent through Resend's REST API with plain fetch rather than the SDK: one
   POST, no new dependency. Provider details live behind sendDiagnosticEmail so
   swapping to Postmark or SES later is a single function.

   Rendered in the brand's near-black. Dark HTML email needs three specific
   defences to survive real inboxes, all of which are in place below:
   color-scheme/supported-color-schemes so Gmail and Outlook dark modes don't
   invert it, opaque hex only (Outlook's Word engine drops rgba), and bgcolor
   attributes alongside every CSS background (that engine ignores the CSS one,
   which would render the card white and hide the off-white type). */

const BASE_URL = process.env.DIAGNOSTIC_URL || "https://diagnostic.graycontentstudio.co";

// Mirrors globals.css. The two flattened values replace rgba() the Word engine
// would drop, leaving an invisible panel behind.
const INK = "#f5f2ec";
const MUTED = "#9b968e";
const GOLD = "#fac748"; // Tuscan Sun
const PAPER = "#0b0b0c"; // page ground
const SURFACE = "#141416"; // card
const MAHOGANY = "#301509"; // Rich Mahogany — the header's depth
const RULE = "#2a2a2c";
const ACCENT_SOFT = "#342d1d"; // accent at 14% over SURFACE
const ACCENT_EDGE = "#705c2a"; // accent at 40% over SURFACE

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderDiagnosticEmail(opts: {
  result: Result;
  publicId: string;
  name?: string | null;
  ctaLabel: string;
  bookingUrl: string;
}): { subject: string; html: string; text: string } {
  const { result, publicId, name, ctaLabel, bookingUrl } = opts;
  const meta = stageMeta(result.stage);
  const next = result.stage < 5 ? STAGES[result.stage] : null;
  const resultUrl = `${BASE_URL}/results/${publicId}`;

  const primaryLabel =
    result.stage === 5 ? "Optimization & Leverage" : DIMENSION_LABELS[result.primaryBottleneck];
  const primaryWhat =
    result.stage === 5
      ? "No structural gap is holding you back — the constraint is now efficiency and leverage."
      : BOTTLENECK_COPY[result.primaryBottleneck].what;

  const subject = `Your Gray Content Growth Diagnosis: Stage ${result.stage} — ${meta.name}`;
  const greeting = name?.trim() ? `${name.trim().split(" ")[0]},` : "Here's your diagnosis,";

  const roadmapRows = result.roadmap
    .map(
      (item, i) => `
      <tr>
        <td style="padding:0 0 18px 0;vertical-align:top;width:34px;">
          <span style="font-size:13px;font-weight:700;color:${GOLD};">${String(i + 1).padStart(2, "0")}</span>
        </td>
        <td style="padding:0 0 18px 0;vertical-align:top;">
          <strong style="font-size:15px;color:${INK};">${esc(item.title)}</strong><br>
          <span style="font-size:14px;color:${MUTED};line-height:1.55;">${esc(item.detail)}</span>
        </td>
      </tr>`
    )
    .join("");

  const secondaryHtml = result.secondaryBottlenecks.length
    ? `<p style="margin:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};">Also holding you back</p>
       <p style="margin:0 0 26px 0;font-size:15px;color:${INK};line-height:1.6;">${result.secondaryBottlenecks
         .map((d) => `<strong>${esc(DIMENSION_LABELS[d])}</strong> — ${esc(BOTTLENECK_COPY[d].what)}`)
         .join("<br>")}</p>`
    : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<style>:root{color-scheme:dark;supported-color-schemes:dark;}</style></head>
<body style="margin:0;padding:0;background:${PAPER};color-scheme:dark;" bgcolor="${PAPER}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Stage ${result.stage} — ${esc(meta.name)}. Your primary bottleneck is ${esc(primaryLabel)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" style="background:${PAPER};padding:28px 12px;">
<tr><td align="center" bgcolor="${PAPER}" style="background:${PAPER};">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${SURFACE}" style="width:600px;max-width:100%;background:${SURFACE};border:1px solid ${RULE};border-radius:10px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <tr><td bgcolor="${MAHOGANY}" style="background:${MAHOGANY};padding:30px 34px;">
    <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${INK};">
      Gray<span style="color:${GOLD};">·</span>Content<span style="color:${GOLD};">·</span>Studio
    </p>
    <p style="margin:22px 0 0 0;font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:${GOLD};">Your Content Diagnosis</p>
    <h1 style="margin:8px 0 0 0;font-size:26px;line-height:1.25;color:${INK};font-weight:700;">Stage ${result.stage} — ${esc(meta.name)}</h1>
  </td></tr>

  <tr><td bgcolor="${SURFACE}" style="background:${SURFACE};padding:32px 34px 0 34px;">
    <p style="margin:0 0 18px 0;font-size:16px;color:${INK};">${esc(greeting)}</p>
    <p style="margin:0 0 26px 0;font-size:17px;line-height:1.4;color:${INK};font-weight:700;">${esc(meta.headline)}</p>
    <p style="margin:0 0 28px 0;font-size:15px;line-height:1.65;color:${MUTED};">${esc(meta.positioning)}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${ACCENT_SOFT}" style="background:${ACCENT_SOFT};border:1px solid ${ACCENT_EDGE};border-radius:8px;margin:0 0 26px 0;">
      <tr><td bgcolor="${ACCENT_SOFT}" style="background:${ACCENT_SOFT};padding:20px 22px;">
        <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};">Your primary bottleneck</p>
        <p style="margin:0 0 8px 0;font-size:20px;font-weight:700;color:${GOLD};">${esc(primaryLabel)}</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:${INK};">${esc(primaryWhat)}</p>
      </td></tr>
    </table>

    ${secondaryHtml}

    ${
      next
        ? `<p style="margin:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};">Your next milestone</p>
           <p style="margin:0 0 6px 0;font-size:17px;font-weight:700;color:${INK};">Stage ${next.id} — ${esc(next.name)}</p>
           <p style="margin:0 0 30px 0;font-size:14px;line-height:1.65;color:${MUTED};">${esc(meta.nextStageRequirement)}</p>`
        : `<p style="margin:0 0 30px 0;font-size:14px;line-height:1.65;color:${MUTED};">${esc(meta.nextStageRequirement)}</p>`
    }

    <p style="margin:0 0 14px 0;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};">What to focus on next</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${roadmapRows}</table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 6px 0;">
      <tr><td align="center" style="padding:14px 0 6px 0;">
        <a href="${esc(resultUrl)}" style="display:inline-block;background:${GOLD};color:${PAPER};text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:15px 30px;border-radius:999px;">View Your Full Diagnosis</a>
      </td></tr>
      <tr><td align="center" style="padding:0 0 8px 0;">
        <span style="font-size:12px;color:${MUTED};">Includes your 30-day plan and every dimension score.</span>
      </td></tr>
    </table>
  </td></tr>

  <tr><td bgcolor="${SURFACE}" style="background:${SURFACE};padding:26px 34px 34px 34px;">
    <div style="border-top:1px solid ${RULE};padding-top:24px;">
      <p style="margin:0 0 18px 0;font-size:14px;line-height:1.65;color:${MUTED};">
        This diagnostic was created by Gray Content Studio to help businesses understand where their
        content is working, where it's breaking down, and what to do next.
      </p>
      <a href="${esc(bookingUrl)}" style="display:inline-block;background:${SURFACE};color:${GOLD};text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:13px 26px;border:1px solid ${GOLD};border-radius:999px;">${esc(ctaLabel)}</a>
    </div>
  </td></tr>

  <tr><td bgcolor="${PAPER}" style="background:${PAPER};padding:18px 34px;border-top:1px solid ${RULE};">
    <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
      ${esc(LEGAL.entity)} — Video Production · Editing · Animation<br>
      ${esc(LEGAL.postalAddress)}<br>
      You're receiving this because you requested your diagnosis at ${esc(BASE_URL.replace(/^https?:\/\//, ""))}.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  const text = [
    `Stage ${result.stage} — ${meta.name}`,
    "",
    meta.headline,
    meta.positioning,
    "",
    `YOUR PRIMARY BOTTLENECK: ${primaryLabel}`,
    primaryWhat,
    "",
    ...(result.secondaryBottlenecks.length
      ? [
          "ALSO HOLDING YOU BACK:",
          ...result.secondaryBottlenecks.map(
            (d) => `- ${DIMENSION_LABELS[d]}: ${BOTTLENECK_COPY[d].what}`
          ),
          "",
        ]
      : []),
    ...(next ? [`YOUR NEXT MILESTONE: Stage ${next.id} — ${next.name}`, meta.nextStageRequirement, ""] : []),
    "WHAT TO FOCUS ON NEXT:",
    ...result.roadmap.map((r, i) => `${String(i + 1).padStart(2, "0")}. ${r.title} — ${r.detail}`),
    "",
    `View your full diagnosis (includes your 30-day plan): ${resultUrl}`,
    "",
    `${ctaLabel}: ${bookingUrl}`,
    "",
    `${LEGAL.entity} — Video Production · Editing · Animation`,
    LEGAL.postalAddress,
  ].join("\n");

  return { subject, html, text };
}

/** Sends the diagnostic result. Thin wrapper over the shared mail transport. */
export async function sendDiagnosticEmail(
  to: string,
  message: { subject: string; html: string; text: string }
): Promise<boolean> {
  return sendMail(to, message, "diagnostic");
}

export type MailerStatus = {
  keySet: boolean;
  fromSet: boolean;
  from: string | null;
  /** null when we couldn't ask Resend (no key, or the request failed). */
  domains: { name: string; status: string }[] | null;
  /** Key works for sending but isn't permitted to read domain status. */
  restrictedKey?: boolean;
  error: string | null;
};

/** Reports whether the result email is actually wired up: env vars present, and
    what Resend says about the sending domain's verification. Read-only, and it
    never returns the API key — only booleans and Resend's own domain status. */
export async function checkMailer(): Promise<MailerStatus> {
  const key = envStr("RESEND_API_KEY");
  const from = mailFrom() ?? null;
  const base: MailerStatus = {
    keySet: Boolean(key),
    fromSet: Boolean(from),
    from,
    domains: null,
    error: null,
  };
  if (!key) return { ...base, error: "RESEND_API_KEY is not set on this deployment." };

  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // A sending-only key is valid for delivery but not permitted to read
      // /domains, and Resend answers that with a 401 as well. Treat it as
      // configured rather than broken — the send path is what matters.
      if (res.status === 401 && /restrict/i.test(body)) {
        return {
          ...base,
          restrictedKey: true,
          error:
            "Key is valid but scoped to sending only, so domain status can't be read here. Sending is unaffected.",
        };
      }
      const detail =
        res.status === 401
          ? "Resend rejected the API key (401). The value is present but not a valid key — most often it was copied truncated from the key list rather than at creation. Create a fresh key in Resend, copy it immediately, re-save it in Vercel and redeploy."
          : `Resend rejected the request (HTTP ${res.status}).`;
      return { ...base, error: detail };
    }

    const parsed = (await res.json()) as { data?: { name?: string; status?: string }[] };
    return {
      ...base,
      domains: (parsed.data ?? []).map((d) => ({
        name: d.name ?? "unknown",
        status: d.status ?? "unknown",
      })),
    };
  } catch {
    return { ...base, error: "Couldn't reach the Resend API." };
  }
}
