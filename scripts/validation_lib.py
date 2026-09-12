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

# Marker on the first sidebar entry: the page-title leaf that points at the
# page's <h1>. Mirrored in scripts/tools/gen_topic_sidebars.py (TITLE_ROLE),
# which is the tool that emits it.
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

    Rule (see GEMINI.md / agents docs): entries are objects; each entry may carry
    a "children" list; nested children are objects with at least "link".
    - Structural breakage (non-list children, non-object entries, missing link)
      fails: it breaks tree navigation in assets/js/topic-loader.js.
    - Missing "title" only warns: topic-loader.js falls back to a formatted
      section name (item.title || this.formatTopicName(sectionKey)).
    - The FIRST entry should be the page-title leaf
      `{ "title": ..., "link": "#<h1-id>", "role": "title" }`
      pointing at the page's <h1> (manual/ARCHITECTURE.md §"Topic sidebar JSON").
      A missing one warns — content debt, backfillable by
      scripts/tools/gen_topic_sidebars.py. A present but malformed one fails:
      topic-loader.js only renders '#'-anchored leaves, so a title leaf without
      an anchor (or with children) would be dead navigation.
    """
    issues: list = []

    if not isinstance(data, list):
        return [("fail", f"{rel}: sidebar JSON must be a list of entries")]

    def walk(entry, depth: int) -> None:
        if not isinstance(entry, dict):
            issues.append(("fail", f"{rel}: sidebar entry must be an object"))
            return
        if "title" not in entry:
            issues.append(("warn", f"{rel}: sidebar entry missing 'title'"))
        children = entry.get("children")
        if children is None:
            return
        if not isinstance(children, list):
            issues.append(("fail", f"{rel}: sidebar 'children' must be a list"))
            return
        for child in children:
            if isinstance(child, dict) and "link" not in child:
                issues.append(("fail", f"{rel}: sidebar child missing 'link'"))
            walk(child, depth + 1)

    if data:
        first = data[0]
        if not (isinstance(first, dict) and first.get("role") == TITLE_ROLE):
            # Covers both a sidebar with no title link at all and a legacy title
            # link that predates the marker — same fix for either: add the tag.
            issues.append(
                ("warn", f"{rel}: first sidebar entry is not tagged as the page-title leaf ('role': '{TITLE_ROLE}')")
            )
        elif first.get("children") is not None:
            issues.append(("fail", f"{rel}: page-title leaf must not carry 'children'"))
        elif not str(first.get("link", "")).startswith("#"):
            issues.append(("fail", f"{rel}: page-title leaf needs a '#' anchor link"))

    for entry in data:
        walk(entry, 0)
    return issues
