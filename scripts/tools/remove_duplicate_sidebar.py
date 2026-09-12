#!/usr/bin/env python3
"""Remove a duplicated (empty) topic sidebar block from Rust roadmap pages.

Each affected page contains the real page wrapper:

    <div class="container-fluid px-0">
      <div class="row g-0">
        <aside class="side-bar ..."> ... Lab Topics ... </aside>
        <main id="main-content" ...>
          <div class="container-fluid px-0">     <- duplicate begins here
            <div class="row g-0">
              <aside class="side-bar ..."> ... Lab Topics ... </aside>
              <main id="main-content" ...>       <- duplicate ends here
          ... page content ...

The duplicate wrapper + sidebar + main make "Lab Topics" render twice and
leave two unbalanced </div> tags. This script deletes the inner duplicate
block (from its <div class="container-fluid px-0"> line through its
<main id="main-content" ...> line), leaving one balanced layout.

Usage:
    python scripts/tools/remove_duplicate_sidebar.py              # dry-run (diff only)
    python scripts/tools/remove_duplicate_sidebar.py --apply      # write changes
    python scripts/tools/remove_duplicate_sidebar.py FILE [FILE]  # explicit files
"""
from __future__ import annotations

import difflib
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_GLOB = "roadmap/rust/*.html"

WRAP = '<div class="container-fluid px-0">'
ROW = '<div class="row g-0">'
ASIDE = '<aside class="side-bar'
ASIDE_END = "</aside>"
MAIN = '<main id="main-content"'


def find_indices(lines: list[str], needle: str) -> list[int]:
    return [i for i, line in enumerate(lines) if needle in line]


def fix_text(text: str) -> tuple[str, bool]:
    """Return (new_text, changed) with the duplicate block removed."""
    lines = text.splitlines(keepends=True)

    mains = find_indices(lines, MAIN)
    if len(mains) != 2:
        raise ValueError(
            f"expected exactly 2 '{MAIN}' markers, found {len(mains)}"
        )
    outer_main, inner_main = mains

    wraps = find_indices(lines, WRAP)
    # The duplicate wrapper is the first one that opens inside the outer main.
    dup_start_candidates = [i for i in wraps if i > outer_main]
    if not dup_start_candidates:
        raise ValueError("duplicate wrapper '<div class=\"container-fluid px-0\">' not found")
    start = dup_start_candidates[0]

    # Validate the duplicate block has the expected contiguous shape.
    if ROW not in lines[start + 1]:
        raise ValueError(f"line {start + 2} is not the duplicate '{ROW}'")
    if ASIDE not in lines[start + 2]:
        raise ValueError(f"line {start + 3} is not the duplicate sidebar aside")
    if ASIDE_END not in lines[inner_main - 2]:
        raise ValueError(f"line {inner_main - 1} is not the duplicate '{ASIDE_END}'")
    if lines[inner_main - 1].strip() != "":
        raise ValueError(f"line {inner_main} should be blank before the duplicate main")

    del lines[start : inner_main + 1]
    return "".join(lines), True


def main(argv: list[str]) -> int:
    apply_changes = "--apply" in argv
    files = [a for a in argv if not a.startswith("--")]

    if files:
        targets = [Path(f) if Path(f).is_absolute() else REPO_ROOT / f for f in files]
    else:
        targets = sorted(REPO_ROOT.glob(DEFAULT_GLOB))

    if not targets:
        print("No files matched.", file=sys.stderr)
        return 1

    changed = 0
    for path in targets:
        raw = path.read_text(encoding="utf-8", newline="")
        try:
            new_text, did_change = fix_text(raw)
        except ValueError as exc:
            print(f"SKIP {path.relative_to(REPO_ROOT)}: {exc}", file=sys.stderr)
            continue
        if not did_change:
            print(f"OK   {path.relative_to(REPO_ROOT)}: nothing to do")
            continue

        changed += 1
        rel = path.relative_to(REPO_ROOT)
        if apply_changes:
            path.write_text(new_text, encoding="utf-8", newline="")
            print(f"FIX  {rel}: duplicate sidebar block removed")
        else:
            print(f"DRY  {rel}: duplicate sidebar block would be removed")
            diff = difflib.unified_diff(
                raw.splitlines(keepends=True),
                new_text.splitlines(keepends=True),
                fromfile=f"a/{rel}",
                tofile=f"b/{rel}",
            )
            sys.stdout.writelines(diff)

    verb = "fixed" if apply_changes else "to fix"
    print(f"\n{changed} file(s) {verb}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
