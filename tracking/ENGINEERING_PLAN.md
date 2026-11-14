# Engineering Tracks — Improvement Plan

**Scope:** the 9 tracks with `"kind": "engineering"` in `roadmap/roadmap-index.json`:
`cse`, `dba`, `dsa`, `dsl`, `hpc`, `osd`, `pgp`, `sml`, `tek`.

The 33 `"kind": "language"` tracks are out of scope here — `tracking/roadmaps-status.json` covers both kinds; this document focuses on engineering tracks.

## Executive Status Matrix

| Track | Status | Topics | Unwired | Placeholders | Practice Layer | Priority Tier & Action |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`dba`** | `converted` | 11 | 0 | 0 | None | ✅ **Complete**: 9 lessons authored 2026-11-14; optional next: `demo/` with runnable SQL scripts. |
| **`tek`** | `converted` | 12 | 0 | 0 | None | ✅ **Complete**: 8 lessons authored 2026-11-14; optional next: shell-automation `demo/`. |
| **`dsl`** | `converted` | 40 | 0 | 0 | Ref | **Tier 3 (Polish)**: Add `demo/` language snippets & `samples.html` study projects. |
| **`pgp`** | `converted` | 66 | 0 | 0 | Demo | **Tier 3 (Polish)**: Add `references.html` and `samples.html`. |
| **`osd`** | `converted` | 8 | 0 | 0 | None | ✅ **Complete**: all 8 lessons authored and wired; `release-management` + `maintainership` written 2026-11-14. |
| **`hpc`** | `converted` | 8 | 0 | 0 | None | ✅ **Complete (Wiring & Cleanup)**: All 8 topic pages wired, 2 orphan files deleted, typos fixed, Puppeteer verified. |
| **`sml`** | `converted` | 10 | 0 | 0 | None | ✅ **Complete (Wiring)**: All 10 topic pages wired with dynamic sidebars and regression tested. |
| **`dsa`** | `converted` | 24 | 0 | 0 | Full | ✅ **Complete**: 24 topics, `demo/` (10 programs), `demo_examples.html`, `references.html`, `samples.html`. |
| **`cse`** | `converted` | 17 | 0 | 0 | Ref | ✅ **Complete**: 17 topics, fundamentals survey + direct pointers to deep-dive tracks, `references.html`. |

**Why a dedicated document instead of extending `TODO.md`:** `TODO.md` is a chronological log of
completed language-track rebuilds. Engineering tracks need a different axis — most of them
are *structurally wired but empty*, which is a distinct failure mode from anything `TODO.md`
was tracking. Once a track reaches "done", fold a short entry into `TODO.md` and mark it done here.

## How this was verified (reusable methodology)

Three checks, each catching a different failure mode. Run them in this order:

1. **`python tracking/generate_roadmaps_status.py`** — regenerates
   `tracking/roadmaps-status.json`. As of this plan it checks, per track: topic page count,
   which pages still carry WIP/placeholder markers (size `< 6000` bytes **and** matches the
   `WIP` regex near the top of the script), missing `data/<topic>.json` sidecars, a lingering
   legacy `topic.html`, and — new in this pass — **which topic pages never `<script
   src="...topic-loader.js">`**, i.e. pages whose sidebar can never render even if their JSON
   sidecar is perfect. This last check is what actually caught the sml/osd/hpc/cse gaps below;
   `npm run check` does not catch it (see point 3).
2. **Read the actual page body**, not just its size. The WIP regex only catches phrasings
   already seen in this repo. Every track below was hand-opened and its `<main>` content read
   before being marked "real" or "placeholder" — do the same before trusting the automated
   status for a track not yet covered here. If you find a new placeholder phrasing, add it to
   the `WIP` regex in `generate_roadmaps_status.py` (four phrasings were added this pass; see
   its `git log`) so the next person doesn't have to re-discover it by hand.
