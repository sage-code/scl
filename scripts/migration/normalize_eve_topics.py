#!/usr/bin/env python3
"""Normalize Eve topic pages and rebuild their hierarchical sidebar JSON."""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVE_DIR = ROOT / "projects" / "eve"
SKIP_FILES = {"index.html", "template.html", "option.html"}
HEADING_RE = re.compile(r"<h([123])(?P<attrs>[^>]*)>(?P<body>[\s\S]*?)</h\1>", re.IGNORECASE)
HEADER_RE = re.compile(r"<header\b[\s\S]*?</header>", re.IGNORECASE)
FOOTER_RE = re.compile(r"<footer\b[\s\S]*?</footer>", re.IGNORECASE)
ANCHOR_RE = re.compile(r"<a\s+([^>]*?)\bid\s*=\s*([\"'])([^\"']+)\2[^>]*>(?:\s*</a>)?", re.IGNORECASE)
ID_RE = re.compile(r"\bid\s*=\s*([\"'])([^\"']+)\1", re.IGNORECASE)
CODE_BLOCK_RE = re.compile(r"(<pre\b[^>]*>\s*<code\b[^>]*>)([\s\S]*?)(</code>\s*</pre>)", re.IGNORECASE)


def text_only(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def escape_code_markup(source: str) -> str:
    def escape_block(match: re.Match[str]) -> str:
        content = match.group(2).replace('&lt;<span class="eve-token">:</span>', '&lt;&#58;')
        content = content.replace('<', '&lt;')
        content = content.replace('&lt;:', '&lt;&#58;')
        return f"{match.group(1)}{content}{match.group(3)}"

    return CODE_BLOCK_RE.sub(escape_block, source)


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text_only(value).lower()).strip("-")
    return slug or "section"


def normalize_headings(source: str) -> tuple[str, list[dict[str, str]]]:
    used: set[str] = set()
    headings: list[dict[str, str]] = []

    def normalize_empty_anchor(match: re.Match[str]) -> str:
        level = match.group(1)
        attrs = match.group(2)
        heading_id = match.group(5)
        if ID_RE.search(attrs):
            return match.group(0)
        return f'<h{level}{attrs} id="{heading_id}">'

    source = re.sub(
        r'<h([123])([^>]*)>\s*<a\s+([^>]*?)\bid\s*=\s*(["\'])([^"\']+)\4[^>]*>\s*</a>',
        normalize_empty_anchor,
        source,
        flags=re.IGNORECASE,
    )

    def replace_heading(match: re.Match[str]) -> str:
        level = match.group(1)
        attrs = match.group("attrs")
        body = match.group("body")
        anchor = ANCHOR_RE.search(body)
        existing = ID_RE.search(attrs)
        heading_id = existing.group(2) if existing else (anchor.group(3) if anchor else "")
        if not heading_id:
            heading_id = slugify(body)
        base_id = heading_id
        suffix = 2
        while heading_id in used:
            heading_id = f"{base_id}-{suffix}"
            suffix += 1
        used.add(heading_id)

        if existing:
            attrs = ID_RE.sub(f'id="{heading_id}"', attrs, count=1)
        else:
            attrs = f'{attrs} id="{heading_id}"'

        if anchor:
            body = body[: anchor.start()] + body[anchor.end() :]
        headings.append({"level": level, "id": heading_id, "title": text_only(body)})
        return f"<h{level}{attrs}>{body}</h{level}>"

    return HEADING_RE.sub(replace_heading, source), headings


def build_sidebar(headings: list[dict[str, str]]) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    current_h2: dict[str, object] | None = None
    for heading in headings:
        item: dict[str, object] = {
            "title": heading["title"],
            "link": f'#{heading["id"]}',
        }
        if heading["level"] == "3" and current_h2 is not None:
            current_h2.setdefault("children", []).append(item)
        else:
            items.append(item)
            current_h2 = item if heading["level"] == "2" else None
    return items


def standardize_shell(source: str) -> str:
    if 'id="bookmark-list"' in source:
        return source

    header = HEADER_RE.search(source)
    footer = FOOTER_RE.search(source)
    if not header or not footer:
        return source

    body_start = header.end()
    content = source[body_start : footer.start()]
    content = re.sub(r"<script\b[\s\S]*?</script>", "", content, flags=re.IGNORECASE)
    content = content.strip()
    if content.endswith("</div>"):
        content = content[:-6].rstrip()

    shell = f'''\n\n<div class="container-fluid px-0">\n  <div class="row g-0">\n    <aside class="side-bar col-lg-3 col-12">\n      <div id="study-sidebar" class="sidebar-content shadow-sm p-3 sticky-top">\n        <div class="d-flex justify-content-between align-items-center mb-2">\n          <h5 class="mb-0">Lab Topics</h5>\n        </div>\n        <hr>\n        <ul id="bookmark-list" class="list-unstyled">\n        </ul>\n      </div>\n    </aside>\n\n    <main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">\n{content}\n    </main>\n  </div>\n</div>\n\n<hr>\n\n{footer.group(0)}\n'''
    return source[:body_start] + shell + "</div>\n<script src=\"/sage.js\" defer></script>\n</body>\n</html>\n"


def process(path: Path, dry_run: bool) -> bool:
    source = path.read_text(encoding="utf-8", errors="ignore")
    normalized, headings = normalize_headings(source)
    normalized = escape_code_markup(normalized)
    normalized = standardize_shell(normalized)
    sidebar = build_sidebar(headings)
    json_path = path.with_suffix(".json")
    changed = normalized != source or json.loads(json_path.read_text(encoding="utf-8")) != sidebar
    if changed and not dry_run:
        path.write_text(normalized, encoding="utf-8")
        json_path.write_text(json.dumps(sidebar, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    return changed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    pages = sorted(
        p for p in EVE_DIR.glob("*.html")
        if p.name.lower() not in SKIP_FILES and p.with_suffix(".json").exists()
    )
    changed = [p.name for p in pages if process(p, args.dry_run)]
    print(f"Scanned: {len(pages)}")
    print(f"Would change: {len(changed)}" if args.dry_run else f"Changed: {len(changed)}")
    for name in changed:
        print(name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
