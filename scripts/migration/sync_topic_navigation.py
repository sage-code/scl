#!/usr/bin/env python3
"""Audit and normalize roadmap topic navigation assets.

Rules enforced (excluding index/topic pages):
- Every topic HTML page has a sibling JSON navigation file.
- Every h1/h2/h3 has an id (missing ids are added).
- Remove terminal helper links like "Back to Laboratory" / "Read Next".
- Regenerate JSON entries from heading structure for all lab topics.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
ROADMAP_DIR = ROOT / "roadmap"
SKIP_DIRS = {"labs"}
SKIP_FILES = {"index.html", "topic.html", "template.html"}

HEADING_RE = re.compile(r"<h([1-3])([^>]*)>(.*?)</h\1>", re.IGNORECASE | re.DOTALL)
OPEN_HEADING_RE = re.compile(r"<h([1-3])([^>]*)>", re.IGNORECASE)
ID_IN_ATTRS_RE = re.compile(r"\bid\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE)
ID_IN_INNER_RE = re.compile(r"\bid\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE)
STRIP_TAGS_RE = re.compile(r"<[^>]+>")
ALL_IDS_RE = re.compile(r"\bid\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE)
PARAGRAPH_RE = re.compile(r"(?is)<p\b[^>]*>.*?</p>")
END_LINK_PHRASE_RE = re.compile(r"\b(back\s+to\s+(?:laboratory|lab)|read\s+next)\b", re.IGNORECASE)


@dataclass
class HeadingItem:
    level: int
    title: str
    id_value: str


def slugify(value: str) -> str:
    base = unescape(value)
    base = STRIP_TAGS_RE.sub("", base)
    base = re.sub(r"\s+", " ", base).strip().lower()
    base = re.sub(r"[^a-z0-9\s-]", "", base)
    base = re.sub(r"\s+", "-", base).strip("-")
    return base or "section"


def unique_id(base: str, used: set[str]) -> str:
    if base not in used:
        used.add(base)
        return base

    idx = 2
    while f"{base}-{idx}" in used:
        idx += 1
    candidate = f"{base}-{idx}"
    used.add(candidate)
    return candidate


def discover_topic_pages() -> list[Path]:
    topic_pages: list[Path] = []
    if not ROADMAP_DIR.exists():
        return topic_pages

    lab_dirs = [
        item for item in ROADMAP_DIR.iterdir() if item.is_dir() and item.name not in SKIP_DIRS
    ]

    for lab_dir in sorted(lab_dirs):
        for html_file in sorted(lab_dir.rglob("*.html")):
            if html_file.name.lower() in SKIP_FILES:
                continue
            topic_pages.append(html_file)

    return topic_pages


def remove_terminal_navigation_links(html: str) -> tuple[str, bool]:
    modified = False

    def replace_paragraph(match: re.Match[str]) -> str:
        nonlocal modified
        block = match.group(0)
        plain = unescape(STRIP_TAGS_RE.sub(" ", block))
        plain = re.sub(r"\s+", " ", plain).strip().lower()

        if "<a" not in block.lower():
            return block

        if END_LINK_PHRASE_RE.search(plain):
            modified = True
            return ""

        return block

    updated = PARAGRAPH_RE.sub(replace_paragraph, html)
    return updated, modified


def extract_headings_and_apply_ids(html: str) -> tuple[str, list[HeadingItem], int]:
    used_ids = {match.group(1) for match in ALL_IDS_RE.finditer(html)}
    headings: list[HeadingItem] = []
    ids_added = 0

    def normalize_title(text: str, fallback_id: str) -> str:
        title = re.sub(r"\s+", " ", unescape(STRIP_TAGS_RE.sub("", text))).strip()
        if not title:
            title = fallback_id.replace("-", " ").title()
        if len(title) > 140:
            title = title[:137].rstrip() + "..."
        return title

    def replacer(match: re.Match[str]) -> str:
        nonlocal ids_added

        level = int(match.group(1))
        attrs = match.group(2) or ""
        lookahead = html[match.end() : match.end() + 2000]

        # Prefer explicit heading close, fallback to a short immediate chunk for malformed markup.
        closing = re.search(rf"</h{level}>", lookahead, re.IGNORECASE)
        if closing:
            inner_chunk = lookahead[: closing.start()]
        else:
            inner_chunk = lookahead[:220]

        heading_id = None
        attrs_match = ID_IN_ATTRS_RE.search(attrs)
        if attrs_match:
            heading_id = attrs_match.group(1)
        else:
            inner_match = re.search(
                r"^\s*<a\b[^>]*\bid\s*=\s*[\"']([^\"']+)[\"']",
                inner_chunk,
                re.IGNORECASE,
            )
            if inner_match:
                heading_id = inner_match.group(1)

        if not heading_id:
            candidate_title = normalize_title(inner_chunk, f"section-{len(headings)+1}")
            heading_id = unique_id(slugify(candidate_title), used_ids)
        elif heading_id not in used_ids:
            used_ids.add(heading_id)

        if not attrs_match:
            attrs = f'{attrs} id="{heading_id}"'
            ids_added += 1
        replacement = f"<h{level}{attrs}>"

        title = normalize_title(inner_chunk, heading_id)
        headings.append(HeadingItem(level=level, title=title, id_value=heading_id))
        return replacement

    updated_html = OPEN_HEADING_RE.sub(replacer, html)

    # Remove duplicate id from an immediate anchor if the heading now owns it.
    updated_html = re.sub(
        r"(<h[1-3][^>]*\bid\s*=\s*[\"']([^\"']+)[\"'][^>]*>\s*<a\b[^>]*?)\s+id\s*=\s*[\"']\2[\"']",
        r"\1",
        updated_html,
        flags=re.IGNORECASE,
    )

    return updated_html, headings, ids_added


def prune_empty_children(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for item in items:
        children = item.get("children")
        if isinstance(children, list):
            prune_empty_children(children)
            if not children:
                item.pop("children", None)
    return items


def build_navigation_tree(headings: list[HeadingItem]) -> list[dict[str, Any]]:
    roots: list[dict[str, Any]] = []
    current_h1: dict[str, Any] | None = None
    current_h2: dict[str, Any] | None = None

    for heading in headings:
        node: dict[str, Any] = {
            "title": heading.title,
            "link": f"#{heading.id_value}",
            "children": [],
        }

        if heading.level == 1:
            roots.append(node)
            current_h1 = node
            current_h2 = None
            continue

        if heading.level == 2:
            if current_h1 is None:
                roots.append(node)
            else:
                current_h1.setdefault("children", []).append(node)
            current_h2 = node
            continue

        if current_h2 is not None:
            current_h2.setdefault("children", []).append(node)
        elif current_h1 is not None:
            current_h1.setdefault("children", []).append(node)
        else:
            roots.append(node)

    return prune_empty_children(roots)


def process_topic_page(file_path: Path, dry_run: bool) -> dict[str, Any]:
    original_html = file_path.read_text(encoding="utf-8", errors="ignore")

    without_end_links, removed_end_links = remove_terminal_navigation_links(original_html)
    html_with_ids, headings, ids_added = extract_headings_and_apply_ids(without_end_links)

    nav_items = build_navigation_tree(headings)
    json_path = file_path.with_suffix(".json")
    original_json = json_path.read_text(encoding="utf-8", errors="ignore") if json_path.exists() else None
    new_json = json.dumps(nav_items, indent=2, ensure_ascii=False) + "\n"

    html_changed = html_with_ids != original_html
    json_changed = original_json != new_json

    if not dry_run:
        if html_changed:
            file_path.write_text(html_with_ids, encoding="utf-8")
        if json_changed:
            json_path.write_text(new_json, encoding="utf-8")

    return {
        "file": str(file_path.relative_to(ROOT)),
        "json": str(json_path.relative_to(ROOT)),
        "headings": len(headings),
        "ids_added": ids_added,
        "removed_end_links": removed_end_links,
        "html_changed": html_changed,
        "json_changed": json_changed,
        "json_created": original_json is None,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync and audit roadmap topic navigation assets")
    parser.add_argument("--dry-run", action="store_true", help="Report changes without writing files")
    args = parser.parse_args()

    pages = discover_topic_pages()
    if not pages:
        print("No topic pages found under roadmap labs.")
        return 0

    results = [process_topic_page(page, dry_run=args.dry_run) for page in pages]

    pages_with_new_ids = sum(1 for r in results if r["ids_added"] > 0)
    pages_with_html_changes = sum(1 for r in results if r["html_changed"])
    pages_with_json_changes = sum(1 for r in results if r["json_changed"])
    json_created = sum(1 for r in results if r["json_created"])
    end_links_removed = sum(1 for r in results if r["removed_end_links"])

    print(f"Scanned topic pages: {len(results)}")
    print(f"Pages with missing heading ids fixed: {pages_with_new_ids}")
    print(f"Pages with end-links removed: {end_links_removed}")
    print(f"JSON files created: {json_created}")
    print(f"HTML files changed: {pages_with_html_changes}")
    print(f"JSON files changed: {pages_with_json_changes}")

    changed_items = [r for r in results if r["html_changed"] or r["json_changed"]]
    if changed_items:
        print("Changed files:")
        for item in changed_items[:120]:
            flags = []
            if item["html_changed"]:
                flags.append("html")
            if item["json_changed"]:
                flags.append("json")
            print(f"- {item['file']} ({', '.join(flags)})")
        if len(changed_items) > 120:
            print(f"- ... {len(changed_items) - 120} more")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