3. **`npm run build && npm run check`** — validates generated `public/` output, including that
   every `data/*.json` sidecar is well-formed JSON with resolvable anchors. It does **not**
   check whether a page actually includes `topic-loader.js`, so a track can pass `npm run
   check` cleanly while still rendering zero sidebar at runtime (sml/osd/hpc did, before this
   pass fixed the classifier). Treat "0 warnings" from `npm run check` as necessary, not
   sufficient, for an engineering track.

Re-run step 1 after any change described below and diff `tracking/roadmaps-status.json` to
confirm the intended status actually moved.

## The three failure modes found

Every engineering track falls into one or more of these. Fixing (A) is mechanical and safe;
(B) and (C) require writing real lesson content.

- **(A) Wired but empty sidebar** — the page has real content, `data/<topic>.json` exists and
  is valid, but the page itself never includes `topic-loader.js` (or the whole `<aside>` shell
  is missing), so the sidebar never renders. This is the *exact same class of bug* fixed
  earlier this session for `scala`/`plsql` (duplicated wrapper markup there; here, wiring is
  simply absent). Fix: copy the standard shell + footer scripts from a working page in the
  same track (or from `roadmap/scala/*.html` post-fix) verbatim, keeping the page's own
  `<main>` content untouched.
- **(B) Templated placeholder content** — the page's `<main>` is a copy-pasted stub (`"This
  lesson is a placeholder and will be populated..."`, `"Dummy topic page. Planned content:
  ..."`, `"Add the learning objectives..."`). No amount of wiring fixes this; it needs an
  actual lesson written, matching the quality bar of the track's own best page (or of `dsl`,
  `scala`, `plsql` if the track has no good page yet).
- **(C) Orphaned / off-roadmap page** — a `.html` file in the track directory that is not
  linked from `index.html` at all. Found in `hpc` (`cloud.html`, `tools.html` — see below).
  Decide per-file: delete it, or write it and add a matching `<tr data-topic="...">` row to
  `index.html` plus a `data/<topic>.json` sidecar.

## Per-track status (generated; read `tracking/roadmaps-status.json` for the live numbers)

Sizes/counts below are a snapshot from this planning pass. Regenerate before trusting exact
numbers if time has passed.

### Tier 0 — mechanical wiring fix only (COMPLETED)
Both `sml` and `hpc` have been fully rewired, standardized, regression-tested with Puppeteer, and verified. See Completed Engineering Tracks below.

#### ✅ `cse` — Software Engineering / CS Fundamentals — DONE (2026-09-29)
Was 18 topics, 10 unwired, plus 8 more with the *wrong* wiring (`/common/topic-loader.js`,
a path that doesn't exist, plus `labId: 'engineering'` instead of `'cse'` — so in fact all 18
pages had a broken sidebar, not 10; the substring check that produced the "10 unwired" count
above missed the wrong-path case, since `topic-loader.js` still appeared in the string). Fixed:
- All 18 pages rewired to `/assets/js/topic-loader.js` + `labId: 'cse'`; legacy `topic.html`
  redirect deleted (nothing referenced it); `index.html`'s `data-lab-id` fixed to `"cse"` to
  match (it said `"engineering"`, breaking progress-tracking).
