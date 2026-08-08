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
- For external links that open in a new tab, always use `target="_blank"` with `rel="noopener noreferrer nofollow"` to reduce reverse-tabnabbing risk and avoid passing ranking trust to third-party references.

## Frontend Design Strategy

- Preserve the established Sage-Code visual language unless a redesign is explicitly requested.
- Prefer reusing existing components/styles before inventing new ones (for example `first-page-nav`, `card-slate`, `card-title`, shared button patterns).
- Avoid generic or "template-looking" UI. Keep layouts intentional, bold, and readable.
- Keep navigation simple and explicit. Avoid unnecessary dropdown complexity on top-level navigation.
- For new homepage cards/CTAs, keep iconography meaningful and aligned with existing typography and spacing conventions.
- Ensure responsive behavior on desktop and mobile for every UI change.

## AI Curriculum Authoring Standard

- Treat Sage-Code as an A-to-Z engineering curriculum platform, not a superficial tutorial site.
- For roadmap content, assume learners may start with zero background unless the page explicitly states prerequisites.
- Default writing mode: deep technical instruction with step-by-step progression from fundamentals to production engineering.
- Explain language mechanics precisely: syntax, symbols, statements, operators, control flow, typing/modeling rules, and runtime behavior.
- Prefer direct technical clarity over motivational filler; avoid vague claims like "easy" or "simple" without explanation.
- Keep page titles, section titles, and sidebar labels short. Put detail in body text, not in long headings.
- Prefer compact H1/H2/H3 labels that scan well in sidebars and navigation. Example: use `Flutter Core Concepts` instead of `Flutter Core Concepts: Widgets, Layout, and Rendering`.
- Keep reference pages separate when learners need official docs, tutorials, and further reading. Do not hide the deep-dive reference map inside an operations or tooling lesson.
- Assume every lab is serious by default. Do not add framing like `Professional`, `Complete`, `Ultimate`, or similar promotional adjectives to titles, badges, hero copy, or section labels unless the user explicitly asks for that tone.
- Prefer spartan titles and design language. Keep labels factual, compact, and neutral.

For each roadmap topic page, include:

1. Concept overview and why it matters in real engineering.
2. Detailed explanation of constructs and syntax used.
3. Multiple executable examples (basic, intermediate, production-oriented).
4. Common mistakes and how to avoid them.
5. Engineering tips and trade-offs (performance, maintainability, refactor safety).
6. A step-by-step practice sequence or mini-lab task.

Depth expectations:

- Do not publish placeholder sections or one-paragraph summaries for core topics.
- Prefer concrete examples with typed contracts, realistic naming, and edge cases.
- When a concept is abstract (for example, type systems, architecture boundaries), add a structured diagram or flow explanation where practical.
- Keep topic progression coherent across the track: fundamentals first, then composition/reuse, then production/enterprise concerns.

Quality bar for AI-generated educational content:

- Write for engineering outcomes: reliability, readability, scalability, and collaboration.
- Include tips and tricks that experienced developers use (debug loops, contract validation, migration strategy, review checklists).
- Avoid copying the same skeleton across topics; tailor each page to the specific subject.
- If content quality is uncertain, improve depth before finalizing edits.

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