#!/usr/bin/env python3
"""
One-off migration: wrap lab topic HTML in the unified shell (header + sidebar
placeholders + topic-loader). Run from repo root:
  python migrate_lab_topic_shells.py
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

LAYOUT_STYLE = """
    .side-bar { order: 1; }
    #main-content { order: 2; }
    @media (max-width: 991px) {
      .side-bar { display: none; }
      .side-bar.active {
        display: block;
        position: absolute;
        top: 100px;
        left: 0;
        right: 0;
        z-index: 1000;
        background: rgba(0,0,0,0.95);
      }
    }
"""


def extract_head_fields(html: str) -> tuple[str, str, str, str]:
    title_m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.DOTALL)
    title = (title_m.group(1) if title_m else "Topic").strip()
    desc_m = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\']',
        html,
        re.I,
    )
    description = desc_m.group(1).strip() if desc_m else ""
    kw_m = re.search(
        r'<meta\s+name=["\']keywords["\']\s+content=["\']([^"\']*)["\']',
        html,
        re.I,
    )
    keywords = kw_m.group(1).strip() if kw_m else ""
    return title, description, keywords


def extract_container_inner(html: str) -> str:
    html = html.replace("\r\n", "\n")
    if "<body" not in html.lower():
        return html.strip()
    body_m = re.search(r"<body[^>]*>", html, re.I)
    if not body_m:
        return html.strip()
    body = html[body_m.end() :]
    body = re.sub(r"</body>[\s\S]*$", "", body, flags=re.I).strip()
    m = re.search(r'<div\s+class="container"[^>]*>', body, re.I)
    if not m:
        return body.strip()
    inner = body[m.end() :]
    depth = 1
    pos = 0
    tag_re = re.compile(r"<div\b[^>]*>|</div>", re.I)
    end_at = None
    while depth > 0:
        mm = tag_re.search(inner, pos)
        if not mm:
            break
        if mm.group(0).lower().startswith("<div"):
            depth += 1
        else:
            depth -= 1
        if depth == 0:
            end_at = mm.start()
            break
        pos = mm.end()
    if end_at is not None:
        inner = inner[:end_at]
    inner = inner.strip()
    inner = re.sub(
        r"^\s*<!--\s*header\s*-->\s*<header[^>]*>[\s\S]*?</header>\s*",
        "",
        inner,
        count=1,
        flags=re.I,
    )
    inner = re.sub(
        r"<footer\s+class=\"footer copyright\"[\s\S]*?</footer>\s*",
        "",
        inner,
        count=1,
        flags=re.I,
    )
    inner = re.sub(r"<script[^>]*src=[\"']/sage\.js[\"'][^>]*>\s*</script>\s*", "", inner, flags=re.I)
    return inner.strip()


def build_shell(
    *,
    title: str,
    description: str,
    keywords: str,
    inner: str,
    lab_id: str,
    topic_id: str,
    home_link: str,
    lab_home_link: str,
) -> str:
    desc_attr = description.replace('"', "&quot;")
    kw_attr = keywords.replace('"', "&quot;")
    return f"""<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="description" content="{desc_attr}">
  <meta name="author" content="Elucian Moise">
  <meta name="keywords" content="{kw_attr}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>{title}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="icon" type="image/png" href="/images/favicon.ico">
  <link rel="stylesheet" href="/prism.css">
  <script src="/prism.js"></script>
  <link rel="stylesheet" href="/sage.css">
  <style>{LAYOUT_STYLE}
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
            <h5 class="mb-0">Learning Path</h5>
            <a id="home-link" href="{home_link}" class="btn btn-sm btn-secondary" title="Back to topics">↩</a>
          </div>
          <div class="progress mb-3" style="height: 8px;">
            <div id="main-progress" class="progress-bar bg-success" style="width: 0%;"></div>
          </div>
          <hr>
          <ul id="bookmark-list" class="list-unstyled">
          </ul>
        </div>
      </aside>

      <main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">
{inner}
      </main>
    </div>
  </div>

  <hr>

  <footer class="footer copyright">
    <p class="x-small text-secondary mb-0">&copy; 2026 Sage-Code Laboratory</p>
  </footer>

