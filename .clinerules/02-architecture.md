# Architecture — Sage-Code SCL (always active)

SCL is a sophisticated static website for learning software engineering and programming — didactic, practical, and highly accurate. Static-first vanilla HTML/CSS/JS generator. Deployed to Vercel from `public/`. Supabase optional for roadmap auth.

## Layout
- `assets/` — shared CSS/JS/fonts/images; templates `assets/roadmap_template.html`, `assets/topic_template.html`.
- `roadmap/` — learning tracks: source pages + `roadmap/<track>/data/<topic>.json` sidebars; each track has `demo/` single-file demos (subfolders allowed) and a `demo_examples.html` index page (see manual/ARCHITECTURE.md §Demo Example Pages).
- `projects/` — standalone project sites (topic contract in `manual/PROJECTS-ARCHITECTURE.md`).
- `layouts/` — header/footer/base wrappers injected at build time (never runtime DOM assembly).
- `public/` — generated deploy output. Never hand-edit.
- `scripts/` — tooling; reusable scripts go in `scripts/tools/` (e.g. `trace.sh`).

## Build pipeline
`node build.js` regenerates `public/`, copies assets, injects shared header/footer + sidebars, extracts inline JS to `public/assets/js/inline/`. Source pages keep `<header id="dynamic-header">` placeholders.

## Topic page contract
- At least one `h1`; multiple `h2`; and `h3` under each `h2`. Keep heading IDs stable. A page MAY declare several `h1`, each rooting its own sidebar tree.
- Sidebar JSON follows the **template** (`manual/ARCHITECTURE.md` §"Topic sidebar JSON — template", scaffold at `assets/topic_sidebar_template.json`) — there is no reference track; a track is an instance. The page title (`h1`) is the ONLY top-level entry and carries its `h2` chapters in `children`, each `h2` carrying a `children` array of `h3` anchors — three collapsible levels (title → chapter → section) in `topic-loader.js` and `build.js`. The title is an ordinary folder: no `role` key, no special glyph. An `h2` with no `h3` is a leaf chapter (no `children` key), not an empty folder. Legacy flat sidebars (childless `role: "title"` leaf + flat `h2`) still render on older tracks and warn as content debt; migrate with `python scripts/tools/migrate_sidebars.py --track <track>` (structure from the page, existing titles preserved), or `--all` for the whole repo.
- Topic pages boot `window.TOPIC_CONFIG` (topicId, labId) and load `/assets/js/topic-loader.js`.
- Prism: link the single bundle `/assets/prism.css` + `/assets/prism.js` (no prism-loader/data-lang); always `content-code.css` + `content-sidebar.css`; `content-tables.css` only when the page has tables.

## Roadmap structure (template-defined)

- A track is an instance of the pattern, never the definition of it. Templates: `assets/roadmap_template.html`, `assets/topic_template.html`, `assets/topic_sidebar_template.json`. Pattern: phases dashboard index, numbered topic rows (`01..NN`), lesson pages + `data/<topic>.json` sidecars, `demo_examples.html`, `samples.html`, and a dedicated `references.html` (final phase).
- References live only on the track index and the references page — never a per-topic References section.
- Diagrams must fit the language. `assets/images/*.svg` are language-agnostic primitives only (generic control flow / HPC shapes; `/images/<name>.svg` in source). Never copy a shared SVG into a track. When no shared diagram faithfully depicts the language's construct, author a NEW track-specific SVG at `roadmap/<track>/img/<name>.svg` (`projects/<project>/img/` for projects). Not all languages are the same. SVG style: solid non-transparent canvas and boxes, light-on-dark contrast (dark writing only inside light highlight boxes), UML/logic shapes, aligned gaps — `manual/ARCHITECTURE.md` §Diagrams.

## Links & security
- Canonical topic links: `/roadmap/<track>/<topic>.html`. Track roots: `/roadmap/<track>/`.
- External links: `target="_blank" rel="noopener noreferrer nofollow"`.

## Curriculum style
- Technical, step-by-step, fundamentals → production. No promotional adjectives.
- Full details: `manual/ARCHITECTURE.md`.
## Mission & quality bar
- Roadmaps are didactic, practical, and highly accurate: every factual claim is verified against official documentation; no filler, no placeholders, no promotional adjectives.
- Lab quality is high at every level: concepts progress from complete-beginner to expert through 5 or more phases of sophistication.

## Roadmap phases (5+ required)
- Every track MUST define at least five phases of increasing sophistication — a typical ladder: foundations → implementation/advanced → domain/application → practice & demos → reference.
- Phase headers and topic rows are numbered sequentially across the track (`01..NN`); inserting a topic renumbers later rows and phase headers.

## SVG diagrams & explanations (mandatory)
- Any spatial, relational, or structural concept must be illustrated with an SVG and an explanatory caption — diagrams teach, they are never decoration.
- Reuse a shared language-agnostic primitive (`assets/images/*.svg`, source path `/images/<name>.svg`) only when it faithfully matches; otherwise author a NEW SVG at `roadmap/<track>/img/<name>.svg` (projects: `projects/<project>/img/`). Never copy a shared SVG into a track.
- Follow the dark-theme style spec in `manual/ARCHITECTURE.md` §Diagrams: solid non-transparent canvas and boxes, light-on-dark contrast, UML/logic shapes, aligned gaps.

## Syntax highlighting (Prism + exotic languages)
- Common languages: single Prism bundle `/assets/prism.css` + `/assets/prism.js`; no prism-loader or data-lang. Always link `content-code.css` + `content-sidebar.css`.
- Grammars are added CENTRALLY to `assets/prism.js` (the download link in its header lists the included languages).
- Exotic / uncommon languages in engineering roadmaps: register the grammar centrally when possible; when a grammar cannot be provided, the page MUST include additional CSS (a `content-code` extension or a track-level stylesheet) so comments, strings, and keywords stay visually distinguishable in the dark theme. Never ship unformatted code walls.
- Local code viewer: extend `assets/js/code-viewer.js` `langMap` for every new file extension so `/roadmap/code-viewer.html?file=...` links highlight correctly (demo files included).

## Code examples: comments are mandatory
- A code example without comments is defective.
- Every example has a preceding intro paragraph (what it shows + why) and didactic comments covering intent and edge cases — the comments teach correct commenting. Same standard in `03-execution-protocol`.

## Practice & demos
- `roadmap/<track>/demo/` holds runnable single-file examples (`NN_name.<ext>`) and MAY contain subfolders to group demos by phase or category (`demo/<group>/NN_name.<ext>`).
- Demos may be spread around the tutorial (embedded in lesson pages) and/or centralized per phase.
- Centralized page `demo_examples.html`: one `h1`, one `h2` per phase/category; each category lists its demos in a table `# | Description | Link`; the Link column opens the local code viewer:
  `/roadmap/code-viewer.html?file=/roadmap/<track>/demo/<group>/<filename>` (subfolder paths included).
  Tracks whose demos render standalone in a browser add a second **Preview** column linking the
  demo file directly (`target="_blank" rel="noopener noreferrer"`).
- Sidebar `data/demo_examples.json`: template shape with leaf chapters; build with `migrate_sidebars.py --track <track>` or `gen_topic_sidebars.py --mixed`.
- The track `index.html` lists a `demo_examples` row under a Practice & Demo phase. Full details: `manual/ARCHITECTURE.md` §Demo Example Pages.

