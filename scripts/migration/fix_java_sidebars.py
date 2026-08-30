#!/usr/bin/env python3
"""Fix Java lab HTML wrappers and generate missing sidebar JSON files."""

from __future__ import annotations

import re
import json
from pathlib import Path
from dataclasses import dataclass
from html import unescape

ROOT = Path(__file__).resolve().parents[2]
JAVA_DIR = ROOT / "roadmap" / "java"

HEADING_RE = re.compile(r"<h([1-3])([^>]*)>(.*?)</h\1>", re.IGNORECASE | re.DOTALL)
OPEN_HEADING_RE = re.compile(r"<h([1-3])([^>]*)>", re.IGNORECASE)
ID_IN_ATTRS_RE = re.compile(r"\bid\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE)
STRIP_TAGS_RE = re.compile(r"<[^>]+>")
ALL_IDS_RE = re.compile(r"\bid\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE)

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

def clean_html_wrappers(html: str) -> str:
    # Remove nested duplicate container/row/aside/main wrappers if present
    pattern = re.compile(
        r'(<div class="container-fluid px-0">\s*<div class="row g-0">\s*<aside.*?</aside>\s*<main[^>]*>)\s*'
        r'(<div class="container-fluid px-0">\s*<div class="row g-0">\s*<aside.*?</aside>\s*<main[^>]*>)',
        re.DOTALL | re.IGNORECASE
    )
    while pattern.search(html):
        html = pattern.sub(r'\1', html)
    return html

def extract_headings_and_apply_ids(html: str) -> tuple[str, list[HeadingItem]]:
    used_ids = {match.group(1) for match in ALL_IDS_RE.finditer(html)}
    headings: list[HeadingItem] = []

    def normalize_title(text: str, fallback_id: str) -> str:
        title = re.sub(r"\s+", " ", unescape(STRIP_TAGS_RE.sub("", text))).strip()
        if not title:
            title = fallback_id.replace("-", " ").title()
        if len(title) > 140:
            title = title[:137].rstrip() + "..."
        return title

    def replacer(match: re.Match[str]) -> str:
        level = int(match.group(1))
        attrs = match.group(2) or ""
        lookahead = html[match.end() : match.end() + 2000]
        closing = re.search(rf"</h{level}>", lookahead, re.IGNORECASE)
        inner_chunk = lookahead[: closing.start()] if closing else lookahead[:220]

        heading_id = None
        attrs_match = ID_IN_ATTRS_RE.search(attrs)
        if attrs_match:
            heading_id = attrs_match.group(1)
        else:
            inner_match = re.search(r"^\s*<a\b[^>]*\bid\s*=\s*[\"']([^\"']+)[\"']", inner_chunk, re.IGNORECASE)
            if inner_match:
                heading_id = inner_match.group(1)

        if not heading_id:
            candidate_title = normalize_title(inner_chunk, f"section-{len(headings)+1}")
            heading_id = unique_id(slugify(candidate_title), used_ids)
        elif heading_id not in used_ids:
            used_ids.add(heading_id)

        if not ID_IN_ATTRS_RE.search(attrs):
            attrs = f'{attrs} id="{heading_id}"'

        title = normalize_title(inner_chunk, heading_id)
        headings.append(HeadingItem(level=level, title=title, id_value=heading_id))
        return f"<h{level}{attrs}>"

    updated_html = OPEN_HEADING_RE.sub(replacer, html)
    return updated_html, headings

def build_navigation_tree(headings: list[HeadingItem]) -> list[dict[str, Any]]:
    roots = []
    current_h1 = None
    current_h2 = None

    for heading in headings:
        node = {
            "title": heading.title,
            "link": f"#{heading.id_value}",
            "children": [],
        }
        if heading.level == 1:
            roots.append(node)
            current_h1 = node
            current_h2 = None
        elif heading.level == 2:
            if current_h1 is None:
                roots.append(node)
            else:
                current_h1.setdefault("children", []).append(node)
            current_h2 = node
        else:
            if current_h2 is not None:
                current_h2.setdefault("children", []).append(node)
            elif current_h1 is not None:
                current_h1.setdefault("children", []).append(node)
            else:
                roots.append(node)

    # Prune empty children arrays
    def prune(items):
        for item in items:
            if isinstance(item.get("children"), list):
                prune(item["children"])
                if not item["children"]:
                    item.pop("children", None)
        return items

    return prune(roots)

def main():
    if not JAVA_DIR.exists():
        print("Java directory not found.")
        return

    html_files = sorted(JAVA_DIR.glob("*.html"))
    print(f"Found {len(html_files)} HTML files in roadmap/java/.")

    for html_path in html_files:
        if html_path.name.lower() in {"index.html", "topic.html"}:
            continue

        original_html = html_path.read_text(encoding="utf-8", errors="ignore")
        cleaned_html = clean_html_wrappers(original_html)
        final_html, headings = extract_headings_and_apply_ids(cleaned_html)

        nav_items = build_navigation_tree(headings)
        json_path = html_path.with_suffix(".json")
        json_text = json.dumps(nav_items, indent=2, ensure_ascii=False) + "\n"

        html_path.write_text(final_html, encoding="utf-8")
        json_path.write_text(json_text, encoding="utf-8")
        print(f"Processed: {html_path.name} -> {len(headings)} headings, generated {json_path.name}")

    print("Java sidebar generation complete.")

if __name__ == "__main__":
    main()
