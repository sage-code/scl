# Sage-Code SCL Architecture

## Purpose

This repository is a static-site source workspace. The build pipeline assembles source content into deployable runtime files under `public/`.

## Canonical Routes

- Site root: `/`
- Roadmap hub: `/roadmap/`
- Projects: `/projects/`
- Community: `/community/`

## Repository Layout

```text
/assets              # Shared CSS, JS, fonts, images
/roadmap             # Roadmap source pages and topic content
/projects            # Standalone project source pages
/community           # Community source pages and assets
/layouts             # Shared HTML wrappers/fragments
/public              # Generated deploy/runtime output
/manual              # Developer docs and generated reports
/database            # Supabase SQL setup scripts
/scripts             # Local tooling (Node, Python)
build.js             # Main build orchestrator
run.sh               # Project maintenance CLI wrapper
vercel.json          # Hosting config
```

## Project Maintenance CLI

The `run.sh` script provides a unified command-line interface for managing the local environment, build process, and git workflows.

### Usage
```bash
./run.sh [command] [options]
```

### Supported Commands
- `clean`     : Cleans build artifacts (`npm run clean`).
- `build`     : Generates the static website into `public/` — generation only, no validation (`npm run build`).
- `rebuild`   : Cleans and performs a full build (`npm run clean && npm run build:full`).
- `test`      : Verifies source files — the originals: JSON/JS/Python syntax and roadmap sidebar hierarchy (`npm run test`).
- `check`     : Verifies generated output in `public/` — footer injection, page closure, JSON hierarchy; CSS findings advisory (`npm run check`).
- `audit`     : Browser audit of generated pages via Puppeteer (`node scripts/audit.js <folder>`).
- `commit`    : Stages all changes and commits.
                Usage: `run commit "your message"` (or use `run` alias if configured).
- `publish`   : Bumps the patch version, commits, and pushes (`./run.sh publish`).
- `-h, --help`: Displays usage documentation.

*Note: For convenience, an alias `run` is configured in `~/.bashrc` pointing to `./run.sh`.*

## Template Policy

- Shared authoring templates live only in `assets/`.
- Canonical shared templates are `assets/roadmap_template.html` and `assets/topic_template.html`.
- Do not keep `template.html` files inside individual `roadmap/<track>/` folders.
- Roadmap track pages should use concrete source pages (`index.html`, topic pages, and optional `topic.html`) instead of per-track template files.

## Build Pipeline (Actual)

`npm run build` runs `node build.js` and performs the following:

1. Generates roadmap index metadata via `roadmap.py`.
2. Recreates `public/` from scratch.
3. Copies `assets/` to `public/assets/`.
4. Writes runtime Supabase config to `public/assets/js/supabase-config.js` from env vars when available (otherwise copies the source config file).
5. Copies root runtime files (`robots.txt`, `sitemap.xml`) to `public/`.
6. Copies source content into publish namespaces:
   - `projects/**` -> `public/projects/**`
   - `community/**` -> `public/community/**`
   - `roadmap/**` (including top-level auth pages and track folders) -> `public/roadmap/**`
7. Builds top-level root pages (`*.html`) into `public/*.html`.
8. Optimizes all published HTML files:
   - injects shared header/footer from `layouts/`
   - injects static sidebar structures for roadmap topics
   - injects roadmap runtime scripts for progress/auth where needed
   - rewrites legacy route prefixes to current canonical routes
   - rewrites and normalizes asset paths
   - externalizes executable inline scripts to `public/assets/js/inline/*.js`
9. Writes build metadata to `manual/build-manifest.json`.

Build does not run validations; verification is a separate step (`run test` for source files, `run check` for generated output).

## Route Contract

- Root pages: `public/*.html` from repository-root `*.html`.
- Roadmap landing: `public/roadmap/index.html` from `roadmap/index.html`.
- Roadmap auth/profile pages: `public/roadmap/login.html`, `public/roadmap/register.html`, `public/roadmap/profile.html`, `public/roadmap/reset-password.html`, `public/roadmap/unregister.html`.
- Roadmap tracks/topics: `public/roadmap/<track>/**`.
- Project pages: `public/projects/**`.
- Community pages: `public/community/**`.

## Roadmap Link Rules

