#!/usr/bin/env python3
"""Shared helpers for the source/public validation engines.

Used by:
- scripts/test/test_sources.py  (`npm run test`  — verify source files)
- scripts/check_public.py       (`npm run check` — verify generated public/)
"""
from __future__ import annotations

import json
import re
from pathlib import Path

H1_RE = re.compile(r"<h1\b", re.IGNORECASE)
H2_RE = re.compile(r"<h2\b", re.IGNORECASE)

# Marker on a title node: the page title that roots the sidebar tree. On the
# preferred (title-as-root) shape it tags a top-level `<h1>` entry that carries
# its `<h2>` chapters in `children`; on the legacy shape it tags the childless
# title leaf that sits above flat `<h2>` chapters. Mirrored in
# scripts/tools/gen_topic_sidebars.py (TITLE_ROLE), the tool that emits it.
TITLE_ROLE = "title"


def read_text(path: Path) -> str:
    """Read a file leniently; encoding issues surface as content checks, not crashes."""
    return path.read_text(encoding="utf-8", errors="ignore")


def validate_json_syntax(text: str):
    """Parse JSON text. Returns (error, data); error is None on success."""
    try:
        return None, json.loads(text)
    except json.JSONDecodeError as e:
        return f"Invalid JSON: {e}", None


def sidebar_issues(data, rel: str) -> list:
    """Validate roadmap sidebar/topic JSON hierarchy.

    Returns (level, message) tuples; level is "fail" or "warn".

    Rule (see manual/ARCHITECTURE.md §"Topic sidebar JSON"): entries are objects;
    each entry may carry a "children" list; nested children are objects with at
    least "link".
    - Structural breakage (non-list children, non-object entries, missing link)
      fails: it breaks tree navigation in assets/js/topic-loader.js.
    - Missing "title" only warns: topic-loader.js falls back to a formatted
      section name (item.title || this.formatTopicName(sectionKey)).
    - The page title ROOTS the tree. Two shapes are accepted:
        * title-as-root (preferred): a top-level entry
          `{ "title": ..., "link": "#<h1-id>", "role": "title",
             "children": [ <h2 chapters> ] }` — the h1 is the folder that
          contains every topic. A page may declare several such roots (one per
          `<h1>`).
        * legacy: a childless title leaf, then flat `<h2>` chapters.
      In both shapes the FIRST entry should be tagged `"role": "title"`; a
      missing tag warns — content debt, backfillable by
      scripts/tools/gen_topic_sidebars.py. Any title-tagged entry must anchor
      with '#': topic-loader.js only renders '#'-anchored nodes, so an
      unanchored title (or one whose link is missing) is dead navigation (fails).
    """
    issues: list = []

    if not isinstance(data, list):
        return [("fail", f"{rel}: sidebar JSON must be a list of entries")]

    def walk(entry) -> None:
        if not isinstance(entry, dict):
            issues.append(("fail", f"{rel}: sidebar entry must be an object"))
            return
        if "title" not in entry:
            issues.append(("warn", f"{rel}: sidebar entry missing 'title'"))
        if entry.get("role") == TITLE_ROLE and not str(entry.get("link", "")).startswith("#"):
            issues.append(("fail", f"{rel}: page-title entry needs a '#' anchor link"))
        children = entry.get("children")
        if children is None:
            return
        if not isinstance(children, list):
            issues.append(("fail", f"{rel}: sidebar 'children' must be a list"))
            return
        for child in children:
            if isinstance(child, dict) and "link" not in child:
                issues.append(("fail", f"{rel}: sidebar child missing 'link'"))
            walk(child)

    if data:
        first = data[0]
        if not (isinstance(first, dict) and first.get("role") == TITLE_ROLE):
            # Covers both a sidebar with no title node at all and a legacy title
            # entry that predates the marker — same fix for either: add the tag.
            issues.append(
                ("warn", f"{rel}: first sidebar entry is not tagged as the page title ('role': '{TITLE_ROLE}')")
            )

    for entry in data:
        walk(entry)
    return issues
