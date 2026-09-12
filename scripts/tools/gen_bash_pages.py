#!/usr/bin/env python3
"""Generate Bash track topic pages from body fragments.

Bulk page assembly for roadmap/bash. Each body fragment in
`.temp/bash-bodies/<id>.html` starts with meta comment lines:

    <!--TITLE: Page Title-->
    <!--H1ID: bash-topic-->
    <!--DESC: meta description-->
    <!--KEYWORDS: a, b, c-->

followed by the page content beginning at the first <h2>. The script wraps the
body with the shared Sage-Code topic skeleton (header placeholder, sidebar,
footer, TOPIC_CONFIG boot) and writes `roadmap/bash/<id>.html`.

Usage:
    python scripts/tools/gen_bash_pages.py            # write pages
    python scripts/tools/gen_bash_pages.py --dry-run  # show what would change
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BODIES = ROOT / ".temp" / "bash-bodies"
OUT = ROOT / "roadmap" / "bash"
LAB_ID = "bash"

HEAD = """<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="description" content="{desc}">
  <meta name="author" content="Elucian Moise">
  <meta name="keywords" content="{keywords}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>{title}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="icon" type="image/png" href="/assets/images/favicon.ico">
  <link rel="stylesheet" href="/assets/prism.css">
  <script src="/assets/prism.js"></script>
  <link rel="stylesheet" href="/assets/css/sage-common.css">
  <link rel="stylesheet" href="/assets/css/content-topic.css">
  <link rel="stylesheet" href="/assets/css/content-sidebar.css">
  <link rel="stylesheet" href="/assets/css/content-code.css">
{extra_css}  <link rel="stylesheet" href="/assets/css/code-viewer.css">
  <link rel="stylesheet" href="/assets/css/forms-controls.css">
  <style>
    .side-bar {{ order: 1; }}
    #main-content {{ order: 2; }}
    @media (max-width: 991px) {{
      .side-bar {{ display: none; }}
      .side-bar.active {{ display: block; position: absolute; top: 100px; left: 0; right: 0; z-index: 1000; background: rgba(0,0,0,0.95); }}
    }}
  </style>
</head>
<body>
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
          <ul id="bookmark-list" class="list-unstyled"></ul>
        </div>
      </aside>
      <main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">
        <h1 id="{h1id}">{title}</h1>

{body}
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
    labId: '{lab}',
    topicId: '{topic}',
    homeLink: './index.html#topics',
    labHomeLink: './index.html',
    inlineContent: true
  }};
</script>
<script src="/assets/js/sage.js" defer></script>
<script src="/assets/js/progress.js" defer></script>
<script src="/assets/js/lab-progress-bridge.js" defer></script>
<script src="/assets/js/topic-loader.js" defer></script>
</body>
</html>
"""
TABLES_CSS = '  <link rel="stylesheet" href="/assets/css/content-tables.css">\n'


def parse_body(text: str, path: Path) -> tuple[dict, str]:
    """Extract the KEY header comments and return (meta, content)."""
    meta: dict = {}
    content_lines: list[str] = []
    for line in text.splitlines():
        m = re.match(r"^<!--(TITLE|H1ID|DESC|KEYWORDS|TOPIC):\s*(.*?)-->$", line.strip())
        if m and not content_lines:
            meta[m.group(1)] = m.group(2).strip()
        else:
            content_lines.append(line)
    for key in ("TITLE", "H1ID", "DESC", "KEYWORDS"):
        if key not in meta:
            sys.exit(f"ERROR {path.name}: missing {key} header")
    meta.setdefault("TOPIC", path.stem)
    return meta, "\n".join(content_lines).strip("\n")


def render(meta: dict, body: str) -> str:
    extra_css = TABLES_CSS if "<table" in body else ""
    return HEAD.format(
        title=meta["TITLE"],
        desc=meta["DESC"],
        keywords=meta["KEYWORDS"],
        h1id=meta["H1ID"],
        topic=meta["TOPIC"],
        lab=LAB_ID,
        extra_css=extra_css,
        body=body,
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not BODIES.is_dir():
        sys.exit(f"ERROR: body directory not found: {BODIES}")
    fragments = sorted(BODIES.glob("*.html"))
    if not fragments:
        sys.exit(f"ERROR: no body fragments in {BODIES}")

    written = 0
    for frag in fragments:
        meta, body = parse_body(frag.read_text(encoding="utf-8-sig"), frag)
        page = render(meta, body)
        target = OUT / f"{frag.stem}.html"
        old = target.read_text(encoding="utf-8") if target.exists() else ""
        status = "same" if old == page else ("update" if old else "create")
        print(f"{status:6} {target.relative_to(ROOT)}  ({len(page)} bytes)")
        if status != "same" and not args.dry_run:
            target.write_text(page, encoding="utf-8")
            written += 1

    print(f"\n{'[dry-run] ' if args.dry_run else ''}{written} file(s) written")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
