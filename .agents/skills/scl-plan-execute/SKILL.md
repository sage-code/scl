---
name: scl-plan-execute
description: >-
  Coordinate the two-tier Antigravity workflow for Sage-Code SCL: planning and
  architecting with Gemini 4 Neon, and executing atomic micro-specs with Gemini 4
  Hydrogen (via swarm workers or Act-mode handoff). Use when decomposing multi-step
  roadmaps/site work, creating persistent plans in .temp/, or dispatching Hydrogen executors.
---

# Neon Planner → Hydrogen Executor Workflow (Antigravity)

Sage-Code SCL splits work across two Gemini 4 model tiers in Antigravity:

| Role | Antigravity Model | Responsibility |
|---|---|---|
| **Planner / Architect** | **Gemini 4 Neon** (`gemini-4-neon-medium` default; `gemini-4-neon-high` for complex cross-track architecture) | Onboard, audit gaps, design curriculum/architecture, persist `.temp/plan-<id>.md`, emit atomic micro-specs, verify outcomes |
| **Executor / Worker** | **Gemini 4 Hydrogen** (`gemini-4-hydrogen-medium` default; `gemini-4-hydrogen-low` for mechanical edits) | Execute one `SCOPE / ACTION / ACCEPT` micro-spec precisely, run validation gate, write `.temp/task-<id>.md`, emit receipt |

## 1. Planner Phase (Gemini 4 Neon)

1. **Onboard lightly:** Check `git status`, `git diff`, and read only target track files (`roadmaps/<track>/index.html`, `roadmaps/<track>/data/*.json`) or relevant sections of `manual/ARCHITECTURE.md`.
2. **Decompose atomically:** Limit each task to **1 file or 1 isolated track/component**, ordered by dependency. Never write implementation code inside the plan.
3. **Plan pedagogy & visuals:** Order topics `why → what → how → practice`; schedule explicit SVG diagram tasks (naming concept, target section, and `roadmaps/<track>/img/<name>.svg`) when concepts are spatial/relational.
4. **Persist the plan** to `.temp/plan-<id>.md`:

```text
# Plan: <id> — <goal>
Model: Planner = Gemini 4 Neon | Executor = Gemini 4 Hydrogen
Persistence: .temp/plan-<id>.md

TASK 1:
  SCOPE:  <exact relative path — max 1 file or 1 track>
  ACTION: <single imperative verb + exact modifications>
  ACCEPT: <verifiable acceptance criteria + validation gate>

TASK 2: ...
```

## 2. Dispatching to Gemini 4 Hydrogen

Choose the dispatch mode that fits the task:

- **Parallel / multi-task fan-out (Antigravity Swarm):**
  Spawn Hydrogen worker(s) pinned to `gemini-4-hydrogen-medium` via the `swarm` tool:
  - Use `workspace: "share"` when multiple Hydrogen workers edit different files concurrently.
  - Use `workspace: "inherit"` for a single sequential worker or read-only verifier.
  - Put the exact `SCOPE / ACTION / ACCEPT` micro-spec and reference to `agents/antigravity/executor.md` in the worker `brief`.
- **Single-thread interactive flow:**
  Present the plan and first micro-spec to the user, or switch the conversation model to **Gemini 4 Hydrogen** to execute one task at a time.

## 3. Execution Phase (Gemini 4 Hydrogen)

1. Verify `SCOPE / ACTION / ACCEPT`. If ambiguous or missing required context, emit:
   `REJECT: AMBIGUOUS_SPEC <1-line reason>` and stop.
2. Edit existing files strictly with targeted diffs (`edit_file` or `bee-ed`); reserve `write_file` for new files only.
3. For bulk mechanical edits (`>2` files), write a deterministic Python script in `scripts/tools/` with dry-run diff output before writing.
4. Run the validation gate in order (`scl-build-validate` skill): `npm run test` → `npm run build` → `npm run check`.
5. Write `.temp/task-<id>.md` containing:
   - `TASK`
   - `FILES TOUCHED`
   - `COMMANDS` (status + duration)
   - `VALIDATION RESULT`
   - `FINAL STATUS`
6. Emit a one-line receipt and STOP:
   `DONE <task-id> OK|FAIL [test/build/check]; report .temp/task-<id>.md`

## 4. Verification & Escalation (Back to Neon)

- After Hydrogen reports `DONE`, Neon verifies acceptance criteria via `git diff` and `.temp/task-<id>.md` before marking the task complete in `.temp/plan-<id>.md`.
- On `REJECT: AMBIGUOUS_SPEC`: Neon clarifies the micro-spec and re-dispatches once.
- On `ESCALATE: VALIDATION_FAILED` (triggered after 2 consecutive validation failures): Neon diagnoses the root cause, updates the plan/spec, or handles complex architectural repair directly before re-dispatching.
- Keep escalation inside the Gemini 4 family (**Hydrogen → Neon**).
