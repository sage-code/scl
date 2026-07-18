#!/usr/bin/env python3
"""Normalize CSP topic pages to the shared sidebar template shell.

Scope:
- Targets roadmap/csp/**/*.html topic pages.
- Skips index/topic/template pages.
- Skips demo and snippet directories (*/demo/*, */files/*).

What it enforces:
- Dynamic header placeholder.
- Sidebar shell with bookmark list.
- Main content wrapper (#main-content).
- Standard footer.
- Topic toggle button and topic-loader script bundle.
"""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSP_DIR = ROOT / "roadmap" / "csp"
SKIP_FILES = {"index.html", "template.html", "topic.html"}
SKIP_PATH_PARTS = {"demo", "files"}

HEADER_RE = re.compile(r"<header\b[\s\S]*?</header>", re.IGNORECASE)
BODY_CLOSE_RE = re.compile(r"</body>", re.IGNORECASE)
CONTAINER_OPEN_RE = re.compile(r"<div\s+class=[\"']container[\"']\s*>", re.IGNORECASE)
CONTAINER_CLOSE_RE = re.compile(r"</div>\s*$", re.IGNORECASE)
FOOTER_RE = re.compile(r"<footer\b[\s\S]*?</footer>", re.IGNORECASE)
TOPIC_CONFIG_RE = re.compile(r"<script>\s*window\.TOPIC_CONFIG\s*=\s*\{[\s\S]*?\}\s*;\s*</script>", re.IGNORECASE)
SCRIPT_TAG_RE = re.compile(r"<script\b[\s\S]*?</script>", re.IGNORECASE)
DUP_HTML_CLOSE_RE = re.compile(r"</html>\s*</html>", re.IGNORECASE)
DUP_MAIN_CLOSE_RE = re.compile(r"(?is)(</main>\s*</div>\s*</div>\s*<hr>\s*){2,}")


def discover_pages() -> list[Path]:
    pages: list[Path] = []
    for path in sorted(CSP_DIR.rglob("*.html")):
        if path.name.lower() in SKIP_FILES:
            continue
        rel_parts = {p.lower() for p in path.relative_to(CSP_DIR).parts}
        if rel_parts & SKIP_PATH_PARTS:
            continue
        pages.append(path)
    return pages


def is_conforming(html: str) -> bool:
    if DUP_HTML_CLOSE_RE.search(html):
        return False

    if DUP_MAIN_CLOSE_RE.search(html):
        return False

    checks = (
        'id="dynamic-header"' in html,
        'id="study-sidebar"' in html,
        'id="bookmark-list"' in html,
        'id="main-content"' in html,
        "topic-loader.js" in html,
    )
    return all(checks)


def cleanup_generated_html(html: str) -> str:
    updated = html
    updated = re.sub(r"(?is)<!--\s*Footer\s*-->\s*", "", updated)
    updated = DUP_MAIN_CLOSE_RE.sub("</main>\n    </div>\n  </div>\n\n  <hr>\n", updated)
    updated = DUP_HTML_CLOSE_RE.sub("</html>", updated)
    return updated


def ensure_bootstrap_icons(head: str) -> str:
    if "bootstrap-icons" in head:
        return head
    insert_after = re.search(r"<link[^>]*bootstrap@5\.3\.0[^>]*>\s*", head, re.IGNORECASE)
    icons = '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">\n'
    if insert_after:
        idx = insert_after.end()
        return head[:idx] + icons + head[idx:]
    return head


def extract_head_body_tail(html: str) -> tuple[str, str, str]:
    head_match = re.search(r"<head>[\s\S]*?</head>", html, re.IGNORECASE)
    body_match = re.search(r"<body[\s\S]*?</body>", html, re.IGNORECASE)
    if not head_match or not body_match:
        return "", "", html

    prefix = html[:head_match.start()]
    head = head_match.group(0)
    body = body_match.group(0)
    suffix = html[body_match.end() :]
    return prefix + head, body, suffix


