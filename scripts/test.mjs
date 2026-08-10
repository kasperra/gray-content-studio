#!/usr/bin/env node
/* Runs every *.test.ts check script under src/.
 *
 * These are not framework tests — each file is a standalone module that throws
 * via node:assert/strict. So this runner discovers them and executes each one in
 * its own tsx process, rather than delegating to a test framework.
 *
 * Discovery is deliberate: a hardcoded file list is how these checks went
 * unnoticed in the first place. Drop a new *.test.ts anywhere under src/ and it
 * gets picked up with no wiring.
 *
 *   npm test                 # all checks
 *   npm test -- pricing      # only paths matching "pricing"
 */
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");
const filter = process.argv[2];
const TSX = join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");

function findChecks(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...findChecks(full));
    else if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) out.push(full);
  }
  return out;
}

let files = findChecks(SRC).sort();
if (filter) files = files.filter((f) => f.includes(filter));

if (!files.length) {
  console.error(filter ? `No checks match "${filter}".` : "No *.test.ts files found under src/.");
  process.exit(1);
}

const failed = [];
for (const file of files) {
  const name = relative(ROOT, file);
  console.log(`\n[1m▸ ${name}[0m`);
  // Spawn the resolved binary directly. shell:true would re-split the argument
  // on spaces, which breaks any checkout whose path contains one.
  const { status } = spawnSync(TSX, [file], { stdio: "inherit" });
  if (status !== 0) failed.push(name);
}

console.log("");
if (failed.length) {
  console.error(`[31m✗ ${failed.length} of ${files.length} failed:[0m`);
  for (const f of failed) console.error(`   ${f}`);
  process.exit(1);
}
console.log(`[32m✓ ${files.length} check${files.length === 1 ? "" : "s"} passed[0m`);
