# Sage-Code SCL Website

## Metadata
Version: 1.0.11

Sage-Code SCL is a static educational website for roadmaps, labs, and project showcases.
It is built with vanilla HTML/CSS/JavaScript and assembled into deploy-ready output for Vercel.

## Quick Links

- Website: https://sagecode.org
- Main docs: [manual/ARCHITECTURE.md](manual/ARCHITECTURE.md)
- Source homepage: [roadmap/index.html](roadmap/index.html)
- Source roadmap hub: [roadmap/roadmap.html](roadmap/roadmap.html)

## Project Structure

```text
/assets           # Global CSS, JS, fonts, images
/agents           # AI agent configurations and instructions
/roadmap          # Main source pages and roadmap content
/projects         # Standalone project sites (bee, eve, maj)
/layouts          # Reusable HTML wrappers/fragments
/public           # Generated deploy output
/manual           # Developer documentation and generated reports
/database         # Supabase SQL setup scripts (profiles + roadmap progress)
/scripts          # Local tooling (Python/Node)
/config           # Build and mapping configuration
build.js          # Static site build pipeline
package.json      # Scripts and dependencies
```

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.10+

### Install

```bash
npm install
```

### Build

```bash
npm run build
```


### Versioning and Publishing

To increment the version, commit, and push changes:

```bash
./run.sh publish
```

`npm run build` now uses automatic differential mode when possible:
- Runs a full build when `layouts/base.html` changes, no previous cache exists, or `public/` is missing.
- Otherwise publishes only changed sources and related optimized HTML.

To force a full build manually:

```bash
npm run build:full
```

## Supabase Setup

This repository includes browser-side Supabase client wiring for roadmap auth pages.

1. Install dependencies:

```bash
npm install
```

2. Configure browser client values in [assets/js/supabase-config.js](assets/js/supabase-config.js):
	- `url`
	- `anonKey`
	- `schema`

	Or set these Vercel environment variables and let the build generate the public config file:
	- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`
	- `SUPABASE_SCHEMA` (optional, defaults to `public`)

3. Run SQL scripts in Supabase SQL Editor:
	- [database/001_user_profiles.sql](database/001_user_profiles.sql)
	- [database/002_roadmap_progress.sql](database/002_roadmap_progress.sql)
	- [database/003_delete_own_roadmap_account.sql](database/003_delete_own_roadmap_account.sql)
	- [database/004_roadmap_favorites.sql](database/004_roadmap_favorites.sql)

For automatic deployment with Supabase CLI, use the mirrored migrations in [supabase/migrations](supabase/migrations).
Automated pushes run from [\.github/workflows/supabase-db-push.yml](.github/workflows/supabase-db-push.yml) when migration files change on `main`.

4. Build and deploy:

```bash
npm run build
```

	In Supabase Auth settings, allow the redirect URL for password recovery:
	- `https://sagecode.org/roadmap/reset-password.html`

Roadmap pages wired for Supabase client usage:
- [roadmap/login.html](roadmap/login.html)
- [roadmap/profile.html](roadmap/profile.html)
- [roadmap/register.html](roadmap/register.html)
- [roadmap/unregister.html](roadmap/unregister.html)
- [roadmap/reset-password.html](roadmap/reset-password.html)

### Validate locally

```bash
npm run test:local
```

### Run local static server

```bash
npm run dev
```

The local site is served from `public` at `http://localhost:4173`.

## Documentation Location

All maintained developer docs are under [manual](manual).

- Architecture and conventions: [manual/ARCHITECTURE.md](manual/ARCHITECTURE.md)
- Build metadata report: [manual/build-manifest.json](manual/build-manifest.json)

Notes:
- Generated reports are written under `manual/` (for example build and migration status metadata).
- Deploy artifacts are always generated into `public`.

## Contribution Guide

### Branch and commit

- Create a short-lived branch per feature/fix.
- Keep commits focused and atomic.
- Use clear commit messages describing intent and scope.

### Frontend rules

- Use semantic HTML5 (`header`, `nav`, `main`, `footer`).
- Keep styles in `assets/css` and scripts in `assets/js`.
- Avoid inline executable scripts and inline styles.
- Preserve existing visual language unless the task requests a redesign.

### Before opening a PR

1. Run `npm run build`.
2. Run `npm run test:local`.
3. Verify changed pages under `public` render correctly.
4. Update [manual/ARCHITECTURE.md](manual/ARCHITECTURE.md) if architecture or workflow changed.

## Deployment

- Target platform: Vercel static hosting.
- Deploy source: generated `public` output.
- Keep `public` free of internal developer notes.


## Code Examples
We use a unified viewer to display source code. To link to any code file in the repository, use the following URL structure:

`/roadmap/code-viewer.html?file=/path/to/your/file.ext`

**Example:**
[View Python Script](/roadmap/code-viewer.html?file=/scripts/tools/roadmap.py)

- Ensure the file is accessible in the public directory or project root.
- The viewer automatically detects the language based on the file extension (`.py`, `.js`, etc.).

---
Copyright (c) Sage-Code 2026
