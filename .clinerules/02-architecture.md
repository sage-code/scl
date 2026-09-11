# Architecture — Sage-Code SCL (always active)

Static-first vanilla website generator. Deployed to Vercel from `public/`. Supabase optional for roadmap auth.

## Layout
- `assets/` — shared CSS/JS/fonts/images; templates `assets/roadmap_template.html`, `assets/topic_template.html`.
- `roadmap/` — learning tracks: source pages + `roadmap/<track>/data/<topic>.json` sidebars.
- `projects/` — standalone project sites (topic contract in `manual/PROJECTS-ARCHITECTURE.md`).
- `layouts/` — header/footer/base wrappers injected at build time (never runtime DOM assembly).
- `public/` — generated deploy output. Never hand-edit.
- `scripts/` — tooling; reusable scripts go in `scripts/tools/` (e.g. `trace.sh`).

## Build pipeline
`node build.js` regenerates `public/`, copies assets, injects shared header/footer + sidebars, extracts inline JS to `public/assets/js/inline/`. Source pages keep `<header id="dynamic-header">` placeholders.

## Topic page contract
- Exactly one `h1`, multiple `h2`, and `h3` under each `h2`. Keep heading IDs stable.
- Sidebar JSON must be hierarchical: each `h2` has a `children` array of `h3` anchors (flat lists break `topic-loader.js`).
- Topic pages boot `window.TOPIC_CONFIG` (topicId, labId) and load `/assets/js/topic-loader.js`.

## Links & security
- Canonical topic links: `/roadmap/<track>/<topic>.html`. Track roots: `/roadmap/<track>/`.
- External links: `target="_blank" rel="noopener noreferrer nofollow"`.

## Curriculum style
- Technical, step-by-step, fundamentals → production. No promotional adjectives.
- Full details: `manual/ARCHITECTURE.md`.
