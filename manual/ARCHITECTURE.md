# Sage-Code SCL Architecture

## Purpose

This repository builds the Sage-Code SCL website as static output for deployment.
The source of truth is maintained in `roadmap`, `projects`, `assets`, and `layouts`, while `public` is generated at build time.

## Canonical URLs

- Website: https://sagecode.org
- Home route: `/`
- Roadmap hub: `/roadmap/`
- Project namespace: `/projects/`
- Community namespace: `/community/`

## Repository Layout

```text
/assets              # Shared CSS, JavaScript, fonts, images
/roadmap             # Main source pages and roadmap learning content
/projects            # Standalone project pages (bee, eve, maj)
/layouts             # Reusable layout fragments (base/header/footer)
/public              # Generated runtime output only
/manual              # Developer documentation and build metadata
/database            # Supabase SQL scripts for auth profile/progress tables
/scripts             # Local maintenance/refactor tooling
build.js             # Build and publish orchestration
vercel.json          # Vercel configuration
```

## Build Pipeline

`npm run build` executes `build.js`, which:

1. Clears `public`.
2. Copies runtime assets from `assets`.
3. Copies runtime files from repository root (for example `robots.txt`, `sitemap.xml`).
4. Publishes roadmap and project content to final routes.
5. Publishes roadmap top-level auth pages from `roadmap/*.html` (excluding landing) into `public/roadmap/*.html`.
6. Builds top-level pages from repository root `*.html` into `public/*.html`.
7. Optimizes HTML:
  - injects static header/footer markup
  - rewrites/normalizes internal paths
  - externalizes executable inline scripts to `public/assets/js/inline`
8. Writes `manual/build-manifest.json`.

## Route Contract

- Top-level pages: `public/*.html` from repository root `*.html`
- Roadmap landing: `public/roadmap/index.html` from `roadmap/index.html`
- Roadmap auth/forms: `public/roadmap/login.html`, `public/roadmap/profile.html`, `public/roadmap/register.html`
- Roadmap tracks: `public/roadmap/<track>/...`
- Projects: `public/projects/<project>/...`
- Community: `public/community/...`

Roadmap authoring rule:
- In source roadmap index pages, topic links must use absolute canonical static routes: `/roadmap/<track>/<topic>.html`.
- Track index canonical routes must include trailing slash: `/roadmap/<track>/`.
- Avoid relative links like `./topic` because they can resolve incorrectly when the index route is loaded without a trailing slash.
- Avoid legacy root track links like `/cse/topic.html`; always keep roadmap topics under `/roadmap/<track>/...`.

This contract keeps educational roadmap content and project showcases clearly separated.

## Roadmap Progress TODO

- Add anonymous mode: local-only progress tracking in browser storage.
- Connected mode is now active: signed-in users sync roadmap summaries and topic-section states to Supabase.
- Anonymous mode remains localStorage-backed and is preserved as a fallback.
- Anonymous progress is promoted into the signed-in storage namespace on first login when possible.

## Supabase Integration Baseline

- Browser config file: `assets/js/supabase-config.js`.
- Build output can generate `public/assets/js/supabase-config.js` from Vercel env vars.
- Shared client bootstrap: `assets/js/supabase-client.js`.
- Roadmap auth integration logic: `assets/js/roadmap-auth.js`.
- Shared progress sync helper: `assets/js/roadmap-progress-sync.js`.
- Shared auth state events: `assets/js/roadmap-state.js` emits `roadmap-auth-changed` so progress pages can rehydrate when a session changes.
- Password recovery page: `roadmap/reset-password.html`.
- Account removal page: `roadmap/unregister.html`.
- SQL setup scripts:
  - `database/001_user_profiles.sql`
  - `database/002_roadmap_progress.sql`
  - `database/003_delete_own_roadmap_account.sql`

Auto-run Supabase migration mirror:
- `supabase/migrations/20260718000100_user_profiles.sql`
- `supabase/migrations/20260718000200_roadmap_progress.sql`
- `supabase/migrations/20260718000300_delete_own_roadmap_account.sql`

Deployment automation:
- GitHub Action: `.github/workflows/supabase-db-push.yml`
- Required secret: `SUPABASE_DB_URL`

Run SQL scripts in order using Supabase SQL Editor before enabling connected roadmap mode.

Supabase Auth must allow the password recovery redirect URL:
- `https://sagecode.org/roadmap/reset-password.html`

Supported env vars for build-time config generation:
- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`
- `SUPABASE_SCHEMA` (optional)

## Frontend Rules

- Use semantic HTML.
- Keep reusable styles in `assets/css` and scripts in `assets/js`.
- Avoid inline executable JavaScript in authored pages.
- Preserve path consistency between source and built output.
- Use a common action-button system for primary CTA rows (for example LOGIN, PROFILE, REGISTER).
- Primary CTA row pattern: `first-page-nav` container with `first-page-nav-btn` variants.
- Visual direction for CTA buttons: centered compact pill buttons (not stretched cards), with sage + purple accents aligned with Sage Laboratory brand identity.

## Roadmap Progress Flow

- Roadmap hub pages store completion by course/topic in `sage_progress_*` keys and mirror signed-in changes to `public.roadmap_progress`.
- Topic pages store each checkbox state under a topic-scoped key and mirror section rows to Supabase with a `topicId::sectionKey` naming convention.
- The hub progress bar now prefers remote percentages when a session is active, while anonymous users continue to use localStorage only.
- Build-time script injection adds the Supabase client and progress sync helper to roadmap tables and topic pages automatically, so the source HTML stays minimal.

## Contribution Workflow

1. Create or update source files under `roadmap`, `projects`, `assets`, or `layouts`.
2. Run `npm run build`.
3. Run `npm run test:local`.
4. Verify generated pages under `public`.
5. Update this file when architecture or route contracts change.

## Documentation Policy

- Keep documentation concise, practical, and repository-specific.
- Prefer one maintained architecture guide over overlapping variants.
- Remove stale process notes that no longer represent the active structure.
```javascript
window.SIDEBAR_CONFIG = {
  jsonFile: `./${topicId}.json`,
  contentFile: `./${topicId}.html` or `./${topicId}-content.html`,
  pageKey: topicId,
  labId: 'engineering' or 'go' or other
};
```

## Component Files in /components/

The reference implementation is stored here:
- `components/topic.html` - Master template with all features

This can be copied or referenced when creating new topic pages.

## Best Practices

1. **JSON Structure**: Keep navigation items logical and hierarchical
2. **Content Files**: Use HTML fragments - no HTML, head, body tags needed
3. **IDs**: Ensure JSON link IDs match actual heading IDs in content
4. **Naming**: Use consistent naming (e.g., `overview.json` + `overview.html`)
5. **Testing**:
   - Verify JSON loads correctly
   - Check that content displays
   - Test progress tracking across tabs
   - Verify mobile responsiveness

## Next Steps

1. **Extend to other languages**: Copy patterns to /programming/python, /programming/rust, etc.
2. **Create algebra and other engineering topics**: Use the same pattern
3. **Enhance styling**: Consider additional CSS for topic-specific themes
4. **Add search**: Implement full-text search across all topics
5. **Analytics**: Track learning progress across topics

## File Reference

### Created Files
- `/components/topic.html` - Unified template
- `/engineering/topic.html` - Engineering topic page
- Updated `/engineering/concepts.json` - Added navigation items

### Updated Files
- `/programming/go/topic.html` - Minor consistency updates
- `/programming/go/*.json` - All files updated with lab parameter

### Existing Files (Preserved)
- `/engineering/concepts-content.html` - Original content
- `/programming/go/*.html` content files - All preserved
