/* The studio's one outbound mail path.

   Resend's REST API via plain fetch — one POST, no SDK dependency. Provider
   details live behind sendMail so swapping to Postmark or SES later is a single
   function. Strictly opt-in on env: with the key or from-address unset, every
   send is a silent no-op and the feature that called it carries on.

   Extracted from modules/diagnostic/email.ts when the offer popup needed to
   send too. The diagnostic's env var names are still honoured so nothing has to
   be re-entered in Vercel. */

/** Env values pasted into a dashboard routinely carry a trailing newline or
    wrapping quotes; either produces a malformed header and a confusing 401. */
export function envStr(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;
  const clean = raw.trim().replace(/^["']|["']$/g, "").trim();
  return clean || undefined;
}

/** MAIL_FROM_EMAIL is the name to use going forward; DIAGNOSTIC_FROM_EMAIL is
    what's already set in Vercel and keeps working. */
export function mailFrom(): string | undefined {
  return envStr("MAIL_FROM_EMAIL") ?? envStr("DIAGNOSTIC_FROM_EMAIL");
}

export type MailMessage = { subject: string; html: string; text: string };

/** Returns false (never throws) when unconfigured or failing — a delivery
    problem must never cost us the lead that triggered it. `tag` only labels the
    server log so a failure can be traced to the feature that sent it. */
export async function sendMail(to: string, message: MailMessage, tag: string): Promise<boolean> {
  const key = envStr("RESEND_API_KEY");
  const from = mailFrom();
  if (!key || !from) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(envStr("DIAGNOSTIC_REPLY_TO") ? { reply_to: envStr("DIAGNOSTIC_REPLY_TO") } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`[${tag}] email send failed`, res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[${tag}] email send threw`, err);
    return false;
  }
}
