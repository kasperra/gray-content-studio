/* Runnable check for the offer popup's rules:
     npx tsx src/modules/offer/offer.test.ts

   Guards the three ways this feature does real damage: handing out a coupon
   code someone can't read back, running an offer nobody switched on, and
   recording marketing consent that was never given. */
import assert from "node:assert/strict";
import {
  OFFER_CHOICES,
  OFFER_DEFAULTS,
  expiresAt,
  normalizePhone,
  parseSettings,
  randomCode,
  serializeSettings,
} from "./config";

/* ---- coupon codes ------------------------------------------------------- */

// Codes get read off a screen and typed into an email, so the alphabet must not
// contain a character that's ambiguous in any common face.
const AMBIGUOUS = /[0O1IL]/;
for (let i = 0; i < 2000; i += 1) {
  const code = randomCode("GRAY");
  assert.match(code, /^GRAY-[A-Z0-9]{6}$/, `malformed code: ${code}`);
  assert.ok(!AMBIGUOUS.test(code.slice(5)), `ambiguous character in code body: ${code}`);
}
console.log("codes: 2000 codes well-formed, none containing 0/O/1/I/L ✓");

// A fixed random source must produce a stable code — the generator itself must
// not reach for anything but the source it's given.
const seq = [0, 0.5, 0.999, 0, 0.5, 0.999];
let i = 0;
const fixed = randomCode("X", () => seq[i++]);
i = 0;
assert.equal(randomCode("X", () => seq[i++]), fixed, "code generation is not deterministic");
console.log(`codes: deterministic under a fixed source (${fixed}) ✓`);

/* ---- expiry ------------------------------------------------------------- */

const issued = new Date("2026-08-24T12:00:00.000Z");
assert.equal(expiresAt(issued, 30).toISOString(), "2026-09-23T12:00:00.000Z");
assert.equal(expiresAt(issued, 1).toISOString(), "2026-08-25T12:00:00.000Z");
console.log("expiry: coupon days are added exactly ✓");

/* ---- settings ----------------------------------------------------------- */

// An install where the migration hasn't run must not start showing a popup, and
// must not invent an offer. Absent config means off.
assert.equal(parseSettings({}).enabled, false, "popup defaults to on with no config");
assert.equal(OFFER_DEFAULTS.enabled, false, "code default is on");
assert.equal(OFFER_DEFAULTS.smsEnabled, false, "SMS consent is asked for by default");
console.log("settings: unconfigured install shows nothing and asks for no SMS consent ✓");

// Out-of-range numbers are clamped rather than trusted, so a typo in the admin
// form can't produce a 0-second popup or a 100-year coupon.
const clamped = parseSettings({
  offer_enabled: "true",
  offer_coupon_days: "99999",
  offer_scroll_percent: "-40",
  offer_delay_seconds: "not a number",
  offer_code_prefix: "gr ay-1!",
});
assert.equal(clamped.couponDays, 365);
assert.equal(clamped.scrollPercent, 0);
assert.equal(clamped.delaySeconds, OFFER_DEFAULTS.delaySeconds);
assert.equal(clamped.codePrefix, "GRAY1", "prefix not normalised to code-safe characters");
console.log("settings: bad values clamped, prefix normalised ✓");

// What the admin form saves must be exactly what the popup later reads.
const custom = { ...OFFER_DEFAULTS, enabled: true, couponDays: 45, discountLabel: "15% off", smsEnabled: true };
assert.deepEqual(parseSettings(serializeSettings(custom)), custom, "settings do not round-trip");
console.log("settings: round-trip through the config store is lossless ✓");

/* ---- the question ------------------------------------------------------- */

const ids = new Set(OFFER_CHOICES.map((c) => c.id));
assert.equal(ids.size, OFFER_CHOICES.length, "duplicate choice id");
assert.deepEqual(
  OFFER_CHOICES.map((c) => c.stage),
  [1, 2, 3, 4, 5],
  "choices no longer map onto the five diagnostic stages in order"
);
console.log("question: five choices, one per growth stage, ids unique ✓");

/* ---- phone -------------------------------------------------------------- */

assert.equal(normalizePhone("  (804) 555-0142 "), "(804) 555-0142", "formatting not preserved");
assert.equal(normalizePhone("12345"), null, "too-short number accepted");
assert.equal(normalizePhone("no digits here"), null, "text accepted as a phone number");
assert.equal(normalizePhone("1".repeat(20)), null, "over-long number accepted");
console.log("phone: real numbers kept as typed, junk rejected ✓");

console.log("\noffer: all checks passed");
