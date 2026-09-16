#!/usr/bin/env python3
"""Rename the Verified Contributor Program route from `vip` to `vcp`.

Why
---
The program is named "Verified Contributor Program", so its acronym is VCP.
The published route, the shared stylesheet name and the source folder were
still carrying the legacy `vip` token. This script renames every identifier
that belongs to *this* program:

    community/vip/       -> community/vcp/
    community/vip.css    -> community/vcp.css
    /community/vip/<m>   -> /community/vcp/<m>

The folders themselves are moved with `git mv` (separate step, keeps history);
this script rewrites the text references inside the tracked sources.

What is deliberately NOT renamed
--------------------------------
`assets/js/sage.js` uses `savecode.vip` and `vip.sagecode.org`. Those are
hostnames of a *different* external site, not this program's route: rewriting
them would break the cross-domain breadcrumb logic. The file is deny-listed,
and `PROTECTED` asserts the two hostnames never change.

Usage
-----
    python scripts/tools/rename_vip_to_vcp.py           # dry run (unified diff)
    python scripts/tools/rename_vip_to_vcp.py --write   # apply changes

The script is idempotent: a second run reports "would update 0 file(s)".
"""

from __future__ import annotations

import argparse
import difflib
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

# Only text sources can carry the token. A handful of image files happen to
# contain the byte sequence "vip" (compressed data, not text), so the walk is
# restricted by suffix and every other file type is never opened.
TEXT_SUFFIXES = (
    ".html", ".htm", ".css", ".js", ".mjs", ".json",
    ".py", ".md", ".xml", ".txt", ".sh", ".yml", ".yaml",
)

# Files whose "vip" must survive on purpose:
#   assets/js/sage.js              - savecode.vip / vip.sagecode.org hostnames
#                                    of an external site (see docstring).
#   scripts/tools/fix_community_links.py
#                                  - its RULES match the *legacy* authored links
#                                    (`../vip.css`, `/community/vip/...`) so old
#                                    pages can still be repaired; only the
#                                    replacement side carries the new route.
#   vercel.json                    - `redirects` sources must keep the old URL
#                                    so the 301 to /community/vcp/ keeps working.
# These three are hand-maintained; a new file is renamed automatically because
# it is not listed here.
DENY = {
    "assets/js/sage.js",
    "scripts/tools/fix_community_links.py",
    "vercel.json",
}

# Ordered (old, new) literal replacements.
RULES = (
    # Routes, folder names, stylesheet file name, path comments.
    ("community/vip", "community/vcp"),
    # community/README.md structure bullet: `vip/*.html`
    ("`vip/", "`vcp/"),
    # standardize_community_social.py narrates the profile template.
    ("VIP template", "VCP template"),
)

# Hostnames that must survive byte-identical or the rename broke a live site.
PROTECTED = ("savecode.vip", "vip.sagecode.org")


def tracked_text_files() -> list[str]:
    """Return repo-relative paths of tracked text files that may carry the token."""
    raw = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
    ).stdout
    paths = [p for p in raw.decode("utf-8").split("\0") if p]
    return [
        p for p in paths
        if p.lower().endswith(TEXT_SUFFIXES) and p not in DENY
    ]


def transform(text: str) -> tuple[str, int]:
    """Return the renamed text and the number of applied replacements."""
    changed = 0
    for old, new in RULES:
        changed += text.count(old)
        text = text.replace(old, new)
    return text, changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true",
                        help="apply the changes (default: dry run)")
    args = parser.parse_args()

    touched = 0
    total = 0

    for relative in tracked_text_files():
        path = REPO_ROOT / relative
        try:
            original = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            # Unreadable or not really text: leave it alone.
            continue

        updated, changed = transform(original)
        if not changed:
            continue

        # Guard: a rule must never touch a protected external hostname.
        for token in PROTECTED:
            if original.count(token) != updated.count(token):
                print(f"ABORT: rule would alter protected token {token!r} "
                      f"in {relative}", file=sys.stderr)
                return 2

        touched += 1
        total += changed
        print(f"--- {relative} ({changed} occurrence(s))")

        if args.write:
            path.write_text(updated, encoding="utf-8", newline="\n")
            continue

        sys.stdout.writelines(difflib.unified_diff(
            original.splitlines(keepends=True),
            updated.splitlines(keepends=True),
            fromfile=f"a/{relative}",
            tofile=f"b/{relative}",
        ))

    action = "updated" if args.write else "would update"
    print(f"\n{action} {touched} file(s), {total} occurrence(s).")
    if not args.write and touched:
        print("dry run only - re-run with --write to apply.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
