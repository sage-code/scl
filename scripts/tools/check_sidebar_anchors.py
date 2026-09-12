#!/usr/bin/env python3
"""Verify that every roadmap sidebar anchor resolves to a heading id in its page.

A sidebar (`roadmap/<track>/data/<topic>.json`) drives `assets/js/topic-loader.js`,
which scrolls to `#anchor` links. A typo — or a heading renamed after the JSON was
generated — produces a sidebar entry that silently does nothing. This tool
cross-checks the two sources so the drift is caught before the build.

Usage:
    python scripts/tools/check_sidebar_anchors.py                # whole roadmap
    python scripts/tools/check_sidebar_anchors.py roadmap/swift  # one track
Exit code is 1 when any anchor is unresolved.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ID_RE = re.compile(r"""\bid\s*=\s*["']([^"']+)["']""")


def page_ids(path: Path) -> set[str]:
    return set(ID_RE.findall(path.read_text(encoding="utf-8", errors="ignore")))


def collect_links(data, found: list[str]) -> None:
    """Sidebar JSON is either a flat list or a list of {title,children} chapters."""
    for entry in data:
        if not isinstance(entry, dict):
            continue
        link = entry.get("link")
        if isinstance(link, str) and link.startswith("#"):
            found.append(link)
        children = entry.get("children")
        if isinstance(children, list):
            collect_links(children, found)


def main() -> int:
    scope = sys.argv[1] if len(sys.argv) > 1 else "roadmap"
    base = ROOT / scope
    missing_data = 0
    checked = skipped = 0
    problems: list[str] = []

    for page in sorted(list(base.glob("*.html")) + list(base.glob("*/*.html"))):
        if page.name == "index.html":
            continue
        sidebar = page.parent / "data" / f"{page.stem}.json"
        if not sidebar.exists():
            missing_data += 1
            continue
        try:
            data = json.loads(sidebar.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            problems.append(f"{sidebar.relative_to(ROOT).as_posix()}: invalid JSON - {exc}")
            continue

        links: list[str] = []
        collect_links(data, links)
        if not links:
            skipped += 1
            continue

        ids = page_ids(page)
        checked += len(links)
        for link in links:
            if link.lstrip("#") not in ids:
                problems.append(
                    f"{page.relative_to(ROOT).as_posix()}: sidebar link '{link}' has no matching id"
                )

    print(f"Checked {checked} sidebar anchor(s) across {scope}; "
          f"{missing_data} page(s) without a sidebar, {skipped} without anchors.")
    if problems:
        for problem in problems:
            print("[FAIL]", problem)
        print(f"\n{len(problems)} unresolved anchor(s).")
        return 1
    print("All sidebar anchors resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
