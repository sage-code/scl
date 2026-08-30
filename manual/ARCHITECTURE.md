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
- `build`     : Builds the static website (`npm run build`).
- `test`      : Runs local validation tests (`npm run test:local`).
- `commit`    : Stages all changes and commits. 
                Usage: `run commit "your message"` (or use `run` alias if configured).
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

1. Use `run clean` and `run build` (or via `./run.sh`).
2. Run `run test` (wraps `npm run test:local`).
3. Verify generated output under `public/`.

## Documentation Scope

- `manual/ARCHITECTURE.md` is the canonical architecture reference.
- `manual/PROJECTS-ARCHITECTURE.md` defines the shared topic-page contract for `/projects/*` namespaces.
- `manual/build-manifest.json` and `manual/migration-status.json` are generated reports.
