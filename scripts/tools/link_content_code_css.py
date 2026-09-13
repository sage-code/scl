#!/usr/bin/env python3
"""Link the shared code-highlight stylesheet into project topic pages.

The Bee and Eve projects ship a custom, non-Prism syntax highlighter
(``projects/<name>/js/*.js``) that emits token spans such as
``<span class="keyword">``.  The colors for those tokens live in
``assets/css/content-code.css``.  Project topic pages currently load
``content-topic.css`` and ``content-sidebar.css`` but omit
``content-code.css``, so the emitted tokens render uncolored.

This tool inserts the missing ``content-code.css`` link immediately before
the existing ``content-sidebar.css`` link on every qualifying page.  It is
idempotent: pages that already link the stylesheet are skipped.

Usage:
    python scripts/tools/link_content_code_css.py --project bee --dry-run
    python scripts/tools/link_content_code_css.py --project bee --project eve
"""

from __future__ import annotations

import argparse
import difflib
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
PROJECTS_DIR = REPO_ROOT / "projects"

SIDEBAR_LINK = '<link rel="stylesheet" href="/assets/css/content-sidebar.css">'
CODE_LINK = '<link rel="stylesheet" href="/assets/css/content-code.css">'
# Keep the same visual spacing the pages already use between links.
CODE_THEN_SIDEBAR = CODE_LINK + "    " + SIDEBAR_LINK


def build_replacement(text: str) -> tuple[str, int]:
    """Return (new_text, number_of_links_inserted)."""
    if CODE_LINK in text:
        return text, 0
    if SIDEBAR_LINK not in text:
        return text, 0
    return text.replace(SIDEBAR_LINK, CODE_THEN_SIDEBAR, 1), 1


def unified_diff(path: Path, old: str, new: str) -> str:
    return "".join(
        difflib.unified_diff(
            old.splitlines(keepends=True),
            new.splitlines(keepends=True),
            fromfile=str(path),
            tofile=str(path),
        )
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--project",
        action="append",
        required=True,
        help="Project folder under projects/ (repeatable).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the diff without writing any file.",
    )
    args = parser.parse_args()

    changed: list[str] = []
    skipped: list[str] = []
    missing: list[str] = []
    total_pages = 0

    for project in args.project:
        project_dir = PROJECTS_DIR / project
        if not project_dir.is_dir():
            missing.append(str(project_dir))
            continue
        for page in sorted(project_dir.glob("*.html")):
            total_pages += 1
            original = page.read_text(encoding="utf-8")
            updated, inserted = build_replacement(original)
            if inserted == 0:
                skipped.append(str(page.relative_to(REPO_ROOT)))
                continue
            diff = unified_diff(page, original, updated)
            sys.stdout.write(diff)
            changed.append(str(page.relative_to(REPO_ROOT)))
            if not args.dry_run:
                page.write_text(updated, encoding="utf-8")

    mode = "DRY-RUN" if args.dry_run else "APPLIED"
    print(f"\n[{mode}] pages scanned: {total_pages}")
    print(f"[{mode}] pages updated: {len(changed)}")
    for item in changed:
        print(f"  + {item}")
    print(f"[{mode}] pages skipped (already linked or no sidebar link): {len(skipped)}")
    for item in skipped:
        print(f"  - {item}")
    for item in missing:
        print(f"  ! project not found: {item}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
