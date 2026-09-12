#!/usr/bin/env python3
"""Generate a roadmap topic sidebar JSON from a topic page's own headings.

The sidebar contract (manual/ARCHITECTURE.md §"Topic sidebar JSON") is a tree whose
ROOT is the page title and whose branches are the page's chapters. Hand-writing that
JSON invites drift, so this tool derives it straight from the page: the page stays
the single source of truth and `topic-loader.js` always finds a matching anchor.

Canonical shape — the single-root folder, template-defined in
`manual/ARCHITECTURE.md` §"Topic sidebar JSON — template" (scaffold:
`assets/topic_sidebar_template.json`), for a page with an anchorable `<h1>`:

    [
      {
        "title": "<H1 text>", "link": "#<h1-id>",
        "children": [
          {
            "title": "<H2 text>", "link": "#<h2-id>",
            "children": [ { "title": "<H3 text>", "link": "#<h3-id>" } ]
          }
        ]
      }
    ]

The `<h1>` is the ONLY top-level node: an ordinary, collapsible folder that contains
every topic, exactly as a chapter folder contains its sub-sections. That gives the
reader three navigation levels — title, then chapter, then sub-section — and nothing
in the JSON marks the title as special: there is no `"role"` key and no positional
marker. `topic-loader.js` and `build.js` render every node that has `children` as a
collapsible folder, so the title folds away like any other folder.

A page may declare more than one `<h1>`: each one opens a new top-level root and
claims the `<h2>` sections that follow it, so a document with two titles yields two
sibling trees. A multi-root sidebar is the one case a reader cannot see as a single
title folder.

Legacy fallback — a page with no `<h1>`, or whose `<h1>` has no `id` (so it cannot
be anchored): the root is omitted with a warning and the `<h2>` chapters are emitted
flat at the top level, which is the shape older tracks still use. Those flat sidebars
are content debt — regenerating a page whose `<h1>` is anchorable converts it to the
single-root folder, which is why migration proceeds one track at a time.

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


def clean_title(raw: str) -> str:
    """Heading markup -> plain title text (tags stripped, entities decoded)."""
    text = re.sub(r"<[^>]+>", "", raw)
    return re.sub(r"\s+", " ", html_mod.unescape(text)).strip()


def build_sidebar(page: pathlib.Path, mixed: bool = False):
    """Return (entries, errors, warning) for one topic page.

    Every anchorable `<h1>` becomes a top-level root folder whose `children` are the
    `<h2>` chapters that follow it (each chapter owning its `<h3>` anchors) — the page
    title is an ordinary collapsible folder that contains every topic. Pages with no
    anchorable `<h1>` fall back to the legacy flat shape (top-level `<h2>` chapters,
    no root) and report a warning, not an error, so old tracks keep regenerating
    exactly as before.

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
            # Each <h1> opens a new root folder that contains the chapters after it.
            last_root = {"title": title, "link": f"#{anchor}", "children": []}
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
        warning = "no <h1> found — legacy flat sidebar (root folder omitted)"
    elif not title_roots:
        warning = "h1 has no id — legacy flat sidebar (root folder omitted)"

    if not chapters:
        errors.append("no <h2> chapters found")
    if not mixed:
        for chapter in chapters:
            if not chapter["children"]:
                errors.append(f"chapter {chapter['link']} has no <h3> children")
        for root in title_roots:
            if not root["children"]:
                errors.append(f"root folder {root['link']} contains no <h2> topics")
    return entries, errors, warning


def _format_leaf(entry, indent: str) -> list:
    """One compact single-line object: `{ "title": ..., "link": ... }`."""
    parts = [
        f'"title": {json.dumps(entry["title"], ensure_ascii=False)}',
        f'"link": "{entry["link"]}"',
    ]
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
    """Return (chapters, leaves) BELOW the root folder(s), at any nesting depth.

    A sidebar whose every top-level entry carries `children` is the single-root
    folder shape: those entries are the page title(s), so they are skipped and the
    chapters are counted from their children down.
    """
    roots = entries
    if entries and all(entry.get("children") is not None for entry in entries):
        roots = [child for entry in entries for child in entry["children"]]

    chapters = leaves = 0
    for entry in roots:
        children = entry.get("children")
        if children is None:
            leaves += 1
        else:
            chapters += 1
            leaves += len(children)
    return chapters, leaves


def render(entries) -> str:
    """Serialize with one child per line, matching the hand-written house style.

    Leaves (a section on a flat demo-example page) are emitted as compact
    single-line objects; nodes with `children` keep the expanded multi-line form
    and nest recursively, so a single-root folder tree (h1 -> h2 -> h3)
    round-trips like the hand-written sidecars in the repository.
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
        rooted = bool(entries) and all(e.get("children") is not None for e in entries)
        root_note = "" if rooted else " [no root folder]"

        target = page.parent / "data" / f"{page.stem}.json"
        new_text = render(entries)
        old_text = target.read_text(encoding="utf-8") if target.is_file() else ""

        if old_text == new_text:
            print(f"[SAME] {target}: {chapters} chapters / {leaves} leaves{root_note} — unchanged")
            continue

        if args.dry_run:
            diff = difflib.unified_diff(
                old_text.splitlines(keepends=True),
                new_text.splitlines(keepends=True),
                fromfile=str(target),
                tofile=f"{target} (proposed)",
            )
            sys.stdout.writelines(diff)
            print(f"[DRY ] {target}: would write {chapters} chapters / {leaves} leaves{root_note}")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(new_text, encoding="utf-8")
            print(f"[OK  ] {target}: wrote {chapters} chapters / {leaves} leaves{root_note}")

    if warnings:
        print(f"\n{warnings} page(s) have no anchor-able <h1>; legacy flat shape emitted")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
