# DeepSeek Agent Instructions for Sage-Code SCL (Fireworks)

## Core Philosophy & Objective
This repository builds the static-first vanilla website for Sage-Code. DeepSeek operates as a **low-cost worker model** on Fireworks serverless inference. Priorities: **high-volume mechanical execution**, **minimal generated output**, and strict adherence to the project's static generator and curriculum standards.

**Prerequisite:** Read [agents/fireworks.md](../fireworks.md) for API configuration, model IDs, pricing, and prompt-caching rules. This file covers model behavior only.

---
## 1. Worker-Model Role & Escalation Protocol
* **Worker tasks (default):** bulk content drafting, JSON metadata generation, HTML structure edits, tone normalization, find/replace verification, schema-compliant refactors.
* **Escalate, do not grind:** after 2 failed validation passes on the same task, stop and hand off to the premium model (Gemini/Claude) with a failure summary (task, files, reason, tokens spent).
* **Never attempt in-session:** deep architectural reasoning, ambiguous-requirement resolution, cross-system design. Delegate directly to the premium model.

---
## 2. Automation & Performance Rule: Cross-Platform Python & POSIX Shell
* **POSIX-Compatible Environment:** All shell instructions must assume a POSIX-compliant shell (Bash via Git Bash on Windows, or native shell on Linux/macOS). Never generate or use PowerShell syntax (`pwsh`).
* **Prefer Python Scripts for Bulk Tasks:** For find-and-replace, refactoring, text transformation, or normalization, generate and execute a Python script using standard `python3` invocations.
* **Storage Location:** All new utility scripts **must** be created within the `scripts/tools/` directory. Do not clutter the project root.
* **Diff Generation & Validation:** Python automation scripts must output clear diffs or dry-run validation summaries before writing modifications to disk.
* **Reserve AI for Complex Logic:** Execute all mechanical, multi-file updates via Python — deterministic scripts cost zero tokens.

---
## 3. Token & Cost Governance (Worker Edition)
Output tokens cost 2–3× input on this tier; generated output is the dominant cost.
1. **Emit diffs, not files.** Use patch or search/replace block format. Never reprint an entire file.
2. **Respect `max_tokens` guardrails** from `fireworks.md` §5 (diffs 512–1,024; page drafts 2,048–4,096; JSON metadata 1,024).
3. **Cache-friendly prompts:** keep the system prefix byte-identical across requests; put variable task content last.
4. **Use `git diff` / `git status` for context** instead of reading whole files; use targeted range reads (`start_line` / `end_line`) when full dumps are unnecessary.
5. **Minimize context loading:** avoid reading whole directories or generated assets in `public/`; rely on precise regex searches.
6. **Batch operations:** execute independent tool calls concurrently to minimize round trips.
7. **Concise communication:** direct, factual, minimal. No conversational filler or boilerplate recaps.

---
## 4. DeepSeek-Specific Behavior
* **Structured output first:** prefer JSON mode / structured outputs for metadata and machine-consumed artifacts; DeepSeek adheres tightly to schemas.
* **Large-context batching:** with a 1M-token window, prefer one large-context batch draft over multi-round exchanges — fewer requests means fewer cache-prefix misses.
* **Terse reasoning:** do not narrate analysis. Output the artifact plus a minimal validation note.
* **Model selection:** default `accounts/fireworks/models/deepseek-v4-flash-0731`; escalate to `deepseek-v4-pro-0813` only after repeated validation failure (see `fireworks.md` §2).

---
## 5. Fast Onboarding Checklist
When initiating work:
- Check `git status` and `git diff` to understand current modifications.
- Reference core architecture files if needed: `build.js`, `manual/ARCHITECTURE.md`, `vercel.json`.
- Essential validation commands: `npm run build`, `npm run test:local`.

---
## 6. Architecture & Static Generation Rules
- **Vanilla Stack:** Pure HTML5, CSS3, ES6+ JavaScript, and Bootstrap where established. No modern JS framework runtimes (e.g., React/Vue).
- **Static-First Assembly:** Treat this project as a static site generator. All shared navigation headers, footers, and layouts are injected at build time, **never** via runtime client-side fetching.
- **Directory Layout:**
  - `scripts/tools/`: All new utility and automation scripts.
  - `roadmap/`: Learning track content and metadata.
  - `projects/`: Standalone project sites.
  - `layouts/`: Reusable HTML template page wrappers.
  - `assets/css/` & `assets/js/`: Global styling and logic. (Legacy `/common` path is deprecated).
  - `public/`: Generated runtime build output only. Do not manually edit files here.
- **Script Extraction:** All inline executable JS in source HTML must be extracted to `public/assets/js/inline` during build.

---
## 7. Navigation & Sidebar Shape
Before creating or editing roadmap topic pages and their corresponding JSON metadata:
- **Topic Page Structure:** Each topic page must have exactly one `h1`, multiple `h2`, and multiple `h3` sub-sections under every `h2`.
- **JSON Metadata Hierarchy:** Matching `roadmap/<track>/<topic>.json` files must be strictly hierarchical: each `h2` entry must contain a `children` array of `h3` anchors. (Do not publish flat JSON lists; flat lists break tree navigation in `assets/js/topic-loader.js`).

---
## 8. Publishing & URL Routing Behavior
- **Canonical URLs:**
  - For roadmap index links, use absolute canonical static paths: `/roadmap/<track>/<topic>.html`.
  - For roadmap track canonical URLs, use trailing-slash track roots: `/roadmap/<track>/`.
  - Never use relative links (e.g., `./topic`) or root track links (e.g., `/cse/topic.html`).
- **External Links Security:** Always attach `target="_blank"` and `rel="noopener noreferrer nofollow"` to external links.

---
## 9. AI Curriculum Authoring Standard
When writing or updating roadmap content:
- **Technical Tone:** Clear, step-by-step engineering instruction from fundamentals to production. Avoid promotional adjectives (e.g., *Ultimate*, *Complete*, *Professional*, *Easy*, *Simple*).
- **Concise Headings:** Keep `h1`, `h2`, `h3`, and sidebar labels compact and factual.
- **Standard Topic Structure:**
  1. Concept overview and real-world engineering significance.
  2. Syntax and construct mechanics.
  3. Progressive executable code examples (basic -> intermediate -> production).
  4. Common pitfalls, edge cases, and mitigations.
  5. Performance and maintainability trade-offs.
  6. Practical mini-lab / practice sequence.

---
## 10. Bulk Changes & Validation Workflow
- Use deterministic Python scripts for bulk refactors, placed in `scripts/tools/`.
- All worker output must pass the validation gate (`fireworks.md` §7) **before acceptance**:
  - `npm run build` and `npm run test:local` succeed.
  - JSON metadata parses and is strictly hierarchical.
  - `public/index.html` has embedded navigation header and footer markup; extracted inline scripts exist in `public/assets/js/inline/`.
- 2 failed passes → escalate per `fireworks.md` §6. Do not retry a third time.

