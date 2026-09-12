#!/usr/bin/env python3
"""Generate a roadmap topic sidebar JSON from a topic page's own headings.

The sidebar contract (manual/ARCHITECTURE.md §"Topic sidebar JSON") is a tree whose
ROOT is the page title and whose branches are the page's chapters. Hand-writing that
JSON invites drift, so this tool derives it straight from the page: the page stays
the single source of truth and `topic-loader.js` always finds a matching anchor.

Preferred ("title-as-root") shape — a page with an anchorable `<h1>`:

    [
      {
        "title": "<H1 text>", "link": "#<h1-id>", "role": "title",
        "children": [
          {
            "title": "<H2 text>", "link": "#<h2-id>",
            "children": [ { "title": "<H3 text>", "link": "#<h3-id>" } ]
          }
        ]
      }
    ]

The `<h1>` is the top-level node — the folder that CONTAINS every topic — and it
carries `"role": "title"`, so tools and validators recognise the page title without
relying on position. A page may declare more than one `<h1>`: each one opens a new
top-level root and claims the `<h2>` sections that follow it, so a document with two
titles yields two sibling trees.

Legacy fallback — a page with no `<h1>`, or whose `<h1>` has no `id` (so it cannot
be anchored): the title root is omitted with a warning and the `<h2>` chapters are
emitted flat at the top level, exactly as the pre-title-root contract produced them.
Older tracks keep working unchanged until they are regenerated; converting a track
to the title-as-root shape is therefore opt-in per track.

Demo-example pages (`<track>/demo_examples.html`) and references pages
(`<track>/references.html`) mix expanded chapters with plain leaf sections: pass
`--mixed` to emit an `<h2>` without `<h3>` children as a flat leaf instead of
failing.

Usage:
    python scripts/tools/gen_topic_sidebars.py --dry-run roadmap/swift/control.html
    python scripts/tools/gen_topic_sidebars.py roadmap/swift/*.html
    python scripts/tools/gen_topic_sidebars.py --mixed roadmap/*/references.html roadmap/*/demo_examples.html

Output is written to <track>/data/<topic>.json next to the page. Use --dry-run to
see a unified diff without touching the file. Exit code is 1 if any page fails to
produce a valid sidebar, so it is safe to use as a gate in a build script.
"""
import argparse
import difflib
import html as html_mod
import json
import pathlib
import re
import sys

HEADING_RE = re.compile(r"<h([123])\s+id=\"([^\"]+)\"[^>]*>(.*?)</h\1>", re.S | re.I)
H1_RE = re.compile(r"<h1\b[^>]*>(.*?)</h1>", re.S | re.I)

# Value of the marker key that tags a title node. On the title-as-root shape it
# sits on every top-level `<h1>` root; on the legacy shape it sits on the
# childless title leaf. topic-loader.js ignores unknown keys, so the marker is
# pure metadata: it lets tools and validators recognise the page title without
# relying on position.
TITLE_ROLE = "title"


def clean_title(raw: str) -> str:
    """Heading markup -> plain title text (tags stripped, entities decoded)."""
    text = re.sub(r"<[^>]+>", "", raw)
    return re.sub(r"\s+", " ", html_mod.unescape(text)).strip()


def build_sidebar(page: pathlib.Path, mixed: bool = False):
    """Return (entries, errors, warning) for one topic page.

    On the title-as-root shape every anchorable `<h1>` becomes a top-level node
    tagged `"role": "title"` whose `children` are the `<h2>` chapters that follow
    it (each chapter owning its `<h3>` anchors) — the page title is the folder that
    contains every topic. Pages with no anchorable `<h1>` fall back to the legacy
    shape (flat `<h2>` chapters, no title root) and report a warning, not an error,
    so old tracks keep regenerating exactly as before.

    `mixed=True` is for demo-example and references pages: an `<h2>` without
    `<h3>` children becomes a leaf section instead of an error, while an `<h2>`
    that does have them stays an expanded chapter (h3 attaches in place).
    """
    source = page.read_text(encoding="utf-8")
    entries, errors, seen = [], [], set()
    title_roots, chapters, last_root, last_chapter = [], [], None, None
    has_h1 = bool(H1_RE.search(source))

    for level, anchor, raw in HEADING_RE.findall(source):
        anchor = anchor.strip()
        if anchor in seen:
            errors.append(f"duplicate heading id #{anchor}")
            continue
        seen.add(anchor)
        title = clean_title(raw)
        if not title:
            errors.append(f"empty heading title for #{anchor}")
            continue
        if level == "1":
            # Each <h1> opens a new root that contains the chapters after it.
            last_root = {"title": title, "link": f"#{anchor}", "role": TITLE_ROLE, "children": []}
            last_chapter = None
            entries.append(last_root)
            title_roots.append(last_root)
        elif level == "2":
            last_chapter = {"title": title, "link": f"#{anchor}"}
            if not mixed:
                # Standard topic pages are always expanded; validate below.
                last_chapter["children"] = []
            if last_root is not None:
                last_root["children"].append(last_chapter)
            else:
                # Legacy shape: no title root, so the chapter is top-level.
                entries.append(last_chapter)
            chapters.append(last_chapter)
        elif last_chapter is None:
            errors.append(f"h3 #{anchor} appears before any h2")
        else:
            if "children" not in last_chapter:
                # First h3 under a leaf chapter: upgrade it to an expanded chapter.
                last_chapter["children"] = []
            last_chapter["children"].append({"title": title, "link": f"#{anchor}"})

    warning = None
    if not has_h1:
        warning = "no <h1> found — legacy flat sidebar (title root omitted)"
    elif not title_roots:
        warning = "h1 has no id — legacy flat sidebar (title root omitted)"

    if not chapters:
        errors.append("no <h2> chapters found")
    if not mixed:
        for chapter in chapters:
            if not chapter["children"]:
                errors.append(f"chapter {chapter['link']} has no <h3> children")
        for root in title_roots:
            if not root["children"]:
                errors.append(f"title root {root['link']} contains no <h2> topics")
    return entries, errors, warning


