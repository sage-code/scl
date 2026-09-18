# tscript

Sage-Code TypeScript tutorial — `/roadmap/tscript/`.

Audience: working JavaScript developers. Every lesson states *why* TypeScript exists
for that topic, shows the plain-JS version the types replace, and pairs each example
with its purpose, expected output, and what it teaches.

## Structure

- `index.html` — phase dashboard (6 phases, topics 01–25) with progress tracking.
- Lesson pages `<topic>.html` + sidebar sidecar `data/<topic>.json` (single-root
  template shape: page `<h1>` → `<h2>` chapters → `<h3>` sections).
- Track-specific SVG diagrams in `img/` (dark-theme style spec, `manual/ARCHITECTURE.md`).
- `demo/<group>/` — numbered single-file TypeScript demos; run with `npx tsx <file>`
  (or `node --experimental-strip-types` on Node ≥ 22). A few `demo/<group>/*.html`
  demos are self-contained and previewable in the browser.
- `demo_examples.html` — lab index: `# | Description | Source | Preview`; Source opens
  the unified code viewer (`/roadmap/code-viewer.html?file=…`).
- `samples.html` — study projects; `open-source-projects.html` — the GitHub reading lab.
- `references.html` — categorized references; free-resource tables also live on the index.

## Phases

1. WHY TYPESCRIPT & FOUNDATIONS — motivation, setup, compiler/tsconfig, syntax delta
2. THE TYPE SYSTEM — types, structural typing, functions, interfaces, classes, generics
3. ADVANCED TYPE PROGRAMMING — mapped/conditional types, declarations, modules, decorators
4. PRODUCTION — errors & validation, testing, tooling, debugging, JS→TS migration, frameworks, architecture
5. PRACTICE & DEMO — lab examples, study projects, open-source lab
6. REFERENCE — official docs and free resources

## Rebuild status

**Complete.** The track is a 25-topic tutorial across 6 phases with 25 single-root
sidebars, 12 track SVGs, a runnable demo lab, samples, the open-source reading lab,
a categorized references page, and free resources on the index. Validation: source
tests, differential build, and generated-output checks all pass with zero tscript
warnings; the tracking status reports `converted` with no missing sidebars or WIP pages.
Legacy URLs `/roadmap/typescript/*` redirect permanently (see `vercel.json`).

