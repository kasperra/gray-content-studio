/* Seasonal campaign landing pages — types, themes, and pure helpers.

   Deliberately free of React and Supabase imports so the validation rules and
   the config round-trip can be exercised in a plain node process
   (see campaign.test.ts), and so the client bundle can import the copy.

   The page at /fall-mini-sessions is one *instance* of this: every string,
   price, bullet, image and form option it renders comes from a Campaign object,
   and none of it is written into the page component. A second season is a new
   entry in campaigns.ts plus a three-line route file — see the note there. */

/* ------------------------------------------------------------------ theme -- */

/** A season's colour treatment, layered over the brand's near-black ground.

    Tuscan Sun stays the primary accent on every theme — a seasonal page still
    has to read as Gray Content Studio — and the season moves `warm`, `glow`
    and `deep`, which carry the gradients, the ground wash and the depth
    panels. Values are plain CSS colours, applied as custom properties on the
    page wrapper so the whole page re-skins from this one object. */
export type CampaignTheme = {
  id: string;
  label: string;
  /** Brand accent. Buttons, eyebrows, prices. */
  accent: string;
  /** Season's own hue. Gradient partner to `accent`, used for rules and glyphs. */
  warm: string;
  /** Translucent `warm`, for card fills and chips. */
  warmSoft: string;
  /** Large radial wash behind the hero and closing sections. */
  glow: string;
  /** Depth colour behind panels — the brand's Rich Mahogany, per season. */
  deep: string;
};

/** Presets the studio can start a new season from. Colour only: no season
    carries an offer, a price or a date, because those are facts about a real
    promotion and belong in the campaign itself. */
export const CAMPAIGN_THEMES = {
  fall: {
    id: "fall",
    label: "Fall",
    accent: "#fac748",
    warm: "#d2703a",
    warmSoft: "rgba(210, 112, 58, 0.16)",
    glow: "rgba(210, 112, 58, 0.22)",
    deep: "#301509",
  },
  winter: {
    id: "winter",
    label: "Christmas / Winter",
    accent: "#fac748",
    warm: "#8fb3c9",
    warmSoft: "rgba(143, 179, 201, 0.16)",
    glow: "rgba(143, 179, 201, 0.20)",
    deep: "#132029",
  },
  spring: {
    id: "spring",
    label: "Spring",
    accent: "#fac748",
    warm: "#c98ba8",
    warmSoft: "rgba(201, 139, 168, 0.16)",
    glow: "rgba(201, 139, 168, 0.20)",
    deep: "#2a1520",
  },
  summer: {
    id: "summer",
    label: "Summer",
    accent: "#fac748",
    warm: "#4fa3a0",
    warmSoft: "rgba(79, 163, 160, 0.16)",
    glow: "rgba(79, 163, 160, 0.20)",
    deep: "#0f2422",
  },
  valentines: {
    id: "valentines",
    label: "Valentine's",
    accent: "#fac748",
    warm: "#c2506a",
    warmSoft: "rgba(194, 80, 106, 0.16)",
    glow: "rgba(194, 80, 106, 0.20)",
    deep: "#2b0f18",
  },
  senior: {
    id: "senior",
    label: "Senior portraits",
    accent: "#fac748",
    warm: "#9a86c4",
    warmSoft: "rgba(154, 134, 196, 0.16)",
    glow: "rgba(154, 134, 196, 0.20)",
    deep: "#1c1730",
  },
  custom: {
    id: "custom",
    label: "Custom sessions",
    accent: "#fac748",
    warm: "#9b968e",
    warmSoft: "rgba(155, 150, 142, 0.16)",
    glow: "rgba(155, 150, 142, 0.18)",
    deep: "#1b1b1e",
  },
} as const satisfies Record<string, CampaignTheme>;

export type CampaignThemeId = keyof typeof CAMPAIGN_THEMES;

export function themeById(id: string): CampaignTheme {
  return CAMPAIGN_THEMES[id as CampaignThemeId] ?? CAMPAIGN_THEMES.custom;
}

