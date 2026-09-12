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

# Marker on a LEGACY title node — the un-migrated sidebar shape where the page title
# is a childless leaf sitting above flat `<h2>` chapters. The single-root folder model
# needs no marker: the title IS the only top-level entry and it carries its chapters in
# `children`, so nothing has to be tagged. Kept so the validators can still recognise
# (and flag) the old shape. Mirrored in scripts/tools/gen_topic_sidebars.py, the tool
# that migrates a page out of it.
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
    - The page title is the ROOT FOLDER. Canonical (single-root) shape: every
      top-level entry carries "children", the page `<h1>` is the only such entry,
      and its children are the `<h2>` chapters (each owning its `<h3>` anchors).
      title -> chapter -> sub-section is then three collapsible levels in
      topic-loader.js and build.js. No marker key is involved: a node folds because
      it HAS children.
      A page may declare several `<h1>` roots; each opens its own top-level entry.
      Anything else — a legacy childless `"role": "title"` leaf above flat `<h2>`
      chapters, or a sidebar with no title at all — warns as content debt and is
      migrated by regenerating the sidecar from the page
      (scripts/tools/gen_topic_sidebars.py).
    - Any `"role": "title"` entry must anchor with '#': topic-loader.js only renders
      '#'-anchored nodes, so an unanchored title is dead navigation (fails).
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
        single_root = all(
            isinstance(entry, dict) and entry.get("children") is not None for entry in data
        )
        if not single_root:
            # Two things share this fix: a legacy flat sidebar (childless title leaf,
            # or no title at all) and a sidebar whose title never got a root folder.
            # Either way the repair is to regenerate the sidecar from the page, so its
            # `<h1>` becomes the root folder that contains the chapters.
            issues.append(
                (
                    "warn",
                    f"{rel}: sidebar is not a single-root folder — the page title must be "
                    f"the only top-level entry and carry its chapters in 'children'",
                )
            )
        elif first.get("role") == TITLE_ROLE:
            # Root folder that still carries the legacy marker: legal, but the tag adds
            # nothing now that a node folds because it has children.
            issues.append(
                ("warn", f"{rel}: root folder still carries the legacy 'role': '{TITLE_ROLE}' tag")
            )

    for entry in data:
        walk(entry)
    return issues
