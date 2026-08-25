/* Runnable check for the canonical origin:
     npx tsx src/lib/site.test.ts

   Guards a silent SEO regression: every canonical tag, sitemap entry, OG image
   URL and JSON-LD @id is built from this one value, so a preview hostname
   leaking into it tells crawlers the wrong site is the real one. */
import assert from "node:assert/strict";
import { resolveSiteUrl } from "./site";

const LIVE = "https://www.graycontentstudio.co";

// The preview host is never canonical, however it's written.
for (const preview of [
  "https://gray-content-studio.vercel.app",
  "https://gray-content-studio.vercel.app/",
  "https://gray-content-studio-git-main.VERCEL.APP",
  "  https://some-branch-preview.vercel.app  ",
]) {
  assert.equal(resolveSiteUrl(preview), LIVE, `preview host leaked through: ${preview}`);
}
console.log("site: vercel.app hosts never become canonical ✓");

// Unset, empty, or malformed falls back rather than emitting a broken tag.
for (const bad of [undefined, "", "   ", "not a url", "://nope"]) {
  assert.equal(resolveSiteUrl(bad), LIVE, `bad value not handled: ${JSON.stringify(bad)}`);
}
console.log("site: unset and malformed values fall back to the live domain ✓");

// A real custom domain is honoured, with any trailing slash trimmed so URLs
// built as `${SITE_URL}/path` never come out doubled.
assert.equal(resolveSiteUrl("https://graycontentstudio.co"), "https://graycontentstudio.co");
assert.equal(resolveSiteUrl("https://example.com/"), "https://example.com");
assert.equal(resolveSiteUrl("https://example.com///"), "https://example.com");
console.log("site: real domains honoured, trailing slashes trimmed ✓");

console.log("\nsite: all checks passed");