/** The theme as CSS custom properties, spread onto the page wrapper's style. */
export function themeVars(theme: CampaignTheme): React.CSSProperties {
  return {
    "--c-accent": theme.accent,
    "--c-warm": theme.warm,
    "--c-warm-soft": theme.warmSoft,
    "--c-glow": theme.glow,
    "--c-deep": theme.deep,
  } as React.CSSProperties;
}

/* --------------------------------------------------------------- campaign -- */

/** One option in the session-type picker. `value` is what lands in the CRM, so
    it is stable even if the visitor-facing `label` is reworded later. */
export type SessionTypeOption = { value: string; label: string };

/** A gallery slot. `src` is optional on purpose: a campaign is publishable
    before its photographs exist, and an empty slot renders as a composed
    seasonal panel rather than a broken image or a hole in the layout. Drop a
    file in /public/img/campaigns/<slug>/ and set `src` to fill it. */
export type CampaignImage = { src?: string; alt: string; caption?: string };

export type CampaignStep = { title: string; detail: string };

export type Campaign = {
  /** URL slug, and the namespace for this campaign's config-store overrides. */
  slug: string;
  /** Switches the public page on. An unpublished campaign 404s. */
  published: boolean;
  themeId: CampaignThemeId;

  /** Small all-caps line above the hero headline — where the emoji live. */
  eyebrow: string;
  /** The offer itself, e.g. "Fall Mini Sessions". */
  title: string;
  /** Rendered beside the title at display size, e.g. "$150". */
  price: string;
  /** One or two sentences under the headline. No facts beyond the offer. */
  lede: string;

  /** Everything the session includes, verbatim from the offer. */
  includes: string[];
  /** Who the sessions suit, one card each. */
  audience: { title: string; detail: string }[];
  /** How booking works, in order. */
  steps: CampaignStep[];

  gallery: CampaignImage[];
  /** Heading and lede for the gallery block. */
  galleryTitle: string;
  galleryLede: string;

  /** Primary call to action, used in the hero, the sticky bar and the closer. */
  ctaLabel: string;
  /** Heading above the inquiry form. */
  formTitle: string;
  formLede: string;
  /** Label for the form's date field — a season may ask this differently. */
  dateLabel: string;
  sessionTypes: SessionTypeOption[];
  /** Label and placeholder for the free-text field. */
  ideasLabel: string;
  ideasPlaceholder: string;
  /** Shown in place of the form once an inquiry goes through. */
  confirmationTitle: string;
  confirmationBody: string;

  /** Closing section above the footer. */
  closingTitle: string;
  closingLede: string;

  /** Subject line of the confirmation email sent to the customer. */
  emailSubject: string;
  /** Lead paragraph of that email. */
  emailIntro: string;
  /** What happens next, in that email and on the confirmation screen. */
  emailNextSteps: string;

  /** <title> and meta description. */
  metaTitle: string;
  metaDescription: string;
};

/* --------------------------------------------------------------- overrides -- */

/* Fields the studio can edit at runtime from /admin/campaigns, stored in the
   shared config table as `campaign_<slug>_<field>`. Everything structural
   (gallery slots, audience cards, steps) stays in campaigns.ts, where it is
   reviewed and versioned; these are the values a promotion actually changes
   between runs — the offer, the price, the copy, the CTA and the emails. */
