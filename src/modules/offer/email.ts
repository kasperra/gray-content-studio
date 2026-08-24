import { LEGAL } from "@/content/legal";

/* The coupon email — delivery of something the visitor asked for, not a
   newsletter. The code is shown on screen once; this is what makes it
   recoverable a week later when they're ready to book.

   Rendered light rather than in the site's near-black, for the same reason the
   diagnostic email is: dark HTML renders unpredictably across clients. */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.graycontentstudio.co";
const DIAGNOSTIC = process.env.DIAGNOSTIC_URL || "https://diagnostic.graycontentstudio.co";

const INK = "#1c1a17";
const MUTED = "#6f6a62";
const GOLD = "#b5842e"; // Tuscan Sun darkened for contrast on cream
const PAPER = "#faf8f4";
const RULE = "#e4ded3";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderCouponEmail(opts: {
  code: string;
  discountLabel: string;
  discountNote: string;
  eligibility: string;
  expiresAt: Date;
  /** What they said they needed, echoed back so this reads as a reply. */
  answerLabel: string;
}): { subject: string; html: string; text: string } {
  const { code, discountLabel, discountNote, eligibility, expiresAt, answerLabel } = opts;
  const expiry = expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const subject = `Your Gray Content Studio discount code: ${code}`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(discountLabel)} — code ${esc(code)}, valid through ${esc(expiry)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${RULE};border-radius:10px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <tr><td style="background:#0b0b0c;padding:30px 34px;">
    <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#f5f2ec;">
      Gray<span style="color:#fac748;">·</span>Content<span style="color:#fac748;">·</span>Studio
    </p>
    <p style="margin:22px 0 0 0;font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#fac748;">Your discount</p>
    <h1 style="margin:8px 0 0 0;font-size:26px;line-height:1.25;color:#f5f2ec;font-weight:700;">${esc(discountLabel)}</h1>
  </td></tr>

  <tr><td style="padding:32px 34px 0 34px;">
    <p style="margin:0 0 26px 0;font-size:16px;line-height:1.6;color:${INK};">
      Here's your code — keep this email so you have it when you're ready.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf7e9;border:1px solid #f0dda8;border-radius:8px;margin:0 0 20px 0;">
      <tr><td align="center" style="padding:26px 22px;">
        <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};">Your code</p>
        <p style="margin:0 0 10px 0;font-size:30px;font-weight:700;letter-spacing:.1em;color:${GOLD};">${esc(code)}</p>
        <p style="margin:0;font-size:13px;color:${MUTED};">Valid through ${esc(expiry)}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 8px 0;font-size:14px;line-height:1.65;color:${INK};">${esc(discountNote)}</p>
    <p style="margin:0 0 28px 0;font-size:13px;line-height:1.6;color:${MUTED};">${esc(eligibility)}</p>

    <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};">How to use it</p>
    <p style="margin:0 0 28px 0;font-size:14px;line-height:1.65;color:${MUTED};">
      Reply to this email or start a project on the site and mention your code. We'll apply it to
      your proposal before it's finalised.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px 0;">
      <tr><td align="center" style="padding:6px 0 8px 0;">
        <a href="${esc(SITE)}/#contact" style="display:inline-block;background:#0b0b0c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:15px 30px;border-radius:999px;">Start a Project</a>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:26px 34px 34px 34px;">
    <div style="border-top:1px solid ${RULE};padding-top:24px;">
      <p style="margin:0 0 8px 0;font-size:15px;font-weight:700;color:${INK};">You told us you want to ${esc(answerLabel.toLowerCase())}.</p>
      <p style="margin:0 0 18px 0;font-size:14px;line-height:1.65;color:${MUTED};">
        That's an initial signal. The full Gray Content Growth Diagnostic goes deeper — your current
        growth stage, your biggest bottleneck, and a personalized 30-day plan. It takes a few minutes.
      </p>
      <a href="${esc(DIAGNOSTIC)}" style="display:inline-block;background:#fac748;color:#0b0b0c;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:13px 26px;border-radius:999px;">Take the Full Diagnostic</a>
    </div>
  </td></tr>

  <tr><td style="background:${PAPER};padding:18px 34px;border-top:1px solid ${RULE};">
    <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
      ${esc(LEGAL.entity)} — Video Production · Editing · Animation<br>
      ${esc(LEGAL.postalAddress)}<br>
      You're receiving this because you requested a discount code at
      ${esc(SITE.replace(/^https?:\/\//, ""))}.
      <a href="${esc(SITE)}/offer-terms" style="color:${MUTED};">Coupon terms</a> ·
      <a href="${esc(SITE)}/privacy" style="color:${MUTED};">Privacy</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  const text = [
    discountLabel,
    "",
    "Here's your code — keep this email so you have it when you're ready.",
    "",
    `CODE: ${code}`,
    `Valid through ${expiry}`,
    "",
    discountNote,
    eligibility,
    "",
    "HOW TO USE IT",
    "Reply to this email or start a project on the site and mention your code. We'll apply it to your proposal before it's finalised.",
    `${SITE}/#contact`,
    "",
    `You told us you want to ${answerLabel.toLowerCase()}. That's an initial signal — the full Gray`,
    "Content Growth Diagnostic identifies your growth stage, biggest bottleneck, and a 30-day plan:",
    DIAGNOSTIC,
    "",
    `${LEGAL.entity} — Video Production · Editing · Animation`,
    LEGAL.postalAddress,
    `You're receiving this because you requested a discount code at ${SITE.replace(/^https?:\/\//, "")}.`,
    `Coupon terms: ${SITE}/offer-terms · Privacy: ${SITE}/privacy`,
  ].join("\n");

  return { subject, html, text };
}
