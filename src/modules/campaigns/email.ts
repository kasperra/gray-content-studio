/* The two messages a campaign inquiry sends: a confirmation to the customer and
   a notification to the studio.

   Both go through lib/mail's Resend transport. Rendered in the brand's
   near-black, which needs three specific defences to survive real inboxes — all
   present below, and the reasoning is written up in modules/diagnostic/email.ts:
   color-scheme/supported-color-schemes so Gmail and Outlook dark modes don't
   invert the design, opaque hex only (Outlook's Word engine drops rgba), and
   bgcolor attributes beside every CSS background (that engine ignores the CSS
   one, which would render the card white and hide the off-white type).

   The customer message is transactional — it confirms something the person just
   asked for. It carries no marketing content and no unsubscribe flow, because
   subscribing them to anything is not what they did. */

import { LEGAL } from "@/content/legal";
import { envStr, mailFrom, sendMail, type MailMessage } from "@/lib/mail";
import { SITE_URL } from "@/lib/site";
import {
  formatDate,
  sessionTypeLabel,
  themeById,
  type Campaign,
  type InquiryInput,
} from "./campaign";

// Mirrors globals.css. The flattened values replace rgba() the Word engine
// would drop, leaving an invisible panel behind.
const INK = "#f5f2ec";
const MUTED = "#9b968e";
const PAPER = "#0b0b0c";
const SURFACE = "#141416";
const RULE = "#2a2a2c";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Flatten a theme colour to an opaque hex for email. The seasonal accents are
    already opaque; this only guards against a translucent value reaching a
    client that would drop it. */