</div>

<button id="open-sidebar" class="btn btn-primary d-lg-none shadow-lg" type="button">
  <span style="font-size: 24px;">☰</span>
</button>

<script>
  window.TOPIC_CONFIG = {{
    labId: '{lab_id}',
    topicId: '{topic_id}',
    homeLink: '{home_link}',
    labHomeLink: '{lab_home_link}',
    inlineContent: true
  }};
</script>
<script src="/sage.js" defer></script>
<script src="/common/progress.js" defer></script>
<script src="/common/lab-progress-bridge.js" defer></script>
<script src="/common/topic-loader.js" defer></script>

</body>
</html>
"""


def patch_web_stack_inner(inner: str) -> str:
    inner = inner.replace("</code></code></code></pre>", "</code></pre>")
    inner = re.sub(r"<h2>\s*Go Web Stack\s*</h2>", '<h2 id="title">Go Web Stack</h2>', inner, count=1, flags=re.I)
    inner = re.sub(r"<h2>\s*Components\s*</h2>", '<h2 id="components">Components</h2>', inner, count=1, flags=re.I)
    inner = re.sub(r"<h2>\s*Advantages\s*</h2>", '<h2 id="advantages">Advantages</h2>', inner, count=1, flags=re.I)
    inner = re.sub(r"<h2>\s*Go vs Ruby\s*</h2>", '<h2 id="ruby">Go vs Ruby</h2>', inner, count=1, flags=re.I)
    return inner


def migrate_go_lab() -> None:
    go_dir = ROOT / "programming" / "go"
    topics = [
        "overview",
        "syntax",
        "types",
        "arrays",
        "maps",
        "control",
        "functions",
        "objects",
        "errors",
        "files",
        "concurrency",
        "examples",
        "web-stack",
    ]
    for topic_id in topics:
        path = go_dir / f"{topic_id}.html"
        if not path.exists():
            print(f"skip missing {path}")
            continue
        raw = path.read_text(encoding="utf-8", errors="replace")
        title, description, keywords = extract_head_fields(raw)
        inner = extract_container_inner(raw)
        if topic_id == "web-stack":
            inner = patch_web_stack_inner(inner)
        if topic_id == "overview" and "<p>" in inner and not re.search(r"</p>\s*$", inner.rstrip()):
            inner = inner.rstrip() + "\n</p>"
        out = build_shell(
            title=title,
            description=description,
            keywords=keywords,
            inner=inner,
            lab_id="go",
            topic_id=topic_id,
            home_link="./index.html#topics",
            lab_home_link="./index.html",
        )
        path.write_text(out, encoding="utf-8", newline="\n")
        print(f"ok go {topic_id}.html")


def migrate_engineering_fragments() -> None:
    eng = ROOT / "engineering"
    for topic_id, page_title, desc in [
        ("concepts", "Programming Concepts", "Programming concepts and fundamentals for software engineering."),
        ("algebra", "Numeric Algebra", "Number systems, types, and representations for engineers."),
        ("structures", "Data Structures", "Data structures for software engineering."),
    ]:
        frag = eng / f"{topic_id}.html"
        if not frag.exists():
            print(f"missing {frag}")
            continue
        inner = frag.read_text(encoding="utf-8", errors="replace").strip()
        if inner.startswith("<!DOCTYPE"):
            print(f"skip {topic_id} (already full document)")
            continue
        out = build_shell(
            title=page_title,
            description=desc,
            keywords="software engineering, computer science, sage-code",
            inner=inner,
            lab_id="engineering",
            topic_id=topic_id,
            home_link="./index.html#topics",
            lab_home_link="./index.html",
        )
        frag.write_text(out, encoding="utf-8", newline="\n")
        print(f"ok engineering {topic_id}.html")


def main() -> None:
    migrate_engineering_fragments()
    migrate_go_lab()


if __name__ == "__main__":
    main()
