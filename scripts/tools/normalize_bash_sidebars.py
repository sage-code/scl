#!/usr/bin/env python3
"""OBSOLETE — do not run. It removes the page-title root the template requires.

Historical context: this script was written when sidebars were expected to start at
the first <h2>, so it STRIPPED a leading `<h1>` entry (link "#bash-<topic>") from the
Bash sidecars. The template has since flipped: the page title IS the root folder
(manual/ARCHITECTURE.md §"Topic sidebar JSON — template", scaffold
`assets/topic_sidebar_template.json`). Running this script now deletes exactly the
node the contract requires, so it refuses to act unless the obsolete flag is passed.

Use instead:
    python scripts/tools/migrate_sidebars.py --track <track> [--dry-run]
    python scripts/tools/verify_sidebars.py <track>

Usage:
    python scripts/tools/normalize_bash_sidebars.py --apply-obsolete --dry-run   # refuse-by-default escape hatch
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
    ap.add_argument("--apply-obsolete", action="store_true",
                    help="run the obsolete strip anyway (it removes the required title root)")
    args = ap.parse_args()

    if not args.apply_obsolete:
        print("OBSOLETE TOOL: it strips the page-title root the template requires.\n"
              "Use scripts/tools/migrate_sidebars.py (convert) or "
              "scripts/tools/gen_topic_sidebars.py (author) instead.")
        return 2

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
