# Roadmap Quiz Strategy

## Purpose

Roadmap quizzes are formative practice, not secure exams. Each quiz is a static JSON
document rendered by one reusable browser-side player. Question selections, detailed
results, and mentor-review exports stay on the user's device. The server stores quiz
metadata and per-attempt score summaries only. Pilot the schema and player on one
topic before quiz content is expanded across tracks.

## Framework

Use vanilla JavaScript and semantic HTML, styled with the Bootstrap version already
used by the site. Do not introduce Vue, React, a bundler, or a second UI framework:
the quiz player needs local state, input rendering, scoring, and feedback, all of
which fit the existing static-site architecture.

Reuse the existing Prism assets for code snippets (`/assets/prism.css` and
`/assets/prism.js`). Keep shared navigation and footer assembly in the build; the
player may render the interactive question form at runtime.

## Source layout

Keep quiz content beside each roadmap track, separate from the existing sidebar
metadata in `data/`:

```text
roadmap/
  quiz.html                         # Shared static player page
  <track>/
    quiz/
      <topic>-A.json
      <topic>-B.json
      <topic>-C.json
assets/
  css/roadmap-quiz.css
  js/roadmap-quiz.js
```

Use absolute quiz links such as
`/roadmap/quiz.html?track=python&topic=functions&level=A`. The player validates
the track, topic, and level identifiers before constructing the JSON path
`/roadmap/<track>/quiz/<topic>-<level>.json`; never accept an arbitrary file path
from a query parameter. Keep this quiz directory separate from
`roadmap/<track>/data/`, which remains for sidebar and other track metadata.

Each topic may have three separate quizzes:

| Code | Level | Focus |
|---|---|---|
| A | Basic | Core vocabulary, syntax, and direct applications |
| B | Intermediate | Combining concepts, reading code, and common edge cases |
| C | Advanced | Trade-offs, debugging, design choices, and production scenarios |

Target about 42 questions per complete quiz. A smaller pilot is useful while the
schema and interaction model are being validated.

## JSON data model

Each file represents exactly one quiz and carries its own stable IDs and content
revision. `schemaVersion` changes when the data structure changes; `revision` changes
when the quiz content changes. Question and option IDs must remain stable when
wording is edited, so saved attempts can be invalidated deliberately when a quiz
changes.

```json
{
  "schemaVersion": 1,
  "id": "python-functions-A",
  "revision": 1,
  "name": "Functions: A",
  "track": "python",
  "topic": "functions",
  "level": "A",
  "pointsPossible": 3,
  "questions": [
    {
      "id": "q001",
      "type": "single-choice",
      "prompt": "Which keyword declares a function?",
      "code": {
        "language": "python",
        "source": "def add(left, right):\n    return left + right"
      },
      "options": [
        { "id": "a", "text": "func" },
        { "id": "b", "text": "def" },
        { "id": "c", "text": "function" },
        { "id": "d", "text": "let" }
      ],
      "correctOptionIds": ["b"],
      "explanation": "Python uses def to begin a function definition."
    },
    {
      "id": "q002",
      "type": "matrix",
      "prompt": "Match each call form to its property.",
      "rows": [
        { "id": "positional", "label": "Positional argument" },
        { "id": "keyword", "label": "Keyword argument" }
      ],
      "columns": [
        { "id": "order", "label": "Depends on parameter order" },
        { "id": "name", "label": "Names the parameter" },
        { "id": "default", "label": "Uses a default automatically" }
      ],
      "selectionByRow": {
        "positional": "single",
        "keyword": "single"
      },
      "correctByRow": {
        "positional": ["order"],
        "keyword": ["name"]
      },
      "explanation": "Positional arguments bind by position; keyword arguments bind by parameter name."
    }
  ]
}
```

`code` is optional and may accompany a choice or matrix question. Store source as
plain text and insert it with `textContent`; do not store executable HTML. Prism
highlights the rendered code using the language named in `code.language`.

### Question types

- **`single-choice`**: exactly four options and exactly one correct option. Render
  native radio inputs.
- **`multi-select`**: exactly four options and two or more correct options. State
  “Select all that apply” in the prompt and render native checkboxes.
- **`matrix`**: non-empty `rows` and `columns`. Each row declares `"single"` or
  `"multiple"` in `selectionByRow`; its `correctByRow` entry contains one or more
  valid column IDs according to that mode. Render radio inputs for single rows and
  checkboxes for multiple rows. Its possible points equal the number of correct
  column IDs across all rows.

