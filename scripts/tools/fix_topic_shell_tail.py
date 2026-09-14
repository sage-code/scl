#!/usr/bin/env python3
"""Rewrite the shell of a topic page to the repository's standard topic shell.

Background
----------
Every topic page in this repository (393 of them) uses the standard shell:
`<div id="study-sidebar">`, the static copyright footer, the `#open-sidebar`
mobile toggle, `assets/js/sage.js` and a `window.TOPIC_CONFIG` that sets
`inlineContent: true`:

    manual/PROJECTS-ARCHITECTURE.md -> #study-sidebar, /assets/js/sage.js

Six Odin pages written in phases 6-8 used a different shell instead
(`class="study-sidebar"` with no id, a `#dynamic-footer` placeholder,
`inject-layout.js`, and a config without `inlineContent`). The sidebar rules in
`assets/css/content-sidebar.css` are written against `#study-sidebar`, and the
loader looks the same element up by id, so those pages rendered the sidebar
twice: the real one, plus an unrecognised empty shell next to the heading.

This script rewrites ONLY the shell — the sidebar wrapper line and the
footer/script tail. Page content between `<main>` and `</main>` is never
touched, and the page's `topicId` is preserved.

Usage:
    python scripts/tools/fix_topic_shell_tail.py              # dry run (diff only)
    python scripts/tools/fix_topic_shell_tail.py --apply      # write the fix
"""

from __future__ import annotations

import argparse
import difflib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

FILES = [
    "roadmap/odin/ffi.html",
    "roadmap/odin/threads.html",
    "roadmap/odin/testing.html",
    "roadmap/odin/demo_examples.html",
    "roadmap/odin/samples.html",
    "roadmap/odin/references.html",
]

OLD_SIDEBAR = '<div class="study-sidebar sidebar-content shadow-sm p-3 sticky-top">'
NEW_SIDEBAR = '<div id="study-sidebar" class="sidebar-content shadow-sm p-3 sticky-top">'

TAIL_RE = re.compile(
    r'[ \t]*<footer id="dynamic-footer"[\s\S]*?</script>[ \t]*\r?\n(?=[ \t]*</body>)'
)
TOPIC_ID_RE = re.compile(r"topicId:\s*'([^']+)'")

NEW_TAIL = """  <hr>
  <footer class="footer copyright">
    <p class="x-small text-secondary mb-0">&copy; 2026 Sage-Code Laboratory</p>
  </footer>
</div>
<button id="open-sidebar" class="btn btn-primary d-lg-none shadow-lg" type="button">
  <span style="font-size: 24px;">&#9776;</span>
</button>
<script>
  window.TOPIC_CONFIG = {
    labId: 'odin',
    topicId: '@@TOPIC_ID@@',
    homeLink: './index.html#topics',
    labHomeLink: './index.html',
    inlineContent: true
  };
</script>
<script src="/assets/js/sage.js" defer></script>
<script src="/assets/js/topic-loader.js" defer></script>
"""

TOPIC_ID_TOKEN = "@@TOPIC_ID@@"


def normalize(text: str) -> tuple[str, str]:
    """Return (new_text, topic_id). Raises ValueError when the shell is not found."""
    topic_id_match = TOPIC_ID_RE.search(text)
    if not topic_id_match:
        raise ValueError("no TOPIC_CONFIG topicId found")
    topic_id = topic_id_match.group(1)

    if text.count(OLD_SIDEBAR) != 1:
        raise ValueError(f"expected exactly one legacy sidebar div, found {text.count(OLD_SIDEBAR)}")

    if len(TAIL_RE.findall(text)) != 1:
        raise ValueError("expected exactly one dynamic-footer tail block")

    updated = text.replace(OLD_SIDEBAR, NEW_SIDEBAR, 1)
    updated = TAIL_RE.sub(NEW_TAIL.replace(TOPIC_ID_TOKEN, topic_id), updated, count=1)

    for required in ('id="study-sidebar"', 'id="open-sidebar"', "/assets/js/sage.js",
                     "inlineContent: true", 'id="main-content"', 'id="bookmark-list"'):
        if required not in updated:
            raise ValueError(f"post-condition missing: {required}")
    for forbidden in ("inject-layout.js", "dynamic-footer", 'class="study-sidebar'):
        if forbidden in updated:
            raise ValueError(f"legacy shell remains: {forbidden}")

    # The content region must be byte-identical apart from the sidebar line.
    def content_of(html: str) -> str:
        start = html.index('<main id="main-content"')
        return html[start : html.index("</main>", start)]

    if content_of(text) != content_of(updated):
        raise ValueError("content region changed — refusing to write")

    return updated, topic_id


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="write the changes")
    args = parser.parse_args()

    failures = 0
    for rel in FILES:
        path = ROOT / rel
        original = path.read_text(encoding="utf-8")
        try:
            updated, topic_id = normalize(original)
        except ValueError as exc:
            print(f"SKIP {rel}: {exc}")
            failures += 1
            continue

        if updated == original:
            print(f"OK   {rel}: already standard")
            continue

        diff = difflib.unified_diff(
            original.splitlines(keepends=True),
            updated.splitlines(keepends=True),
            fromfile=f"{rel} (before)",
            tofile=f"{rel} (after)",
            n=1,
        )
        print(f"DIFF {rel} (topicId={topic_id})")
        print("".join(diff))

        if args.apply:
            path.write_text(updated, encoding="utf-8")
            print(f"WROTE {rel}")

    if args.apply:
        print(f"\napplied to {len(FILES) - failures} file(s)")
    else:
        print("\ndry run — re-run with --apply to write")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
