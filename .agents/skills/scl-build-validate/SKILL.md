---
name: scl-build-validate
description: >-
  Run the Sage-Code SCL validation gate, build pipeline, command tracing,
  and diagnostic audits. Use after any source edit, before reporting task completion,
  or when diagnosing build, HTML, or sidebar validation failures.
---

# Build & Validation Gate

Run the validation gate **in exact order** after source edits.

## 1. Mandatory Gate Sequence

1. `npm run test` — validates source originals (JSON/JS/Python syntax, sidebar hierarchy).
2. `npm run build` — runs DB migration check and assembles `public/` (`npm run build:full` for a clean full rebuild).
3. `npm run check` — audits compiled `public/` output (header/footer injection, page closure, JSON hierarchy, extracted inline scripts).

Additional targeted checks when relevant:
- `npm run check:html` — HTML fragment check (`scripts/tools/check_html_fragments.py`)
- `npm run check:sidebar` — sidebar render check (`scripts/tools/check_sidebar_render.js`)
- `python tracking/generate_roadmaps_status.py` — regenerate tracking status after roadmap content changes
- `node scripts/audit.js public` (or `./run.sh audit`) — optional Puppeteer browser audit

## 2. Command Tracing & Log Spooling

- In POSIX Bash (Git Bash / Linux / macOS), wrap commands with `scripts/tools/trace.sh`:
  - `scripts/tools/trace.sh npm run test`
  - `scripts/tools/trace.sh -c 'npm run build > .temp/build.log 2>&1'`
- Inspect trace history instead of re-running blindly:
  - `scripts/tools/trace.sh report` — OK/FAIL counts and durations from `.temp/trace.log`
  - `scripts/tools/trace.sh tail 30` — recent trace entries
- On Windows, if running directly from Antigravity's shell without Git Bash on `PATH`, run `npm` and `python` directly and spool large output into `.temp/` (e.g., `.temp/build.log`). Never write PowerShell-specific syntax into scripts or docs.

## 3. Post-Build Spot Checks

Verify after `npm run build`:
- `public/index.html` contains embedded navigation header and footer markup.
- `public/assets/js/inline/` contains extracted inline scripts.
- Modified `roadmaps/<track>/data/*.json` files are valid 3-level hierarchical trees.

## 4. Fail-Fast Rule (Executor)

- On failure: inspect the error output / `.temp/*.log` / `trace.sh report`, fix the **first** root cause, and re-run the gate.
- After **2 consecutive validation failures** on the same task, stop and emit `ESCALATE: VALIDATION_FAILED` back to the **Neon** planner with files touched and exact error diagnostics. Do not attempt a third blind retry.
