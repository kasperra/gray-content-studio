/* Runnable check for the seasonal campaign rules:
     npx tsx src/modules/campaigns/campaign.test.ts

   Two things here are worth guarding. The override store is what stands between
   an admin edit and a live landing page, and a blank or malformed row must fall
   back to the shipped copy rather than publishing an empty offer. And the
   inquiry validator is the only thing between a public form and the CRM. */
import assert from "node:assert/strict";
import {
  applyOverrides,
  configKey,
  formatDate,
  normalizeDate,
  normalizePhone,
  serializeOverrides,
  sessionTypeLabel,
  themeById,
  validateInquiry,
  CAMPAIGN_THEMES,
  EDITABLE_FIELDS,
  type Campaign,
} from "./campaign";
import { CAMPAIGNS, campaignBySlug } from "./campaigns";
import { campaignFrom, renderStudioEmail, sendCustomerEmail, sendStudioEmail } from "./email";

const found = campaignBySlug("fall-mini-sessions");
assert.ok(found, "the fall campaign should exist");
// Re-bound with the type: assert.ok narrows here, but that narrowing doesn't
// reach inside main() below, where the async checks live.
const fall: Campaign = found;

/* ---------------------------------------------------------------- content -- */

// The offer as briefed. These are promises printed on a public page, so they're
// pinned: a typo here is a typo in what the studio is selling.
assert.equal(fall.price, "$150");
assert.equal(fall.emailSubject, "We received your Fall Mini Session request 🍂");
assert.equal(fall.ctaLabel, "Message Me to Book Your Session");
assert.deepEqual(fall.includes, [
  "30-minute session",
  "Up to 25 professionally edited digital photos",
  "Outdoor fall location",
  "Perfect for couples, families, portraits & kids",
  "Online gallery for viewing and downloading",
  "Additional images available for purchase",
  "Limited spots available this fall",
  "Dates and locations confirmed upon booking",
]);
assert.deepEqual(
  fall.sessionTypes.map((t) => t.label),
  ["Family", "Couple", "Kids", "Portrait", "Other"]
);
console.log("offer: price, CTA, email subject and all 8 inclusions match the brief ✓");

// The hero's fact row used to be hardcoded in CampaignPage, so a change to the
// offer left the layout advertising the old one. It reads from the campaign
// now, and the two must not drift apart again.
{
  const photos = fall.highlights.find((h) => h.label === "Photos");
  assert.ok(photos, "the hero should state a photo count");
  const inclusion = fall.includes.find((i) => /photo/i.test(i));
  assert.ok(inclusion, "the inclusions should state a photo count");
  const countOf = (s: string) => s.match(/\d+/)?.[0];
  assert.equal(
    countOf(photos.value),
    countOf(inclusion),
    "the hero's photo count must match what the inclusions promise"
  );
  assert.equal(countOf(photos.value), "25");
}
console.log("hero: the fact row is campaign data and agrees with the inclusions ✓");

// Every campaign needs a route-able slug and a theme that actually exists.
for (const c of CAMPAIGNS) {
  assert.match(c.slug, /^[a-z0-9-]+$/, `${c.slug} is not URL-safe`);
  assert.ok(CAMPAIGN_THEMES[c.themeId], `${c.slug} points at an unknown theme`);
}
// An unknown theme id falls back rather than throwing on a live page.
assert.equal(themeById("no-such-season").id, "custom");
console.log(`themes: ${Object.keys(CAMPAIGN_THEMES).length} presets, every campaign resolves ✓`);

/* -------------------------------------------------------------- overrides -- */

// Round-trip: serialize then apply should be the identity on editable fields.
const roundTripped = applyOverrides(fall, serializeOverrides(fall));
for (const field of EDITABLE_FIELDS) {
  assert.deepEqual(
    roundTripped[field],
    fall[field],
    `${field} did not survive the config round-trip`
  );
}
console.log(`overrides: all ${EDITABLE_FIELDS.length} editable fields round-trip losslessly ✓`);

// A real edit lands.
const edited = applyOverrides(fall, {
  [configKey(fall.slug, "price")]: "$175",
  [configKey(fall.slug, "includes")]: "45-minute session\n15 edited photos",
  [configKey(fall.slug, "published")]: "false",
});
assert.equal(edited.price, "$175");
assert.deepEqual(edited.includes, ["45-minute session", "15 edited photos"]);
assert.equal(edited.published, false);
assert.equal(edited.title, fall.title, "untouched fields should keep their defaults");