- Widespread mojibake (double/triple-corrupted UTF-8 — curly quotes, em/en-dashes, a
  superscript exponent, and the sidebar's ☰ icon) fixed across 15 of 18 pages; two dead
  `/roadmap/script/` links repaired to `/roadmap/javascript/`.
- **Content migrated out**, per the explicit ask that started this entry: CSE keeps only the
  "what and why" for topics with their own deep-dive track, with a pointer to it —
  `paradigms.html` → `pgp/{linear,structured,object-oriented,functional}.html`;
  `structures.html` → `dsa/data-structures.html`; `version.html` → `osd/git-workflow.html`;
  `testing.html` → `osd/testing.html`; `cloud.html` → `tek/cloud-operations.html` +
  `tek/containers-virtualization.html`; `cybersec.html` → `tek/security-hardening.html`;
  `platforms.html` → `tek/linux-systems.html`. Each trimmed CSE page ends with a "read the
  full lesson" link to where the content went.
- New reference page `cse/references.html`: every other engineering roadmap, honestly
  labeled Ready/Growing, plus a suggested study order — DSA/PGP first, then a language
  track, then OSD, then whichever specialization (DBA/TEK/SML/HPC/DSL) fits.

**Follow-up (2026-09-29, same day):** once it was confirmed all of `paradigms.html`'s and
`structures.html`'s content had landed cleanly in `pgp`/`dsa`, those two pages were **deleted
outright** rather than kept as a trimmed stop-over — a redundant CSE copy of content that now
lives fully in its own roadmap counts as a spoiler, not a service to the reader. `index.html`
was reorganized to match: `prompt-engineering` and `references.html` both moved into
PHASE 1 (COMPUTING FOUNDATIONS), so a reader sees the "jump to DSA/PGP/another roadmap now,
or keep going" choice immediately rather than only after finishing all four phases. Phase 1
is now `concepts` → `algebra` → `languages` → `prompt-engineering` → `references`; the old
PHASE 5 (WHERE TO GO NEXT) was folded away since its one entry moved to Phase 1; every
remaining phase/topic was renumbered 01–17. `references.html`'s own copy was reworded to stop
promising a "closing page" and instead explain why it's reachable this early. Two links that
pointed at the deleted pages were fixed: `cse/tools.html`'s hardcoded "Next topic" footer
(→ `version.html`) and `scala/classes.html`'s "programming paradigms" pointer
(→ `pgp/object-oriented.html`).
`generate_roadmaps_status.py` still classifies `cse` as `converted` after this follow-up.

### Completed Engineering Tracks

#### ✅ `dba` — Database Administration — DONE (2026-11-14)
The 9 placeholder lessons were authored on a shared page shell, PostgreSQL as the reference
engine, cross-linking `plsql` (Oracle SQL/tuning) and `tek` (operations) instead of
duplicating them: `data-modeling`, `sql-fundamentals`, `indexing`, `query-optimization`,
`transactions-concurrency`, `security-access-control`, `backup-recovery`, `replication-ha`,
`monitoring-operations` (13–16 KB each, h1 → h2 → h3 sidebars generated with
`gen_topic_sidebars.py`, a two-part practice lab per lesson). The portable SQL (DDL,
constraints, cascades, joins, CTE/window, upsert, partial/expression/composite index use,
guarded update) was executed against SQLite 3.45; PostgreSQL-only statements (`EXPLAIN
ANALYZE`, roles/RLS, `pg_dump`/`pg_basebackup`, replication) were not executed — no
PostgreSQL in this environment. `dba/README.md` updated. Still optional: `demo/` with
runnable SQL per lesson, `references.html`, `samples.html`.

#### ✅ `tek` — TechOps — DONE (2026-11-14)
The 8 placeholder lessons were authored: `techops-intro`, `shell-automation`,
`networking-basics`, `version-control-cicd` (operator view; basics stay in `osd/ci-cd` and
`osd/git-workflow`), `infra-as-code` (OpenTofu/Terraform + Ansible; Prism `hcl` from CDN),
`observability-monitoring` (PromQL, burn-rate alerts; Prism `json` from CDN),
`incident-response`, `sre-practices`. The `disk-check.sh` and Python health-check/retry
examples were executed locally; Terraform, Ansible, Prometheus and systemd examples were not.
`tek/incident-response.html` added to `check_sidebar_render.js`. Still optional: `demo/`
(shell-automation scripts), `references.html`.

#### ✅ `osd` — Open Source Development — DONE (2026-11-14)
All 8 lessons real and wired. The last two stubs were authored on the `ci-cd.html` template:
`release-management.html` (SemVer, pre-releases, CalVer, changelogs, tagging, deprecation and
migration guides, support windows/LTS, backports) and `maintainership.html` (triage workflow
and issue forms, backlog hygiene and scoped stale automation, onboarding/retention, community
files, private security reports, bus factor and burnout), each with a 3-level sidebar JSON and
a two-part practice lab. `maintainership.html` added to `check_sidebar_render.js`. Status
moved from `not_updated` to `converted`. No `demo/`/`references.html` — optional for this track.

#### ✅ `hpc` — Computer Hardware — DONE (2026-10-20)
All 8 real topic pages wired with modern sidebar scripts (`assets/js/topic-loader.js` + `window.TOPIC_CONFIG` with `labId: 'hpc'`) and `<aside class="side-bar">` shell.
- Deleted 2 unlinked/orphaned joke stubs: `cloud.html` and `tools.html` and their `data/*.json` sidecars (resolving failure mode C and 2 build warnings).
- Spot-fixed typos across pages: `Compoenents` → `Components`, `assable` → `assemble`, `software.With` → `software. With`, `more or les` → `more or less`, `tabe-striped` → `table-striped` (x2), `peribherals` → `peripherals`.
- Fixed canonical URLs, updated index links to canonical absolute paths `/roadmap/hpc/<topic>.html`, and linked modern head assets (`content-code.css`, `content-tables.css`, `bootstrap-icons.min.css`).
- Single-root sidebars verified in Puppeteer regression guard (`scripts/tools/check_sidebar_render.js`).
- Status moved from `not_updated` to `converted`.

#### ✅ `sml` — SML / Statistics & Machine Learning — DONE (2026-10-20)
All 10 topic pages wired with modern sidebar shell, `<aside class="side-bar">`, `window.TOPIC_CONFIG` (`labId: 'sml'`), and `assets/js/topic-loader.js`.
- Cleaned legacy hardcoded bookmark nav in `basic-concepts.html`.
- Updated canonical URLs, secured external links, and added modern CSS assets.
- Single-root sidebars verified in Puppeteer regression guard (`scripts/tools/check_sidebar_render.js`).
- Status moved from `not_updated` to `converted`.

#### ✅ `dsa` — Data Structures & Algorithms — DONE (2026-09-29)
Completed across 24 topic pages across 4 phases with full practice layer:
- Phase 1 Foundations: `algorithms`, `complexity-analysis`, `recursion`, `backtracking`.
- Phase 2 Core Linear Data Structures: `arrays-slices`, `linked-lists`, `stacks-queues`, `hash-tables`.
- Phase 3 Hierarchical & Graph Structures: `trees`, `heaps`, `advanced-trees`, `graphs`.
- Phase 4 Algorithmic Paradigms: `searching`, `sorting`, `string-algorithms`, `graph-algorithms`, `dynamic-programming`, `greedy-algorithms`, `advanced-techniques`.
- Advanced / Production topics: `data-structures`, `production-structures`.
- Practice & Reference: 10 standalone Python demo programs (`demo/01..10`), `demo_examples.html` code index, `samples.html` study projects, and `references.html` official links.
- Sidebar wiring: 100% wired with hierarchical `data/*.json` sidecars; classified as `converted`.

#### ✅ `pgp` — Programming Paradigms — DONE (2026-09-29)
All four lessons written by migrating and expanding `cse/paradigms.html`'s content (which
explained the "linear ↔ XML" connection the earlier draft of this plan flagged as confusing —
it turned out to be a real, deliberate teaching point: XML as a concrete linear/data-oriented
language, not a placeholder description error). `linear.html` covers XML syntax as the running
example; `structured.html` covers decision/repetition/selection; `object-oriented.html` covers
the four pillars plus generics/interfaces/traits; `functional.html` covers pure functions,
closures, scope models, and modern hybrid languages. `cse/paradigms.html` was first trimmed to
a short survey, then — once it was confirmed the content had moved cleanly and nothing else
still needed the intermediate stop — deleted outright (2026-09-29 follow-up) so CSE hands off
to PGP directly instead of keeping a redundant preview; see the `cse` entry above for the full
purge. `generate_roadmaps_status.py` now classifies `pgp` as `converted`.

