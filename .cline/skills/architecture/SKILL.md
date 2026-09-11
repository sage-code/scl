---
name: architecture
description: Orientation for the Sage-Code SCL static website. Use when starting a task, planning roadmap work, or when you need the repository layout, build pipeline, topic-page contract, or validation commands.
---

# Sage-Code SCL — Architecture

Static-first vanilla website generator (HTML5/CSS3/ES6+, Bootstrap), built by `node build.js` into `public/`, deployed on Vercel. Supabase optional for roadmap auth.

## Orientation steps
1. `git status` + `git diff` — see current changes before reading anything.
2. Read `.clinerules/02-architecture.md` (always active) — namespaces + contracts.
3. Deep-dive only when needed: `manual/ARCHITECTURE.md`, `README.md`, `manual/PROJECTS-ARCHITECTURE.md`.
4. Templates: `assets/roadmap_template.html`, `assets/topic_template.html`.

## Key facts
- Source namespaces: `roadmap/` (42 language tracks), `projects/` (bee/eve/maj), `community/`.
- Sidebar JSON: `roadmap/<track>/data/<topic>.json` — hierarchical H2→H3; never flat.
- Topic page: 1 h1, multiple h2, h3 under each h2; `window.TOPIC_CONFIG` + `/assets/js/topic-loader.js` boot.
- Build injects header/footer/sidebar at build time; source pages keep placeholders (`header#dynamic-header`).
- `public/` is generated — never hand-edit.
- Validation: `npm run test` → `npm run build` → `npm run check` (through `trace.sh`).
- CLI: `./run.sh` (clean/build/rebuild/test/check/audit/commit/publish).