Matrix dimensions come from the arrays, not hard-coded layouts. This supports
2x2, 2x3, 3x2, 3x3, 4x4, 2x6, and other reasonable grids. Keep row and column
labels concise; place wide grids in a horizontally scrollable container on narrow
screens.

## Interaction, accessibility, and scoring

- Use a semantic `<form>`, a `<fieldset>` and `<legend>` per question, and visible
  labels for every control. Matrix tables need a caption, row headers, column
  headers, and inputs with accessible names.
- Present one question at a time with previous/next controls, a progress indicator,
  and a submit/review step. Preserve answers during navigation.
- Give each correct selected answer one point and subtract one point for each
  incorrect selection, with a floor of zero per question. This permits partial
  credit on multi-select and matrix questions without rewarding "select everything."
  A single-choice question is worth one point. A multi-select question is worth the
  number of correct options; a matrix is worth the number of correct cells across
  its rows. `pointsPossible` is the sum of those per-question maxima.
- Sum the question points as `pointsEarned`; calculate
  `scorePercent = round(100 * pointsEarned / pointsPossible, 2)`. Require
  `pointsPossible > 0` and validate that earned points are between zero and the
  possible total.
- Show the score and explanations after submission. An incorrect selection can only
  reduce its own question's earned points; it never affects other questions.
- Build a self-contained result JSON locally with quiz ID/name/revision, completion
  time, selected answers, correct answers, per-question points, and totals. Offer a
  download so the learner can back it up or share it with a mentor for review.
  Optionally keep an in-progress attempt in `localStorage`, keyed by quiz ID and
  content revision, with a clear restart action. Do not upload detailed answers or
  result files to the server. Mentor review is a user-initiated share of the
  downloaded file; this design does not add a mentor upload endpoint.

## Server score summary

The browser owns quiz execution and the detailed result file. When the learner
chooses to save a score to their account, send only the quiz ID and `pointsEarned`
through an authenticated Vercel API function. The server looks up the registered
quiz ID, name, revision, and `pointsPossible`, validates the submitted points, and
calculates the percentage itself. Store one row per attempt with the account ID,
quiz ID/name/revision, points earned, possible points, percentage, and completion
time. Keep the quiz catalog separate from the attempt records; each new quiz must be
registered before scores can be saved.

| Record | Fields |
|---|---|
| Quiz catalog | `quiz_id`, `quiz_name`, `revision`, `points_possible` |
| Quiz attempt | `attempt_id`, `user_id`, `quiz_id`, `quiz_name`, `revision`, `points_earned`, `points_possible`, `score_percent`, `completed_at` |

This is a self-reported practice score: because answer choices and the scoring code
run in the browser, the server cannot prove `pointsEarned` without receiving answers
or independently grading them. Do not present the stored percentage as a verified
exam result. Account deletion must also remove that user's score summaries.

## Content quality and validation

Every question should assess a stated learning outcome. Distractors should be
plausible misconceptions, not jokes or wording tricks. Vary the position of correct
choices; do not make order reveal the answer. Add an explanation for every answer,
including each matrix row where a short row-level explanation improves feedback.

The shared quiz validator and source tests should check:

1. JSON parses and `schemaVersion`, positive `revision`, `id`, `name`, `track`,
   `topic`, `level`, and positive `pointsPossible` are valid.
2. Question IDs are unique, and the question count is reported against the target.
3. Single-choice and multi-select option counts and answer IDs satisfy their rules.
4. Matrix answer maps cover every row and reference existing column IDs, with the
   required number of answers for each row's selection mode.
5. Code languages are supported by the shared Prism bundle, and `pointsPossible`
   equals the sum of the question maxima.

Correct answers are present in public JSON and can be inspected by visitors. This
is acceptable for practice quizzes, but not for certification, admissions, or any
high-stakes assessment. Such assessments would need server-side answer validation
and scoring.

## Rollout

1. Implement the initial schema checks and shared player for single-choice,
   multi-select, matrix, and code questions.
2. Pilot `/roadmap/go/quiz/syntax-A.json` from the Go roadmap index; verify scoring,
   keyboard use, responsive matrix layout, Go code highlighting, and result download.
3. Add Go syntax levels B and C only after the first quiz has been reviewed.
4. Add the quiz catalog, summary-only API, and database migration for account score
   history. Verify account deletion removes these records.
5. Add quiz links to additional roadmap pages and expand content only after each quiz
   passes validation.

The initial implementation is a five-question Go syntax A pilot. It exercises each
supported question type and keeps detailed results in a user-downloaded JSON file.
Account score submission and progress restoration are not implemented.