### Already solid — polish only

#### `dsl` — Domain-Specific Languages (40 topics, **0 placeholders, fully wired**)
The most mature engineering track: 40 real lesson pages (11.3 KB median), every page wired,
and it already has `references.html`. What it's missing relative to the language-track
standard (`rust`, `scala`, `plsql`, `odin`, `zig`, `bash` — see `TODO.md`): no `demo/` folder,
no `demo_examples.html`, no `samples.html` study-projects page. Given `dsl` covers real
implementation languages (Lisp, Prolog, OCaml, Racket, Forth, ANTLR grammars, etc.), small
runnable snippets per language would fit the code-viewer pattern well — but this is polish,
not a gap that breaks anything, so it's lowest priority in this plan. Do it after every
Tier 0–2 item above, if at all.

## Practice & Reference layer (applies once a track's lessons are real)

As of 2026-11-14 only `dsa` has the full layer (`demo/`, `demo_examples.html`,
`references.html`, `samples.html`); `pgp` has `demo/`; `cse` and `dsl` have `references.html`.
`dba`, `hpc`, `osd`, `sml` and `tek` have none of it. Once a track's lesson content is
real (Tier 0/1/2 above), consider closing it out the way `bash`/`css`/`odin`/`zig`/`scala`/
`plsql` were closed (see their `TODO.md` entries and this session's `scala`/`plsql` git log
for the concrete pattern: numbered `demo/NN_topic.ext` files, a `demo_examples.html` index
page with phase-grouped tables linking `/roadmap/code-viewer.html?file=...`, and a
`references.html` with verified free playgrounds/docs/courses/samples). This is genuinely
optional for tracks whose subject isn't code-shaped (e.g. `osd`'s "Maintainership" doesn't
need a demo file) — use judgment per track rather than applying it uniformly. `dba`, `dsa`,
and `tek` (`shell-automation` especially) are the strongest candidates.

