/* First-visit offer popup — shared constants and pure helpers.

   Deliberately free of React and Supabase imports so the rules that decide a
   coupon's code and expiry can be checked in a plain node process
   (see offer.test.ts), and so the client bundle can import the copy. */

/** The one question, and what each answer signals internally.

    The visitor is never told their answer maps to a stage — they're picking the
    outcome they want. The mapping is stored so a claim can later be compared
    with, or upgraded into, a full Content Growth Diagnostic. Ids and bottleneck
    keys match the diagnostic's own vocabulary. */
export const OFFER_CHOICES = [
  { id: "discover", label: "Get more people to discover us", stage: 1, bottleneck: "visibility" },
  { id: "consistency", label: "Know what to create and stay consistent", stage: 2, bottleneck: "strategy" },
  { id: "convert", label: "Turn attention into more leads and customers", stage: 3, bottleneck: "conversion" },
  {
    id: "scale",
    label: "Create and distribute more content without doing everything ourselves",
    stage: 4,
    bottleneck: "production",
  },
  {
    id: "optimize",
    label: "Optimize our entire content engine for better results",
    stage: 5,
    bottleneck: "optimization",
  },
] as const;

export type OfferChoiceId = (typeof OFFER_CHOICES)[number]["id"];

export function choiceById(id: string) {
  return OFFER_CHOICES.find((c) => c.id === id);
}

/* ---------------------------------------------------------------- consent -- */

/** Bump whenever the wording below changes. Stored on every claim so an old
    consent can always be read back against the exact text it was given under. */
export const CONSENT_VERSION = "2026-08-24.1";

export const EMAIL_CONSENT_COPY =
  "Yes, I'd like to receive occasional emails from Gray Content Studio about content, marketing, offers, and related services. I understand I can unsubscribe at any time.";

export const SMS_CONSENT_COPY =
  "Yes, I agree to receive recurring marketing text messages from Gray Content Studio at the phone number provided, including promotional offers and updates. Consent is not a condition of purchase. Message frequency varies. Message and data rates may apply. Reply STOP to opt out and HELP for help.";

/* --------------------------------------------------------------- settings -- */

export type OfferSettings = {
  enabled: boolean;
  headline: string;
  discountLabel: string;
  discountNote: string;
  couponDays: number;
  codePrefix: string;
  delaySeconds: number;
  scrollPercent: number;
  exitIntent: boolean;
  suppressDays: number;
  /** Off unless Gray actually sends marketing texts — with it off the SMS
      consent box isn't rendered and sms_consent is always stored false. */
  smsEnabled: boolean;
  eligibility: string;
};

export const OFFER_DEFAULTS: OfferSettings = {
  enabled: false, // opt-in: an unconfigured install shows nothing
  headline: "What would make your content work harder for your business right now?",
  discountLabel: "10% off your first project",
  discountNote: "Applies to your first booked project with Gray Content Studio.",
  couponDays: 30,
  codePrefix: "GRAY",
  delaySeconds: 25,
  scrollPercent: 45,
  exitIntent: true,
  suppressDays: 14,
  smsEnabled: false,
  eligibility:
    "One coupon per business. Applies to new projects only, cannot be combined with other offers or applied to work already booked, and has no cash value.",
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function num(raw: string | undefined, fallback: number, lo: number, hi: number) {
  const n = Number(raw);
  return Number.isFinite(n) ? clamp(Math.round(n), lo, hi) : fallback;
}

const bool = (raw: string | undefined, fallback: boolean) =>
  raw === undefined ? fallback : raw === "true";

const str = (raw: string | undefined, fallback: string, max: number) =>
  (raw ?? "").trim() ? (raw as string).trim().slice(0, max) : fallback;

/** Read the `offer_*` rows out of the config store, with code defaults for any
    key that's missing — so the popup behaves sanely before the migration runs. */
export function parseSettings(kv: Record<string, string>): OfferSettings {
  return {
    enabled: bool(kv.offer_enabled, OFFER_DEFAULTS.enabled),
    headline: str(kv.offer_headline, OFFER_DEFAULTS.headline, 240),
    discountLabel: str(kv.offer_discount_label, OFFER_DEFAULTS.discountLabel, 120),
    discountNote: str(kv.offer_discount_note, OFFER_DEFAULTS.discountNote, 300),
    couponDays: num(kv.offer_coupon_days, OFFER_DEFAULTS.couponDays, 1, 365),
    codePrefix: str(kv.offer_code_prefix, OFFER_DEFAULTS.codePrefix, 12)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") || OFFER_DEFAULTS.codePrefix,
    delaySeconds: num(kv.offer_delay_seconds, OFFER_DEFAULTS.delaySeconds, 0, 600),
    scrollPercent: num(kv.offer_scroll_percent, OFFER_DEFAULTS.scrollPercent, 0, 100),
    exitIntent: bool(kv.offer_exit_intent, OFFER_DEFAULTS.exitIntent),
    suppressDays: num(kv.offer_suppress_days, OFFER_DEFAULTS.suppressDays, 0, 365),
    smsEnabled: bool(kv.offer_sms_enabled, OFFER_DEFAULTS.smsEnabled),
    eligibility: str(kv.offer_eligibility, OFFER_DEFAULTS.eligibility, 1200),
  };
}

export function serializeSettings(s: OfferSettings): Record<string, string> {
  return {
    offer_enabled: String(s.enabled),
    offer_headline: s.headline,
    offer_discount_label: s.discountLabel,
    offer_discount_note: s.discountNote,
    offer_coupon_days: String(s.couponDays),
    offer_code_prefix: s.codePrefix,
    offer_delay_seconds: String(s.delaySeconds),
    offer_scroll_percent: String(s.scrollPercent),
    offer_exit_intent: String(s.exitIntent),
    offer_suppress_days: String(s.suppressDays),
    offer_sms_enabled: String(s.smsEnabled),
    offer_eligibility: s.eligibility,
  };
}

/* ----------------------------------------------------------------- coupon -- */

/** No 0/O/1/I/L — a code gets read off a screen and typed into an email. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function randomCode(prefix: string, random: () => number = Math.random): string {
  let body = "";
  for (let i = 0; i < 6; i += 1) body += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return `${prefix}-${body}`;
}

export function expiresAt(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 86_400_000);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Keep what the visitor typed, but require enough digits to be a real number.
    No country-specific normalising — this is a callback number, not a dialer. */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim().slice(0, 32);
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return trimmed;
}
