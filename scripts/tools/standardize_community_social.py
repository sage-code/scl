#!/usr/bin/env python
"""Standardize the community section on Bootstrap 5 social links.

The community pages grew from a MDB / Bootstrap 4 template, so they still
carry ``data-toggle`` / ``data-placement`` attributes (Bootstrap 5 renamed
these to ``data-bs-*``), the MDB-only ``.flex-center`` utility and a stale
Bootstrap Icons build that has no ``bi-twitter-x`` glyph.

This tool applies two deterministic rules to the community HTML sources:

Rule A - icon library
    Pin the Bootstrap Icons CDN to the version already used by
    ``community/index.html`` and ``index.html`` (1.13.1).  The old 1.10.5
    build predates the ``bi-twitter-x`` (v1.11.0) and ``bi-bluesky``
    (v1.12.0) brand icons, so those glyphs silently rendered as nothing.

Rule B - social block markup
    Replace the legacy ``text-center > row > col-md-12 > flex-center``
    block with the flat Bootstrap 5 pattern used by ``community/index.html``
    and ``community/vip/elucian.html``::

        <div class="d-flex justify-content-center gap-3 mb-5">
          <a href="..." class="btn btn-outline-secondary social-btn"
             data-bs-toggle="tooltip" data-bs-placement="top"
             title="Name on Network" aria-label="Name on Network"
             target="_blank" rel="noopener noreferrer nofollow">
            <i class="bi bi-linkedin" aria-hidden="true"></i>
          </a>
        </div>

    Every ``href`` found in the old block is preserved verbatim - only the
    surrounding markup is normalized - and ``bi-twitter`` becomes the
    official ``bi-twitter-x`` glyph for the same X (Twitter) link.

The tool is idempotent and dry-run by default.  Run with ``--write`` to
apply.  A unified diff of every pending change is printed and saved to
``.temp/social-block-diff.txt``.

Usage::

    python scripts/tools/standardize_community_social.py            # dry run
    python scripts/tools/standardize_community_social.py --write    # apply
"""

from __future__ import annotations

import argparse
import os
import re
import sys

# --- Rule A: icon library -------------------------------------------------

#: Bootstrap Icons CDN builds that predate the current standard.  The 1.10.5
#: build is the one the VIP template was authored against and 1.11.3 is the
#: older repository-wide default; both lack brand glyphs added later
#: (``bi-twitter-x`` needs >= 1.11.0, ``bi-bluesky`` needs >= 1.12.0).
ICONS_LEGACY = (
    "bootstrap-icons@1.10.5/font/bootstrap-icons.css",
    "bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
)

#: Target build: the newest version used anywhere in the site, so every
#: community page - index and member profiles alike - loads the same glyphs.
ICONS_TO = "bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"

# --- Rule B: social blocks ------------------------------------------------

#: Legacy block: the MDB row/column scaffold that wraps the social anchors.
LEGACY_BLOCK = re.compile(
    r'<div class="text-center">\s*<!-- Grid row-->.*?<!-- Grid column -->\s*</div>\s*</div>',
    re.S,
)

#: ``href`` + glyph pairs inside a legacy block.  ``re.S`` lets the pattern
#: span the newlines that separate the anchor, its attributes and the glyph.
LEGACY_LINK = re.compile(
    r'<a\s+href="([^"]+)"[^>]*>\s*<i class="bi bi-([a-z0-9-]+)"></i>',
    re.S,
)

#: Legacy glyph -> current glyph.  Bootstrap Icons 1.11.0 renamed the brand
#: glyph after the X rebrand; ``twitter`` is a deprecated alias.
GLYPH_MAP = {"twitter": "twitter-x"}

#: Glyph -> human readable network name, used for title/aria-label.
NETWORK_NAME = {
    "linkedin": "LinkedIn",
    "twitter-x": "X",
    "github": "GitHub",
    "reddit": "Reddit",
    "bluesky": "Bluesky",
    "twitch": "Twitch",
    "discord": "Discord",
    "gitlab": "GitLab",
}

#: Files owning a legacy block -> display name used in title/aria-label.
#: The name is the person the page is about (``h1`` of the page).
SOCIAL_PAGES = {
    "community/template.html": "Elucian",
    "community/vip/cmoise.html": "Claudiu",
    "community/vip/george.html": "George",
    "community/vip/gmoise.html": "Georgiana",
    "community/vip/laura.html": "Marina",
    "community/vip/liviu.html": "Liviu",
}

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COMMUNITY_DIR = os.path.join(REPO_ROOT, "community")
DIFF_REPORT = os.path.join(REPO_ROOT, ".temp", "social-block-diff.txt")


