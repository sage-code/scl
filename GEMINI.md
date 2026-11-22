# Antigravity / Gemini Workspace Rules — Sage-Code SCL

Always-on core rules for **Sage-Code SCL** (static-first vanilla HTML5/CSS3/ES6+ + Bootstrap website generator, deployed to Vercel from `public/`, with `api/` Turso/libSQL + Resend functions). Detailed runbooks live in `.agents/skills/` and load on demand via progressive disclosure.

---

## 1. Model Workflow (Neon Plans, Hydrogen Executes)

- **Planner / Architect:** **Gemini 4 Neon** (`gemini-4-neon-medium` / `gemini-4-neon-high`) — audits, designs roadmaps, decomposes work into atomic `SCOPE / ACTION / ACCEPT` micro-specs in `.temp/plan-<id>.md`, dispatches workers, and verifies outcomes. See `agents/antigravity/planner.md`.
- **Executor / Worker:** **Gemini 4 Hydrogen** (`gemini-4-hydrogen-medium` / `gemini-4-hydrogen-low`) — executes one micro-spec at a time (or in parallel via Antigravity `swarm` with `workspace: "share"`), runs the validation gate, writes `.temp/task-<id>.md`, and emits a one-line `DONE` receipt. See `agents/antigravity/executor.md`.
- **Fail-fast escalation (Hydrogen → Neon):** Emit `REJECT: AMBIGUOUS_SPEC` on unclear specs; emit `ESCALATE: VALIDATION_FAILED` after 2 consecutive validation failures.

---

## 2. Progressive-Disclosure Skills (`.agents/skills/`)

Activate the relevant skill before specialized work instead of guessing:
- `scl-architecture` — repo layout, build pipeline, templates, Prism/SVG/URL policies.
- `scl-author-topic` — curriculum authoring standard, pedagogy, 3-level sidebar JSON, dark-theme SVG rules, `demo_examples.html`.
- `scl-build-validate` — ordered validation gate, `trace.sh` logging, post-build checks.
- `scl-plan-execute` — Neon → Hydrogen planning, `.temp/plan-<id>.md`, Antigravity `swarm` dispatch.

---

## 3. Shell, Temp Spool & Bulk Automation

- **POSIX & Cross-Platform:** Keep all shell instructions and scripts POSIX Bash (`Git Bash` on Windows, native Bash on Linux/macOS) or cross-platform Python. Never generate PowerShell (`pwsh`) scripts or syntax.
- **Temp Spool (`.temp/`):** Write all intermediate files, logs, plans (`.temp/plan-<id>.md`), and task reports (`.temp/task-<id>.md`) to `.temp/` at the repo root (git-ignored). Never use `/tmp`.
- **Command Tracing:** In POSIX Bash, run commands through `scripts/tools/trace.sh` (logs to `.temp/trace.log`); spool long command output to `.temp/*.log` and inspect with `tail`/`grep`. Avoid interactive pagers (`git --no-pager`).
- **Bulk Changes (`>2` files):** Write deterministic Python scripts under `scripts/tools/` (never clutter repo root) with dry-run diff output before writing.

---

## 4. Context & File-Editing Discipline

- **Diff-first context:** Start with `git status --short` and `git --no-pager diff`. Use targeted line-range reads and regex searches; never read whole `public/` trees or generated assets. Batch independent tool calls in parallel.
- **Strict diff edits:** Modify existing files with targeted `edit_file` patches (or `bee-ed` for large files / `bee-ed balance` for HTML/MD). Reserve `write_file` for newly created files only. Never use shell heredocs to write source files or emit placeholder comments.
- **`public/` is build output:** Never hand-edit files in `public/`.

---

## 5. Architecture & Curriculum Non-Negotiables

- **Static-first vanilla stack:** Pure HTML5/CSS3/ES6+ and Bootstrap. Shared headers, footers, and sidebars are injected at build time (`node build.js`), never fetched at runtime. Inline JS is extracted to `public/assets/js/inline/`.
- **Template-defined roadmaps (5+ phases):** Follow `assets/roadmap_template.html`, `assets/topic_template.html`, and `assets/topic_sidebar_template.json` (see `manual/ARCHITECTURE.md`).
- **3-level sidebar JSON (`roadmaps/<track>/data/<topic>.json`):** Single root `h1` folder → `h2` chapters → `h3` anchors (no `role` key; leaf `h2` omits `children`). Never publish flat sidebar lists.
- **Canonical URLs & security:** Topic links `/roadmaps/<track>/<topic>.html`; track roots `/roadmaps/<track>/`. Never use relative links. External links require `target="_blank" rel="noopener noreferrer nofollow"`.
- **Content quality overrides token economy:** Token discipline applies to context and process ONLY — **never** trim learner-facing explanations, examples, or didactic comments. Author as a mentor, professor, and engineer; avoid promotional adjectives (*Ultimate*, *Complete*, *Professional*, *Easy*, *Simple*); keep references only on track `index.html` and `references.html`.

---

## 6. Validation Gate (Exact Order)

After any source edit, run in exact order:
1. `npm run test` — validates source syntax and sidebar hierarchy.
2. `npm run build` — assembles `public/` (`npm run build:full` for clean rebuild).
3. `npm run check` — audits compiled `public/` output and inline script extraction.

After roadmap content edits, also run `python tracking/generate_roadmaps_status.py` and `python scripts/tools/verify_sidebars.py <track>`.

  