- Topic links in roadmap index tables must use absolute static routes: `/roadmap/<track>/<topic>.html`.
- Track roots should use trailing slash canonical routes: `/roadmap/<track>/`.
- Do not author legacy top-level route prefixes (`/cse/`, `/csp/`, `/pro/`); the build has compatibility rewrites, but source should stay canonical.

## Runtime Script Ownership

- Shared runtime scripts live in `assets/js/`.
- Topic/runtime script injection is handled by `build.js`; source pages should not duplicate injected stacks unless required.
- Executable inline scripts in authored HTML are extracted at build time into `public/assets/js/inline/`.

## Supabase Integration Baseline

- Browser config source: `assets/js/supabase-config.js`.
- Runtime client stack: `assets/js/supabase-client.js`, `assets/js/roadmap-state.js`, `assets/js/roadmap-progress-sync.js`.
- SQL scripts:
  - `database/001_user_profiles.sql`
  - `database/002_roadmap_progress.sql`
  - `database/003_delete_own_roadmap_account.sql`
  - `database/004_roadmap_favorites.sql`

Build-time env support:

- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`
- `SUPABASE_SCHEMA` (optional, default `public`)

## Validation Workflow

1. `run test` — verify source files (originals): JSON/JS/Python syntax and roadmap sidebar hierarchy.
2. `run build` — generate `public/` (generation only, no validation).
3. `run check` — verify the generated output in `public/` (footer injection, page closure, JSON hierarchy; CSS findings advisory).
4. `run audit` — optional browser-level audit of generated pages.
5. `npm run check:sidebar` — live sidebar RENDER gate (`scripts/tools/check_sidebar_render.js`): serves the built `public/` and asserts with Puppeteer that `topic-loader.js` renders exactly the tree each sidecar JSON prescribes (top-level count, node count, deepest level, collapsibility of a folder that has children). Run it after `build` when the sidebar model or its renderers change.
6. `npm run check:html [-- <path> ...]` — markup gate (`scripts/tools/check_html_fragments.py`, logic in `scripts/validation_lib.py: html_markup_issues`). It reports tag balance and escaping with `line:col`, and it is code-region aware: the CONTENT of `<pre>`, `<code>`, `<script>`, `<style>` and `<textarea>` is masked before the document is tokenized, so a sample may hold `<`, `>`, `&` (C++ templates, Fortran relational operators, shell redirection) and even a literal `</code>` without producing a false failure. What still fails is the real thing: an unclosed `<pre>` that swallows the rest of a chapter, an unescaped `<` that the browser reads as a bogus tag (`if (i<n)`, `vector<int>`, `$<$<CONFIG:Debug>:-g>`), an unknown named entity (`&code;`), a stray or crossed closer, an `</h4>` with no opener. Elements a browser auto-closes (`<li>`, `<p>`, `<td>`, ...) are warnings, never failures. Point it at authoring fragments too: `npm run check:html -- .temp/<track>_pages`. Fixtures that pin this behaviour live in `.temp/html_fixtures/` (one clean file, one defect file, one unclosed-region file).

## Documentation Scope

- `manual/ARCHITECTURE.md` is the canonical architecture reference.
- `manual/PROJECTS-ARCHITECTURE.md` defines the shared topic-page contract for `/projects/*` namespaces.

### Syntax Highlighting — One Prism Bundle

All roadmap code is rendered by a **single Prism bundle** that supports every language on the site:

- **Assets**: `assets/prism.css` (theme) + `assets/prism.js` (grammars + line-numbers plugin). The owner registers new languages centrally inside that bundle — the download link in the header of `assets/prism.js` lists the included languages.
- **Loading (topic pages)** — exactly two tags, no `data-lang`, no `prism-loader.js`:
  - `<link rel="stylesheet" href="/assets/prism.css">`
  - `<script src="/assets/prism.js"></script>`
- **Code blocks**: `<pre><code class="language-<lang> line-numbers">…</code></pre>` — Prism auto-highlights on page load.
- **CSS requirement (topic pages)**:
  - Always: `content-code.css` (pre/code styling) and `content-sidebar.css` (left navigation).
  - Only when the page contains a table: `content-tables.css`.
  - Track index pages (`roadmap/<track>/index.html`) use `roadmap-index.css`, not the content-* set.

#### Exotic-Language Special Case (DSL Implementation Languages)

The Prism bundle is deliberately NOT extended for niche survey languages that ship only small examples (ANTLR `.g4`, Racket, Lisp/AutoLISP, Forth, Verilog, LLVM IR, Prolog, Datalog, Clingo, MiniZinc, MATLAB, Wolfram, Stan, FASM). For exactly those pages the DSL roadmap wires a per-page special case — never the global bundle:

- `assets/css/dsl-exotic.css` — per-language token refinements (numbers, directives, language-specific tweaks), linked on each affected page right after `content-code.css`.
- `assets/js/dsl-exotic.js` — a small dependency-free tokenizer with ordered per-language rule tables. It runs on `pre code.language-<lang>` blocks whose language is NOT in the bundle, skips Prism-owned blocks (detected via `.token` spans), is idempotent (`data-scl-highlighted`), and emits the same span classes `content-code.css` already styles: `comment`, `string`, `keyword`, `number`, `operator`, `directive`.

Rules of thumb: prefer registering the grammar centrally in `assets/prism.js` (the global bundle stays the first-class path); use the exotic pair only when the language is a niche DSL with one-page examples. Keep the per-language rule tables ordered (comments → strings → keywords → numbers → directives) so longer constructs match before shorter ones.

### Topic sidebar JSON — template

The sidebar is a tree with THREE collapsible levels: the page TITLE is the root folder, the `<h2>` chapters hang from it, and each chapter owns its `<h3>` anchors. `roadmap/<track>/data/<topic>.json` must obey that hierarchy — flat lists break `topic-loader.js`.

The block below is the **template**. No track is a reference implementation and no track's file is the source of the shape: tracks are only instances of the template, and the template is defined here plus as a copy-ready scaffold in `assets/topic_sidebar_template.json`.

```json
[ { "title": "<H1 text>", "link": "#<h1-id>",
    "children": [ { "title": "<H2 text>", "link": "#<h2-id>",
                    "children": [ { "title": "<H3 text>", "link": "#<h3-id>" } ] } ] } ]
```

- The `<h1>` entry is the ONLY top-level node, and it is an ordinary folder: it renders with the same `bi-folder2` toggle as a chapter and folds the whole lab away like any other node. Nothing marks the title as special — no `"role"` key, no positional tag. A node folds because it HAS children: a topic page ships an empty `<ul id="bookmark-list">` and `topic-loader.js` builds the tree at runtime from `roadmap/<track>/data/<topic>.json` (same stem as the page). `build.js` implements the identical rule in `renderSidebarItems` for the pages whose sidebar it injects statically (`data-static-sidebar="true"`), so both renderers stay in sync.
- Title and chapters open by default (title = level 0, chapter = level 1, section = level 2, see `isSidebarLevelExpanded` in `build.js` / `isTreeLevelExpandedByDefault` in `topic-loader.js`), so title → chapter → sub-section is browsable without a single click and every level can be folded by the reader.
- Three levels where the page has content for three; an `<h2>` chapter with no `<h3>` is a **leaf chapter** inside the root folder (no `children` key) — forcing an empty `children` list would render a folder that opens onto nothing. The `h3-under-every-h2` rule stays an authoring requirement, so `npm run test` keeps warning about the missing section level as content debt.
- A page may declare more than one `<h1>`; each one opens its own top-level root and claims the `<h2>` sections that follow it. The template expects ONE root: a multi-`<h1>` page is a page-structure issue for the author to merge, not a JSON variant.
- **Legacy (un-migrated tracks, left untouched).** The first entry is a childless `{ "role": "title" }` leaf above flat `<h2>` chapters. `npm run test` / `npm run check` warn on it as content debt — migration proceeds per track. The tag survives only so those pages keep their gold title glyph; nothing the generator writes emits it. A `"role": "title"` entry whose `link` is not a `#` anchor fails the gate (dead navigation).

- **Convert an existing track** with `python scripts/tools/migrate_sidebars.py --track <track> [--dry-run]`: it takes the STRUCTURE from the page (root folder + `<h3>` level, dead anchors dropped) and keeps the titles already stored in the sidecar, so short navigation labels are never replaced by long decorated headings. `--all` walks every track and `--report <file>` lists what changed, what was dropped, and which pages are blocked. A sidecar whose tree already matches the template is left byte-for-byte alone, so the diff shows structure only.
- **Author a new page** with `python scripts/tools/gen_topic_sidebars.py roadmap/<track>/<topic>.html`: it rebuilds titles verbatim from the headings and is strict (every `<h2>` needs `<h3>`, so it doubles as an authoring gate; `--mixed` relaxes that for `references.html` and `demo_examples.html`). Re-running either tool is idempotent. With an anchorable `<h1>` the tool emits the root folder; a page with no `<h1>` — or an `<h1>` without an `id` — is reported and cannot be rooted, so give the `<h1>` an `id`.
- Check a track before/after migrating: `python scripts/tools/verify_sidebars.py <track>` — it walks the sidecar recursively, asserts the template shape, that the root anchors the page `<h1>`, and that a page nesting `<h3>` also nests them in the JSON. `python scripts/tools/check_sidebar_anchors.py` proves every anchor still resolves to an id on its page.
- Live census of migration state: `python scripts/tools/migrate_sidebars.py --all --dry-run` prints `migrated / unchanged / blocked / orphan` per track. A BLOCKED page has no anchorable `<h1>` — the repair is a page edit, not a JSON edit.
- Keep the tree shallow and legible (title + H2/H3); titles short and factual with plain `&` (no entities).

## Diagrams (SVG)

Roadmap pages may include **hand-authored SVG diagrams** to explain spatial or relational concepts (control flow, memory layout, type/class hierarchy, async timelines, build pipelines).

- File convention: shared diagrams go to `assets/images/<name>.svg` and are embedded as `<img src="/images/<name>.svg" alt="...">`; track-specific diagrams go to `roadmap/<track>/img/<name>.svg` and are embedded as `/roadmap/<track>/img/<name>.svg`.
- Editable sources for tool-made diagrams live in `assets/draw/*.drawio` (draw.io), exported to `.svg`.
- SVG requirements: declare `viewBox`, responsive `width:100%`, minimal and technical (never decorative); add a one-line caption paragraph under the image.
- **Dark-theme SVG style spec (mandatory for every SVG — draw.io export or hand-authored):**
  - **Solid canvas.** The diagram always sits on a solid background `<rect>` (e.g. `#0f172a`). Never a transparent canvas.
  - **Solid boxes.** Every node/box has a solid fill (default `#1e293b`). Never `fill="none"` and never transparency (`opacity < 1`).
  - **Contrasting writing.** Text uses solid high-contrast fills: `#e2e8f0` primary, `#94a3b8` secondary, `#64748b` only for de-emphasized captions. Text is never dark on a dark box.
  - **Light-box exception.** Dark text (`#0f172a`) is allowed **only when the box itself is a light highlight fill**: `#f59e0b` orange, `#3b82f6` blue, `#ef4444` red, `#34d399` green.
  - **UML / logic-workflow shapes.** Use standard shapes: rounded rectangle = process/object, plain rectangle = data/terminal, diamond = decision, arrow with arrowhead = flow. No free-floating unboxed nodes.
  - **Alignment & spacing.** Shapes align to one axis/grid; columnar shapes share one width and one center-x; leave explicit gaps of at least 12px between shapes (they must never touch); arrows are labeled.


## Roadmap Blueprint — the track pattern (template-defined)

A track is an instance of the pattern below; there is no reference track and no example that defines the standard. The pattern itself is the contract (templates: `assets/roadmap_template.html`, `assets/topic_template.html`, `assets/topic_sidebar_template.json`). A track that follows it passes test/build/check and matches the site standard.

### Track inventory (insertion order)

1. `index.html` — phase dashboard: progress bar + roadmap.js, `data-sage-roadmap`/`data-lab-id` table, `roadmap-phase-row` headers, one `data-topic` row per topic numbered sequentially `01..NN`.
2. Lesson pages `<track>/<topic>.html` + matching `data/<topic>.json` sidebar — a topic page without its sidebar JSON is flagged by `tracking/generate_roadmaps_status.py`.
3. `demo/` single-file examples `NN_name.<ext>` + `demo_examples.html` + `data/demo_examples.json`.
4. `samples.html` — study-projects wrap-up page.
5. `references.html` — the dedicated categorized references page, final section of the track.

### Phase pattern (proven in production, template-defined)

PHASE 1: LANGUAGE FOUNDATIONS · PHASE 2: PROGRAMMING · PHASE 3: PRECOMPILATION & RELIABILITY · PHASE 4: advanced chapter (the track's own specialty phase) · PHASE 5: PRACTICE & DEMO · PHASE 6: REFERENCE.
Topic numbers are sequential across the whole track; inserting a topic renumbers every later row; inserting a phase renumbers later phase headers.

### References policy

Reference lists live ONLY in two places: the track `index.html` "Free References" block and the dedicated `references.html` page. Topic pages never carry a trailing References section — link canonical docs inline where relevant. `references.html` uses categorized tables (name | what it is | best for): online playgrounds/compilers (no install), official documentation, free courses, open-source samples.

### Diagrams

Reuse shared assets first: `assets/images/<name>.svg` is referenced in SOURCE as `/images/<name>.svg` (the build rewrites it to `/assets/images/<name>.svg` in `public/`). Known shared inventory: control flow — `decision`, `switch`, `classic-for`, `for-loop`, `while`, `do-while`; HPC — `parallel_system`, `asynch`, `processes`. Track-specific diagrams: `roadmap/<track>/img/<name>.svg`. Shared SVGs are generic, language-agnostic primitives — never copy one into a track; when a language's construct differs (not all languages are the same), author a new track-specific SVG. Embed pattern: `<div class="text-center"><img src="..." width="..." class="img-fluid protect rounded shadow border"><p>caption</p></div>`.
## Demo Example Pages (required for every roadmap)

Every roadmap track MUST include a **practice & demo** section.

### 1. Demo Source Files — `roadmap/<track>/demo/`
- Store one runnable example per file inside the track's `demo/` folder: `roadmap/<track>/demo/NN_name.<ext>`.
- Number files sequentially (`01`, `02`, ...) and group them by lesson category (the demo page groups them).
- Keep files single-file, commented, consistent with the track's tutorial style, and runnable with the language's standard tooling (e.g. `dotnet run` for C#).
- Demo folders are part of the published `roadmap/**` namespace, so the build copies them to `public/` unchanged.
- The demo folder MAY contain subfolders to group demos by phase or category: `roadmap/<track>/demo/<group>/NN_name.<ext>`; the demo page and the code viewer accept the subfolder path.
- Demos may also be embedded inline in topic pages ("spread around the tutorial"), so a lesson can link its own example; the centralized demo page remains the single index.

### 2. Demo Page — `roadmap/<track>/demo_examples.html`
- Standard lab topic page: `topicId: 'demo_examples'`, `labId: <track>`, powered by `assets/js/topic-loader.js`.
- Exactly one `h1`; one `h2` per phase/category (demos may be centralized per phase); each category lists its demos in a table: `# | Description | Link`.
- The Link column opens the unified code viewer:
  `/roadmap/code-viewer.html?file=/roadmap/<track>/demo/<filename>`
- The code viewer highlights by file extension (`assets/js/code-viewer.js` `langMap`). It uses the
  same single Prism bundle as topic pages (`/assets/prism.css` + `/assets/prism.js`), so when a new
  language is introduced only two things are needed: extend the `langMap` and ensure the grammar is
  registered in `assets/prism.js` (the download link in its header lists the included languages).

### 3. Sidebar JSON — `roadmap/<track>/data/demo_examples.json`
- The same template as any other page: the page `<h1>` is the root folder and each category is a
  chapter under it — `{ "title": "<category>", "link": "#<category-id>" }`, a **leaf chapter**
  (categories have no `<h3>` level, so they carry no `children` key).
- Entries MUST include `title`: the entry is a real navigation label and a title-less entry
  triggers `missing 'title'` warnings in `npm run check`.
- Build it with `python scripts/tools/migrate_sidebars.py --track <track>` (or the generator with
  `--mixed`); never hand-maintain a flat list, which drops out of the template shape.

### 4. Track Index Link
- `roadmap/<track>/index.html` must list a `demo_examples` row — under a
  *Practice & Demo* phase — linking to `/roadmap/<track>/demo_examples.html`.


- `manual/build-manifest.json` and `manual/migration-status.json` are generated reports.
