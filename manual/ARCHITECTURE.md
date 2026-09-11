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


## Diagrams (SVG)

Roadmap pages may include **hand-authored SVG diagrams** to explain spatial or relational concepts (control flow, memory layout, type/class hierarchy, async timelines, build pipelines).

- File convention: shared diagrams go to `assets/images/<name>.svg` and are embedded as `<img src="/images/<name>.svg" alt="...">`; track-specific diagrams go to `roadmap/<track>/img/<name>.svg` and are embedded as `/roadmap/<track>/img/<name>.svg`.
- Editable sources for tool-made diagrams live in `assets/draw/*.drawio` (draw.io), exported to `.svg`.
- SVG requirements: declare `viewBox`, responsive `width:100%`, dark-theme-friendly colors, minimal and technical (never decorative); add a one-line caption paragraph under the image.


## Roadmap Blueprint — the C# reference pattern

`roadmap/csharp/` (14 topics, 6 phases) is the reference implementation for track structure. A new or improved roadmap that follows it passes test/build/check and matches the site standard.

### Track inventory (insertion order)

1. `index.html` — phase dashboard: progress bar + roadmap.js, `data-sage-roadmap`/`data-lab-id` table, `roadmap-phase-row` headers, one `data-topic` row per topic numbered sequentially `01..NN`.
2. Lesson pages `<track>/<topic>.html` + matching `data/<topic>.json` sidebar — a topic page without its sidebar JSON is flagged by `tracking/generate_roadmaps_status.py`.
3. `demo/` single-file examples `NN_name.<ext>` + `demo_examples.html` + `data/demo_examples.json`.
4. `samples.html` — study-projects wrap-up page.
5. `references.html` — the dedicated categorized references page, final section of the track.

### Phase pattern (proven on C#)

PHASE 1: LANGUAGE FOUNDATIONS · PHASE 2: PROGRAMMING · PHASE 3: PRECOMPILATION & RELIABILITY · PHASE 4: advanced chapter (C#: HIGH PERFORMANCE COMPUTING) · PHASE 5: PRACTICE & DEMO · PHASE 6: REFERENCE.
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

### 2. Demo Page — `roadmap/<track>/demo_examples.html`
- Standard lab topic page: `topicId: 'demo_examples'`, `labId: <track>`, powered by `assets/js/topic-loader.js`.
- Exactly one `h1`; one `h2` per category; each category lists its demos in a table: `# | Description | Link`.
- The Link column opens the unified code viewer:
  `/roadmap/code-viewer.html?file=/roadmap/<track>/demo/<filename>`
- The code viewer highlights by file extension (`assets/js/code-viewer.js` `langMap`). When a new
  language is introduced, add its extension mapping there and its Prism component to
  `roadmap/code-viewer.html` (plus verify it is bundled in `assets/prism.js` for topic pages).

### 3. Sidebar JSON — `roadmap/<track>/data/demo_examples.json`
- Flat, titled entries, one per category:
  `[ { "title": "Foundations", "link": "#foundations" }, ... ]`
- Entries MUST include `title` (the legacy Dart classic omitted titles and triggers
  `missing 'title'` warnings in `npm run check`).

### 4. Track Index Link
- `roadmap/<track>/index.html` must list a `demo_examples` row — under a
  *Practice & Demo* phase — linking to `/roadmap/<track>/demo_examples.html`.


- `manual/build-manifest.json` and `manual/migration-status.json` are generated reports.
