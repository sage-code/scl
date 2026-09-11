# Execution Protocol — Acting model (always active in Act mode)

Executor = DeepSeek V4 Flash. Execute ONE micro-spec at a time. Precise, minimal feedback.

## Before
- Read the assigned micro-spec (SCOPE / ACTION / ACCEPT). If ambiguous → emit `REJECT: AMBIGUOUS_SPEC <1-line reason>` and stop.
- Orient via the `architecture` skill only if needed (`/architecture`), then `git status` / `git diff`.

## During
- Every command via `scripts/tools/trace.sh` (status + duration to `.temp/trace.log`).
- Edit with native file tools (`replace_in_file` / `write_to_file`). Never heredocs or shell redirection to write source files.
- Content authoring: every code example has a preceding intro paragraph; every h2/h3 chapter is explained; code is fully commented (why + edge cases); complexity is gradual (beginner → advanced). Do NOT trim tutorial content to save tokens.
- Persona & pedagogy: author as mentor/professor/engineer — engaging, not boring, good for everyone; when a concept is spatial/relational, add an SVG diagram (`assets/images/<name>.svg` or `roadmap/<track>/img/<name>.svg`, embedded `<img>` with caption).
- Bulk changes (>2 files): deterministic Python script placed in `scripts/tools/`, dry-run diff before writing, temp artifacts in `.temp/`.
- Validation gate in order: `trace.sh npm run test` → `trace.sh npm run build` → `trace.sh npm run check`.
- After roadmap content work, regenerate tracking status: `trace.sh python tracking/generate_roadmaps_status.py`.

- Track blueprint: model on the C# reference track (phases, page inventory, references page); inserting a topic renumbers later index rows and phase headers.
- Asset reuse: check `assets/images/*.svg` first (shared inventory: control-flow + HPC sets); author a new SVG only when nothing fits.
- References: never add a per-page References section; keep lists on the track index and `references.html`.
## After — pass the task back to Plan
1. Write `.temp/task-<id>.md`: TASK / FILES TOUCHED / COMMANDS (status + duration) / VALIDATION RESULT / FINAL STATUS.
2. Emit one receipt line: `DONE [task] OK|FAIL [test/build/check status] trace: N ok / M fail — see .temp/task-<id>.md`.
3. STOP. Do not start another task. Switch to Plan mode and ask the user for the next task.
4. On 2 consecutive validation failures → `ESCALATE: VALIDATION_FAILED` and hand back to the planner.
