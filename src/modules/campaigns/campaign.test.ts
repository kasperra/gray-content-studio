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
} from "./campaign";
import { CAMPAIGNS, campaignBySlug } from "./campaigns";

const fall = campaignBySlug("fall-mini-sessions");
assert.ok(fall, "the fall campaign should exist");

/* ---------------------------------------------------------------- content -- */

// The offer as briefed. These are promises printed on a public page, so they're
// pinned: a typo here is a typo in what the studio is selling.
assert.equal(fall.price, "$150");
assert.equal(fall.emailSubject, "We received your Fall Mini Session request 🍂");
assert.equal(fall.ctaLabel, "Message Me to Book Your Session");
assert.deepEqual(fall.includes, [
  "30-minute session",
  "10 professionally edited digital photos",
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

console.log("\ncampaigns: all checks passed");
