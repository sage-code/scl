#!/usr/bin/env python3
"""Compose roadmap topic pages from <main> content fragments.

Every roadmap topic page shares the same shell: head links (Prism bundle plus
content-code/content-sidebar), the #dynamic-header placeholder, the
#study-sidebar aside, the #main-content column, the footer, the mobile sidebar
button and the window.TOPIC_CONFIG boot. Hand-editing that shell across 20+
files is how a track ends up with duplicated sidebars, nested <main> elements
and pages that load no sidebar at all.

This tool keeps the shell in ONE place. The author writes only the content that
belongs inside <main>, in a fragment file that starts with a plain-text marker
header (no HTML comment, so the header survives any editor or shell handling):

    @@title: Types & Values
    @@description: Static types, ranges, distinct types, conversions, tuples.
    @@keywords: sage, code, nim, types, ranges, distinct, conversion
    @@topic: types
    <h1 id="nim-types">Types &amp; Values</h1>
    <h2 id="basic-types">Basic Types</h2>
    <h3 id="int">Integer Types</h3>

Usage:
    python scripts/tools/compose_topic_pages.py --track nim --fragments .temp/nim_pages --dry-run
    python scripts/tools/compose_topic_pages.py --track nim --fragments .temp/nim_pages --force

A page is written to roadmap/<track>/<topic>.html. An existing file is left
alone unless --force is given, so a regeneration can never silently discard a
hand edit. The topic page contract is checked before writing: one <h1>, two or
more <h2>, and at least one <h3> inside every <h2> chapter.
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SHELL = """<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="description" content="@DESCRIPTION@">
  <meta name="author" content="Elucian Moise">
  <meta name="keywords" content="@KEYWORDS@">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>@TITLE@</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="icon" type="image/png" href="/assets/images/favicon.ico">
  <link rel="stylesheet" href="/assets/prism.css">
  <script src="/assets/prism.js"></script>
  <link rel="stylesheet" href="/assets/css/sage-common.css">
  <link rel="stylesheet" href="/assets/css/content-topic.css">
  <link rel="stylesheet" href="/assets/css/content-sidebar.css">
  <link rel="stylesheet" href="/assets/css/content-code.css">
  <link rel="stylesheet" href="/assets/css/content-tables.css">
  <link rel="stylesheet" href="/assets/css/code-viewer.css">
  <link rel="stylesheet" href="/assets/css/forms-controls.css">
  <style>
    .side-bar { order: 1; }
    #main-content { order: 2; }
    @media (max-width: 991px) {
      .side-bar { display: none; }
      .side-bar.active { display: block; position: absolute; top: 100px; left: 0; right: 0; z-index: 1000; background: rgba(0,0,0,0.95); }
    }
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
@BODY@
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
  window.TOPIC_CONFIG = {
    labId: "@TRACK@",
    topicId: "@TOPIC@",
    homeLink: "./index.html#topics",
    labHomeLink: "./index.html",
    inlineContent: true
  };
