#!/usr/bin/env python3
"""Prepend the page-title link as the FIRST entry of every topic sidebar JSON.

Convention (see manual/ARCHITECTURE.md "Topic sidebar JSON — shape"):
the first sidebar entry is a leaf
{ "title": "<H1 text>", "link": "#<h1-id>", "role": "title" }
pointing at the topic page's <h1>, so the user can always click back to the
top of the lab. The h2/h3 tree keeps two levels only.

Superseded for new work by scripts/tools/gen_topic_sidebars.py, which derives the
whole sidebar (title leaf included) from the page; this script remains only to
retrofit the hand-written C-track data files, whose h1 texts are irregular.

Usage:
  python scripts/tools/add_sidebar_title_entries.py            # dry-run
  python scripts/tools/add_sidebar_title_entries.py --apply    # write files
"""
from __future__ import annotations

import argparse
import difflib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "roadmap" / "c" / "data"

# topic -> (h1-id without '#', H1 text as shown on the page, plain &)
TITLE_ENTRIES: dict[str, tuple[str, str]] = {
    "abi-asm": ("c-abi-asm", "ABI Programming with Assembly"),
    "advanced": ("c-advanced", "Advanced C"),
    "algorithms": ("c-algorithms", "Algorithms"),
    "collections": ("c-collections", "Data Structures"),
    "composite": ("c-composite", "Arrays, Structs, Unions"),
    "control": ("c-control", "Control Flow"),
    "demo_examples": ("c-demo-examples", "C Demo Examples"),
    "directives": ("c-directives", "The Preprocessor"),
    "errors": ("c-errors", "Error Handling & errno"),
    "functions": ("c-functions", "Functions, Scope & Linkage"),
    "gpu": ("c-gpu", "GPU Computing"),
    "input": ("c-input", "Input & Output"),
    "memory": ("c-memory", "Dynamic Memory & Lifetimes"),
    "overview": ("c-overview", "Why C & Thinking in C"),
    "parallel": ("c-parallel", "Parallel & Multicore Processing"),
    "pointers": ("c-pointers", "Pointers & Arrays"),
    "references": ("c-references", "References & Compilers"),
    "samples": ("c-samples", "Study Projects"),
    "setup": ("c-setup", "Toolchain & First Program"),
    "strings": ("c-strings", "Strings"),
    "syntax": ("c-syntax", "Lexical Structure"),
    "types": ("c-types", "Data Types & Conversions"),
}


def detect_eol(text: str) -> str:
    """Return the dominant line ending so formatting is preserved."""
    return "\r\n" if text.count("\r\n") > text.count("\n") // 2 else "\n"


def title_entry(h1_id: str, title: str) -> str:
    return '{ "title": %s, "link": %s, "role": "title" }' % (
        json.dumps(title, ensure_ascii=False),
        json.dumps("#" + h1_id, ensure_ascii=False),
    )


def insert_title(raw: str, h1_id: str, title: str) -> str:
    """Insert the leaf title entry right after the array's opening '['."""
    idx = raw.index("[")
    eol = detect_eol(raw)
    insert = f"{eol}  {title_entry(h1_id, title)},"
    return raw[: idx + 1] + insert + raw[idx + 1 :]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply", action="store_true", help="write files (default: dry-run diff only)"
    )
    args = parser.parse_args()

    if not DATA_DIR.is_dir():
        raise SystemExit(f"data dir not found: {DATA_DIR}")

    changed = skipped = 0
    for topic in sorted(TITLE_ENTRIES):
        h1_id, title = TITLE_ENTRIES[topic]
        path = DATA_DIR / f"{topic}.json"
        if not path.is_file():
            print(f"MISSING {topic}.json")
            continue

        raw = path.read_text(encoding="utf-8")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"INVALID {topic}.json: {e}")
            continue

        first = data[0] if isinstance(data, list) and data else {}
        if first.get("link") == f"#{h1_id}":
            print(f"SKIP   {topic}.json (title entry already present)")
            skipped += 1
            continue

        new_raw = insert_title(raw, h1_id, title)

        # sanity: inserted content must still parse
        try:
            json.loads(new_raw)
        except json.JSONDecodeError as e:
            print(f"BAD-INSERT {topic}.json: {e}")
            raise SystemExit(1)

        if args.apply:
            path.write_text(new_raw, encoding="utf-8", newline="")
            print(f"WROTE  {topic}.json")
        else:
            before = raw.splitlines()
            after = new_raw.splitlines()
            diff = "\n".join(
                difflib.unified_diff(
                    before, after, fromfile=f"{topic}.json (before)",
                    tofile=f"{topic}.json (after)", lineterm="",
                )
            )
            print(f"EDIT   {topic}.json  -> {title} (#{h1_id})")
            print(diff)
        changed += 1

    print(f"\n{changed} file(s) to change, {skipped} already done.")
    if not args.apply:
        print("Dry run only — rerun with --apply to write.")


if __name__ == "__main__":
    main()
