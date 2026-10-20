# Sage-Code SCL Tracking System & Context Optimization Guide

This directory manages migration status, roadmaps auditing, and implementation roadmaps for the Sage-Code SCL repository.

---

## ⚡ Context Usage & Token Reduction Guide for AI Agents

To conserve token quotas and prevent context pollution (per `GEMINI.md` Rule 2):

### 1. Never Dump `roadmaps-status.json` Into Context
- `tracking/roadmaps-status.json` is a detailed database of all 42 tracks (~35 KB, ~1,150 lines). Loading it consumes ~9,000–10,000 tokens.
- **Instead, use `tracking/roadmaps-summary.json`** (~9 KB) for an overview of tracks needing attention, or use the CLI commands below.

### 2. Fast CLI Status Invocations
Run the Python status generator with targeted arguments to retrieve exact answers without file reads:
```bash
# Print high-level summary and tracks needing action:
python tracking/generate_roadmaps_status.py --compact

# Print JSON status of the 9 engineering tracks only:
python tracking/generate_roadmaps_status.py --engineering

# Print detailed JSON for a single track:
python tracking/generate_roadmaps_status.py --track sml
```

### 3. Use Targeted Line Reads for Markdown Plans
- Do not read whole plan files (`ENGINEERING_PLAN.md` or `TODO.md`) when working on a single track.
- Check the table of contents or search for `#### <track>` and use range reads (e.g. `start_line: 75, end_line: 120`).

---

## Tracking Directory Files

| File | Purpose | Optimal Consumption Pattern |
| :--- | :--- | :--- |
| `roadmaps-summary.json` | High-signal summary of active priorities & metrics | Read when high-level overview is needed (~2-3k tokens) |
| `roadmaps-status.json` | Full sitewide automated audit data | Tool target only (avoid loading full content into LLM context) |
| `generate_roadmaps_status.py` | Generator script for both status JSONs | Run via CLI with flags (`--compact`, `--engineering`, `--track`) |
| `ENGINEERING_PLAN.md` | In-depth architectural roadmap for the 9 engineering tracks | Read per-track sections using targeted range reads |
| `TODO.md` | Active sprint checklist & historical migration changelog | Read active top section; use range reads for track logs |
| `MIGRATION_PLAN.md` | High-level 3-step legacy sidebar migration protocol | Reference for legacy sidebar restructuring |

---

## Engineering Roadmaps Quick Status

The 9 engineering tracks (`kind: "engineering"` in `roadmap/roadmap-index.json`):

| Track | Status | Topics | Unwired | Placeholders | Practice Layer | Next Action |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`sml`** | `not_updated` | 10 | 10 | 0 | None | **Tier 0**: Add sidebar shell & `topic-loader.js` (content exists) |
| **`hpc`** | `not_updated` | 10 | 10 | 1 | None | **Tier 0**: Wire 8 pages, resolve 2 orphan files (`cloud`, `tools`), fix typos |
| **`osd`** | `not_implemented` | 8 | 5 | 5 | None | **Tier 1**: Author 5 missing lessons (`code-review`, `ci-cd`, etc.) + wire shell |
| **`dba`** | `not_implemented` | 11 | 0 | 9 | None | **Tier 1**: Author 9 placeholder lessons + SQL demo scripts in `demo/` |
| **`tek`** | `not_implemented` | 12 | 0 | 8 | None | **Tier 2**: Author 8 placeholder lessons (`infra-as-code`, `sre-practices`, etc.) |
| **`dsl`** | `converted` | 40 | 0 | 0 | Ref | **Tier 3**: Polish with `demo/` snippets and `samples.html` study projects |
| **`pgp`** | `converted` | 66 | 0 | 0 | Demo | **Tier 3**: Polish with `references.html` and `samples.html` |
| **`dsa`** | `converted` | 24 | 0 | 0 | Full | ✅ **Complete**: 24 topics, `demo/`, `demo_examples.html`, `references.html`, `samples.html` |
| **`cse`** | `converted` | 17 | 0 | 0 | Ref | ✅ **Complete**: CS fundamentals hub, external track pointers, `references.html` |

