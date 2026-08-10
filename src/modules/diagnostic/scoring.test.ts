/* Runnable check for the diagnostic engine:
     npx tsx src/modules/diagnostic/scoring.test.ts

   Guards the two ways a diagnostic loses credibility: putting a business in the
   wrong stage, and giving advice that doesn't match the stage it just assigned. */
import assert from "node:assert/strict";
import { diagnose, stageMeta } from "./scoring";
import { visibleQuestions } from "./questions";
import type { Answers, StageId } from "./types";

type Persona = { name: string; expect: StageId; answers: Answers };

const PERSONAS: Persona[] = [
  {
    name: "A — referral-dependent, barely publishes",
    expect: 1,
    answers: {
      business_type: "professional_services",
      discovery: "referrals",
      frequency: "never",
      publish_blocker: "time",
      capacity: "no_plan",
      planning: "adhoc",
      objective_share: "almost_none",
      messaging: "shifts",
      repurposing: "once",
      channels: "zero",
      post_view_action: "nothing",
      conversion_path: "none",
      measurement: "none",
      testing: "no",
      frustration: "what_to_create",
      intent: "outside_help",
      urgency: "90_days",
    },
  },
  {
    name: "B — publishes consistently, no strategy",
    expect: 2,
    answers: {
      business_type: "local",
      discovery: "social",
      frequency: "multi_weekly",
      attribution: "unclear",
      capacity: "just_barely",
      planning: "trends",
      objective_share: "some",
      messaging: "loose",
      repurposing: "repost",
      channels: "two_three",
      post_view_action: "follow",
      conversion_path: "profile",
      measurement: "vanity",
      testing: "instinct",
      frustration: "unknown_working",
      intent: "diy",
      urgency: "six_months",
    },
  },
  {
    name: "C — strong content and audience, weak conversion",
    expect: 3,
    answers: {
      business_type: "ecommerce",
      discovery: "search",
      frequency: "multi_weekly",
      attribution: "unclear",
      capacity: "comfortably",
      planning: "documented",
      objective_share: "most",
      messaging: "documented",
      repurposing: "multi_piece",
      channels: "two_three",
      post_view_action: "follow",
      conversion_path: "sometimes",
      measurement: "engagement",
      testing: "review",
      frustration: "no_customers",
      intent: "partner",
      urgency: "30_days",
    },
  },
  {
    name: "D — proven strategy and conversion, production/distribution bottleneck",
    expect: 4,
    answers: {
      business_type: "agency",
      discovery: "search",
      frequency: "weekly",
      capacity: "well_short",
      planning: "documented",
      objective_share: "nearly_all",
      messaging: "enforced",
      repurposing: "repost",
      channels: "one",
      post_view_action: "contact",
      conversion_path: "most",
      measurement: "leads",
      testing: "review",
      frustration: "volume",
      intent: "full_operation",
      urgency: "asap",
    },
  },
  {
    name: "E — full content operation",
    expect: 5,
    answers: {
      business_type: "startup",
      discovery: "search",
      frequency: "daily",
      attribution: "meaningful",
      capacity: "headroom",
      planning: "documented",
      objective_share: "nearly_all",
      messaging: "enforced",
      repurposing: "system",
      channels: "four_plus",
      post_view_action: "buy",
      conversion_path: "designed",
      measurement: "revenue",
      testing: "test",
      frustration: "standout",
      intent: "partner",
      urgency: "90_days",
    },
  },
];

