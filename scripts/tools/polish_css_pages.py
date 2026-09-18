#!/usr/bin/env python3
"""Mechanical head normalization for the legacy CSS roadmap pages (roadmap/css).

Fixes, in one deterministic pass:
1. Stray `>` text node inside the Prism script tag:  <script src="/assets/prism.js">></script>
2. Missing content stylesheets: link content-code.css always and content-tables.css
   (the CSS track pages all contain tables), matching assets/topic_template.html.
3. Legacy runtime script path src="/sage.js" -> canonical src="/assets/js/sage.js"
   (build.js rewrites the legacy path, but sources should stay canonical).

Usage:
    python scripts/tools/polish_css_pages.py            # dry run: unified diff to stdout
    python scripts/tools/polish_css_pages.py --apply    # write the changes
"""
from __future__ import annotations

import argparse
import difflib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRACK = ROOT / "roadmap" / "css"

# Legacy pages that still carry the old head boilerplate (index.html included).
PAGES = [
    "index.html",
    "syntax.html",
    "typography.html",
    "box-model.html",
    "responsive.html",
    "animation.html",
    "bootstrap.html",
    "frameworks.html",
    "references.html",
]

PRISM_BAD = '<script src="/assets/prism.js">></script>'
PRISM_GOOD = '<script src="/assets/prism.js"></script>'

# The legacy single-line stylesheet run on every css page.
LINKS_BAD = (
    '<link rel="stylesheet" href="/assets/css/sage-common.css">'
    '  <link rel="stylesheet" href="/assets/css/content-topic.css">'
    '    <link rel="stylesheet" href="/assets/css/content-sidebar.css">'
)
LINKS_GOOD = (
    '<link rel="stylesheet" href="/assets/css/sage-common.css">\n'
    '  <link rel="stylesheet" href="/assets/css/content-topic.css">\n'
    '  <link rel="stylesheet" href="/assets/css/content-sidebar.css">\n'
    '  <link rel="stylesheet" href="/assets/css/content-code.css">\n'
    '  <link rel="stylesheet" href="/assets/css/content-tables.css">'
)

SAGE_BAD = '<script src="/sage.js" defer></script>'
SAGE_GOOD = '<script src="/assets/js/sage.js" defer></script>'


def normalize(text: str) -> tuple[str, list[str]]:
    applied: list[str] = []
    if PRISM_BAD in text:
        text = text.replace(PRISM_BAD, PRISM_GOOD)
        applied.append("prism-script-typo")
    if LINKS_BAD in text:
        text = text.replace(LINKS_BAD, LINKS_GOOD)
        applied.append("content-css-links")
    if SAGE_BAD in text:
        text = text.replace(SAGE_BAD, SAGE_GOOD)
        applied.append("sage-js-path")
    return text, applied


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write changes (default: dry run)")
    args = parser.parse_args()

    failures = 0
    for name in PAGES:
        path = TRACK / name
        if not path.is_file():
            print(f"[SKIP] {name}: not a file")
            failures += 1
            continue
        raw = path.read_bytes()
        bom = b"\xef\xbb\xbf" if raw.startswith(b"\xef\xbb\xbf") else b""
        old_text = raw.decode("utf-8-sig")
        new_text, applied = normalize(old_text)
        if not applied:
            print(f"[OK]   {name}: nothing to fix")
            continue
        if args.apply:
            path.write_bytes(bom + new_text.encode("utf-8"))
            print(f"[FIX]  {name}: {', '.join(applied)}")
        else:
            diff = difflib.unified_diff(
                old_text.splitlines(), new_text.splitlines(),
                fromfile=f"a/roadmap/css/{name}", tofile=f"b/roadmap/css/{name}", lineterm="",
            )
            print("\n".join(diff))
            print(f"[DRY]  {name}: {', '.join(applied)}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
