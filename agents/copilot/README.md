# Copilot Agent Instructions for Sage-Code SCL

## Core Philosophy & Objective
This repository builds the static-first vanilla website for Sage-Code. Copilot agents must prioritize **high token efficiency (TPM reduction)**, **git-diff-driven context retrieval**, and strict adherence to the project's static generator and curriculum standards.

---
## 1. Automation & Performance Rule: Cross-Platform Python & POSIX Shell

* **POSIX-Compatible Environment**: All shell instructions must assume a POSIX-compliant shell (Bash via Git Bash on Windows, or native shell on Linux/macOS). Never generate or use PowerShell syntax (`pwsh`).
* **Prefer Python Scripts for Bulk Tasks**: For find-and-replace, refactoring, text transformation, or normalization, generate and execute a Python script using standard `python3` invocations.
* **Diff Generation & Validation**: Python automation scripts must output clear diffs or dry-run validation summaries before writing modifications to disk.
* **Reserve AI for Complex Logic**: Use AI exclusively for deep architectural reasoning, semantic understanding, or code design. Execute all mechanical, multi-file updates via Python.
---

## 2. Token Efficiency & TPM Management (Free Quota Optimization)

To operate smoothly within free-tier quota limits (strict TPM/RPM constraints):

1. **Use `git diff` for Context:**
   - Always run `git diff` or `git status` to inspect incremental changes rather than reading whole files.
   - Use targeted range reads (`start_line` / `end_line`) when full file dumps are unnecessary.
2. **Minimize Context Loading:**
   - Avoid reading whole directories or large generated assets in `public/`.
   - Rely on specific regex codebase searches (`search_codebase`) targeting exact function names, IDs, or classes.
3. **Concise Communication:**
   - Keep planning and explanation outputs direct, factual, and minimal. Omit conversational chatter or boilerplate recaps.
4. **Batch Operations:**
   - Execute independent tool calls concurrently where available to minimize round-trip overhead.

---

## 3. Fast Onboarding Checklist

When initiating work:
- Check `git status` and `git diff` to understand current modifications.
- Reference core architecture files if needed:
  - `build.js`
  - `manual/ARCHITECTURE.md`
  - `vercel.json`
- Essential validation commands:
  - `npm run build`
  - `npm run test:local`

---

## 4. Architecture & Static Generation Rules

- **Vanilla Stack:** Pure HTML5, CSS3, ES6+ JavaScript, and Bootstrap where established. No modern JS framework runtimes (e.g., React/Vue).
- **Static-First Assembly:** Treat this project as a static site generator. All shared navigation headers, footers, and layouts are injected at build time, **never** via runtime client-side fetching.
- **Directory Layout:**
  - `roadmap/`: Learning track content and metadata.
  - `projects/`: Standalone project sites.
  - `layouts/`: Reusable HTML template page wrappers.
  - `assets/css/` & `assets/js/`: Global styling and logic. (Legacy `/common` path is deprecated).
  - `public/`: Generated runtime build output only. Do not manually edit files here.
- **Script Extraction:** All inline executable JS in source HTML must be extracted to `public/assets/js/inline` during build.

---

## 5. Navigation & Sidebar Shape

Before creating or editing roadmap topic pages and their corresponding JSON metadata:
- **Topic Page Structure:** Each topic page must have exactly one `h1`, multiple `h2`, and multiple `h3` sub-sections under every `h2`.
- **JSON Metadata Hierarchy:** Matching `roadmap/<track>/<topic>.json` files must be strictly hierarchical: each `h2` entry must contain a `children` array of `h3` anchors. (Do not publish flat JSON lists; flat lists break tree navigation in `assets/js/topic-loader.js`).

---

## 6. Publishing & URL Routing Behavior

- **Canonical URLs:**
  - For roadmap index links, use absolute canonical static paths: `/roadmap/<track>/<topic>.html`.
  - For roadmap track canonical URLs, use trailing-slash track roots: `/roadmap/<track>/`.
  - Never use relative links (e.g., `./topic`) or root track links (e.g., `/cse/topic.html`).
- **External Links Security:** Always attach `target="_blank"` and `rel="noopener noreferrer nofollow"` to external links.

---

## 7. AI Curriculum Authoring Standard

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

## 8. Bulk Changes & Validation Workflow

- Use deterministic Python scripts for bulk refactors.
- Always execute `npm run build` after changes and verify:
  - `public/index.html` has embedded navigation header and footer markup.
  - Extracted inline scripts exist in `public/assets/js/inline/`.
  - Navigation tree JSONs are valid and hierarchical.

