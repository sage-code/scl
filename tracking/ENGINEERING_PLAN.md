# Engineering Tracks — Improvement Plan

**Scope:** the 9 tracks with `"kind": "engineering"` in `roadmap/roadmap-index.json`:
`cse`, `dba`, `dsa`, `dsl`, `hpc`, `osd`, `pgp`, `sml`, `tek`.

The 33 `"kind": "language"` tracks are out of scope here — per the session that produced
this plan, those have been reviewed track by track (most recently `scala` and `plsql`,
see their `git log`) and are in materially better shape. `tracking/roadmaps-status.json`
covers both kinds; this document narrows to engineering.

**Why a new document instead of extending `TODO.md`:** `TODO.md` is a chronological log of
completed language-track rebuilds. Engineering tracks need a different axis — most of them
are *structurally wired but empty*, which is a distinct failure mode from anything `TODO.md`
was tracking. Once a track's page in this plan reaches "done", fold a short entry into
`TODO.md` the same way `bash`/`css`/`odin`/etc. were folded in, and delete that track's
section here (or mark it done — see the closing checklist).

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

### Tier 0 — mechanical wiring fix only (real content already exists)

#### `sml` — SML / Statistics & Machine Learning (10 topics, **0 of 10 wired**)
All ten topic pages have substantial, real content (9.7–20 KB each — `basic-concepts.html`
and `storage.html` are the largest). **None** include `topic-loader.js`; none have the
`<aside class="side-bar">` shell at all — the page goes straight from the header to an `<h2>`.
This is the highest-ROI fix in this whole plan: add the standard shell (copy it from any fixed
`roadmap/scala/*.html` page — header include, `<aside>`/`bookmark-list`, `<main
id="main-content">`, `window.TOPIC_CONFIG` script block with `labId: 'sml'`, and the
`sage.js`/`topic-loader.js` script tags) around each page's existing `<main>` content. Do not
rewrite the lesson text. `data/<topic>.json` sidecars already exist — verify each still
anchors correctly against the (unchanged) heading `id`s once the shell is added.
Files: `analysis`, `basic-concepts`, `cleaning`, `collection`, `deep-learning`,
`ethical-issues`, `life-cycle`, `machine-learning`, `storage`, `visualization`.
No `demo/`, `references.html`, or `samples.html` — worth adding once wiring is fixed (§ below).

#### `hpc` — Computer Hardware (10 topic pages listed in `index.html`, **0 of 8 real ones wired**)
Eight of the ten `.html` files in `roadmap/hpc/` are linked from `index.html` and have real,
substantial content (13–31 KB) but an empty, never-populated `<ul id="bookmark-list">` — the
shell exists but no `topic-loader.js`/`TOPIC_CONFIG` script runs. This is **the original bug
report from this session, mechanically**: an empty sidebar box that looks broken to a reader.
Fix identically to `sml` above (`labId: 'hpc'`).
Files needing wiring: `backup`, `computers`, `connectors`, `disk`, `gpu`, `infrastructure`,
`networks`, `power`.