// Blank, whitespace and malformed rows must never blank out a live page.
const damaged = applyOverrides(fall, {
  [configKey(fall.slug, "price")]: "   ",
  [configKey(fall.slug, "title")]: "",
  [configKey(fall.slug, "includes")]: "\n\n   \n",
  [configKey(fall.slug, "published")]: "yes-please",
});
assert.equal(damaged.price, fall.price);
assert.equal(damaged.title, fall.title);
assert.deepEqual(damaged.includes, fall.includes);
assert.equal(damaged.published, fall.published, "a non-boolean must not toggle publication");

// One campaign's keys must not bleed into another's.
assert.equal(configKey("fall-mini-sessions", "price"), "campaign_fall_mini_sessions_price");
assert.notEqual(configKey("winter-sessions", "price"), configKey("fall-mini-sessions", "price"));
console.log("overrides: blank/malformed rows fall back, keys stay namespaced ✓");

/* ------------------------------------------------------------- validation -- */

const today = new Date("2026-09-02T00:00:00Z");
const good = {
  name: "Jane Smith",
  email: "jane@email.com",
  phone: "(555) 123-4567",
  preferredDate: "2026-10-11",
  sessionType: "family",
  ideas: "Two kids, warm colours",
};

assert.deepEqual(validateInquiry(good, fall, today).errors, {});

// Each field fails on its own, and the error map names the field that failed —
// so the form can mark it rather than showing one message at the bottom.
const cases: [Partial<typeof good>, string][] = [
  [{ name: "J" }, "name"],
  [{ email: "jane@" }, "email"],
  [{ email: "not-an-email" }, "email"],
  [{ phone: "123" }, "phone"],
  [{ phone: "" }, "phone"],
  [{ preferredDate: "" }, "preferredDate"],
  [{ preferredDate: "11/10/2026" }, "preferredDate"],
  [{ preferredDate: "2026-13-45" }, "preferredDate"],
  [{ sessionType: "wedding" }, "sessionType"], // not an option on this campaign
  [{ sessionType: "" }, "sessionType"],
];
for (const [patch, field] of cases) {
  const { errors } = validateInquiry({ ...good, ...patch }, fall, today);
  assert.ok(errors[field as keyof typeof errors], `${field} should have been rejected`);
  assert.equal(Object.keys(errors).length, 1, `only ${field} should fail here`);
}
console.log(`inquiry: valid request accepted, ${cases.length} bad fields each rejected alone ✓`);

// Dates: today is allowed, yesterday and beyond a year out are not.
assert.equal(normalizeDate("2026-09-02", today), "2026-09-02");
assert.equal(normalizeDate("2026-09-01", today), null);
assert.equal(normalizeDate("2027-09-02", today), "2027-09-02");
assert.equal(normalizeDate("2028-01-01", today), null);
assert.equal(formatDate("2026-10-11"), "Sunday, October 11, 2026");
console.log("dates: same-day allowed, past and >1yr rejected, formatting is UTC-stable ✓");

// Phones keep the visitor's own formatting; junk is refused.
assert.equal(normalizePhone("(555) 123-4567"), "(555) 123-4567");
assert.equal(normalizePhone("+44 20 7946 0958"), "+44 20 7946 0958");
assert.equal(normalizePhone("555-1234"), "555-1234");
assert.equal(normalizePhone("call me"), null);
assert.equal(normalizePhone("1"), null);
console.log("phone: real numbers kept as typed, junk rejected ✓");

// Over-long input is clamped, not rejected — losing a lead to a paste is worse.
const long = validateInquiry(
  { ...good, ideas: "x".repeat(5000), name: "y".repeat(500) },
  fall,
  today
);
assert.equal(long.values.ideas.length, 2000);
assert.equal(long.values.name.length, 120);
assert.deepEqual(long.errors, {});

// Session types resolve to their visitor-facing label for emails and the CRM.
assert.equal(sessionTypeLabel(fall, "kids"), "Kids");
assert.equal(sessionTypeLabel(fall, "unknown"), "unknown");

/* ------------------------------------------------------------ mail sender -- */

