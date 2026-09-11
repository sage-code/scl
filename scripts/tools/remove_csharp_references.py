#!/usr/bin/env python3
"""Remove per-page References sections from the C# roadmap.

References now live only on the track index page (roadmap/csharp/index.html).
This script removes:
  - the <h2 id="references"> ... </main> block from each topic HTML page, and
  - the matching "References" sidebar entry (link == "#references") from each
    roadmap/csharp/data/*.json.

Safe by construction:
  - only <h2 id="references"> is a removal anchor (types.html has an unrelated
    <h3 id="reference"> that is untouched);
  - index.html and demo_examples.html are skipped (no <h2 id="references">).

Run with --dry-run to review the file list before writing.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSHARP = ROOT / "roadmap" / "csharp"
DATA = CSHARP / "data"


def process_html(path: Path, dry: bool) -> bool:
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)

    start = next(
        (i for i, line in enumerate(lines) if '<h2 id="references">' in line),
        None,
    )
    if start is None:
        return False

    end = next(
        (j for j in range(start, len(lines)) if lines[j].strip() == "</main>"),
        None,
    )
    if end is None:
        raise SystemExit(f"error: no </main> found after references in {path}")

    new_lines = lines[:start] + lines[end:]
    if not dry:
        path.write_text("".join(new_lines), encoding="utf-8")
    return True


def process_json(path: Path, dry: bool) -> bool:
    data = json.loads(path.read_text(encoding="utf-8"))
    kept = [
        entry
        for entry in data
        if not (isinstance(entry, dict) and entry.get("link") == "#references")
    ]
    changed = len(kept) != len(data)
    if changed and not dry:
        path.write_text(
            json.dumps(kept, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    return changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="print changes without writing")
    args = parser.parse_args()

    changed: list[str] = []

    for path in sorted(CSHARP.glob("*.html")):
        if path.name == "index.html":
            continue
        if process_html(path, args.dry_run):
            changed.append(path.relative_to(ROOT).as_posix())

    for path in sorted(DATA.glob("*.json")):
        if process_json(path, args.dry_run):
            changed.append(path.relative_to(ROOT).as_posix())

    prefix = "[DRY-RUN] " if args.dry_run else ""
    print(f"{prefix}removed references from {len(changed)} file(s)")
    for name in changed:
        print(" -", name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
