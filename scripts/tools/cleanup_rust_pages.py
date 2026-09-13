#!/usr/bin/env python3
"""Mechanical cleanup of Rust roadmap topic pages (Sage-Code SCL).

Idempotent fixes applied to every roadmap/rust/*.html topic page:

  1. Repair a malformed Prism script tag:
     <script src="/assets/prism.js">></script>  ->  <script src="/assets/prism.js"></script>
  2. Add the two content CSS bundles the topic template requires
     (content-code.css + content-tables.css) right after content-sidebar.css.
  3. Strip leftover "Page Bookmarks" navigation blocks - the <h4> heading plus
     the following nav/ul/li/hr/blank lines up to the first real heading
     (a pre-sidebar-era manual anchor list).
  4. Strip empty anchors (<a></a> / <a ></a>) left inside headings.

Running twice changes nothing. Pass --dry-run to preview, --apply to write.
"""
import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGES = sorted((ROOT / "roadmap" / "rust").glob("*.html"))

PRISM_BROKEN_RE = re.compile(r'<script src="/assets/prism\.js">></script>')
SIDEBAR_CSS_RE = re.compile(r'(<link rel="stylesheet" href="/assets/css/content-sidebar\.css">)')
EMPTY_ANCHOR_RE = re.compile(r'<a\s*></a>')
BOOKMARK_HEADER = "<h4>Page Bookmarks</h4>"


def is_bookmark_line(line: str) -> bool:
    """True for the tags/whitespace that make up a Page Bookmarks nav block."""
    s = line.strip()
    if not s:
        return True
    return (
        s.startswith("<hr")
        or s.startswith("<li")
        or s.startswith("</li")
        or s.startswith("<nav")
        or s.startswith("</nav")
        or s.startswith("<ul")
        or s.startswith("</ul")
    )


def strip_bookmarks(lines):
    """Remove <h4>Page Bookmarks</h4> and its trailing nav/ul/li/hr block."""
    out = []
    i = 0
    changed = False
    while i < len(lines):
        line = lines[i]
        if BOOKMARK_HEADER in line:
            changed = True
            i += 1
            # consume the trailing nav/ul/li/hr/blank lines until real content
            while i < len(lines) and is_bookmark_line(lines[i]):
                i += 1
            continue
        out.append(line)
        i += 1
    return out, changed


def process(path):
    orig = path.read_text(encoding="utf-8")
    text = orig
    notes = []

    if PRISM_BROKEN_RE.search(text):
        text = PRISM_BROKEN_RE.sub('<script src="/assets/prism.js"></script>', text)
        notes.append("fixed malformed prism script tag")

    if SIDEBAR_CSS_RE.search(text):
        text = SIDEBAR_CSS_RE.sub(
            r'\1\n  <link rel="stylesheet" href="/assets/css/content-code.css">\n'
            r'  <link rel="stylesheet" href="/assets/css/content-tables.css">',
            text,
        )
        notes.append("added content-code.css + content-tables.css")

    empty_count = len(EMPTY_ANCHOR_RE.findall(text))
    if empty_count:
        text = EMPTY_ANCHOR_RE.sub("", text)
        notes.append(f"removed {empty_count} empty anchor(s)")

    lines = text.splitlines(keepends=True)
    lines, bm = strip_bookmarks(lines)
    if bm:
        notes.append("removed Page Bookmarks nav block")
    text = "".join(lines)

    return orig, text, notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="preview only, no writes")
    ap.add_argument("--apply", action="store_true", help="write changes to disk")
    args = ap.parse_args()
    if args.dry_run == args.apply:  # both or neither
        ap.error("pass exactly one of --dry-run or --apply")

    changed = 0
    for path in PAGES:
        orig, text, notes = process(path)
        if orig == text:
            continue
        changed += 1
        action = "[DRY ]" if args.dry_run else "[OK  ]"
        print(f"{action} {path.name}: " + "; ".join(notes))
        if args.apply:
            path.write_text(text, encoding="utf-8")

    label = "dry-run (no writes)" if args.dry_run else "applied"
    print(f"\n{label}: {changed} file(s) changed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
