#!/usr/bin/env python3
"""Normalize Bee topic heading hierarchy and regenerate sidebar JSON.

Rules enforced per `projects/bee/*.html` topic page:
- Exactly one H1 in the page heading sequence (extra H1 values are demoted to H2).
- Every H1/H2/H3 gets a stable unique `id`.
- Malformed heading closures are corrected (for example H2 closed as H3).
- Sidebar JSON is regenerated as hierarchical H1 -> H2 -> H3.
"""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BEE_DIR = ROOT / "projects" / "bee"
SKIP_FILES = {"index.html", "template.html"}

HEADING_ANY_RE = re.compile(r"<h([1-3])([^>]*)>([\s\S]*?)</h([1-3])>", re.IGNORECASE)
ID_RE = re.compile(r"\bid\s*=\s*([\"'])(.*?)\1", re.IGNORECASE)
A_TAG_RE = re.compile(r"</?a\b[^>]*>", re.IGNORECASE)
TAG_RE = re.compile(r"<[^>]+>")
NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")


def strip_tags(value: str) -> str:
    return TAG_RE.sub("", value)


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    text = html.unescape(strip_tags(value)).lower()
    text = normalize_space(text)
    text = NON_ALNUM_RE.sub("-", text).strip("-")
    return text or "section"


def remove_id_attr(attrs: str) -> str:
    return ID_RE.sub("", attrs)


def parse_existing_id(attrs: str) -> str:
    match = ID_RE.search(attrs)
    if not match:
        return ""
    return normalize_space(match.group(2))


def ensure_unique_id(candidate: str, used_ids: set[str]) -> str:
    base = slugify(candidate)
    unique = base
    index = 2
    while unique in used_ids:
        unique = f"{base}-{index}"
        index += 1
    used_ids.add(unique)
    return unique


def clean_heading_body(body: str) -> str:
    cleaned = A_TAG_RE.sub("", body)
    cleaned = re.sub(r"^\s*</a>\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def normalize_headings(html_text: str) -> tuple[str, list[dict[str, str]]]:
    used_ids: set[str] = set()
    h1_seen = False
    heading_rows: list[dict[str, str]] = []

    def repl(match: re.Match[str]) -> str:
        nonlocal h1_seen

        open_level = int(match.group(1))
        attrs = match.group(2) or ""
        body = match.group(3) or ""

        level = open_level
        if level == 1:
            if h1_seen:
                level = 2
            else:
                h1_seen = True

        cleaned_body = clean_heading_body(body)
        title = normalize_space(html.unescape(strip_tags(cleaned_body)))
        existing_id = parse_existing_id(attrs)

        if existing_id:
            heading_id = ensure_unique_id(existing_id, used_ids)
        else:
            heading_id = ensure_unique_id(title or f"h{level}", used_ids)

        attrs_wo_id = normalize_space(remove_id_attr(attrs))
        attrs_suffix = f" {attrs_wo_id}" if attrs_wo_id else ""

        heading_rows.append({"level": str(level), "title": title or f"Section {heading_id}", "id": heading_id})

        return f"<h{level} id=\"{heading_id}\"{attrs_suffix}>{cleaned_body}</h{level}>"

    updated = HEADING_ANY_RE.sub(repl, html_text)
    return updated, heading_rows


def build_hierarchy(rows: list[dict[str, str]]) -> list[dict]:
    if not rows:
        return []

    h1_row = next((row for row in rows if row["level"] == "1"), None)
    if h1_row is None:
        h1_row = rows[0]
        h1_row = {"level": "1", "title": h1_row["title"], "id": h1_row["id"]}

    root: dict = {
        "title": h1_row["title"],
        "link": f"#{h1_row['id']}",
        "children": [],
    }

    current_h2: dict | None = None
    started = False

    for row in rows:
        level = row["level"]
        title = row["title"]
        link = f"#{row['id']}"

        if not started:
            if row["id"] == h1_row["id"] and level == "1":
                started = True
                continue
            started = True

        if level == "2":
            current_h2 = {"title": title, "link": link, "children": []}
            root["children"].append(current_h2)
            continue

        if level == "3":
            if current_h2 is None:
                current_h2 = {"title": "Overview", "link": f"#{h1_row['id']}", "children": []}
                root["children"].append(current_h2)
            current_h2["children"].append({"title": title, "link": link})

    for item in root["children"]:
        if not item.get("children"):
            item.pop("children", None)

    return [root]


def process_file(html_path: Path) -> tuple[bool, bool]:
    original = html_path.read_text(encoding="utf-8", errors="ignore")
    updated, rows = normalize_headings(original)

    html_changed = updated != original
    if html_changed:
        html_path.write_text(updated, encoding="utf-8")

    sidebar = build_hierarchy(rows)
    json_path = html_path.with_suffix(".json")
    json_text = json.dumps(sidebar, indent=2, ensure_ascii=True) + "\n"

    prior_json = json_path.read_text(encoding="utf-8", errors="ignore") if json_path.exists() else ""
    json_changed = prior_json != json_text
    if json_changed:
        json_path.write_text(json_text, encoding="utf-8")

    return html_changed, json_changed


def main() -> None:
    html_files = sorted(
        p for p in BEE_DIR.glob("*.html") if p.name.lower() not in SKIP_FILES
    )

    html_changes = 0
    json_changes = 0

    for html_file in html_files:
        h_changed, j_changed = process_file(html_file)
        if h_changed:
            html_changes += 1
        if j_changed:
            json_changes += 1

    print(f"Bee hierarchy fix complete. HTML changed: {html_changes}, JSON changed: {json_changes}")


if __name__ == "__main__":
    main()