## Known tooling gaps to fix alongside this work

- `npm run check` validates `data/*.json` shape but never checks that a page actually
  includes `topic-loader.js`. The new `unwired_sidebar_pages` metric in
  `generate_roadmaps_status.py` covers this for now; consider porting the same check into
  `scripts/check.js` (or `scripts/tools/check_sidebar_render.js`'s route list, per-track) so
  `npm run check`/`check:sidebar` catch it directly instead of requiring a separate Python
  run. Still open (2026-11-14): `scripts/test/test_sources.py` now warns about a
  loader-driven page without `#study-sidebar`, but a page with no loader at all is still only
  caught by the Python status generator.
- Minor Bootstrap-4-era classes still appear in a few engineering pages (`thead-dark`,
  `thead-light` in `cse/*.html` — Bootstrap 5 uses `table-dark`/`table-light`; `tabe-striped`
  typo in `hpc/connectors.html`). Low priority; fix opportunistically while editing those
  files for other reasons.

## Definition of done, per track

A track can move from this document into `TODO.md`'s completed list when:
1. Every topic page in `index.html`'s table has real content (no WIP/placeholder marker) —
   confirm with `python tracking/generate_roadmaps_status.py` showing `wip_pages: []` for it.
2. Every topic page includes `topic-loader.js` and renders its sidebar — confirm
   `unwired_sidebar_pages: []` for it in the regenerated status.
3. `npm run build && npm run check` passes with 0 warnings for that track's files.
4. `npm run check:sidebar` still passes (add the track's most structurally-complex page to
   `DEFAULT_ROUTES` in `scripts/tools/check_sidebar_render.js` as a regression guard — follow
   the pattern of the `scala`/`plsql` entries added this session).
5. A short entry is added to `TODO.md` describing what shipped (topic count, phases, whether
   a `demo/`/`references.html`/`samples.html` was added), and this track's section is deleted
   from this file (or marked `✅ done` with a one-line pointer to the `TODO.md` entry).
