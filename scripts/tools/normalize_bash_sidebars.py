#!/usr/bin/env python3
"""Normalize Bash track sidebar JSON to start at the h2 level.

Topic sidebars in every other track (e.g. roadmap/csharp/data/*.json) begin at
the first <h2>; the page <h1> is not listed. The Bash sidebars were generated
with a leading h1 entry (link "#bash-<topic>"). This script removes that entry
so the sidebar mirrors the h2/h3 structure, and is idempotent.

Usage:
    python scripts/tools/normalize_bash_sidebars.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "roadmap" / "bash" / "data"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not DATA.is_dir():
        sys.exit(f"ERROR: data directory not found: {DATA}")

    changed = 0
    for path in sorted(DATA.glob("*.json")):
        entries = json.loads(path.read_text(encoding="utf-8-sig"))
        if not isinstance(entries, list) or not entries:
            continue
        first = entries[0]
        if isinstance(first, dict) and str(first.get("link", "")).startswith("#bash-"):
            entries = entries[1:]
            print(f"strip h1 -> {path.name}")
            if not args.dry_run:
                path.write_text(
                    json.dumps(entries, indent=2, ensure_ascii=False) + "\n",
                    encoding="utf-8",
                )
            changed += 1

    print(f"\n{'[dry-run] ' if args.dry_run else ''}{changed} file(s) updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
