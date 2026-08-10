import { DIMENSIONS, type Answers, type Dimension, type Result, type StageId } from "./types";
import { visibleQuestions, optionLabel } from "./questions";
import { ROADMAP_LIBRARY, plan30For, STAGES } from "./content";

/* Deterministic scoring. No AI decides a stage, a score, or a bottleneck —
   given the same answers this always returns the same diagnosis, which is what
   makes the result defensible to a prospect who asks "why did I get this?".

   Dimensions are scored as a percentage of the points available on the questions
   that were actually asked, so an adaptive skip never silently penalises anyone. */

/** A dimension must clear each gate to advance past that stage. Ordered: a
    business can't be "Strategic" while invisible, and can't be a "Content
    Engine" on strong engagement alone if it can't convert or measure. */
const GATES = {
  visibility: 40, // Stage 1 → 2: can people find you at all?
  strategy: 45, // Stage 2 → 3: is content built on purpose?
  conversion: 50, // Stage 3 → 4: does attention become business?
  scale: 60, // Stage 4 → 5: production + distribution
  measurement: 60, // Stage 4 → 5: do you know what works?
} as const;

/** Below this a dimension is worth calling out as a weakness. */
const WEAK = 70;

export function scoreDimensions(answers: Answers): Record<Dimension, number> {
  const earned: Record<string, number> = {};
  const possible: Record<string, number> = {};

  for (const q of visibleQuestions(answers)) {
    if (!q.max) continue;
    const chosen = q.options.find((o) => o.id === answers[q.id]);
    // Unanswered questions contribute nothing to either side of the ratio.
    if (!chosen) continue;
    for (const [dim, max] of Object.entries(q.max)) {
      possible[dim] = (possible[dim] ?? 0) + (max as number);
      earned[dim] = (earned[dim] ?? 0) + (chosen.scores?.[dim as Dimension] ?? 0);
    }
  }

  const out = {} as Record<Dimension, number>;
  for (const dim of DIMENSIONS) {
    const p = possible[dim] ?? 0;
    out[dim] = p === 0 ? 0 : Math.round((100 * (earned[dim] ?? 0)) / p);
  }
  return out;
}

export function stageFor(s: Record<Dimension, number>): StageId {
  if (s.visibility < GATES.visibility) return 1;
  if (s.strategy < GATES.strategy) return 2;
  if (s.conversion < GATES.conversion) return 3;
  if (
    s.production < GATES.scale ||
    s.distribution < GATES.scale ||
    s.measurement < GATES.measurement
  )
    return 4;
  return 5;
}

/** The dimension actually blocking the next stage — not merely the lowest score.
    Someone can have a weak-ish distribution number and still be gated by
    conversion; naming the gate is what makes the roadmap correct. */
function primaryFor(stage: StageId, s: Record<Dimension, number>): Dimension {
  const lowestOf = (dims: Dimension[]) =>
    dims.reduce((a, b) => (s[a] <= s[b] ? a : b));

  switch (stage) {
    case 1:
      return "visibility";
    case 2:
      return "strategy";
    case 3:
      return "conversion";
    case 4: {
      const failing = (["production", "distribution", "measurement"] as Dimension[]).filter(
        (d) => s[d] < (d === "measurement" ? GATES.measurement : GATES.scale)
      );
      return lowestOf(failing.length ? failing : (["production", "distribution"] as Dimension[]));
    }
    case 5:
      return lowestOf([...DIMENSIONS]);
  }
}

function secondariesFor(primary: Dimension, s: Record<Dimension, number>): Dimension[] {
  return DIMENSIONS.filter((d) => d !== primary && s[d] < WEAK)
    .sort((a, b) => s[a] - s[b])
    .slice(0, 2);
}

/** Plain-language evidence drawn strictly from what the user selected. Every
    line is tied to a specific answer, so nothing here is invented. */
function reasonsFor(answers: Answers): string[] {
  const out: string[] = [];
  const said = (q: string, ...v: string[]) => v.includes(answers[q]);
  const quote = (q: string) => `"${optionLabel(q, answers[q])}"`;

  if (said("discovery", "referrals", "none")) {
    out.push(
      `You told us new business mostly arrives through ${quote("discovery").toLowerCase()} — content isn't yet a channel people find you through.`
    );
  } else if (said("discovery", "search", "social")) {
    out.push(`New business already finds you through ${quote("discovery").toLowerCase()}, so discovery is working.`);
  }

  if (said("frequency", "never", "occasionally")) {
    out.push(`You publish ${quote("frequency").toLowerCase()}, so there isn't a steady body of work compounding for you.`);
  }
  if (said("frequency", "multi_weekly", "daily")) {
    out.push(`You publish ${quote("frequency").toLowerCase()} — volume is not your constraint.`);
  }
  if (said("attribution", "none", "unclear")) {
    out.push("Despite that volume, you can't yet trace new business back to the content.");
  }

  if (said("planning", "adhoc", "trends", "competitors")) {
    out.push(`Publishing decisions come from ${quote("planning").toLowerCase()} rather than a documented plan.`);
  }
  if (said("objective_share", "almost_none", "some")) {
    out.push("Most of what you publish isn't tied to a specific business objective.");
  }

  if (said("post_view_action", "nothing", "follow", "unknown")) {
    out.push(`After someone sees your content, ${quote("post_view_action").toLowerCase()} — attention isn't being converted.`);
  }
  if (said("conversion_path", "none", "profile", "sometimes")) {
    out.push("There's no consistent pathway from a piece of content to an inquiry.");
  }

  if (said("measurement", "none", "vanity")) {
    out.push(`Performance is judged on ${quote("measurement").toLowerCase()}, which can't tell you what produced business.`);
  }
  if (said("repurposing", "once", "repost")) {
    out.push("Strong pieces aren't being repurposed, so each one stops earning almost immediately.");
  }
  if (said("capacity", "well_short", "no_plan")) {
    out.push("Production capacity is falling short of what your plan requires.");
  }

  return out.slice(0, 5);
}

/** Roadmap: the gating dimension first, then the other weak areas, then the
    requirement for the next stage. Four items, ordered by what to fix first. */
function roadmapFor(primary: Dimension, secondaries: Dimension[], stage: StageId) {
  const ordered: Dimension[] = [primary, ...secondaries];
  for (const d of DIMENSIONS) {
    if (ordered.length >= 4) break;
    if (!ordered.includes(d)) ordered.push(d);
  }
  return ordered.slice(0, 4).map((d) => ({
    dimension: d,
    title: ROADMAP_LIBRARY[d].title,
    detail: ROADMAP_LIBRARY[d][stage >= 4 ? "advanced" : "core"],
  }));
}

export function diagnose(answers: Answers): Result {
  const scores = scoreDimensions(answers);
  const stage = stageFor(scores);
  const primaryBottleneck = primaryFor(stage, scores);
  const secondaryBottlenecks = secondariesFor(primaryBottleneck, scores);

  const overall = Math.round(
    DIMENSIONS.reduce((sum, d) => sum + scores[d], 0) / DIMENSIONS.length
  );

  return {
    scores,
    overall,
    stage,
    primaryBottleneck,
    secondaryBottlenecks,
    reasons: reasonsFor(answers),
    roadmap: roadmapFor(primaryBottleneck, secondaryBottlenecks, stage),
    plan30: plan30For(stage, primaryBottleneck),
    purchaseIntent: answers.intent ?? "",
    urgency: answers.urgency ?? "",
    businessType: answers.business_type ?? "",
  };
}

export function stageMeta(id: StageId) {
  return STAGES.find((s) => s.id === id)!;
}
