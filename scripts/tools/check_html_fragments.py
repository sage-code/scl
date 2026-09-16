#!/usr/bin/env python3
"""Balance and escaping audit for HTML pages and authoring fragments.

Why this tool exists: a naive open/close tag tally false-fails on real content.
Example code inside <pre>/<code> legitimately contains "<", ">", "&" and even a
literal closing tag as language punctuation (C++ templates, Fortran relational
operators, shell redirection, a didactic sample that quotes `</code>`), and the
tally reads all of it as markup. Meanwhile the failures worth catching slip past:
an unclosed <pre> that swallows the rest of a chapter, or a "<" that the browser
parses as a bogus tag and drops.

What it does instead (implementation: `html_markup_issues` in
scripts/validation_lib.py):
- walks code-bearing regions (<pre>, <code>, <script>, <style>, <textarea>) with a
  stack, matching them the way a browser tokenizer does — a literal closer in a
  sample stays content, a crossed pair closes the inner region first;
- blanks the CONTENT of those regions while preserving every byte offset and
  newline, so line/column numbers stay exact;
- runs html.parser over the masked document for real structure, treating as a
  warning (never a failure) anything a browser auto-closes: <li>, <p>, <td>, ...;
- audits escaping in two passes, because masking hides the case worth catching:
  on the ORIGINAL text inside code regions an unescaped '<' is a failure
  (`if (i<n)`, `vector<int>`, `$<$<CONFIG:Debug>:-g>`), while intentional markup
  there (`<span class="hljs-keyword">`, `<sup>2</sup>`) is recognised as markup;
  on the masked text `&name` without its ';' and unknown entities (`&code;`) fail,
  and '&' followed by a space is left alone because HTML5 requires no escaping
  there — flagging it would only bury the real findings under page titles.

Usage:
    python scripts/tools/check_html_fragments.py .temp/fortran_pages/*.html
    python scripts/tools/check_html_fragments.py roadmap/fortran
    python scripts/tools/check_html_fragments.py --strict roadmap swift
Exit code is 1 when any FAIL is reported (any WARN too, with --strict).
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

from validation_lib import html_markup_issues, read_text  # noqa: E402

# Findings quote authored content, and a Windows console defaults to cp1252: without
# this, printing a page that contains a typographic character would crash the run.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def collect(targets: list[str]) -> list[Path]:
    """Expand files and directories (recursively) into a sorted list of pages."""
    pages: list[Path] = []
    for target in targets:
        path = (ROOT / target) if not Path(target).is_absolute() else Path(target)
        if path.is_dir():
            pages.extend(p for p in path.rglob("*.html") if "public" not in p.parts)
        elif path.exists():
            pages.append(path)
        else:
            print(f"[WARN] no such path: {target}")
    return sorted(dict.fromkeys(pages))


def main(argv: list[str]) -> int:
    if "-h" in argv or "--help" in argv:
        print(__doc__)
        return 0
    strict = "--strict" in argv
    list_only = "--list" in argv
    targets = [a for a in argv if not a.startswith("-")]
    if not targets:
        targets = ["roadmap", "projects", "community", "assets", "layouts"]

    pages = collect(targets)
    failed = warned = 0
    for page in pages:
        rel = page.relative_to(ROOT).as_posix() if page.is_relative_to(ROOT) else str(page)
        issues = html_markup_issues(read_text(page), rel)
        fails = [m for lvl, m in issues if lvl == "fail"]
        warns = [m for lvl, m in issues if lvl == "warn"]
        failed += len(fails)
        warned += len(warns)
        if fails or warns:
            print(f"{rel}: {len(fails)} fail, {len(warns)} warn")
            for message in fails:
                print(f"  [FAIL] {message}")
            for message in warns:
                print(f"  [WARN] {message}")
            if any("is never closed" in m for m in fails) and any(
                "inside a code sample" in m for m in fails
            ):
                print(
                    "  [HINT] An unclosed code region swallows everything after it; fix "
                    "it first, then re-run - later findings may be collateral."
                )
        elif list_only:
            continue
        else:
            print(f"{rel}: clean")

    print(f"\n{len(pages)} file(s): {failed} fail, {warned} warn")
    return 1 if failed or (strict and warned) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
