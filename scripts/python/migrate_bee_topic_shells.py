#!/usr/bin/env python3
"""Migrate Bee topic pages to the shared topic-shell architecture.

- Normalizes `projects/bee/*.html` topic pages to include the common sidebar shell.
- Generates matching `projects/bee/*.json` sidebar files from existing H2/H3 heading ids.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BEE_DIR = ROOT / "projects" / "bee"
SKIP_FILES = {"index.html", "template.html"}

HEAD_RE = re.compile(r"<head[\s\S]*?</head>", re.IGNORECASE)
BODY_RE = re.compile(r"<body\b([^>]*)>([\s\S]*?)</body>", re.IGNORECASE)
HEADING_RE = re.compile(r"<h([23])\b([^>]*)>([\s\S]*?)</h\1>", re.IGNORECASE)
ID_RE = re.compile(r"\bid\s*=\s*['\"]([^'\"]+)['\"]", re.IGNORECASE)
TAG_RE = re.compile(r"<[^>]+>")

HEADER_RE = re.compile(r"<header\b[^>]*id=['\"]dynamic-header['\"][^>]*>\s*</header>", re.IGNORECASE)
FOOTER_RE = re.compile(r"<footer\b[\s\S]*?</footer>", re.IGNORECASE)
TOPIC_CONFIG_RE = re.compile(r"<script>\s*window\.TOPIC_CONFIG\s*=\s*\{[\s\S]*?\}\s*;\s*</script>", re.IGNORECASE)
RUNTIME_SCRIPT_RE = re.compile(
    r"<script\b[^>]*src=['\"][^'\"]*(?:sage\.js|roadmap\.js|progress\.js|lab-progress-bridge\.js|topic-loader\.js|sidebar\.js)[^'\"]*['\"][^>]*>\s*</script>",
    re.IGNORECASE,
)
MAIN_OPEN_RE = re.compile(r"<main\b[^>]*id=['\"]main-content['\"][^>]*>", re.IGNORECASE)
MAIN_CLOSE_RE = re.compile(r"</main>", re.IGNORECASE)
OPEN_SIDEBAR_BTN_RE = re.compile(r"<button\b[^>]*id=['\"]open-sidebar['\"][\s\S]*?</button>", re.IGNORECASE)


def strip_tags(value: str) -> str:
    text = TAG_RE.sub("", value)
    text = text.replace("&nbsp;", " ").replace("&amp;", "&")
    return re.sub(r"\s+", " ", text).strip()


def ensure_bootstrap_icons(head_html: str) -> str:
    if "bootstrap-icons" in head_html.lower():
        return head_html

    link = "  <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css\">\n"
    if "</head>" in head_html.lower():
        return re.sub(r"</head>", f"{link}</head>", head_html, flags=re.IGNORECASE)
    return head_html


def build_sidebar_items(html: str) -> list[dict]:
    items: list[dict] = []
    current_parent: dict | None = None

    for match in HEADING_RE.finditer(html):
        level = int(match.group(1))
        attrs = match.group(2) or ""
        title = strip_tags(match.group(3) or "")
        id_match = ID_RE.search(attrs)
        heading_id = id_match.group(1).strip() if id_match else ""

        if not title or not heading_id:
            continue

        entry = {"title": title, "link": f"#{heading_id}"}

        if level == 2:
            entry["children"] = []
            items.append(entry)
            current_parent = entry
        elif level == 3 and current_parent is not None:
            current_parent.setdefault("children", []).append(entry)

    normalized: list[dict] = []
    for item in items:
        if not item.get("children"):
            item.pop("children", None)
        normalized.append(item)

    return normalized


def normalize_content(content_html: str) -> str:
    updated = content_html
    updated = HEADER_RE.sub("", updated)
    updated = FOOTER_RE.sub("", updated)
    updated = TOPIC_CONFIG_RE.sub("", updated)
    updated = RUNTIME_SCRIPT_RE.sub("", updated)

    # If the page was already wrapped by this migration, unwrap to authored content.
    # We target the innermost `#main-content` block to avoid nested-main regex pitfalls.
    for _ in range(3):
        open_matches = list(MAIN_OPEN_RE.finditer(updated))
        if not open_matches:
            break

        open_match = open_matches[-1]
        close_match = MAIN_CLOSE_RE.search(updated, open_match.end())
        if not close_match:
            break

        updated = updated[open_match.end() : close_match.start()]

    updated = OPEN_SIDEBAR_BTN_RE.sub("", updated)
    return updated.strip()


def build_topic_shell(body_attrs: str, topic_id: str, content_html: str) -> str:
    attrs = body_attrs or ""
    attrs = re.sub(r"\s*data-topic-runtime-injected\s*=\s*['\"]true['\"]", "", attrs, flags=re.IGNORECASE)
    attrs = attrs.rstrip()
    body_open = '<body data-topic-runtime-injected="true"'
    if attrs:
        body_open += f"{attrs}"
    body_open += ">"

    return f'''{body_open}
<div class="container">

  <header id="dynamic-header" class="container-fluid pb-2"></header>

  <div class="container-fluid px-0">
    <div class="row g-0">
      <aside class="side-bar col-lg-3 col-12">
        <div id="study-sidebar" class="sidebar-content shadow-sm p-3 sticky-top">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0">Lab Topics</h5>
          </div>
          <hr>
          <ul id="bookmark-list" class="list-unstyled">
          </ul>
        </div>
      </aside>

      <main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">
{content_html}
      </main>
    </div>
  </div>

  <hr>

  <footer class="footer copyright">
    <p class="x-small text-secondary mb-0">&copy; 2026 Sage-Code Laboratory</p>
  </footer>
</div>

<button id="open-sidebar" class="btn btn-primary d-lg-none shadow-lg" type="button">
  <span style="font-size: 24px;">&#9776;</span>
</button>

<script>
  window.TOPIC_CONFIG = {{
    labId: 'bee',
    topicId: '{topic_id}',
    homeLink: '/projects/bee/#topics',
    labHomeLink: '/projects/bee/',
    inlineContent: true
  }};
</script>
<script src="/assets/js/sage.js" defer></script>
<script src="/assets/js/progress.js" defer></script>
<script src="/assets/js/lab-progress-bridge.js" defer></script>
<script src="/assets/js/topic-loader.js" defer></script>
</body>'''


def migrate_file(html_path: Path) -> tuple[bool, bool]:
    original = html_path.read_text(encoding="utf-8", errors="ignore")

    head_match = HEAD_RE.search(original)
    body_match = BODY_RE.search(original)
    if not head_match or not body_match:
        return False, False

    prefix = original[: head_match.start()]
    head_html = head_match.group(0)
    suffix = original[body_match.end() :]

    body_attrs = body_match.group(1) or ""
    body_inner = body_match.group(2) or ""

    normalized_content = normalize_content(body_inner)
    if not normalized_content:
        return False, False

    sidebar_items = build_sidebar_items(body_inner)
    if not sidebar_items:
        return False, False

    topic_id = html_path.stem
    new_head = ensure_bootstrap_icons(head_html)
    new_body = build_topic_shell(body_attrs, topic_id, normalized_content)

    doctype = "" if "<!doctype" in prefix.lower() else "<!DOCTYPE html>\n"
    new_html = f"{doctype}{prefix}{new_head}\n{new_body}{suffix}"

    html_changed = new_html != original
    if html_changed:
        html_path.write_text(new_html, encoding="utf-8")

    json_path = html_path.with_suffix(".json")
    json_text = json.dumps(sidebar_items, indent=2, ensure_ascii=True) + "\n"
    json_changed = True
    if json_path.exists() and json_path.read_text(encoding="utf-8", errors="ignore") == json_text:
        json_changed = False
    else:
        json_path.write_text(json_text, encoding="utf-8")

    return html_changed, json_changed


def main() -> None:
    html_files = sorted(
        p for p in BEE_DIR.glob("*.html") if p.name.lower() not in SKIP_FILES
    )

    changed_html = 0
    changed_json = 0
    skipped = []

    for html_path in html_files:
        html_changed, json_changed = migrate_file(html_path)
        if not html_changed and not json_changed:
            skipped.append(html_path.name)
            continue
        if html_changed:
            changed_html += 1
        if json_changed:
            changed_json += 1

    print(f"Bee migration complete. HTML changed: {changed_html}, JSON changed: {changed_json}")
    if skipped:
        print("Skipped:", ", ".join(skipped))


if __name__ == "__main__":
    main()