function opaque(color: string, fallback: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function shell(opts: {
  campaign: Campaign;
  preheader: string;
  heading: string;
  eyebrow: string;
  body: string;
}): string {
  const theme = themeById(opts.campaign.themeId);
  const gold = opaque(theme.accent, "#fac748");
  const deep = opaque(theme.deep, "#301509");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(opts.heading)}</title>
<style>:root{color-scheme:dark;supported-color-schemes:dark;}</style></head>
<body style="margin:0;padding:0;background:${PAPER};color-scheme:dark;" bgcolor="${PAPER}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" style="background:${PAPER};padding:28px 12px;">
<tr><td align="center" bgcolor="${PAPER}" style="background:${PAPER};">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${SURFACE}" style="width:600px;max-width:100%;background:${SURFACE};border:1px solid ${RULE};border-radius:10px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <tr><td bgcolor="${deep}" style="background:${deep};padding:30px 34px;">
    <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${INK};">
      Gray<span style="color:${gold};">·</span>Content<span style="color:${gold};">·</span>Studio
    </p>
    <p style="margin:22px 0 0 0;font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:${gold};">${esc(opts.eyebrow)}</p>
    <h1 style="margin:8px 0 0 0;font-size:26px;line-height:1.25;color:${INK};font-weight:700;">${esc(opts.heading)}</h1>
  </td></tr>

  ${opts.body}

  <tr><td bgcolor="${PAPER}" style="background:${PAPER};padding:18px 34px;border-top:1px solid ${RULE};">
    <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
      ${esc(LEGAL.entity)} — Video Production · Editing · Animation<br>
      ${esc(LEGAL.postalAddress)}
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

/** Rows of "label — value", used for the details block in both messages. */
function detailRows(pairs: [string, string][]): string {
  return pairs
    .filter(([, v]) => v)
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:0 0 14px 0;vertical-align:top;">
          <span style="display:block;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};">${esc(label)}</span>
          <span style="display:block;font-size:15px;line-height:1.5;color:${INK};margin-top:3px;">${esc(value)}</span>
        </td>
      </tr>`
    )
    .join("");
}

/* ------------------------------------------------------------- customer -- */

/** The confirmation the customer receives. Confirms receipt and sets the
    expectation that the studio makes contact — it does not confirm a booking,
    because nothing is booked at this point. */
export function renderCustomerEmail(opts: {
  campaign: Campaign;
  inquiry: InquiryInput;
}): MailMessage {
  const { campaign, inquiry } = opts;
  const firstName = inquiry.name.trim().split(/\s+/)[0] || "there";
  const typeLabel = sessionTypeLabel(campaign, inquiry.sessionType);
  const dateLabel = inquiry.preferredDate ? formatDate(inquiry.preferredDate) : "";

  const body = `
  <tr><td bgcolor="${SURFACE}" style="background:${SURFACE};padding:32px 34px 8px 34px;">
    <p style="margin:0 0 18px 0;font-size:16px;color:${INK};">Hi ${esc(firstName)},</p>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:${INK};">${esc(campaign.emailIntro)}</p>

    <p style="margin:0 0 14px 0;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};">What you sent us</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRows(
        [
          ["Session", campaign.title],
          ["Session type", typeLabel],
          ["Preferred date", dateLabel],
          ["Phone", inquiry.phone],
          ["Inspiration / ideas", inquiry.ideas],
        ]
      )}
    </table>

    <p style="margin:8px 0 26px 0;font-size:15px;line-height:1.65;color:${MUTED};">${esc(campaign.emailNextSteps)}</p>

    <p style="margin:0 0 30px 0;font-size:15px;line-height:1.65;color:${MUTED};">
      If anything above is wrong, just reply to this message and we'll fix it.
    </p>
  </td></tr>`;

  const html = shell({
    campaign,
    preheader: `We've received your ${campaign.title} request. We'll be in touch to confirm the details.`,
    eyebrow: "Request received",
    heading: campaign.title,
    body,
  });

  const text = [
    `Hi ${firstName},`,
    "",
    campaign.emailIntro,
    "",
    "WHAT YOU SENT US",
    `Session: ${campaign.title}`,
    `Session type: ${typeLabel}`,
    ...(dateLabel ? [`Preferred date: ${dateLabel}`] : []),
    `Phone: ${inquiry.phone}`,
    ...(inquiry.ideas ? [`Inspiration / ideas: ${inquiry.ideas}`] : []),
    "",
    campaign.emailNextSteps,
    "",
    "If anything above is wrong, just reply to this message and we'll fix it.",
    "",
    `${LEGAL.entity} — Video Production · Editing · Animation`,
    LEGAL.postalAddress,
  ].join("\n");

  return { subject: campaign.emailSubject, html, text };
}

/* --------------------------------------------------------------- studio -- */

/** The studio's copy of the inquiry. Everything needed to reply is in the
    message body, so a reply can go out from a phone without opening the CRM. */
export function renderStudioEmail(opts: {
  campaign: Campaign;
  inquiry: InquiryInput;
  leadId: string | null;
}): MailMessage {
  const { campaign, inquiry, leadId } = opts;
  const theme = themeById(campaign.themeId);
  const gold = opaque(theme.accent, "#fac748");
  const typeLabel = sessionTypeLabel(campaign, inquiry.sessionType);
  const dateLabel = inquiry.preferredDate ? formatDate(inquiry.preferredDate) : "Not given";
  const crmUrl = `${SITE_URL}/admin/crm`;

  const body = `
  <tr><td bgcolor="${SURFACE}" style="background:${SURFACE};padding:32px 34px 8px 34px;">
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:${INK};">
      New <strong style="color:${gold};">${esc(campaign.title)}</strong> inquiry from the website.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRows(
        [
          ["Name", inquiry.name],
          ["Email", inquiry.email],
          ["Phone", inquiry.phone],
          ["Preferred date", dateLabel],
          ["Session type", typeLabel],
          ["Inspiration / ideas", inquiry.ideas || "—"],
        ]
      )}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 6px 0;">
      <tr><td style="padding:8px 0 22px 0;">
        <a href="mailto:${esc(inquiry.email)}" style="display:inline-block;background:${gold};color:${PAPER};text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:14px 28px;border-radius:999px;">Reply to ${esc(inquiry.name.split(/\s+/)[0] || "them")}</a>
      </td></tr>
      <tr><td style="padding:0 0 20px 0;">
        <a href="${esc(crmUrl)}" style="font-size:13px;color:${gold};text-decoration:none;">Open the CRM board →</a>
        ${leadId ? `<span style="font-size:12px;color:${MUTED};"> · lead ${esc(leadId)}</span>` : ""}
      </td></tr>
    </table>
  </td></tr>`;

  const html = shell({
    campaign,
    preheader: `${inquiry.name} · ${typeLabel} · ${dateLabel}`,
    eyebrow: "New inquiry",
    heading: campaign.title,
    body,
  });

  const text = [
    `New ${campaign.title} inquiry from the website.`,
    "",
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Phone: ${inquiry.phone}`,
    `Preferred date: ${dateLabel}`,
    `Session type: ${typeLabel}`,
    `Inspiration / ideas: ${inquiry.ideas || "—"}`,
    "",
    `Reply: mailto:${inquiry.email}`,
    `CRM: ${crmUrl}`,
    ...(leadId ? [`Lead: ${leadId}`] : []),
  ].join("\n");

  return {
    subject: `New ${campaign.title} inquiry — ${inquiry.name}`,
    html,
    text,
  };
}

/** Who a campaign email comes from.

    These pages are a consumer photography promotion, not the diagnostic, so
    they send under the studio's own address rather than the diagnostic@ sender
    the other features share. Falls back to that shared sender when unset, so an
    install without the variable still delivers — Admin → Campaigns prints the
    address actually in use, since a wrong-but-working sender is otherwise
    invisible until someone reads a received message. */
export function campaignFrom(): string | undefined {
  return envStr("CAMPAIGN_FROM_EMAIL") ?? mailFrom();
}

/** Thin wrappers over the shared transport, so the log tag is consistent. */

/** The customer's confirmation. Reply-to is left at the shared studio address —
    the message invites a reply if a detail is wrong, and that reply should
    reach the studio. */
export async function sendCustomerEmail(to: string, message: MailMessage): Promise<boolean> {
  return sendMail(to, message, "campaign", { from: campaignFrom() });
}

/** The studio's copy. Reply-to is the person who inquired, so hitting Reply in
    the inbox answers them directly instead of looping back to the studio's own
    address. `replyTo` is safe to take from the form because validateInquiry has
    already matched it against EMAIL_RE, which forbids whitespace — there is no
    room for a second address or a header break. */
export async function sendStudioEmail(
  to: string,
  message: MailMessage,
  replyTo?: string
): Promise<boolean> {
  return sendMail(to, message, "campaign-studio", { from: campaignFrom(), replyTo });
}