/* The campaign pages shipped sending as diagnostic@, because the shared
   mailFrom() falls back to DIAGNOSTIC_FROM_EMAIL and nothing overrode it.
   These pin the resolution order so that can't recur silently. */
{
  const saved = {
    campaign: process.env.CAMPAIGN_FROM_EMAIL,
    mail: process.env.MAIL_FROM_EMAIL,
    diagnostic: process.env.DIAGNOSTIC_FROM_EMAIL,
  };
  const setEnv = (k: string, v: string | undefined) => {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  };

  try {
    // Its own address wins over both shared senders.
    setEnv("CAMPAIGN_FROM_EMAIL", "hello@studio.test");
    setEnv("MAIL_FROM_EMAIL", "shared@studio.test");
    setEnv("DIAGNOSTIC_FROM_EMAIL", "diagnostic@studio.test");
    assert.equal(campaignFrom(), "hello@studio.test");

    // Unset, it falls back rather than failing to send at all.
    setEnv("CAMPAIGN_FROM_EMAIL", undefined);
    assert.equal(campaignFrom(), "shared@studio.test");
    setEnv("MAIL_FROM_EMAIL", undefined);
    assert.equal(campaignFrom(), "diagnostic@studio.test");

    // Nothing configured at all: undefined, so sendMail no-ops instead of
    // posting a message with an empty From that Resend would reject.
    setEnv("DIAGNOSTIC_FROM_EMAIL", undefined);
    assert.equal(campaignFrom(), undefined);

    // A value pasted into a dashboard with quotes or a trailing newline still
    // resolves — that shape of typo produces a confusing 401, not a clear error.
    setEnv("CAMPAIGN_FROM_EMAIL", '"hello@studio.test"\n');
    assert.equal(campaignFrom(), "hello@studio.test");
  } finally {
    setEnv("CAMPAIGN_FROM_EMAIL", saved.campaign);
    setEnv("MAIL_FROM_EMAIL", saved.mail);
    setEnv("DIAGNOSTIC_FROM_EMAIL", saved.diagnostic);
  }
  console.log("sender: campaign address wins, falls back cleanly, tolerates pasted quotes ✓");
}

/* ---------------------------------------------------------- reply routing -- */

/* Wrapped in main() rather than run at top level: tsx transpiles these checks
   to CJS, and a top-level await makes the module async, which CJS can't
   require. */
async function main() {
/* What actually reaches Resend. The studio's copy has to reply to the person
   who inquired — a notification about someone that replies to yourself is the
   kind of thing only noticed after a customer is left waiting. */
{
  const saved = {
    key: process.env.RESEND_API_KEY,
    campaign: process.env.CAMPAIGN_FROM_EMAIL,
    reply: process.env.DIAGNOSTIC_REPLY_TO,
    fetch: globalThis.fetch,
  };

  process.env.RESEND_API_KEY = "re_test";
  process.env.CAMPAIGN_FROM_EMAIL = "Gray <hello@studio.test>";
  process.env.DIAGNOSTIC_REPLY_TO = "studio@studio.test";

  const sent: Record<string, unknown>[] = [];
  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    sent.push(JSON.parse(init.body));
    return { ok: true, status: 200, text: async () => "" };
  }) as unknown as typeof fetch;

  try {
    const message = renderStudioEmail({
      campaign: fall,
      inquiry: { ...good, email: "jane@customer.test" },
      leadId: null,
    });

    await sendStudioEmail("studio@studio.test", message, "jane@customer.test");
    const studio = sent.at(-1)!;
    assert.equal(studio.from, "Gray <hello@studio.test>");
    assert.equal(studio.reply_to, "jane@customer.test", "Reply must reach the inquirer");

    await sendCustomerEmail("jane@customer.test", message);
    const customer = sent.at(-1)!;
    assert.equal(customer.from, "Gray <hello@studio.test>");
    assert.equal(
      customer.reply_to,
      "studio@studio.test",
      "the customer's reply must still reach the studio"
    );

    // Without an explicit reply-to the shared address still applies, so the
    // diagnostic and the offer coupon are unaffected by this change.
    await sendStudioEmail("studio@studio.test", message);
    assert.equal(sent.at(-1)!.reply_to, "studio@studio.test");
  } finally {
    globalThis.fetch = saved.fetch;
    const restore = (k: string, v: string | undefined) => {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    };
    restore("RESEND_API_KEY", saved.key);
    restore("CAMPAIGN_FROM_EMAIL", saved.campaign);
    restore("DIAGNOSTIC_REPLY_TO", saved.reply);
  }
  console.log("reply-to: studio copy answers the inquirer, customer copy answers the studio ✓");
}
}

main().then(
  () => console.log("\ncampaigns: all checks passed"),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