export const EDITABLE_FIELDS = [
  "published",
  "eyebrow",
  "title",
  "price",
  "lede",
  "includes",
  "ctaLabel",
  "formTitle",
  "formLede",
  "dateLabel",
  "confirmationTitle",
  "confirmationBody",
  "closingTitle",
  "closingLede",
  "emailSubject",
  "emailIntro",
  "emailNextSteps",
  "metaTitle",
  "metaDescription",
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

/** `includes` is a list; it round-trips through the key/value store as one
    newline-separated block, which is also how it is edited in the admin form. */
const LIST_FIELDS = new Set<EditableField>(["includes"]);
const BOOL_FIELDS = new Set<EditableField>(["published"]);

export function configKey(slug: string, field: EditableField): string {
  return `campaign_${slug.replace(/-/g, "_")}_${field}`;
}

const MAX_LEN = 2000;

function cleanLine(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/** Apply the stored overrides to a campaign's code defaults. Anything missing,
    blank or malformed falls back to the default, so the page renders correctly
    before the migration runs and cannot be blanked out by a bad row. */
export function applyOverrides(base: Campaign, kv: Record<string, string>): Campaign {
  const next: Campaign = { ...base };
  for (const field of EDITABLE_FIELDS) {
    const raw = kv[configKey(base.slug, field)];
    if (raw === undefined) continue;

    if (BOOL_FIELDS.has(field)) {
      if (raw === "true" || raw === "false") next.published = raw === "true";
      continue;
    }
    if (LIST_FIELDS.has(field)) {
      const items = raw
        .split("\n")
        .map(cleanLine)
        .filter(Boolean)
        .slice(0, 20);
      if (items.length) next.includes = items;
      continue;
    }
    const value = raw.trim().slice(0, MAX_LEN);
    if (value) (next as unknown as Record<string, string>)[field] = value;
  }
  return next;
}

/** The rows to write for a campaign — the inverse of applyOverrides. */
export function serializeOverrides(campaign: Campaign): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of EDITABLE_FIELDS) {
    const key = configKey(campaign.slug, field);
    if (BOOL_FIELDS.has(field)) out[key] = String(campaign.published);
    else if (LIST_FIELDS.has(field)) out[key] = campaign.includes.join("\n");
    else out[key] = String((campaign as unknown as Record<string, unknown>)[field] ?? "");
  }
  return out;
}

/* -------------------------------------------------------------- inquiries -- */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type InquiryInput = {
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  sessionType: string;
  ideas: string;
};

export type InquiryErrors = Partial<Record<keyof InquiryInput, string>>;

/** Keep what the visitor typed, but require enough digits to be a real number.
    No country-specific normalising — this is a callback number, not a dialer.
    Mirrors the offer popup's rule so the CRM sees one shape of phone number. */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim().slice(0, 32);
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return trimmed;
}

/** A preferred date is a request, not a booking — the studio confirms the real
    one. So it is stored as the ISO day the visitor picked and nothing more;
    anything unparseable or absurd is rejected rather than guessed at. */
export function normalizeDate(raw: string, today = new Date()): string | null {
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  // Round today to its own UTC noon so a same-day request is always allowed.
  const floor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12, 0, 0)
  );
  const ceiling = new Date(floor.getTime() + 366 * 86_400_000);
  if (parsed < floor || parsed > ceiling) return null;
  return trimmed;
}

/** Human form of a stored ISO day, for emails and the CRM note. */
export function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Validate an inquiry against its campaign. Returns the cleaned values and a
    per-field error map, so the form can mark the field that actually failed
    instead of showing one generic message at the bottom. */
export function validateInquiry(
  raw: Partial<InquiryInput>,
  campaign: Pick<Campaign, "sessionTypes">,
  today = new Date()
): { values: InquiryInput; errors: InquiryErrors } {
  const errors: InquiryErrors = {};

  const name = String(raw.name ?? "").trim().slice(0, 120);
  if (name.length < 2) errors.name = "Please enter your full name.";

  const email = String(raw.email ?? "").trim().toLowerCase().slice(0, 200);
  if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email address.";

  const phoneRaw = String(raw.phone ?? "");
  const phone = normalizePhone(phoneRaw);
  if (!phone) errors.phone = "Please enter a phone number we can reach you on.";

  const dateRaw = String(raw.preferredDate ?? "");
  const preferredDate = normalizeDate(dateRaw, today);
  if (!preferredDate) errors.preferredDate = "Please choose a date within the next year.";

  const sessionType = String(raw.sessionType ?? "").trim();
  const known = campaign.sessionTypes.some((t) => t.value === sessionType);
  if (!known) errors.sessionType = "Please choose a session type.";

  const ideas = String(raw.ideas ?? "").trim().slice(0, 2000);

  return {
    values: {
      name,
      email,
      phone: phone ?? phoneRaw.trim().slice(0, 32),
      preferredDate: preferredDate ?? "",
      sessionType,
      ideas,
    },
    errors,
  };
}

/** Label for a stored session-type value, for emails and the CRM note. */
export function sessionTypeLabel(campaign: Pick<Campaign, "sessionTypes">, value: string): string {
  return campaign.sessionTypes.find((t) => t.value === value)?.label ?? value;
}