**Two orphaned files** (failure mode C): `cloud.html` and `tools.html` exist in
`roadmap/hpc/` but are **not linked from `index.html`** and are not real content — both
contain the same copy-pasted "you are a hacker... this is a template page you should not
find" joke stub under the heading "HW Tutorial" (unrelated to either filename). `cloud.html`
also has a stray unclosed `<a >` tag and `tools.html` an unclosed `<a href="...">` before
`</li>`. Decide: (a) delete both and their `data/*.json` if any, since HPC's other 8 topics
already cover the track's stated scope, or (b) write real "Cloud Computing" and "Dev/Test
Tools" lessons and wire them into `index.html`'s phase table. Given every other engineering
track skews toward *fewer, deeper* topics, (a) is the safer default unless a reviewer wants
HPC to cover cloud/tooling explicitly.
Also spot-fix while in these files: `computers.html` has "Compoenents" (heading typo),
"assable" → "assemble", "les" → "less", and a missing space in "software.With" — the same
class of typo already fixed in `scala`/`plsql` this session; do a full typo pass across all
8 real HPC pages while wiring them (don't assume `computers.html` is the only one affected).

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

### Tier 1 — mostly-empty tracks with a working template already in the same track

#### `dba` — Database Administration (11 topics, **9 placeholders, 2 real**)
`databases.html` (36 KB) and `db-design.html` (23 KB) are real, well-developed lessons —
**use these two as the writing template** for the other nine. All 11 pages are already fully
wired (sidebar works correctly); this track needs content authoring only, no structural fix.
Placeholders to write, with the one-line scope already promised in `index.html`
(quote these verbatim as the lesson's opening scope, don't re-derive them):
- `data-modeling` — Entity relationships, constraints, domains, and schema strategy.
- `sql-fundamentals` — DDL, DML, query writing, and practical data manipulation. (Cross-link
  to `roadmap/plsql/` — this session's rebuilt PL/SQL track — instead of re-teaching SQL from
  scratch; DBA's job here is the *administration* angle, not the language.)
- `indexing` — B-tree/hash indexing, selectivity, index maintenance.
- `query-optimization` — Execution plans, bottleneck diagnosis, tuning workflow. (Heavy overlap
  with `roadmap/plsql/optimize.html` — cross-link rather than duplicate.)
- `transactions-concurrency` — ACID, isolation levels, locking, conflict handling.
- `security-access-control` — AuthN/authZ, auditing, secrets handling.
- `backup-recovery` — Backup strategies, restore testing, disaster recovery plans.
- `replication-ha` — Replication models, failover patterns, resilient deployments.
- `monitoring-operations` — SLOs, alerting, capacity planning, runbook-driven ops.

No `demo/`, `references.html`, or `samples.html` yet — see § Practice & Reference below;
DBA is a strong demo-folder candidate (runnable SQL scripts per lesson, same pattern as
`roadmap/plsql/demo/`).

#### 🚧 `osd` — Open Source Development (8 topics, **5 of 8 still placeholders**)
**Update (2026-09-29): two more pages done**, both migrated from CSE (`git-workflow.html`
from `cse/version.html`'s Git-specific sections — architecture, commands, branching, forking;
`testing.html` from `cse/testing.html`'s full testing-strategy content — paradigms, the
anatomy of a functional test, CI, TDD). `foundations.html` (19.9 KB, correctly wired) remains
the third real lesson. The other five are still the exact `"Dummy topic page. Planned
content: ..."` stub — each stub's meta description already states the intended scope, e.g.
`ci-cd.html`: "automated checks, deployment pipelines, and rollback safety." Use `index.html`'s
descriptions (quoted in full above, § Per-track status data) as the outline for each. These 5
also need the sidebar shell added (failure mode A) at the same time content is written —
don't wire an empty stub, write the real lesson directly into the correct shell.
Remaining topics: `code-review`, `documentation`, `ci-cd`, `release-management`,
`maintainership`.

### Tier 2 — full-track authoring (near-zero real content, but solid bones)

#### 🚧 `dsa` — Data Structures & Algorithms (10 topics, **9 of 10 still placeholders**)
**Update (2026-09-29): `data-structures.html` is done** — written by migrating and expanding
`cse/structures.html`'s content (arrays, linked lists, stacks, queues, heaps, trees, graphs,
hash tables, plus the "exotic structures" section: Bloom filters, HyperLogLog, interval trees,
tries, wavelet trees). Cross-links added to the still-placeholder `complexity-analysis`,
`trees-heaps`, `graph-algorithms`, and `sorting` pages so the wiring is ready the moment
those are written. The other 9 pages are still the templated stub; sidebar wiring is already
correct throughout, so each remaining page is a pure content-authoring task. This is the
**strongest demo-folder candidate of all nine tracks** — algorithms are inherently code, and a
`demo/` folder of small, runnable, language-agnostic-but-concrete programs (pick one language
— Python reads clearest for pseudocode-adjacent algorithm teaching, or reuse the site's own
`dsl`/`plsql`/`scala` Prism grammars if another language fits the site's voice better) would
make this the flagship engineering track. Remaining topics and their promised scope (from
`index.html`): `algorithms`, `complexity-analysis`, `searching`, `sorting`, `trees-heaps`,
`graph-algorithms`, `dynamic-programming`, `greedy-algorithms`, `advanced-techniques`.
Suggested authoring order: `complexity-analysis` next (everything else depends on Big-O
vocabulary), then `searching`/`sorting` (concrete, teachable with small demos), then
`trees-heaps` → `graph-algorithms` → `dynamic-programming` → `greedy-algorithms` →
`advanced-techniques` last (it explicitly depends on DP + greedy being taught first).

#### 🚧 `tek` — TechOps (12 topics, **8 of 12 still placeholders**)
**Update (2026-09-29): four pages done** — `linux-systems.html` (migrated from
`cse/platforms.html`'s boot/file-system/distributions/command-line content, refocused from
general OS theory to Linux specifically), `cloud-operations.html` and
`containers-virtualization.html` (migrated and split from `cse/cloud.html` — service models,
providers, and data centers in the former; Docker and Kubernetes, plus a VM-vs-container
comparison table, in the latter), and `security-hardening.html` (migrated from
`cse/cybersec.html` — core concepts, writing a policy, GDPR basics). The other 8 pages are
still the identical `"This lesson is a placeholder and will be populated in the current
TechOps rollout"` stub. `index.html`'s descriptions (quoted above) are detailed enough to
write from directly. Suggested order follows the existing phase structure:
PHASE 1 `techops-intro` → ~~`linux-systems`~~ → `shell-automation` → `networking-basics`;
PHASE 2 `version-control-cicd` → ~~`containers-virtualization`~~ → `infra-as-code` →
~~`cloud-operations`~~; PHASE 3 `observability-monitoring` → `incident-response` →
~~`security-hardening`~~ → `sre-practices`. `shell-automation` is a natural demo-folder
candidate (reuse the `bash` track's demo conventions if useful — see `TODO.md`'s `bash`
entry).

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

None of the 9 engineering tracks currently has a `demo/` folder or `demo_examples.html`;
only `dsl` has `references.html`; none has `samples.html`. Once a track's lesson content is
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
  run. Not done in this pass — flagging so it isn't lost.
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