def find_community_html() -> list[str]:
    """Return every HTML file under ``community/`` as repo-relative paths."""
    found: list[str] = []
    for dirpath, _dirnames, filenames in os.walk(COMMUNITY_DIR):
        for name in sorted(filenames):
            if name.endswith(".html"):
                path = os.path.join(dirpath, name)
                found.append(os.path.relpath(path, REPO_ROOT).replace("\\", "/"))
    return sorted(found)


def read_text(path: str) -> str:
    """Read a source file preserving its original line endings."""
    with open(path, "r", encoding="utf-8", newline="") as handle:
        return handle.read()


def detect_newline(text: str) -> str:
    """Return the line separator to use for new content (CRLF when present)."""
    return "\r\n" if "\r\n" in text else "\n"


def bump_icons(text: str) -> tuple[str, bool]:
    """Rule A on a single file. Returns the text and whether it changed."""
    changed = False
    for legacy in ICONS_LEGACY:
        if legacy != ICONS_TO and legacy in text:
            text = text.replace(legacy, ICONS_TO)
            changed = True
    return text, changed


def build_block(links: list[tuple[str, str]], who: str, newline: str) -> str:
    """Render the standard Bootstrap 5 social block.

    ``links`` is the ordered list of ``(href, glyph)`` pairs recovered from
    the legacy block, so no link is ever invented or dropped.
    """
    lines = ['<div class="d-flex justify-content-center gap-3 mb-5">']
    for href, glyph in links:
        network = NETWORK_NAME.get(glyph, glyph.title())
        label = f"{who} on {network}"
        lines.append(f"  <!-- {network} -->")
        lines.append(f'  <a href="{href}" class="btn btn-outline-secondary social-btn"')
        lines.append('     data-bs-toggle="tooltip" data-bs-placement="top"')
        lines.append(f'     title="{label}" aria-label="{label}"')
        lines.append('     target="_blank" rel="noopener noreferrer nofollow">')
        lines.append(f'    <i class="bi bi-{glyph}" aria-hidden="true"></i>')
        lines.append("  </a>")
    lines.append("</div>")
    return newline.join(lines)


def rewrite_social_block(rel: str, text: str) -> tuple[str, int]:
    """Rule B on a single file. Returns the text and the number of changes."""
    who = SOCIAL_PAGES[rel]
    matches = list(LEGACY_BLOCK.finditer(text))
    if not matches:
        return text, 0

    newline = detect_newline(text)
    for match in reversed(matches):  # right to left keeps offsets valid
        links = [
            (href, GLYPH_MAP.get(glyph, glyph))
            for href, glyph in LEGACY_LINK.findall(match.group(0))
        ]
        if not links:
            print(f"  SKIP {rel}: legacy block found but no links parsed", file=sys.stderr)
            continue
        block = build_block(links, who, newline)
        text = text[: match.start()] + block + text[match.end():]
    return text, len(matches)


def unified_diff(rel: str, before: str, after: str) -> str:
    """Produce a readable unified diff for one file."""
    import difflib

    return "".join(
        difflib.unified_diff(
            before.splitlines(keepends=True),
            after.splitlines(keepends=True),
            fromfile=f"a/{rel}",
            tofile=f"b/{rel}",
        )
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--write", action="store_true", help="apply the changes")
    args = parser.parse_args()

    pending: list[tuple[str, str, str]] = []

    for rel in find_community_html():
        path = os.path.join(REPO_ROOT, rel)
        original = read_text(path)
        text, icons_changed = bump_icons(original)

        if rel in SOCIAL_PAGES:
            text, blocks = rewrite_social_block(rel, text)
            if blocks:
                print(f"  block  {rel} ({blocks} legacy block)")

        if text != original:
            pending.append((rel, original, text))
            if icons_changed:
                print(f"  icons  {rel}")

    if not pending:
        print("Nothing to do: community pages already standardized.")
        return 0

    diff = "".join(unified_diff(rel, before, after) for rel, before, after in pending)
    os.makedirs(os.path.dirname(DIFF_REPORT), exist_ok=True)
    with open(DIFF_REPORT, "w", encoding="utf-8", newline="") as handle:
        handle.write(diff)
    print(diff)
    print(f"diff saved to {os.path.relpath(DIFF_REPORT, REPO_ROOT)}")

    if not args.write:
        print(f"dry run: {len(pending)} file(s) would change (use --write)")
        return 0

    for rel, _before, after in pending:
        path = os.path.join(REPO_ROOT, rel)
        with open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(after)
    print(f"wrote {len(pending)} file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
