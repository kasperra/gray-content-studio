import { LEGAL } from "@/content/legal";

/* The coupon email — delivery of something the visitor asked for, not a
   newsletter. The code is shown on screen once; this is what makes it
   recoverable a week later when they're ready to book.

   Rendered in the brand's near-black rather than the safer light treatment,
   which needs three specific defences to survive real inboxes:

     1. color-scheme / supported-color-schemes tell Gmail and Outlook the design
        is already dark, so their dark modes leave it alone instead of inverting
        near-black into near-white and dragging the text with it.
     2. Every colour is an opaque hex. Outlook's Word engine drops rgba(), which
        would leave gold-on-gold panels and invisible rules.
     3. bgcolor attributes sit alongside the CSS background on every table cell,
        because that same engine ignores CSS backgrounds — without them the card
        renders white and the off-white type disappears.

   Colours mirror globals.css: bg #0b0b0c, surface #141416, ink #f5f2ec,
   muted #9b968e, Tuscan Sun #fac748, Rich Mahogany #301509 for the header. */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.graycontentstudio.co";
const DIAGNOSTIC = process.env.DIAGNOSTIC_URL || "https://diagnostic.graycontentstudio.co";

const BG = "#0b0b0c"; // page ground
const SURFACE = "#141416"; // card
const INK = "#f5f2ec";
const MUTED = "#9b968e";
const ACCENT = "#fac748"; // Tuscan Sun
const MAHOGANY = "#301509"; // Rich Mahogany — the header's depth
const RULE = "#2a2a2c"; // flattened from rgba(245,242,236,0.12) over SURFACE
const ACCENT_SOFT = "#342d1d"; // flattened from rgba(250,199,72,0.14) over SURFACE
const ACCENT_EDGE = "#705c2a"; // flattened from accent at 40% over SURFACE

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
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<style>:root{color-scheme:dark;supported-color-schemes:dark;}</style>
</head>
<body style="margin:0;padding:0;background:${BG};color-scheme:dark;" bgcolor="${BG}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(discountLabel)} — code ${esc(code)}, valid through ${esc(expiry)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BG}" style="background:${BG};padding:28px 12px;">
<tr><td align="center" bgcolor="${BG}" style="background:${BG};">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${SURFACE}" style="width:600px;max-width:100%;background:${SURFACE};border:1px solid ${RULE};border-radius:10px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <tr><td bgcolor="${MAHOGANY}" style="background:${MAHOGANY};padding:30px 34px;">
    <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${INK};">
      Gray<span style="color:${ACCENT};">·</span>Content<span style="color:${ACCENT};">·</span>Studio
    </p>
    <p style="margin:22px 0 0 0;font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:${ACCENT};">Your discount</p>
    <h1 style="margin:8px 0 0 0;font-size:26px;line-height:1.25;color:${INK};font-weight:700;">${esc(discountLabel)}</h1>
  </td></tr>

  <tr><td bgcolor="${SURFACE}" style="background:${SURFACE};padding:32px 34px 0 34px;">
    <p style="margin:0 0 26px 0;font-size:16px;line-height:1.6;color:${INK};">
      Here's your code — keep this email so you have it when you're ready.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${ACCENT_SOFT}" style="background:${ACCENT_SOFT};border:1px solid ${ACCENT_EDGE};border-radius:8px;margin:0 0 20px 0;">
      <tr><td align="center" bgcolor="${ACCENT_SOFT}" style="background:${ACCENT_SOFT};padding:26px 22px;">
        <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};">Your code</p>
        <p style="margin:0 0 10px 0;font-size:30px;font-weight:700;letter-spacing:.1em;color:${ACCENT};">${esc(code)}</p>
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

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center" style="padding:6px 0 8px 0;">
        <a href="${esc(SITE)}/#contact" style="display:inline-block;background:${ACCENT};color:${BG};text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:15px 30px;border-radius:999px;">Start a Project</a>
      </td></tr>
    </table>
  </td></tr>

  <tr><td bgcolor="${SURFACE}" style="background:${SURFACE};padding:26px 34px 34px 34px;">
    <div style="border-top:1px solid ${RULE};padding-top:24px;">
      <p style="margin:0 0 8px 0;font-size:15px;font-weight:700;color:${INK};">You told us you want to ${esc(answerLabel.toLowerCase())}.</p>
      <p style="margin:0 0 18px 0;font-size:14px;line-height:1.65;color:${MUTED};">
        That's an initial signal. The full Gray Content Growth Diagnostic goes deeper — your current
        growth stage, your biggest bottleneck, and a personalized 30-day plan. It takes a few minutes.
      </p>
      <a href="${esc(DIAGNOSTIC)}" style="display:inline-block;background:${SURFACE};color:${ACCENT};text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:13px 26px;border:1px solid ${ACCENT};border-radius:999px;">Take the Full Diagnostic</a>
    </div>
  </td></tr>

  <tr><td bgcolor="${BG}" style="background:${BG};padding:20px 34px;border-top:1px solid ${RULE};">
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
