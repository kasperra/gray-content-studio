/* Runnable check for the package presets:
     npx tsx src/modules/pricing/bundles.test.ts

   Guards the trap that shipped once already: a preset that loads far above the
   "from" price the card advertises. A visitor clicking "from $3,800" and landing
   on $5,760 reads as bait-and-switch, so every preset must compute close to its
   floor — and must only reference services that exist on the rate card. */
import assert from "node:assert/strict";
import { BUNDLES } from "./bundles";
import { computeEstimate } from "./compute";
import { PRICING_CATEGORIES } from "./data";

const TOLERANCE = 0.1; // 10%

const known = new Set(PRICING_CATEGORIES.flatMap((c) => c.services.map((s) => s.id)));

for (const bundle of BUNDLES) {
  // Every selected id must exist, or it silently vanishes from the estimate.
  for (const id of Object.keys(bundle.selections)) {
    assert.ok(known.has(id), `${bundle.name}: unknown service id "${id}"`);
  }

  assert.ok(
    Object.keys(bundle.selections).length > 0,
    `${bundle.name}: preset is empty`
  );

  const estimate = computeEstimate({
    selections: bundle.selections,
    rushId: "none",
    travelMiles: 0,
    discountType: "none",
    discountValue: 0,
    depositPct: 50,
  });

  // The estimate must survive the round trip — no dropped lines.
  assert.equal(
    estimate.items.length,
    Object.keys(bundle.selections).length,
    `${bundle.name}: ${Object.keys(bundle.selections).length} services selected but ${estimate.items.length} priced`
  );

  const drift = (estimate.total - bundle.floor) / bundle.floor;
  const pct = (drift * 100).toFixed(1);
  console.log(
    `${bundle.name.padEnd(16)} loads $${estimate.total.toLocaleString().padStart(6)}  ` +
      `floor $${bundle.floor.toLocaleString().padStart(6)}  ${drift >= 0 ? "+" : ""}${pct}%`
  );
  assert.ok(
    Math.abs(drift) <= TOLERANCE,
    `${bundle.name}: preset loads $${estimate.total} but the card advertises "from $${bundle.floor}" (${pct}% off, max ±${TOLERANCE * 100}%)`
  );
}

// Each tier must genuinely contain the one below it — the cards promise it.
// The exceptions are entry-tier lines the higher tiers cover with their own,
// heavier equivalents; carrying them up would double-bill the client.
const STARTER_ONLY: Record<string, string> = {
  videohalf: "superseded by the brand film's all-inclusive production",
  starterstrat: "higher tiers bill their own strategy work (Campaign Engine: Creative Strategy Session)",
};

const [starter, builder, engine] = BUNDLES;
for (const id of Object.keys(starter.selections)) {
  if (STARTER_ONLY[id]) continue;
  assert.ok(builder.selections[id], `Brand Builder is missing Social Starter's "${id}"`);
}

// A starter-only line must not reappear upstream — that's the double-bill.
for (const id of Object.keys(STARTER_ONLY)) {
  assert.ok(!builder.selections[id], `Brand Builder double-bills "${id}": ${STARTER_ONLY[id]}`);
  assert.ok(!engine.selections[id], `Campaign Engine double-bills "${id}": ${STARTER_ONLY[id]}`);
}
for (const id of Object.keys(builder.selections)) {
  assert.ok(engine.selections[id], `Campaign Engine is missing Brand Builder's "${id}"`);
}

console.log("bundles: all checks passed");
