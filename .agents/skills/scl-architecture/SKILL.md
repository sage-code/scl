---
name: scl-architecture
description: >-
  Orientation and architectural reference for the Sage-Code SCL static website.
  Use when starting a task, planning roadmap changes, inspecting repository layout,
  or verifying build pipeline, template contracts, Prism/diagram policies, or canonical URLs.
---

# Sage-Code SCL — Architecture Reference

Sage-Code SCL is a static-first, vanilla HTML5/CSS3/ES6+ (+ Bootstrap) learning platform built by `node build.js` into `public/` and deployed on Vercel. Roadmap accounts and progress tracking use Vercel serverless functions in `api/` backed by Turso (libSQL) and Resend email.

## Fast Orientation

1. Inspect current changes first: `git status --short` and `git --no-pager diff --stat`.
2. Deep-dive only when needed:
   - [manual/ARCHITECTURE.md](../../../manual/ARCHITECTURE.md) — full site & diagram specification
   - [manual/PROJECTS-ARCHITECTURE.md](../../../manual/PROJECTS-ARCHITECTURE.md) — standalone project sites
   - [build.js](../../../build.js) and [vercel.json](../../../vercel.json)
3. Canonical templates:
   - Track index: `assets/roadmap_template.html`
   - Topic page: `assets/topic_template.html`
   - Sidebar JSON: `assets/topic_sidebar_template.json`

## Directory Layout

| Path | Purpose |
|---|---|
| `roadmaps/` | Learning tracks: `index.html`, topic `.html` pages, `data/<topic>.json` sidebars, `img/*.svg`, `demo/` runnable examples, `demo_examples.html`, `samples.html`, `references.html` |
| `projects/` | Standalone project sites (`bee`, `eve`, `maj`) |
| `community/` | Community pages |
| `layouts/` | Shared header/footer/base HTML wrappers injected at build time |
| `assets/` | Shared CSS, JS, fonts, images (`/images/<name>.svg`), and HTML/JSON templates (legacy `/common` is deprecated) |
| `api/` | Vercel serverless functions (Turso/libSQL + Resend) |
| `scripts/tools/` | Reusable automation, validation, and migration scripts (place all new utility scripts here) |
| `tracking/` | Track status generators (`tracking/generate_roadmaps_status.py`) |
| `public/` | **Generated build output — never hand-edit** |
| `.temp/` | Git-ignored spool for logs, plans, task reports, and scratch files |

## Build Pipeline & Runtime Contract

- `node build.js` regenerates `public/`, copies assets, injects shared header/footer and sidebars at build time (never via runtime client-side fetching), and extracts inline executable JS into `public/assets/js/inline/`.
- Source pages keep `<header id="dynamic-header">` placeholders.
- Topic pages boot `window.TOPIC_CONFIG` (`topicId`, `labId`) and load `/assets/js/topic-loader.js`.

## Roadmap & Topic Contracts (Template-Defined)

- **No single track is the reference definition** — follow the templates (`assets/roadmap_template.html`, `assets/topic_template.html`, `assets/topic_sidebar_template.json`) and `manual/ARCHITECTURE.md`.
- **Phases:** Every track defines **5+ phases** of increasing sophistication (e.g., foundations → implementation/advanced → domain/application → practice & demos → references).
- **Table layout (`index.html`):**
  - Phase row: `<tr class="roadmap-phase-row"><th colspan="4" class="roadmap-phase">PHASE X: NAME</th></tr>`
  - Topic row: `<tr data-topic="id"><td class="text-center"><input type="checkbox" class="topic-check"></td><td>ID</td><td><a href="/roadmaps/<track>/<topic>.html">Title</a></td><td class="small text-secondary">Description</td></tr>`
  - Topic rows are numbered sequentially (`01..NN`); inserting or moving a topic renumbers later rows and phase headers.
- **Sidebar JSON (`roadmaps/<track>/data/<topic>.json`):**
  - Three collapsible levels: the page `h1` title is the **sole top-level entry** `{ "title": "...", "link": "#<h1-id>", "children": [ ... ] }`, containing `h2` chapters, each with a `children` array of `h3` anchors.
  - No `role` key or special glyph on the root title. An `h2` without `h3` children omits the `children` key (leaf chapter).
- **References policy:** Reference lists live only on the track `index.html` and dedicated `references.html` — never add a trailing References section to a lesson page.

## Styling, Prism, Code Viewer & Diagrams

- **CSS:** Always link `content-code.css` and `content-sidebar.css`; link `content-tables.css` only when the page has tables.
- **Prism:** Use the single bundle `/assets/prism.css` + `/assets/prism.js` (`language-<lang> line-numbers`). Never use `prism-loader.js` or `data-lang`. Add new grammars centrally to `assets/prism.js`; for exotic languages without a grammar, provide a CSS extension so comments, strings, and keywords remain distinguishable in the dark theme.
- **Code Viewer:** Extend `langMap` in `assets/js/code-viewer.js` for new file extensions so `/roadmaps/code-viewer.html?file=...` highlights demo files properly.
- **Diagrams:** Shared primitives in `assets/images/*.svg` (`/images/<name>.svg`) are reused only when they faithfully match the language construct. Otherwise author a new track-specific SVG in `roadmaps/<track>/img/<name>.svg` (never copy a shared SVG into a track). Follow `manual/ARCHITECTURE.md` §Diagrams dark-theme rules.

## Canonical URLs & Security

- Topic links: `/roadmaps/<track>/<topic>.html` (never relative `./topic` or root `/cse/topic.html`).
- Track roots: `/roadmaps/<track>/` (trailing slash).
- External links: always include `target="_blank" rel="noopener noreferrer nofollow"`.
