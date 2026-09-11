---
name: build-validate
description: Build, test and validate the Sage-Code SCL static site. Use after any source edit, before authoring or committing, or when diagnosing build output or validation failures.
---

# Build & Validate

Run the validation gate IN ORDER; every command through `scripts/tools/trace.sh`.

## Gate
1. `trace.sh npm run test`   — source originals: JSON/JS/Python syntax, sidebar hierarchy.
2. `trace.sh npm run build`  — assemble `public/` (full rebuild: `npm run build:full`).
3. `trace.sh npm run check`  — audit compiled output (footer injection, page closure, JSON hierarchy).

For pipelines/redirects use the `-c` form, e.g. `trace.sh -c 'npm run build > .temp/build.log 2>&1'`.

## Interpret results
- `trace.sh report` — OK/FAIL counts + durations from `.temp/trace.log`.
- Failures: read the log / `trace.sh tail`, fix the FIRST error, re-run the gate.
- After build, spot-check: `public/index.html` has embedded nav/footer; `public/assets/js/inline/` populated.

## Audit (optional)
- `node scripts/audit.js public` — Puppeteer browser audit (`./run.sh audit`).
