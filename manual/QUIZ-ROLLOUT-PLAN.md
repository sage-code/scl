# Roadmap Quiz Rollout Plan

## Scope and assumptions

- Cover all 42 roadmaps listed in `roadmap/index.html`.
- Create one course-level A/B/C quiz suite per roadmap, not a separate suite for
  every topic page. Each set contains exactly 42 questions.
- Follow the roadmap index ordering within its lanes: programming tracks first,
  then engineering tracks.
- Go A/B/C already contain 42 questions each. Keep Go in its back-end sequence
  position as a review checkpoint; do not regenerate it unless requested.
- For each track, choose one stable topic slug for the quiz files and catalog links.
  Go currently uses `syntax`; use a slug that accurately describes each other
  roadmap's course-level quiz scope.

## Progress checkpoint

- HTML (`fundamentals`): **Available**; A/B/C prepared, validated, and activated.
- CSS (`foundations`): **Available**; A/B/C prepared, validated, and activated.
- JavaScript (`fundamentals`): **Available** / **Review pending**; A/B/C prepared, validated, and activated in the catalog.
- Python (`fundamentals`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Dart (`fundamentals`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- TypeScript (`fundamentals`, track `tscript`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- React (`fundamentals`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Vue (`fundamentals`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Flutter (`fundamentals`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- WebAssembly (`fundamentals`, track `wasm`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Svelte (`fundamentals`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Ruby (`fundamentals`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- PHP (`fundamentals`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Node.js (`fundamentals`, track `node`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- C (`fundamentals`, track `c`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- C++ (`fundamentals`, track `cpp`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Rust (`fundamentals`, track `rust`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Assembly (`fundamentals`, track `assembly`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Bash (`fundamentals`, track `bash`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Swift (`fundamentals`, track `swift`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Julia (`fundamentals`, track `julia`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- C# (`fundamentals`, track `csharp`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Java (`fundamentals`, track `java`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Scala (`fundamentals`, track `scala`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- PL/SQL (`fundamentals`, track `plsql`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Kotlin (`fundamentals`, track `kotlin`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Nim (`fundamentals`, track `nim`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Zig (`fundamentals`, track `zig`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Fortran (`fundamentals`, track `fortran`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Ada (`fundamentals`, track `ada`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Elixir (`fundamentals`, track `elixir`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Odin (`fundamentals`, track `odin`): **Review pending**; A/B/C prepared, validated, and activated in the catalog for review.
- Go (`syntax`): existing A/B/C sets; **Review pending** (activated in the catalog).
- Next roadmap: CSE (Phase 6 Engineering fundamentals), after review of pending sets.
- Keep newly prepared sets unavailable until review unless the user asks to
  activate them for review. Do not advance until the review pause is complete.

## One-time setup

1. Generalize `assets/js/roadmap-quiz-catalog.js` from its Go-only quiz list to
   track-specific quiz metadata as sets are ready for review. Keep each track's
   topic slug, A/B/C titles, and descriptions aligned with its JSON files.
2. Keep unpublished sets unavailable rather than linking to missing quiz files.
   Preserve the existing status behavior: None, Fail, or Pass.
3. Check each completed roadmap for its A/B/C files, 42 questions per set, valid
   point totals, format mix, short-code minimum, and balanced answer positions.

## Quiz content and quality gate

Apply these requirements to each roadmap before moving to the next:

- **A — Foundations:** essential vocabulary, syntax, core constructs, and direct
  applications.
- **B — Application:** combine concepts, read or trace short examples, and handle
  common errors and edge cases.
- **C — Engineering:** debugging, design choices, production constraints,
  reliability, and trade-offs.
- Each A/B/C set has exactly 42 questions. At least 5 questions in each set
  (at least 10%) use a very short code example or expression.
- Use single-choice, multi-select checkboxes, and matching grids where each format
  best measures the concept. Vary correct-answer positions and use plausible
  distractors.
- Give every question a clear prompt, technically accurate answer key, and concise
  explanation. Use executable or unambiguous snippets in the roadmap's language.
- Keep each quiz's points total consistent with its single-choice answers,
  multi-select correct options, and grid cells.

## Roadmap sequence

### Phase 1 — Front-end roadmaps

1. HTML — **Available**
2. CSS — **Available**
3. JavaScript — **Review pending**
4. TypeScript — **Review pending** (`tscript`, `fundamentals`, A/B/C prepared & activated)
5. React — **Review pending** (`fundamentals`, A/B/C prepared & activated)
6. Vue — **Review pending** (`fundamentals`, A/B/C prepared & activated)
7. Flutter — **Review pending** (`fundamentals`, A/B/C prepared & activated)
8. WebAssembly — **Review pending** (`wasm`, `fundamentals`, A/B/C prepared & activated)
9. Svelte — **Review pending** (`fundamentals`, A/B/C prepared & activated)

### Phase 2 — Back-end roadmaps

10. Python — **Review pending** (`fundamentals`, A/B/C prepared & activated)
11. Go — Existing A/B/C sets; review pending (`syntax`, activated)
12. Dart — **Review pending** (`fundamentals`, A/B/C prepared & activated)
13. Ruby — **Review pending** (`fundamentals`, A/B/C prepared & activated)
14. PHP — **Review pending** (`fundamentals`, A/B/C prepared & activated)
15. Node.js — **Review pending** (`node`, `fundamentals`, A/B/C prepared & activated)

### Phase 3 — Systems-language roadmaps

16. C — Review pending (`fundamentals` A/B/C in `roadmap/c/quiz/`)
17. C++ — Review pending (`fundamentals` A/B/C in `roadmap/cpp/quiz/`)
18. Rust — Review pending (`fundamentals` A/B/C in `roadmap/rust/quiz/`)
19. Assembly — Review pending (`fundamentals` A/B/C in `roadmap/assembly/quiz/`)
20. Bash — Review pending (`fundamentals` A/B/C in `roadmap/bash/quiz/`)
21. Swift — Review pending (`fundamentals` A/B/C in `roadmap/swift/quiz/`)

### Phase 4 — Enterprise-language roadmaps

22. Julia — Review pending (`fundamentals` A/B/C in `roadmap/julia/quiz/`)
23. C# — Review pending (`fundamentals` A/B/C in `roadmap/csharp/quiz/`)
24. Java — Review pending (`fundamentals` A/B/C in `roadmap/java/quiz/`)
25. Scala — Review pending (`fundamentals` A/B/C in `roadmap/scala/quiz/`)
26. PL/SQL — Review pending (`fundamentals` A/B/C in `roadmap/plsql/quiz/`)
27. Kotlin — Review pending (`fundamentals` A/B/C in `roadmap/kotlin/quiz/`)

### Phase 5 — Disruptive-language roadmaps

28. Nim — Review pending (`fundamentals` A/B/C in `roadmap/nim/quiz/`)
29. Zig — Review pending (`fundamentals` A/B/C in `roadmap/zig/quiz/`)
30. Fortran — Review pending (`fundamentals` A/B/C in `roadmap/fortran/quiz/`)
31. Ada — Review pending (`fundamentals` A/B/C in `roadmap/ada/quiz/`)
32. Elixir — Review pending (`fundamentals` A/B/C in `roadmap/elixir/quiz/`)
33. Odin — Review pending (`fundamentals` A/B/C in `roadmap/odin/quiz/`)

### Phase 6 — Engineering fundamentals

34. CSE — Pending
35. DSA — Pending
36. PGP — Pending

### Phase 7 — Data and applied technology

37. TEK — Pending
38. DBA — Pending
39. SML — Pending

### Phase 8 — Infrastructure and systems engineering

40. HPC — Pending
41. OSD — Pending
42. DSL — Pending

## Review pauses

Work on one roadmap at a time. For a new roadmap, prepare all three sets, run the
quiz tests and site validation, and report the question counts, format mix, short
example count, and any content issues. Then stop for review. Do not start the next
roadmap until the user has reviewed the current A/B/C set and explicitly asks to
continue. If corrections are requested, revise and revalidate that roadmap before
advancing.
