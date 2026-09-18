#!/usr/bin/env python3
"""Promote the javascript track's legacy title-h2 to a topic-contract h1.

The 8 kept legacy lesson pages open with `<h2 id="...">Title</h2>` as a pseudo
title and carry no `<h1>` — a page-structure defect under the topic contract
(at least one h1; the sidebar root anchors it). This script promotes the FIRST
`<h2>` inside `<main>` to an `<h1>` (same id, same text) on every page that has
no `<h1>` at all. Dry-run by default; pass --write to apply.
"""
import argparse
import difflib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRACK = ROOT / "roadmap" / "javascript"

H1_RE = re.compile(r"<h1\b", re.I)
MAIN_RE = re.compile(r"(<main\b[^>]*>)(.*?)(</main>)", re.S | re.I)
FIRST_H2 = re.compile(r"<h2(\s+id=\"[^\"]+\")?([^>]*)>(.*?)</h2>", re.S | re.I)


def promote(text: str) -> tuple[str, bool]:
    if H1_RE.search(text):
        return text, False
    match = MAIN_RE.search(text)
    if not match:
        return text, False
    body = match.group(2)
    h2 = FIRST_H2.search(body)
    if not h2:
        return text, False
    new_h2 = f"<h1{h2.group(1) or ''}{h2.group(2)}>{h2.group(3)}</h1>"
    new_body = body[: h2.start()] + new_h2 + body[h2.end():]
    return text[: match.start(2)] + new_body + text[match.end(2):], True


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="apply changes (default: dry-run)")
    args = ap.parse_args()

    changed = 0
    for page in sorted(TRACK.glob("*.html")):
        rel = page.relative_to(ROOT).as_posix()
        original = page.read_text(encoding="utf-8")
        updated, did = promote(original)
        if not did:
            continue
        changed += 1
        if args.write:
            page.write_text(updated, encoding="utf-8", newline="\n")
            print(f"[WRITE] {rel}")
        else:
            print(f"[DRY] {rel}")
            diff = difflib.unified_diff(
                original.splitlines(), updated.splitlines(), fromfile=rel, tofile=rel, lineterm=""
            )
            print("\n".join(list(diff)[:16]))
    print(f"\n{changed} page(s) {'promoted' if args.write else 'would promote'}.")


if __name__ == "__main__":
    main()
