# Antigravity Configuration for Sage-Code SCL

## Overview

This directory documents the **Google Antigravity** setup for **Sage-Code SCL**, using a two-tier Gemini 4 workflow:

- **Planner / Architect:** **Gemini 4 Neon** (`agents/antigravity/planner.md`)
- **Executor / Acting Worker:** **Gemini 4 Hydrogen** (`agents/antigravity/executor.md`)

Unlike Cline/Fireworks setups that rely on manually pinned static prompt prefixes (`agents/static-context-prefix.md` + `scripts/tools/context_signature.py`), Antigravity natively optimizes context and token usage via **hierarchical always-on rules** (`GEMINI.md`) and **progressive-disclosure skills** (`.agents/skills/`).

---

## 1. Customization Layout (Auto-Discovered by Antigravity)

| Path | Type | When Loaded | Purpose |
|---|---|---|---|
| `GEMINI.md` | Workspace Rule | Always on (keep concise) | Non-negotiables: Neon/Hydrogen model split, shell/temp rules, diff-first editing, validation gate, skill pointers |
| `.agents/skills/scl-architecture/SKILL.md` | Skill | On demand | Repo layout, build pipeline, template-defined roadmap contracts, Prism/SVG/URL policies |
| `.agents/skills/scl-author-topic/SKILL.md` | Skill | On demand | Curriculum authoring standard, mentor/professor/engineer pedagogy, 3-level sidebar JSON, SVG dark-theme spec, `demo_examples.html` |
| `.agents/skills/scl-build-validate/SKILL.md` | Skill | On demand | Ordered validation gate (`test` → `build` → `check`), `trace.sh` logging, fail-fast rules |
| `.agents/skills/scl-plan-execute/SKILL.md` | Skill | On demand | Neon → Hydrogen planning, `.temp/plan-<id>.md`, Antigravity `swarm` dispatch, escalation |

> **Why progressive disclosure matters:** Only skill `name` and `description` (~40 tokens each) enter the prompt by default. Full procedures load only when a task actually needs them, keeping Neon planning turns sharp and Hydrogen execution turns fast and low-cost.

---

## 2. Model Routing (Neon + Hydrogen)

| Role | Default Model | High-Complexity / Alternate | Use For |
|---|---|---|---|
| **Planner** | `gemini-4-neon-medium` | `gemini-4-neon-high` / `gemini-4-neon-xhigh` | Architecture, roadmap audits, multi-file decomposition, SVG & pedagogy planning, diagnosing escalated failures |
| **Executor** | `gemini-4-hydrogen-medium` | `gemini-4-hydrogen-low` (mechanical) / `gemini-4-hydrogen-high` (dense authoring) | Executing single `SCOPE / ACTION / ACCEPT` micro-specs, running Python bulk scripts, HTML/JSON updates, validation gate |

### How to Run Plan → Execute in Antigravity

1. **Interactive Mode (Single Conversation):**
   - Select **Gemini 4 Neon** (or use `/plan`) to inspect `git status`/`git diff`, audit target tracks, and write `.temp/plan-<id>.md`.
   - Switch to **Gemini 4 Hydrogen** to execute each micro-spec one by one, producing `.temp/task-<id>.md` and a one-line `DONE` receipt.
   - Switch back to **Gemini 4 Neon** to review `git diff` and approve or escalate.
2. **Parallel Swarm Mode (Multi-Task Fan-Out):**
   - Run the coordinator on **Gemini 4 Neon** (or `gemini-pro-orchestrator-neon`).
   - Spawn Hydrogen workers with `swarm(action="add", model="gemini-4-hydrogen-medium", workspace="share", brief="<micro-spec>")` so independent pages or tracks execute concurrently without workspace collisions.
   - Neon reviews and lands each worker's changes, then runs the final validation gate.

---

## 3. Native Tooling Mapping

| Operation | Antigravity Tool | Notes |
|---|---|---|
| Read files / ranges | `read_file` (`StartLine` / `EndLine`) | Prefer targeted ranges over full-file reads |
| Modify existing files | `edit_file` (or `bee-ed` via `run_command`) | Never overwrite existing files wholesale with `write_file` |
| Create new files | `write_file` | New files only |
| Shell / scripts | `run_command` | Keep scripts POSIX-compatible; spool logs to `.temp/` |
| Parallel execution | `swarm` (`model: "gemini-4-hydrogen-medium"`) | Use `workspace: "share"` for concurrent editors |
| Read-only codebase survey | `invoke_subagent` (`research`) | Keeps main context clean during large audits |

---

## 4. Escalation & Validation Contract

- **Validation gate (exact order):** `npm run test` → `npm run build` → `npm run check`.
- **Status tokens:**
  - `REJECT: AMBIGUOUS_SPEC <reason>` — Hydrogen stops immediately when a micro-spec is unclear; Neon clarifies once.
  - `ESCALATE: VALIDATION_FAILED` — Hydrogen stops after **2 consecutive validation failures** on the same task; Neon diagnoses and repairs the plan.
- Escalation stays within Gemini 4 (**Hydrogen → Neon**).

---

## 5. Related Profiles

- [agents/antigravity/planner.md](./planner.md) — Detailed instructions for **Gemini 4 Neon**
- [agents/antigravity/executor.md](./executor.md) — Detailed instructions for **Gemini 4 Hydrogen**
- [agents/instructions.md](../instructions.md) — Index of all agent configurations in this repository