</script>
<script src="/assets/js/sage.js" defer></script>
<script src="/assets/js/topic-loader.js" defer></script>
</body>
</html>
"""

META_KEYS = ("title", "description", "keywords", "topic")
META_PREFIX = "@@"


def parse_fragment(text: str, path: Path) -> tuple[dict[str, str], str]:
    """Split a fragment into its @@key: value header and the <main> body."""
    lines = text.splitlines()
    meta: dict[str, str] = {}
    index = 0
    while index < len(lines) and lines[index].startswith(META_PREFIX):
        line = lines[index][len(META_PREFIX):]
        if ":" in line:
            key, value = line.split(":", 1)
            key = key.strip().lower()
            if key in META_KEYS:
                meta[key] = value.strip()
        index += 1
    if not meta:
        raise ValueError(f"{path.name}: missing @@title/@@topic header")
    missing = [key for key in META_KEYS if not meta.get(key)]
    if missing:
        raise ValueError(f"{path.name}: meta header is missing {', '.join(missing)}")
    body = "\n".join(lines[index:]).strip("\n")
    if not body:
        raise ValueError(f"{path.name}: no content after the meta header")
    return meta, body + "\n"


def check_contract(body: str, path: Path) -> list[str]:
    """Check the topic page contract: one h1, >=2 h2, an h3 in every h2."""
    problems: list[str] = []
    h1s = re.findall(r"<h1\b[^>]*>", body)
    if len(h1s) != 1:
        problems.append(f"expected exactly one <h1>, found {len(h1s)}")
    elif not re.search(r"<h1\b[^>]*\bid=\"", body):
        problems.append("<h1> has no id attribute")
    chapters = list(re.finditer(r"<h2\b[^>]*>", body))
    if len(chapters) < 2:
        problems.append(f"expected at least two <h2> chapters, found {len(chapters)}")
    sections = [m.start() for m in re.finditer(r"<h3\b[^>]*>", body)]
    for index, chapter in enumerate(chapters):
        end = chapters[index + 1].start() if index + 1 < len(chapters) else len(body)
        if not any(chapter.end() <= start < end for start in sections):
            label = re.search(r'id="([^"]*)"', chapter.group(0))
            problems.append(f"chapter '{label.group(1) if label else '?'}' has no <h3>")
    return [f"{path.name}: {problem}" for problem in problems]


def render(meta: dict[str, str], body: str, track: str) -> str:
    """Fill the shared shell with one fragment.

    Meta values are plain text: an author may write either 'Types & Values' or
    the HTML-escaped 'Types &amp; Values' and the shell gets '&amp;' either way.
    Escaping twice produced '&amp;amp;' in page titles, which rendered as the
    literal characters in a browser tab.
    """
    page = SHELL
    page = page.replace("@DESCRIPTION@", html.escape(html.unescape(meta["description"]), quote=True))
    page = page.replace("@KEYWORDS@", html.escape(html.unescape(meta["keywords"]), quote=True))
    page = page.replace("@TITLE@", html.escape(html.unescape(meta["title"]), quote=False))
    page = page.replace("@TRACK@", track)
    page = page.replace("@TOPIC@", meta["topic"])
    return page.replace("@BODY@", body)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--track", required=True, help="track folder under roadmap/, e.g. nim")
    parser.add_argument("--fragments", required=True, help="folder holding <topic>.html fragments")
    parser.add_argument("--dry-run", action="store_true", help="report what would be written, write nothing")
    parser.add_argument("--force", action="store_true", help="overwrite pages that already exist")
    args = parser.parse_args()

    fragment_dir = Path(args.fragments)
    if not fragment_dir.is_absolute():
        fragment_dir = ROOT / fragment_dir
    if not fragment_dir.is_dir():
        print(f"FATAL: fragment folder not found: {fragment_dir}")
        return 2

    target_dir = ROOT / "roadmap" / args.track
    if not target_dir.is_dir():
        print(f"FATAL: track folder not found: {target_dir}")
        return 2

    fragments = sorted(fragment_dir.glob("*.html"))
    if not fragments:
        print(f"FATAL: no fragments in {fragment_dir}")
        return 2

    failures: list[str] = []
    written = skipped = 0
    for fragment in fragments:
        try:
            meta, body = parse_fragment(fragment.read_text(encoding="utf-8"), fragment)
        except ValueError as error:
            failures.append(str(error))
            continue
        problems = check_contract(body, fragment)
        if problems:
            failures.extend(problems)
            continue
        target = target_dir / f"{meta['topic']}.html"
        if target.exists() and not args.force:
            print(f"SKIP  {target.relative_to(ROOT)} (exists, use --force)")
            skipped += 1
            continue
        page = render(meta, body, args.track)
        if args.dry_run:
            print(f"DRY   {target.relative_to(ROOT)} ({len(page)} bytes)")
        else:
            target.write_text(page, encoding="utf-8", newline="\n")
            print(f"WRITE {target.relative_to(ROOT)} ({len(page)} bytes)")
        written += 1

    print(f"\nfragments={len(fragments)} written={written} skipped={skipped} failed={len(failures)}")
    for failure in failures:
        print(f"  FAIL {failure}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
