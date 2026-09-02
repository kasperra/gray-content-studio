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

/** The default sender. MAIL_FROM_EMAIL is the name to use going forward;
    DIAGNOSTIC_FROM_EMAIL is what's already set in Vercel and keeps working.

    A feature that should send under its own identity passes `from` to sendMail
    rather than changing this — every caller shares it, so moving it moves the
    diagnostic and the offer coupon too. */
export function mailFrom(): string | undefined {
  return envStr("MAIL_FROM_EMAIL") ?? envStr("DIAGNOSTIC_FROM_EMAIL");
}

export type MailMessage = { subject: string; html: string; text: string };

/** Per-message overrides of the two addresses a reply depends on.

    `from` must be on a domain verified in Resend or delivery fails, so callers
    pass an env-provided value and fall back to mailFrom() rather than
    hardcoding an address. `replyTo` is where a reply lands, which is not always
    the studio: a notification *about* someone is most useful when Reply reaches
    them. Both default to the shared configuration when omitted. */
export type SendOptions = { from?: string; replyTo?: string };

/** Returns false (never throws) when unconfigured or failing — a delivery
    problem must never cost us the lead that triggered it. `tag` only labels the
    server log so a failure can be traced to the feature that sent it. */
export async function sendMail(
  to: string,
  message: MailMessage,
  tag: string,
  opts: SendOptions = {}
): Promise<boolean> {
  const key = envStr("RESEND_API_KEY");
  const from = opts.from ?? mailFrom();
  if (!key || !from) return false;

  const replyTo = opts.replyTo ?? envStr("DIAGNOSTIC_REPLY_TO");

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
        ...(replyTo ? { reply_to: replyTo } : {}),
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
