#!/usr/bin/env python3
"""Promote the leading chapter heading of Java topic pages to a page title.

`manual/ARCHITECTURE.md` §"Topic page contract" requires every topic page to
declare at least one `<h1>`: that heading is the root of the sidebar tree, and
`scripts/tools/migrate_sidebars.py` reports a page without an anchorable `<h1>`
as BLOCKED because the repair is a page edit, not a JSON edit.

In the Java track a group of older pages opens straight into their first
chapter, which was written as the page title anyway (`<h2 id="java-arrays">Java
Arrays</h2>`). Promoting that one heading fixes the contract, keeps the anchor
id — so no existing link breaks — and leaves the remaining chapters untouched.

Only the FIRST `<h2>` inside `<main>` is considered, and only when the page
declares at least two of them (promoting the only chapter would leave the page
with no `<h2>` at all, which the same contract requires). Pages that fail the
check are reported and skipped; they need content, not a tag change.

Deterministic and idempotent: a page that already has an `<h1>` is skipped.

Usage:
    python scripts/tools/promote_java_titles.py --dry-run
    python scripts/tools/promote_java_titles.py --apply
"""
import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
TRACK = REPO / "roadmap" / "java"

# page -> the id the leading chapter is expected to carry (a safety check, so a
# page that was edited by hand is reported instead of silently rewritten).
PAGES = {
    "annotations.html": "java-annotations",
    "arrays.html": "java-arrays",
    "collections.html": "java-collections",
    "inference.html": "type-inference",
    "lambda.html": "lambda-expressions",
    "objects.html": "java-objects",
    "packages.html": "java-packages",
    "performance.html": "performance-computing",
    "regex.html": "regular-expressions",
    "sealed.html": "sealed-classes",
    "switch.html": "switch-expressions",
}

MAIN_RE = re.compile(r"<main\b[^>]*>", re.IGNORECASE)
H1_RE = re.compile(r"<h1\b", re.IGNORECASE)
H2_RE = re.compile(r"<h2\b", re.IGNORECASE)
LEADING_H2_RE = re.compile(r"<h2(\b[^>]*?)>", re.IGNORECASE)

# A promoted heading whose closing tag was left behind. The opening tag is the
# revision this script makes, so repairing the closer keeps it idempotent even
# if an earlier run was interrupted between the two writes.
MISMATCH_RE = re.compile(r"(<h1\b[^>]*>[^<]*)</h2>", re.IGNORECASE)


def promote(text: str, expected_id: str):
    """Return (new_text, reason, offset). reason is None when nothing changed."""
    repaired, count = MISMATCH_RE.subn(r"\1</h1>", text)
    if count:
        return repaired, None, repaired.find("<h1")
    text = repaired
    start = MAIN_RE.search(text)
    if not start:
        return text, "no <main> element", -1
    head, tail = text[:start.end()], text[start.end():]

    if H1_RE.search(head + tail.split("<h2", 1)[0]):
        return text, "already has an <h1> before the first chapter", -1

    h2s = H2_RE.findall(tail)
    if len(h2s) < 2:
        return text, f"only {len(h2s)} <h2> chapter(s) — the page needs content first", -1

    match = LEADING_H2_RE.search(tail)
    if not match or expected_id not in match.group(1):
        return text, f"leading chapter is not id=\"{expected_id}\"", -1

    offset = start.end() + match.start()
    return head + tail[:match.start()] + "<h1" + match.group(1) + ">" \
        + tail[match.end():], None, offset


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true", help="print the plan, change nothing")
    group.add_argument("--apply", action="store_true", help="rewrite the pages")
    args = parser.parse_args()

    planned = []
    problems = 0

    for name, expected_id in sorted(PAGES.items()):
        path = TRACK / name
        if not path.exists():
            print(f"[FAIL] missing page: {name}", file=sys.stderr)
            problems += 1
            continue
        text = path.read_text(encoding="utf-8")
        new_text, reason, offset = promote(text, expected_id)
        if reason:
            print(f"[SKIP] {name:20s} {reason}")
            continue
        line = text.count("\n", 0, offset) + 1
        action = "repair closing tag" if "<h1" in text else "promote <h2"
        print(f"[PLAN] {name:20s} {action} -> <h1> (line {line})")
        planned.append((path, new_text))

    print(f"\n{len(planned)} page(s) planned, {problems} problem(s)")
    if args.dry_run or problems:
        if problems:
            return 1
        print("dry run: nothing written")
        return 0

    for path, new_text in planned:
        path.write_text(new_text, encoding="utf-8")
    print(f"applied {len(planned)} page(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
