# Roadmap Sidebar Migration Plan

## Overview
This document outlines the migration strategy for synchronizing the roadmap sidebar data. The goal is to ensure all languages have consistent `topic.json` files and populated `data/` directories.

## Migration Steps

### 1. Fix Missing Topic JSONs
For languages where `topic.html` exists but `data/topic.json` is missing:
1.  Navigate to `roadmap/<language>/`.
2.  Create the `data/` directory if it doesn't exist.
3.  Create/copy a template `topic.json`.
4.  Populate `topic.json` with the relevant topics extracted from `topic.html`.

### 2. Populate Empty Data Folders
For languages with empty `data/` folders:
1.  Identify the required roadmap topics for the language.
2.  Create the necessary JSON structure in `roadmap/<language>/data/`.
3.  Update the `topic.html` or equivalent sidebar generator to use this new data source.

### 3. Verification
1.  Run the local development server.
2.  Check the roadmap sidebar for the affected language.
3.  Ensure links and structure match the expected layout.

## Current Priorities
- **Engineering tracks** (`cse`, `dba`, `dsa`, `dsl`, `hpc`, `osd`, `pgp`, `sml`, `tek`) —
  see `tracking/ENGINEERING_PLAN.md`. As of 2026-11-14 all nine are complete (`dba` and
  `tek` lessons authored the same day); what remains there is optional demo/reference
  material. Pages whose sidebar never
  renders because they lack `topic-loader.js` (formerly `sml`, `hpc`, `cse`, `osd`, `svelte`)
  are all fixed. Read `ENGINEERING_PLAN.md`'s "three failure modes" section before starting.
- All missing-JSON and legacy `topic.html` issues are resolved (`go` fixed 2026-11-14).
- Language cleanup now means rewriting thin legacy pages — see `tracking/TODO.md`'s "Next
  Priorities".
