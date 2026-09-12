#!/usr/bin/env python3
"""Generate a roadmap topic sidebar JSON from a topic page's own headings.

The sidebar contract (manual/ARCHITECTURE.md) is a two-level hierarchy where every
`<h2>` chapter owns a `children` array of its `<h3>` anchors. Hand-writing that JSON
invites drift, so this tool derives it straight from the page: the page stays the
single source of truth and `topic-loader.js` always finds a matching anchor.

Every sidebar leads with the page-title leaf
`{ "title": "<H1 text>", "link": "#<h1-id>", "role": "title" }` — the FIRST entry,
pointing at the page's `<h1>` so the reader can always jump back to the top of the
lab. It is regenerated from the page like everything else, so it can never drift or
duplicate. A page whose `<h1>` has no `id` cannot be anchored, so its title leaf is
omitted with a warning instead of failing the run.

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

HEADING_RE = re.compile(r"<h([23])\s+id=\"([^\"]+)\"[^>]*>(.*?)</h\1>", re.S | re.I)
H1_RE = re.compile(r"<h1\b([^>]*)>(.*?)</h1>", re.S | re.I)
ID_ATTR_RE = re.compile(r"""\bid\s*=\s*["']([^"']+)["']""", re.I)

# Value of the marker attribute that tags the first sidebar entry as the page
# title leaf. topic-loader.js ignores unknown keys, so the marker is pure
# metadata: it lets tools and validators recognise the title item without
# relying on its position or on the absence of a `children` array.
TITLE_ROLE = "title"


def clean_title(raw: str) -> str:
    """Heading markup -> plain title text (tags stripped, entities decoded)."""
    text = re.sub(r"<[^>]+>", "", raw)
    return re.sub(r"\s+", " ", html_mod.unescape(text)).strip()


def find_title_entry(source: str):
    """Return (entry, warning) for the page-title leaf.

    The page's first `<h1>` becomes `{ "title": ..., "link": "#<id>", "role":
    "title" }`. `topic-loader.js` only renders entries whose link starts with
    `#`, so a heading without an `id` cannot be linked: the caller omits the leaf
    and surfaces the returned warning instead of failing the whole page.
    """
    match = H1_RE.search(source)
    if not match:
        return None, "no <h1> found — title entry omitted"
    attrs, raw = match.group(1), match.group(2)
    anchor_match = ID_ATTR_RE.search(attrs)
    if not anchor_match:
        return None, "h1 has no id — title entry omitted"
    title = clean_title(raw)
    if not title:
        return None, "h1 has no text — title entry omitted"
    return {
        "title": title,
        "link": f"#{anchor_match.group(1).strip()}",
        "role": TITLE_ROLE,
    }, None


def build_sidebar(page: pathlib.Path, mixed: bool = False):
    """Return (entries, errors, warning) for one topic page.

    `entries` always leads with the page-title leaf when the page's `<h1>` can be
    anchored. `mixed=True` is for demo-example and references pages: an `<h2>`
    without `<h3>` children becomes a leaf section instead of an error, while an
    `<h2>` that does have them stays an expanded chapter (h3 attaches in place).
    """
    source = page.read_text(encoding="utf-8")
    entries, errors, seen = [], [], set()
    title_entry, warning = find_title_entry(source)
    chapters, last_chapter = [], None

    for _level, anchor, raw in HEADING_RE.findall(source):
        anchor = anchor.strip()
        if anchor in seen:
            errors.append(f"duplicate heading id #{anchor}")
            continue
        seen.add(anchor)
        title = clean_title(raw)
        if not title:
            errors.append(f"empty heading title for #{anchor}")
            continue
        if _level == "2":
            last_chapter = {"title": title, "link": f"#{anchor}"}
            if not mixed:
                # Standard topic pages are always expanded; validate below.
                last_chapter["children"] = []
            entries.append(last_chapter)
            chapters.append(last_chapter)
        elif last_chapter is None:
            errors.append(f"h3 #{anchor} appears before any h2")
        else:
            if "children" not in last_chapter:
                # First h3 under a leaf chapter: upgrade it to an expanded chapter.
                last_chapter["children"] = []
            last_chapter["children"].append({"title": title, "link": f"#{anchor}"})

    # The title leaf is always FIRST: manual/ARCHITECTURE.md §"Topic sidebar JSON".
    if title_entry is not None:
        entries.insert(0, title_entry)

    if not chapters:
        errors.append("no <h2> chapters found")
    if not mixed:
        for chapter in chapters:
            if not chapter["children"]:
                errors.append(f"chapter {chapter['link']} has no <h3> children")
    return entries, errors, warning


def render(entries) -> str:
    """Serialize with one child per line, matching the hand-written house style.

    Entries without a `children` array — the page-title leaf and every entry on a
    flat demo-example page — are emitted as compact single-line objects; chapters
    keep the expanded three-key form.
    """
    lines = ["["]
    for index, entry in enumerate(entries):
        comma = "" if index == len(entries) - 1 else ","
        children = entry.get("children")
        if children is None:
            parts = [
                f'"title": {json.dumps(entry["title"], ensure_ascii=False)}',
                f'"link": "{entry["link"]}"',
            ]
            if "role" in entry:
                parts.append(f'"role": {json.dumps(entry["role"], ensure_ascii=False)}')
            lines.append("  { " + ", ".join(parts) + " }" + comma)
            continue
        lines.append("  {")
        lines.append(f'    "title": {json.dumps(entry["title"], ensure_ascii=False)},')
        lines.append(f'    "link": "{entry["link"]}",')
        lines.append('    "children": [')
        for child_index, child in enumerate(children):
            child_comma = "" if child_index == len(children) - 1 else ","
            lines.append(
                f'      {{ "title": {json.dumps(child["title"], ensure_ascii=False)}, '
                f'"link": "{child["link"]}" }}{child_comma}'
            )
        lines.append("    ]")
        lines.append("  }" + comma)
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
        "the h1 title leaf is still prepended",
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

        chapters = sum(1 for e in entries if e.get("role") != TITLE_ROLE)
        leaves = sum(len(e["children"]) for e in entries if "children" in e)
        has_title = any(e.get("role") == TITLE_ROLE for e in entries)
        title_note = "" if has_title else " [no title entry]"

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
        print(f"\n{warnings} page(s) have no anchor-able <h1>; title entry omitted.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