for (const p of PERSONAS) {
  const r = diagnose(p.answers);
  const meta = stageMeta(r.stage);
  console.log(
    `${p.name}\n  → Stage ${r.stage} (${meta.name})  bottleneck: ${r.primaryBottleneck}` +
      `  overall ${r.overall}  [vis ${r.scores.visibility} str ${r.scores.strategy} prod ${r.scores.production} dist ${r.scores.distribution} conv ${r.scores.conversion} meas ${r.scores.measurement}]`
  );
  assert.equal(r.stage, p.expect, `${p.name}: expected Stage ${p.expect}, got ${r.stage}`);

  // The roadmap must lead with the bottleneck it just named, or the advice
  // contradicts the diagnosis.
  assert.equal(
    r.roadmap[0].dimension,
    r.primaryBottleneck,
    `${p.name}: roadmap doesn't lead with the primary bottleneck`
  );
  assert.equal(r.roadmap.length, 4, `${p.name}: expected a 4-step roadmap`);
  assert.equal(r.plan30.length, 4, `${p.name}: expected a 4-week plan`);
  assert.ok(r.reasons.length > 0, `${p.name}: no evidence generated for the diagnosis`);

  // Secondaries are genuinely weak areas, worst first, never repeating the
  // primary. (The primary is the *gating* dimension, not necessarily the lowest
  // score — at Stage 1 everything is low but visibility is what blocks progress.)
  assert.ok(!r.secondaryBottlenecks.includes(r.primaryBottleneck), `${p.name}: primary repeated as secondary`);
  for (const s of r.secondaryBottlenecks) {
    assert.ok(r.scores[s] < 70, `${p.name}: secondary "${s}" scores ${r.scores[s]} — not a weakness`);
  }
  for (let i = 1; i < r.secondaryBottlenecks.length; i++) {
    assert.ok(
      r.scores[r.secondaryBottlenecks[i - 1]] <= r.scores[r.secondaryBottlenecks[i]],
      `${p.name}: secondary bottlenecks not ordered worst-first`
    );
  }
}

/* Mixed cases — the contradictions a naive total-score model would produce. */

// Big audience, strong engagement, no conversion or measurement. A single
// impressive dimension must not buy a Stage 5 rating.
const vanityStar = diagnose({
  business_type: "personal_brand",
  discovery: "social",
  frequency: "daily",
  attribution: "none",
  capacity: "headroom",
  planning: "documented",
  objective_share: "nearly_all",
  messaging: "enforced",
  repurposing: "system",
  channels: "four_plus",
  post_view_action: "follow",
  conversion_path: "profile",
  measurement: "vanity",
  testing: "instinct",
  frustration: "no_customers",
  intent: "partner",
  urgency: "asap",
});
assert.ok(
  vanityStar.stage <= 3,
  `high-engagement/no-conversion business reached Stage ${vanityStar.stage}; conversion gate failed`
);
assert.equal(vanityStar.primaryBottleneck, "conversion");
console.log(`\nmixed: high engagement, no conversion → Stage ${vanityStar.stage} (${stageMeta(vanityStar.stage).name}) ✓ gated`);

// Converts well but is nearly invisible: foundations gate before anything else.
const hiddenGem = diagnose({
  business_type: "professional_services",
  discovery: "referrals",
  frequency: "never",
  publish_blocker: "capacity",
  capacity: "well_short",
  planning: "documented",
  objective_share: "nearly_all",
  messaging: "enforced",
  repurposing: "once",
  channels: "zero",
  post_view_action: "buy",
  conversion_path: "designed",
  measurement: "revenue",
  testing: "test",
  frustration: "volume",
  intent: "full_operation",
  urgency: "asap",
});
assert.equal(hiddenGem.stage, 1, `invisible business reached Stage ${hiddenGem.stage}`);
assert.equal(hiddenGem.primaryBottleneck, "visibility");
console.log(`mixed: converts but invisible → Stage ${hiddenGem.stage} (${stageMeta(hiddenGem.stage).name}) ✓ gated`);

// Adaptive routing: the two branch questions are mutually exclusive.
const low = visibleQuestions({ frequency: "never" }).map((q) => q.id);
const high = visibleQuestions({ frequency: "daily" }).map((q) => q.id);
assert.ok(low.includes("publish_blocker") && !low.includes("attribution"), "low-volume branch wrong");
assert.ok(high.includes("attribution") && !high.includes("publish_blocker"), "high-volume branch wrong");
assert.equal(low.length, high.length, "branches should ask the same number of questions");
console.log(`adaptive: low-volume asks publish_blocker, high-volume asks attribution ✓ (${low.length} questions each)`);

// Every stage must carry its own CTA — no shared fallback.
const ctas = new Set(([1, 2, 3, 4, 5] as StageId[]).map((s) => stageMeta(s).cta));
assert.equal(ctas.size, 5, "stages share a CTA");
console.log("ctas: all five stages have a distinct next step ✓");

console.log("\ndiagnostic: all checks passed");
