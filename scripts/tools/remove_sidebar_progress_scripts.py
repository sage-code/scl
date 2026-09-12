#!/usr/bin/env python3
"""Strip the retired sidebar-progress runtime from lab (topic) pages.

Sidebar progress checkboxes were removed from the topic template: a lab page is
now navigation + save-position only, and roadmap completion is marked manually on
the lab index. That left two dead `<script>` tags behind on every lab page:

    <script src="/assets/js/progress.js" defer></script>
    <script src="/assets/js/lab-progress-bridge.js" defer></script>

`lab-progress-bridge.js` is still loaded by the roadmap index pages (their own
`roadmap.js` uses `sageNotifyLabFullyComplete` / `sageClearTopicSubProgress`), so
this tool only edits pages that carry a sidebar: a page counts as a lab page when
it contains `<ul id="bookmark-list">`. Index/hub pages are left untouched.

The runtime is matched by exact basename, so `progress-legacy.js`,
`roadmap-progress-sync.js` and any other `*progress*` script are never removed.

Usage:
    python scripts/tools/remove_sidebar_progress_scripts.py --dry-run
    python scripts/tools/remove_sidebar_progress_scripts.py
"""
import argparse
import difflib
import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]

BOOKMARK_LIST_RE = re.compile(r"""<ul[^>]*\bid\s*=\s*["']bookmark-list["']""", re.I)
SCRIPT_RE = re.compile(
    r"""[ \t]*<script\b[^>]*\bsrc\s*=\s*["'][^"']*\b(?:progress|lab-progress-bridge)\.js["'][^>]*>\s*</script>[ \t]*\r?\n?""",
    re.I,
)

SKIP_DIRS = {".git", "node_modules", "public", ".temp", "vendor", "dist"}


def iter_html_files():
    for path in sorted(REPO_ROOT.rglob("*.html")):
        if set(path.relative_to(REPO_ROOT).parts) & SKIP_DIRS:
            continue
        yield path


def strip_scripts(text: str) -> str:
    return SCRIPT_RE.sub("", text)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="show diffs, write nothing")
    args = parser.parse_args()

    scanned = changed = removed = 0
    for path in iter_html_files():
        original = path.read_text(encoding="utf-8")
        if not BOOKMARK_LIST_RE.search(original):
            continue
        scanned += 1
        updated = strip_scripts(original)
        if updated == original:
            continue
        removed += len(SCRIPT_RE.findall(original))
        changed += 1
        rel = path.relative_to(REPO_ROOT)
        if args.dry_run:
            sys.stdout.writelines(
                difflib.unified_diff(
                    original.splitlines(keepends=True),
                    updated.splitlines(keepends=True),
                    fromfile=str(rel),
                    tofile=f"{rel} (proposed)",
                )
            )
            print(f"[DRY ] {rel}")
        else:
            path.write_text(updated, encoding="utf-8")
            print(f"[OK  ] {rel}")

    verb = "would update" if args.dry_run else "updated"
    print(f"\n{scanned} lab page(s) scanned; {verb} {changed}; {removed} script tag(s) removed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