def normalize_body(body: str, lab_id: str, topic_id: str) -> str:
    # Preserve any existing opening body tag.
    body_open_match = re.search(r"<body[^>]*>", body, re.IGNORECASE)
    body_open = body_open_match.group(0) if body_open_match else "<body>"

    inner = body[body_open_match.end() : BODY_CLOSE_RE.search(body).start()] if body_open_match and BODY_CLOSE_RE.search(body) else body

    # Strip any existing topic config and script tags; they are rebuilt consistently.
    inner = TOPIC_CONFIG_RE.sub("", inner)
    inner = SCRIPT_TAG_RE.sub("", inner)

    # Guarantee a single root container for consistent layout.
    if CONTAINER_OPEN_RE.search(inner):
        start = CONTAINER_OPEN_RE.search(inner).start()
        end = inner.rfind("</div>")
        if end > start:
            container_inner = inner[start + CONTAINER_OPEN_RE.search(inner).end() - CONTAINER_OPEN_RE.search(inner).start() : end].strip()
        else:
            container_inner = inner.strip()
    else:
        container_inner = inner.strip()

    # Normalize header placeholder.
    header_match = HEADER_RE.search(container_inner)
    if header_match:
        before_header = container_inner[: header_match.start()]
        after_header = container_inner[header_match.end() :]
    else:
        before_header = ""
        after_header = container_inner

    # Remove legacy footer from content body.
    after_header = FOOTER_RE.sub("", after_header)

    content_html = after_header.strip()

    normalized = f'''{body_open}

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
    labId: '{lab_id}',
    topicId: '{topic_id}',
    homeLink: './index.html#topics',
    labHomeLink: './index.html',
    inlineContent: true
  }};
</script>
<script src="/assets/js/sage.js" defer></script>
<script src="/assets/js/progress.js" defer></script>
<script src="/assets/js/lab-progress-bridge.js" defer></script>
<script src="/assets/js/topic-loader.js" defer></script>

</body>'''

    return normalized


@dataclass
class Result:
    file: str
    changed: bool


def process_file(path: Path, dry_run: bool) -> Result:
    original = path.read_text(encoding="utf-8", errors="ignore")

    shell_checks = (
        'id="dynamic-header"' in original,
        'id="study-sidebar"' in original,
        'id="bookmark-list"' in original,
        'id="main-content"' in original,
        "topic-loader.js" in original,
    )

    if all(shell_checks) and (DUP_HTML_CLOSE_RE.search(original) or DUP_MAIN_CLOSE_RE.search(original) or "<!-- Footer -->" in original):
        repaired = cleanup_generated_html(original)
        if repaired != original and not dry_run:
            path.write_text(repaired, encoding="utf-8")
        return Result(str(path.relative_to(ROOT)), repaired != original)

    if is_conforming(original):
        return Result(str(path.relative_to(ROOT)), False)

    head_and_prefix, body, suffix = extract_head_body_tail(original)
    if not body:
        return Result(str(path.relative_to(ROOT)), False)

    # Ensure bootstrap icons in head section.
    head_and_prefix = ensure_bootstrap_icons(head_and_prefix)

    rel = path.relative_to(CSP_DIR)
    lab_id = rel.parts[0]
    topic_id = path.stem

    normalized_body = normalize_body(body, lab_id=lab_id, topic_id=topic_id)
    suffix_clean = suffix.strip()
    if not suffix_clean:
        suffix_clean = "</html>"

    updated = f"{head_and_prefix}\n{normalized_body}\n{suffix_clean}\n"
    updated = cleanup_generated_html(updated)

    if updated != original and not dry_run:
        path.write_text(updated, encoding="utf-8")

    return Result(str(path.relative_to(ROOT)), updated != original)


def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize CSP topic pages to sidebar shell")
    parser.add_argument("--dry-run", action="store_true", help="Only report changes")
    args = parser.parse_args()

    pages = discover_pages()
    results = [process_file(page, dry_run=args.dry_run) for page in pages]

    changed = [r.file for r in results if r.changed]
    print(f"Scanned: {len(results)}")
    print(f"Changed: {len(changed)}")
    for file in changed[:400]:
        print(file)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