def _format_leaf(entry, indent: str) -> list:
    """One compact single-line object: `{ "title": ..., "link": ... }`."""
    parts = [
        f'"title": {json.dumps(entry["title"], ensure_ascii=False)}',
        f'"link": "{entry["link"]}"',
    ]
    if "role" in entry:
        parts.append(f'"role": {json.dumps(entry["role"], ensure_ascii=False)}')
    return [f"{indent}{{ {', '.join(parts)} }}"]


def _format_node(entry, depth: int) -> list:
    """Serialize one entry and its descendants into house-style lines.

    Indentation follows the hand-written files: a top-level entry opens at two
    spaces, its keys at four, and each nesting level adds four more — so an h2
    leaf sits at six and an h3 under an h2 at ten. Leaves collapse to one line.
    """
    indent = " " * (2 + 4 * depth)
    prop = " " * (2 + 4 * depth + 2)
    children = entry.get("children")
    if children is None:
        return _format_leaf(entry, indent)
    lines = [f"{indent}{{"]
    lines.append(f'{prop}"title": {json.dumps(entry["title"], ensure_ascii=False)},')
    lines.append(f'{prop}"link": "{entry["link"]}",')
    if "role" in entry:
        lines.append(f'{prop}"role": {json.dumps(entry["role"], ensure_ascii=False)},')
    lines.append(f'{prop}"children": [')
    for index, child in enumerate(children):
        child_lines = _format_node(child, depth + 1)
        if index != len(children) - 1:
            child_lines[-1] += ","
        lines.extend(child_lines)
    lines.append(f"{prop}]")
    lines.append(f"{indent}}}")
    return lines


def count_tree(entries) -> tuple:
    """Return (chapters, leaves) for a sidebar tree, at any nesting depth."""
    chapters = leaves = 0
    for entry in entries:
        children = entry.get("children")
        if children is None:
            continue
        if entry.get("role") == TITLE_ROLE:
            child_chapters, child_leaves = count_tree(children)
            chapters += child_chapters
            leaves += child_leaves
        else:
            chapters += 1
            leaves += len(children)
    return chapters, leaves


def render(entries) -> str:
    """Serialize with one child per line, matching the hand-written house style.

    Leaves (a childless title node and every section on a flat demo-example page)
    are emitted as compact single-line objects; nodes with `children` keep the
    expanded multi-line form and nest recursively, so a title-as-root tree
    (h1 -> h2 -> h3) round-trips like the hand-written files.
    """
    lines = ["["]
    for index, entry in enumerate(entries):
        entry_lines = _format_node(entry, 0)
        if index != len(entries) - 1:
            entry_lines[-1] += ","
        lines.extend(entry_lines)
    lines.append("]")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pages", nargs="+", type=pathlib.Path)
    parser.add_argument("--dry-run", action="store_true", help="show diff, write nothing")
    parser.add_argument(
        "--mixed",
        action="store_true",
        help="allow h2 sections without h3 children (references.html, demo_examples.html); "
        "the h1 title root still wraps its chapters",
    )
    args = parser.parse_args()

    failures = 0
    warnings = 0
    for page in args.pages:
        if not page.is_file():
            print(f"[SKIP] {page}: not a file")
            failures += 1
            continue

        entries, errors, warning = build_sidebar(page, mixed=args.mixed)
        if warning:
            print(f"[WARN] {page}: {warning}")
            warnings += 1
        for error in errors:
            print(f"[FAIL] {page}: {error}")
        if errors:
            failures += 1
            continue

        chapters, leaves = count_tree(entries)
        has_title = any(e.get("role") == TITLE_ROLE for e in entries)
        title_note = "" if has_title else " [no title root]"

        target = page.parent / "data" / f"{page.stem}.json"
        new_text = render(entries)
        old_text = target.read_text(encoding="utf-8") if target.is_file() else ""

        if old_text == new_text:
            print(f"[SAME] {target}: {chapters} chapters / {leaves} leaves{title_note} — unchanged")
            continue

        if args.dry_run:
            diff = difflib.unified_diff(
                old_text.splitlines(keepends=True),
                new_text.splitlines(keepends=True),
                fromfile=str(target),
                tofile=f"{target} (proposed)",
            )
            sys.stdout.writelines(diff)
            print(f"[DRY ] {target}: would write {chapters} chapters / {leaves} leaves{title_note}")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(new_text, encoding="utf-8")
            print(f"[OK  ] {target}: wrote {chapters} chapters / {leaves} leaves{title_note}")

    if warnings:
        print(f"\n{warnings} page(s) have no anchor-able <h1>; legacy flat shape emitted")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
