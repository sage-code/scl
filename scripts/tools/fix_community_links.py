#!/usr/bin/env python3
"""Normalize community page links to site-root (absolute) routes.

Why
---
Community pages are published by Vercel with `cleanUrls: true` and
`trailingSlash: true` (see `vercel.json`). A source file such as
`community/vip/elucian.html` is therefore served from the virtual route
`/community/vip/elucian/`, which is one directory level deeper than the file's
own folder in `public/`. Any page-relative link authored as `../...` resolves
one folder too high and 404s in production (missing stylesheets, script
errors, broken member photos and certificate links).

`build.js` keeps root-absolute links intact for `/public/community/**`
(see `shouldRelativizeRootLinks`), so community sources must be authored with
site-root links, exactly like the roadmap and project sources.

Usage
-----
    python scripts/tools/fix_community_links.py            # dry run (diff only)
    python scripts/tools/fix_community_links.py --write     # apply changes

The script is idempotent: running it twice produces no further changes.
"""

from __future__ import annotations

import argparse
import difflib
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
COMMUNITY_DIR = REPO_ROOT / "community"

# Ordered (pattern, replacement) rules applied to every community HTML file.
# Each rule rewrites only the attribute prefix so the remaining path and the
# original quoting style are preserved.
RULES = [
    # ../vip.css -> shared community stylesheet served from the site root.
    (re.compile(r"""(?P<attr>href=)(?P<q>["'])(?:\.\./)+vip\.css(?P=q)"""),
     r"\g<attr>\g<q>/community/vip.css\g<q>"),
    # ../certificate/<file>.jpg -> /community/certificate/<file>.jpg
    (re.compile(r"""(?P<attr>href=)(?P<q>["'])(?:\.\./)+certificate/"""),
     r"\g<attr>\g<q>/community/certificate/"),
    # ../index.html -> the canonical community hub route /community/
    (re.compile(r"""(?P<attr>href=)(?P<q>["'])(?:\.\./)+index\.html(?P=q)"""),
     r"\g<attr>\g<q>/community/\g<q>"),
    # Bare relative favicon path -> shared brand asset under /assets.
    (re.compile(r"""(?P<attr>href=)(?P<q>["'])images/favicon\.ico(?P=q)"""),
     r"\g<attr>\g<q>/assets/images/favicon.ico\g<q>"),
    # Bare relative member photo path -> /community/images/<file>
    (re.compile(r"""(?P<attr>src=)(?P<q>["'])images/(?P<name>[^"']+)(?P=q)"""),
     r"\g<attr>\g<q>/community/images/\g<name>\g<q>"),
    # Legacy absolute CDN references to the old sagecode.org document root.
    (re.compile(r"""https://sagecode\.org/vip\.css"""), "/community/vip.css"),
    (re.compile(r"""https://sagecode\.org/sage\.js"""), "/assets/js/sage.js"),
]


def transform(text: str) -> tuple[str, int]:
    """Return the normalized text and the number of applied replacements."""
    changed = 0
    result = text
    for pattern, replacement in RULES:
        result, count = pattern.subn(replacement, result)
        changed += count
    return result, changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true",
                        help="apply the changes (default: dry run)")
    args = parser.parse_args()

    if not COMMUNITY_DIR.is_dir():
        print(f"community directory not found: {COMMUNITY_DIR}", file=sys.stderr)
        return 1

    sources = sorted(COMMUNITY_DIR.rglob("*.html"))
    touched = 0
    total = 0

    for source in sources:
        original = source.read_text(encoding="utf-8")
        updated, changed = transform(original)
        if not changed:
            continue

        touched += 1
        total += changed
        relative = source.relative_to(REPO_ROOT).as_posix()
        print(f"--- {relative} ({changed} link(s))")

        if args.write:
            source.write_text(updated, encoding="utf-8", newline="\n")
            continue

        diff = difflib.unified_diff(
            original.splitlines(keepends=True),
            updated.splitlines(keepends=True),
            fromfile=f"a/{relative}",
            tofile=f"b/{relative}",
        )
        sys.stdout.writelines(diff)

    action = "updated" if args.write else "would update"
    print(f"\n{action} {touched} file(s), {total} link(s).")
    if not args.write and touched:
        print("dry run only - re-run with --write to apply.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
