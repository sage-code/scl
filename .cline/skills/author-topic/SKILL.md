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

## Practice & Demo (required for every track)
- Single-file demos live in `roadmap/<track>/demo/NN_name.<ext>`, numbered and grouped by category.
- Create `demo_examples.html` + `data/demo_examples.json` (flat TITLED entries) listing demos by category, each linked to `/roadmap/code-viewer.html?file=/roadmap/<track>/demo/<file>`.
- Add a `demo_examples` row to the track `index.html` under a "Practice & Demo" phase.
- New languages: extend `assets/js/code-viewer.js` `langMap` + add the Prism component in `roadmap/code-viewer.html`.

## Validate before done
Through `trace.sh`: `npm run test` → `npm run build` → `npm run check`. Then write `.temp/task-<id>.md` report and stop — switch back to Plan.
