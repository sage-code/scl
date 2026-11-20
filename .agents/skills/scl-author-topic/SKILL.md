---
name: scl-author-topic
description: >-
  Author or update Sage-Code SCL roadmap/project topic pages, sidebar JSONs,
  SVG diagrams, and demo_examples pages. Use when writing curriculum content,
  adding or revising topics, fixing heading/sidebar hierarchy, or creating track demos.
---

# Authoring Roadmap & Project Topics

Use canonical templates: `assets/topic_template.html`, `assets/roadmap_template.html`, and `assets/topic_sidebar_template.json`.

## 1. Content Authoring & Pedagogy Standard (Mandatory)

> **Overrides token economy:** Token-efficiency rules apply to context retrieval and process ONLY — **never** trim learner-facing explanations, examples, or didactic comments to save tokens.

Author as a **mentor, professor, and engineer**:

- **Mentor:** Open with why the concept matters before mechanics; anticipate beginner pitfalls; welcoming, never condescending.
- **Professor:** Define every term on first use; state underlying principles; follow `why → what → how → practice`.
- **Engineer:** Show production trade-offs, edge cases, and real-world consequences; avoid promotional adjectives (*Ultimate*, *Complete*, *Professional*, *Easy*, *Simple*).
- **Explain before code:** Every `h2` chapter, every `h3` subchapter, and every code block MUST have a preceding explanatory paragraph stating what it demonstrates and why it matters. No bare headings or unintroduced code blocks.
- **Gradual complexity:** Progress from complete-beginner to production within each page and across the track (5+ phases).
- **Mandatory didactic comments:** Every code example MUST include meaningful comments explaining intent, invariants, and edge cases — never restating obvious syntax.
- **Engaging variety:** Mix short paragraphs, executable code, tables, SVG diagrams, and a guided mini-lab/practice step.

Standard topic progression:
1. Concept overview and engineering significance
2. Syntax and construct mechanics
3. Progressive executable examples (basic → intermediate → production)
4. Common pitfalls, edge cases, and mitigations
5. Performance and maintainability trade-offs
6. Practical mini-lab / practice sequence

## 2. Topic Page HTML Contract

- Headings: at least one `h1` (multiple allowed, each rooting a sidebar tree), multiple `h2`, and `h3` sub-sections under each `h2`. Keep heading `id` attributes stable.
- Skeleton: `header#dynamic-header`, `aside#study-sidebar` (or `aside.side-bar`), `main#main-content`, footer.
- Boot `window.TOPIC_CONFIG` (`topicId`, `labId`) and include `/assets/js/topic-loader.js`.
- No inline executable JS/styles in source HTML.
- Styles & Prism: `/assets/prism.css`, `/assets/prism.js`, `content-code.css`, `content-sidebar.css`, plus `content-tables.css` only when tables are present. Code blocks use `language-<lang> line-numbers`.
- Canonical links: `/roadmap/<track>/<topic>.html` and `/roadmap/<track>/`.
- External links: `target="_blank" rel="noopener noreferrer nofollow"`.
- No per-topic References section (references belong only on track `index.html` and `references.html`).

## 3. Sidebar JSON (`roadmap/<track>/data/<topic>.json`)

Template shape (`assets/topic_sidebar_template.json`):
- Single top-level `h1` entry with `children` array of `h2` chapters; each `h2` has a `children` array of `h3` anchors.
- No `role` key or special glyph on the root title. Leaf `h2` chapters omit `children`.
- Short factual titles (plain `&`, no HTML entities) and local `#anchor` links.

Tooling:
- Generate sidebar from page: `python scripts/tools/gen_topic_sidebars.py roadmap/<track>/<topic>.html`
- Migrate legacy flat sidebars: `python scripts/tools/migrate_sidebars.py --track <track>`
- Verify sidebar anchors against HTML IDs: `python scripts/tools/verify_sidebars.py <track>`

## 4. Visual Mode (SVG Diagrams)

When a concept is spatial or relational (control flow, memory layout, type hierarchy, async timelines, pipelines), include an SVG diagram with a one-line explanatory caption:
- Check `assets/images/*.svg` first; reuse a shared `/images/<name>.svg` ONLY if it faithfully represents the language's construct. Never copy a shared SVG into a track.
- Otherwise author a NEW self-contained SVG in `roadmap/<track>/img/<name>.svg` (embed via `<img src="/roadmap/<track>/img/<name>.svg" alt="...">`).
- Dark-theme style spec (`manual/ARCHITECTURE.md` §Diagrams — non-negotiable):
  - Declare `viewBox` and responsive `width:100%`.
  - Solid non-transparent canvas (`#0f172a`) and boxes (`#1e293b`).
  - Light high-contrast text (`#e2e8f0` / `#94a3b8`); dark text ONLY inside light highlight boxes (`#f59e0b`, `#3b82f6`, `#ef4444`, `#34d399`).
  - UML/logic shapes only (rounded rect, rect, diamond, labeled arrows — no floating unboxed nodes), aligned on an axis with `>=12px` non-touching gaps.

## 5. Practice & Demo Pages

- Runnable single-file demos: `roadmap/<track>/demo/NN_name.<ext>` (category subfolders allowed).
- `demo_examples.html` + `data/demo_examples.json`: one `h1`, one `h2` per category, table `# | Description | Link` pointing to `/roadmap/code-viewer.html?file=/roadmap/<track>/demo/<file>`.
- Browser-renderable demos add a second **Preview** link straight to the demo file (`target="_blank" rel="noopener noreferrer"`).
- Register `demo_examples` in track `index.html` under a "Practice & Demo" phase.
- New language extensions: update `langMap` in `assets/js/code-viewer.js` and central grammar in `assets/prism.js`.

## 6. Post-Authoring Checklist

1. If a topic or phase was added/moved in `index.html`, renumber sequential topic IDs (`01..NN`) and phase headers.
2. Check HTML balance if `bee-ed` is available: `bee-ed balance roadmap/<track>/<topic>.html`.
3. Verify sidebar links match heading IDs: `python scripts/tools/verify_sidebars.py <track>`.
4. Regenerate tracking status: `python tracking/generate_roadmaps_status.py`.
5. Run the validation gate (`scl-build-validate` skill): `npm run test` → `npm run build` → `npm run check`.
