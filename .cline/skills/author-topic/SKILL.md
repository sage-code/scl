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

## Validate before done
Through `trace.sh`: `npm run test` → `npm run build` → `npm run check`. Then write `.temp/task-<id>.md` report and stop — switch back to Plan.
