---
name: author-topic
description: Create or update roadmap/project topic pages and their sidebar JSON for Sage-Code. Use when writing curriculum content, adding a topic to a track, fixing heading/sidebar structure, or updating canonical links.
---

# Authoring Roadmap / Project Topics

Follow the canonical templates: `assets/topic_template.html` (topic pages) and `assets/roadmap_template.html` (track index).

## Topic page rules
- Exactly one `h1`; multiple `h2`; `h3` sub-sections under each `h2`. Keep heading IDs stable.
- Semantic skeleton: `header#dynamic-header`, `aside#study-sidebar` (or `aside.side-bar`), `main#main-content`, footer.
- Boot `window.TOPIC_CONFIG` (topicId, labId) and include `/assets/js/topic-loader.js`.
- No inline executable JS/styles in source (build extracts to `public/assets/js/inline/`).
- Prism: link the single bundle `/assets/prism.css` + `/assets/prism.js`; code blocks use `language-<lang> line-numbers`. Always `content-code.css` + `content-sidebar.css`; `content-tables.css` only when the page has tables. No `prism-loader.js` / `data-lang`.
- External links: `target="_blank" rel="noopener noreferrer nofollow"`.
- Canonical topic link: `/roadmap/<track>/<topic>.html`; track root `/roadmap/<track>/`. Never relative links or `/cse/...` style roots.

## Sidebar JSON (`roadmap/<track>/data/<topic>.json`)
- Hierarchical: each H2 object has a `children` array of H3 anchors. Flat lists break tree navigation.
- Links are local anchors (`#section`). Titles short and factual.

## Curriculum standard
- Step-by-step fundamentals → production; progressive executable examples; common pitfalls; trade-offs; mini-lab practice.
- No promotional adjectives (Ultimate/Complete/Professional/Easy).

## Content Authoring Standard (mandatory)
- Explain before code: every h2/h3 chapter AND every code example has a textual introduction (what it shows + why).
- Gradual complexity: complete-beginner → advanced, within each page and across the track.
- Didactic comments in every example: intent, edge cases, why — teaching proper commenting.
- NEVER trim tutorial content to save tokens; completeness wins over token economy on learner-facing pages.

## Persona & Pedagogy (mandatory)
- Author as a highly trained mentor, professor, and engineer: WHY first (mentor), principles stated (professor), production reality (engineer).
- Engaging, not boring: vary prose/code/tables/diagrams; short paragraphs; guided practice; no promotional adjectives or filler.
- Good for everyone: define terms on first use; short clear sentences; fundamentals first, production later.
- Visual mode: when a concept is spatial/relational, produce an SVG diagram that fits the language — prefer `roadmap/<track>/img/<name>.svg` (track); reuse shared `assets/images/<name>.svg` only when it faithfully matches the language's construct. Embed as `<img src="/images/<name>.svg" alt="...">` or `<img src="/roadmap/<track>/img/<name>.svg" alt="...">` with a one-line caption.

## Practice & Demo (required for every track)
- Single-file demos live in `roadmap/<track>/demo/NN_name.<ext>`, numbered and grouped by category.
- Create `demo_examples.html` + `data/demo_examples.json` (flat TITLED entries) listing demos by category, each linked to `/roadmap/code-viewer.html?file=/roadmap/<track>/demo/<file>`.
- Add a `demo_examples` row to the track `index.html` under a "Practice & Demo" phase.
- New languages: extend `assets/js/code-viewer.js` `langMap` + add the Prism component in `roadmap/code-viewer.html`.

## Track blueprint & asset reuse

- Model the track on `roadmap/csharp/` (reference implementation): index phases dashboard, lessons, `demo_examples.html`, `samples.html`, dedicated `references.html`.
- Register every new/moved topic in `index.html` under the right phase; topic numbers stay sequential — inserting renumbers later rows and phase headers.
- References list only on the track index and `references.html`; never add a per-page References section.
- Diagrams are language-specific: reuse a shared `assets/images/*.svg` (source path `/images/<name>.svg`) only as a language-agnostic primitive that faithfully matches this language. Otherwise author a NEW SVG in `roadmap/<track>/img/<name>.svg` (or `projects/<project>/img/`). Never copy a shared SVG into the track.
- After content work, regenerate tracking (`trace.sh python tracking/generate_roadmaps_status.py`) and cross-check sidebar links ↔ heading IDs.

## Validate before done
Through `trace.sh`: `npm run test` → `npm run build` → `npm run check`. Then write `.temp/task-<id>.md` report and stop — switch back to Plan.
