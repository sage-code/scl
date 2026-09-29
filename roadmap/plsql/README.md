# PL/SQL

A 17-topic SQL and PL/SQL roadmap, progressing from the database life cycle
(build, operate, maintain, optimize) through the PL/SQL language (syntax,
structure, control flow, cursors, exceptions) and data & modules
(types, collections, packages, transform, triggers) to practice & reference.

- `data/*.json` — sidebar sidecar files (one per topic page), consumed by
  `assets/js/topic-loader.js`. This track uses the legacy flat sidebar shape
  (each `<h2>` is its own top-level entry, `<h3>` nests under the nearest
  preceding `<h2>`) — keep new pages consistent with it rather than mixing in
  the single-root `<h1>` model used by newer tracks.
- `demo/*.sql`, `*.pks`, `*.pkb`, `*.pkc` — single-file practice scripts, one
  per lesson, viewable through `/roadmap/code-viewer.html` and indexed on
  `demo_examples.html`. Scripts that create their own tables drop them first,
  so they can be re-run safely.
