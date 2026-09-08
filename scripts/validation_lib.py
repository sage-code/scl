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

    for entry in data:
        walk(entry, 0)
    return issues
