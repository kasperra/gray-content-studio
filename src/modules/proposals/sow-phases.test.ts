/* Runnable check for SOW phase selection:
     npx tsx src/modules/proposals/sow-phases.test.ts
   Guards the substring trap — "Post-Production" contains "Production", and an
   edit-only scope must never print a shoot-day phase. */
import assert from "node:assert/strict";
import { phasesFor } from "./sow-phases";

const titles = (cats: string[]) => phasesFor(cats).map((p) => p.title);

// Edit-only scope: no shoot day promised.
assert.deepEqual(titles(["Post-Production"]), ["Discovery", "Editing", "Delivery"]);

// Shoot scopes do get Production.
assert.ok(titles(["Production"]).includes("Production"));
assert.ok(titles(["Photography"]).includes("Production"));

// Pre-production unlocks both planning phases, still no shoot on its own.
assert.deepEqual(titles(["Pre-Production & Strategy"]), [
  "Discovery",
  "Strategy",
  "Pre-Production",
  "Delivery",
]);
assert.ok(!titles(["Pre-Production & Strategy"]).includes("Production"));

// An event package is sold as one all-inclusive line with no Production or
// Post-Production line beside it, so the category itself has to earn both
// phases — otherwise every event SOW prints as Discovery + Delivery alone.
assert.deepEqual(titles(["Event Coverage"]), ["Discovery", "Production", "Editing", "Delivery"]);

// Social work adds distribution.
assert.ok(titles(["Social Media Management"]).includes("Content Distribution"));

// Empty scope still shows the universal phases.
assert.deepEqual(titles([]), ["Discovery", "Delivery"]);

// Full-stack scope stays in process order, no duplicates.
const full = titles([
  "Pre-Production & Strategy",
  "Production",
  "Post-Production",
  "Social Media Management",
]);
assert.deepEqual(full, [
  "Discovery",
  "Strategy",
  "Pre-Production",
  "Production",
  "Editing",
  "Delivery",
  "Content Distribution",
]);
assert.equal(new Set(full).size, full.length);

console.log("sow-phases: all checks passed");
