#!/usr/bin/env node
// `npm run check` — full check of the GENERATED output in public/.
// Run `npm run build` first. For source-file checks use `npm run test`.
//
// Steps:
//  1. CSS class validation (validate-css.js): classes used in public HTML
//     must be defined in assets/css (Bootstrap/utility patterns ignored).
//  2. Generated HTML/JSON structure (check_public.py): footer injection
//     integrity, page closure, sidebar JSON hierarchy in public/roadmap.

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");

if (!fs.existsSync(PUBLIC_DIR)) {
  console.error("[FAIL] public/ not found. Run `npm run build` first.");
  process.exit(1);
}

function resolvePython() {
  for (const cmd of ["python", "python3", "py"]) {
    const probe = spawnSync(cmd, ["--version"], { stdio: "pipe" });
    if (probe.status === 0) return cmd;
  }
  return null;
}

const python = resolvePython();

const steps = [
  {
    // Advisory: missing CSS classes are content debt (external embeds, legacy
    // pages), not structural breakage. Run `node scripts/validate-css.js`
    // directly for the strict listing.
    label: "CSS class validation (advisory)",
    cmd: process.execPath,
    args: ["scripts/validate-css.js"],
    fatal: false,
  },
  {
    label: "Generated HTML/JSON structure",
    cmd: python,
    args: ["scripts/check_public.py"],
    fatal: true,
  },
];

let failedSteps = 0;
for (const step of steps) {
  console.log(`--- ${step.label} ---`);
  if (!step.cmd) {
    if (step.fatal) {
      console.error(`[FAIL] ${step.label}: Python interpreter not found`);
      failedSteps += 1;
    } else {
      console.warn(`[WARN] ${step.label}: skipped (Python interpreter not found)`);
    }
    continue;
  }
  const result = spawnSync(step.cmd, step.args, { stdio: "inherit", cwd: ROOT });
  if (result.status !== 0) {
    if (step.fatal) {
      console.error(`[FAIL] ${step.label}`);
      failedSteps += 1;
    } else {
      console.warn(`[WARN] ${step.label}: reported issues (non-fatal, see above)`);
    }
  }
}

if (failedSteps > 0) {
  console.error(`\nCheck failed: ${failedSteps} step(s) reported failures.`);
  process.exit(1);
}

console.log("\nAll checks passed.");
