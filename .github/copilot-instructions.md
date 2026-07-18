# Copilot Instructions for Sage-Code SCL

## Project Context

- This repository builds a static vanilla website for Sage-Code, deployed on Vercel.
- Supabase may be used for dynamic integrations, but the core website is static-first.
- Primary source namespaces are `roadmap/` (learning content) and `projects/` (standalone project sites).

## Fast Onboarding Checklist

When starting a task, read these files first:

1. README.md
2. build.js
3. manual/ARCHITECTURE.md
4. vercel.json

Then run:

1. npm run build
2. npm run test:local

Before editing content at scale, verify these generated outputs after build:

1. public/index.html has embedded navigation header markup (not dynamic placeholder).
2. public pages include footer markup in final HTML.
3. public/assets/js/inline contains extracted script files from any inline executable JavaScript.

## Architecture Rules

- Use only vanilla HTML5, CSS3, ES6+ JavaScript, and Bootstrap where already established.
- Keep global styles in assets/css and global scripts in assets/js.
- Legacy /common script paths are deprecated; use /assets/js paths.
- Keep reusable page wrappers in layouts.
- Keep top-level source pages in roadmap/ and standalone projects in projects/.
- Build output only goes to public and must contain runtime artifacts only.
- Treat this project as a static website generator: perform build-time assembly, not runtime DOM assembly, for shared layout.
- Inline executable JavaScript in source HTML must be extracted to assets/js during build.
- Build output must not depend on dynamic header/footer loading scripts.

Target structure:

```text
/assets
/roadmap
/projects
/layouts
/public
/manual
/scripts
/config
build.js
package.json
```

## Publishing Behavior

- Publish only required website artifacts; do not publish developer docs, scripts, or manual content.
- Embed the navigation bar and footer directly in generated HTML during build.
- Keep roadmap routes under `/roadmap/*` and project routes under `/projects/*`.
- For roadmap index topic links, always use absolute canonical static paths: `/roadmap/<track>/<topic>.html`.
- For roadmap index canonical URLs, use trailing-slash track roots: `/roadmap/<track>/`.
- Do not use relative topic links like `./topic` or root track links like `/cse/topic.html`.

## SEO and Semantics

- Every page should use semantic structure: header, nav, main, footer.
- Keep metadata and document titles accurate.
- Avoid inline styles and inline script blocks for executable code.
- Keep SEO structured data scripts (application/ld+json) in-page when needed.

## Frontend Design Strategy

- Preserve the established Sage-Code visual language unless a redesign is explicitly requested.
- Prefer reusing existing components/styles before inventing new ones (for example `first-page-nav`, `card-slate`, `card-title`, shared button patterns).
- Avoid generic or "template-looking" UI. Keep layouts intentional, bold, and readable.
- Keep navigation simple and explicit. Avoid unnecessary dropdown complexity on top-level navigation.
- For new homepage cards/CTAs, keep iconography meaningful and aligned with existing typography and spacing conventions.
- Ensure responsive behavior on desktop and mobile for every UI change.

## Documentation Policy

- Explain why in comments, not obvious mechanics.
- Keep comments brief and useful for maintainers.
- Keep docs concise and current in manual/ARCHITECTURE.md.
- Remove obsolete or duplicated markdown docs when consolidating documentation.

## Execution Policy for Bulk Changes

- Use Python scripts for repeatable bulk refactors and content operations.
- Use PowerShell scripts for local environment orchestration on Windows.
- Prefer deterministic scripts over ad-hoc manual edits.

## Validation Policy

- After relevant edits, run `npm run build` and validate generated output in `public/`.
- When touching shared frontend styles or homepage sections, verify both source files and generated HTML.

## Clarification Policy

- If requirements are ambiguous and can cause regressions, ask before applying destructive operations.