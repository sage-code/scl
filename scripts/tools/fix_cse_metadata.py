#!/usr/bin/env python3
"""Deterministic metadata, external-link security, and table-CSS fixer for roadmap/cse/*.html."""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

CSE_DIR = Path("roadmap/cse")
BASE_URL = "https://sagecode.org/roadmap/cse"


def canonical_url_for(filename: str) -> str:
    if filename == "index.html":
        return f"{BASE_URL}/"
    return f"{BASE_URL}/{filename}"


def fix_canonical_and_og(text: str, filename: str) -> tuple[str, int]:
    target = canonical_url_for(filename)
    changes = 0

    def repl_attr(pattern: str, src: str) -> tuple[str, int]:
        count = 0

        def _sub(m: re.Match[str]) -> str:
            nonlocal count
            if m.group(2) != target:
                count += 1
                return f"{m.group(1)}{target}{m.group(3)}"
            return m.group(0)

        out = re.sub(pattern, _sub, src, flags=re.IGNORECASE)
        return out, count

    text, c1 = repl_attr(
        r'(<link\s+rel=["\']canonical["\'][^>]*\bhref=["\'])([^"\']+)(["\'][^>]*>)',
        text,
    )
    changes += c1

    text, c2 = repl_attr(
        r'(<meta\s+property=["\']og:url["\'][^>]*\bcontent=["\'])([^"\']+)(["\'][^>]*>)',
        text,
    )
    changes += c2

    # JSON-LD "url": "https://sagecode.org/cse/..."
    def _sub_jsonld(m: re.Match[str]) -> str:
        nonlocal changes
        if m.group(2) != target:
            changes += 1
            return f'{m.group(1)}{target}{m.group(3)}'
        return m.group(0)

    text = re.sub(
        r'("url"\s*:\s*")(https://sagecode\.org/cse/[^"]*)(")',
        _sub_jsonld,
        text,
    )

    return text, changes


def fix_external_links(text: str) -> tuple[str, int]:
    changes = 0

    def _sub_anchor(m: re.Match[str]) -> str:
        nonlocal changes
        tag = m.group(0)
        orig = tag

        # Ensure target="_blank"
        if re.search(r'\btarget\s*=', tag, re.IGNORECASE):
            tag = re.sub(
                r'\btarget\s*=\s*["\'][^"\']*["\']',
                'target="_blank"',
                tag,
                flags=re.IGNORECASE,
            )
        else:
            tag = tag[:-1] + ' target="_blank">'

        # Ensure rel="noopener noreferrer nofollow"
        rel_match = re.search(r'\brel\s*=\s*(["\'])([^"\']*)\1', tag, re.IGNORECASE)
        required_tokens = ["noopener", "noreferrer", "nofollow"]
        if rel_match:
            existing = rel_match.group(2).split()
            merged = list(existing)
            for tok in required_tokens:
                if tok not in merged:
                    merged.append(tok)
            new_rel = f'rel="{" ".join(merged)}"'
            tag = tag[: rel_match.start()] + new_rel + tag[rel_match.end() :]
        else:
            tag = tag[:-1] + ' rel="noopener noreferrer nofollow">'

        if tag != orig:
            changes += 1
        return tag

    text = re.sub(
        r'<a\b[^>]*\bhref=["\']https?://[^"\']+["\'][^>]*>',
        _sub_anchor,
        text,
        flags=re.IGNORECASE,
    )
    return text, changes


def fix_content_tables_css(text: str, filename: str) -> tuple[str, int]:
    if filename == "index.html":
        return text, 0
    if not re.search(r"<table\b", text, re.IGNORECASE):
        return text, 0
    if "content-tables.css" in text:
        return text, 0

    link_tag = '<link rel="stylesheet" href="/assets/css/content-tables.css">'
    # Insert after content-sidebar.css if present, else before </head>
    sidebar_pat = r'(<link\s+rel=["\']stylesheet["\']\s+href=["\']/assets/css/content-sidebar\.css["\'][^>]*>)'
    if re.search(sidebar_pat, text, re.IGNORECASE):
        text = re.sub(
            sidebar_pat,
            rf"\1\n  {link_tag}",
            text,
            count=1,
            flags=re.IGNORECASE,
        )
        return text, 1

    if "</head>" in text:
        text = text.replace("</head>", f"  {link_tag}\n</head>", 1)
        return text, 1

    return text, 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print summary of changes without modifying files.",
    )
    args = parser.parse_args()

    if not CSE_DIR.is_dir():
        print(f"ERROR: {CSE_DIR} not found", file=sys.stderr)
        return 1

    total_files_changed = 0
    total_url_fixes = 0
    total_link_fixes = 0
    total_css_fixes = 0

    for path in sorted(CSE_DIR.glob("*.html")):
        orig = path.read_text(encoding="utf-8")
        updated, c_url = fix_canonical_and_og(orig, path.name)
        updated, c_link = fix_external_links(updated)
        updated, c_css = fix_content_tables_css(updated, path.name)

        if updated != orig:
            total_files_changed += 1
            total_url_fixes += c_url
            total_link_fixes += c_link
            total_css_fixes += c_css
            mode = "DRY-RUN" if args.dry_run else "UPDATED"
            print(
                f"{mode:7s} {path.as_posix():36s} urls={c_url} links={c_link} table_css={c_css}"
            )
            if not args.dry_run:
                path.write_text(updated, encoding="utf-8")

    print(
        f"Summary: files={total_files_changed}, url_fixes={total_url_fixes}, "
        f"ext_link_fixes={total_link_fixes}, table_css_fixes={total_css_fixes}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
