#!/usr/bin/env python3
"""Migrate roadmap sidebars to the canonical TEMPLATE shape (single-root folder).

The sidebar contract (manual/ARCHITECTURE.md §"Topic sidebar JSON") is a template,
not an example: a tree with three collapsible levels — ROOT folder (the page
`<h1>`) -> chapter (`<h2>`) -> section (`<h3>`):

    [
      {
        "title": "<h1 text>", "link": "#<h1-id>",
        "children": [
          {
            "title": "<h2 text>", "link": "#<h2-id>",
            "children": [ { "title": "<h3 text>", "link": "#<h3-id>" } ]
          }
        ]
      }
    ]

No track is a reference: the template above is the contract and `assets/roadmap_template.html`
plus `assets/topic_template.html` are the page templates. Any track is only an instance.

WHY A TRANSFORMER RATHER THAN A REGENERATOR
-------------------------------------------
`gen_topic_sidebars.py` rebuilds titles from the page headings verbatim. Long headings
decorated with a separator glyph (`for □ Counted Repetition`) would then leak into
short navigation labels, and every curated shorter label would be lost. This tool instead
takes the STRUCTURE from the page (so the root folder and the `<h3>` level appear, and
dead anchors disappear) and keeps the TITLE already stored in the sidecar whenever the
anchor still exists on the page. Pass --regen-titles to rebuild titles verbatim instead.

Rules applied to every page that has a sidebar
----------------------------------------------
* `<h1>`            -> top-level root folder; every one that follows claims the next `<h2>`s.
* `<h2>`            -> chapter inside the current root; its `<h3>` anchors become children.
* `<h2>` with no `<h3>` -> LEAF chapter inside the root folder (three levels where the page
  has content for them, two where it does not). Forcing an empty `children` list would
  render a folder that opens onto nothing.
* `<h3>` before any `<h2>` -> leaf attached directly to the root (reported).
* Anchor in the sidecar but NOT on the page -> DROPPED (it is dead navigation; see
  scripts/tools/check_sidebar_anchors.py) and listed in the report.
* Page without an anchorable `<h1>` -> BLOCKED: the file is left untouched and listed, because
  the repair is a page edit (add `<h1 id="...">`), not a JSON edit.
* Dropped anchors, blocked pages and rewritten titles are written to --report.
* A sidecar whose parsed tree already matches the template is left BYTE-FOR-BYTE alone
  (formatting included), so only structural changes appear in the diff — a migration you
  can actually review.

Usage:
    python scripts/tools/migrate_sidebars.py --track csharp --dry-run --report .temp/csharp.md
    python scripts/tools/migrate_sidebars.py --track csharp
    python scripts/tools/migrate_sidebars.py --all --dry-run --report .temp/all.md
    python scripts/tools/migrate_sidebars.py --all
    python scripts/tools/migrate_sidebars.py --pages roadmap/go/data/overview.json

Exit code is 1 if any page could not be processed (unreadable JSON, no chapters); a
blocked page is a reported condition, not a failure.
"""
from __future__ import annotations

import argparse
import collections
import difflib
import html as html_mod
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from gen_topic_sidebars import render  # noqa: E402  (shared house-style serializer)

ROOT = pathlib.Path(__file__).resolve().parents[2]
HEADING_RE = re.compile(r"<h([123])\s+id=\"([^\"]+)\"[^>]*>(.*?)</h\1>", re.S | re.I)


def clean_title(raw: str) -> str:
    """Heading markup -> plain text (tags stripped, entities decoded, space collapsed)."""
    text = re.sub(r"<[^>]+>", "", raw)
    return re.sub(r"\s+", " ", html_mod.unescape(text)).strip()


def bare(link: str) -> str:
    """'#section' -> 'section'; anything else -> '' (only '#' links are navigable)."""
    link = link or ""
    return link.lstrip("#").strip() if link.startswith("#") else ""


def collect_titles(entries, out: dict) -> dict:
    """Map bare anchor -> existing title, at every nesting depth."""
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        link = bare(entry.get("link"))
        if link and entry.get("title"):
            out.setdefault(link, entry["title"])
        if isinstance(entry.get("children"), list):
            collect_titles(entry["children"], out)
    return out
def migrate_page(page: pathlib.Path, existing, regen_titles: bool = False):
    """Build the template-shaped sidebar for one page.

    Returns (entries, report). The report carries the counts of the new tree plus
    the conditions a human must look at: anchors dropped because they are no longer
    on the page, `<h3>` that appear before any `<h2>`, and the reason a page could
    not be rooted at all.
    """
    source = page.read_text(encoding="utf-8", errors="ignore")
    titles = {} if regen_titles else collect_titles(existing, {})
    if not isinstance(existing, list):
        existing = []

    roots: list = []
    current_root = None
    current_chapter = None
    seen: set = set()
    misordered, errors = [], []

    for level, anchor, raw in HEADING_RE.findall(source):
        anchor = anchor.strip()
        if anchor in seen:
            continue
        seen.add(anchor)
        heading_text = clean_title(raw) or anchor
        label = heading_text if regen_titles else titles.get(anchor, heading_text)

        if level == "1":
            current_root = {"title": label, "link": f"#{anchor}", "children": []}
            current_chapter = None
            roots.append(current_root)
        elif level == "2":
            if current_root is None:
                errors.append(f"h2 #{anchor} appears before any h1")
                continue
            current_chapter = {"title": label, "link": f"#{anchor}"}
            current_root["children"].append(current_chapter)
        else:
            section = {"title": label, "link": f"#{anchor}"}
            if current_chapter is not None:
                current_chapter.setdefault("children", []).append(section)
            elif current_root is not None:
                misordered.append(anchor)
                current_root["children"].append(section)
            else:
                errors.append(f"h3 #{anchor} appears before any h1")

    report = {
        "blocked": None, "dropped": [], "misordered": sorted(misordered), "errors": errors,
        "roots": 0, "chapters": 0, "leaves": 0, "multi_root": False,
    }
    if not roots:
        report["blocked"] = "no anchorable <h1 id> on the page — the repair is a page edit"
        return [], report
    if not any(root["children"] for root in roots):
        # A root folder that contains nothing renders as an empty, pointless folder.
        report["blocked"] = "page has no <h2> chapters under its <h1> — nothing to navigate"
        return [], report
    report["multi_root"] = len(roots) > 1

    dropped = [a for a in collect_titles(existing, {}) if a and a not in seen]
    report["dropped"] = sorted(dropped)

    chapters = leaves = 0
    for root in roots:
        for child in root["children"]:
            if "children" in child:
                chapters += 1
                leaves += len(child["children"])
            else:
                leaves += 1  # leaf chapter (h2 without h3): still a navigable entry
    report.update(roots=len(roots), chapters=chapters, leaves=leaves)
    return roots, report


def targets_from_args(args) -> list:
    """Resolve --pages / --track / --all into a sorted list of sidecar paths."""
    if args.pages:
        return sorted(pathlib.Path(p) for p in args.pages)
    if args.all and args.track:
        raise SystemExit("ERROR: --all and --track are mutually exclusive")
    if args.all:
        tracks = sorted(p.name for p in (ROOT / "roadmap").iterdir() if p.is_dir())
    elif args.track:
        tracks = [args.track]
    else:
        raise SystemExit("ERROR: pass --pages, --track <name>, or --all")

    found = []
    for track in tracks:
        data = ROOT / "roadmap" / track / "data"
        if not data.is_dir():
            print(f"[WARN] no data directory for track '{track}'")
            continue
        found.extend(sorted(data.glob("*.json")))
    return found


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--pages", nargs="+", help="explicit sidecar JSON paths")
    parser.add_argument("--track", help="one track name under roadmap/")
    parser.add_argument("--all", action="store_true", help="every track")
    parser.add_argument("--dry-run", action="store_true", help="show diffs, write nothing")
    parser.add_argument("--regen-titles", action="store_true",
                        help="rebuild titles from the heading text verbatim "
                             "(default: keep the titles already stored in the sidecar)")
    parser.add_argument("--report", type=pathlib.Path, help="write a markdown report here")
    parser.add_argument("--max-diffs", type=int, default=6, help="diffs to print in --dry-run")
    args = parser.parse_args()

    stats = collections.Counter()
    per_track = collections.defaultdict(collections.Counter)
    report_lines = ["# Sidebar migration report", ""]
    failures = 0
    printed = 0

    for sidecar in targets_from_args(args):
        page = sidecar.parent.parent / f"{sidecar.stem}.html"
        track = sidecar.parent.parent.name
        rel = sidecar.relative_to(ROOT).as_posix()
        per_track[track]["total"] += 1

        if not page.is_file():
            stats["orphan"] += 1
            per_track[track]["orphan"] += 1
            report_lines.append(f"- ORPHAN `{rel}`: the page does not exist")
            continue
        try:
            existing = json.loads(sidecar.read_text(encoding="utf-8-sig"))
        except json.JSONDecodeError as exc:
            print(f"[FAIL] {rel}: invalid JSON - {exc}")
            failures += 1
            continue

        entries, rep = migrate_page(page, existing, regen_titles=args.regen_titles)
        if rep["blocked"]:
            stats["blocked"] += 1
            per_track[track]["blocked"] += 1
            report_lines.append(f"- BLOCKED `{track}/{sidecar.stem}`: {rep['blocked']}")
            continue
        if rep["errors"]:
            for error in rep["errors"]:
                print(f"[FAIL] {track}/{sidecar.stem}: {error}")
            failures += 1
            continue

        new_text = render(entries)
        old_text = sidecar.read_text(encoding="utf-8-sig")
        if existing == entries:
            # Same tree, possibly different formatting: leave the file byte-for-byte
            # alone. Only a structural change is worth a diff, which keeps the
            # migration reviewable and the history clean.
            stats["same"] += 1
            per_track[track]["same"] += 1
            continue
        if old_text == new_text:
            stats["same"] += 1
            per_track[track]["same"] += 1
            continue

        stats["migrated"] += 1
        per_track[track]["migrated"] += 1
        if rep["dropped"]:
            stats["dropped"] += len(rep["dropped"])
            report_lines.append(
                f"- DROPPED {len(rep['dropped'])} dead anchor(s) in `{track}/{sidecar.stem}`: "
                + ", ".join(f"`#{a}`" for a in rep["dropped"])
            )
        if rep["misordered"]:
            report_lines.append(
                f"- MISORDERED `{track}/{sidecar.stem}`: h3 before any h2 -> "
                + ", ".join(f"`#{a}`" for a in rep["misordered"])
            )
        if rep["multi_root"]:
            stats["multiroot"] += 1
            report_lines.append(
                f"- MULTI-ROOT `{track}/{sidecar.stem}`: {rep['roots']} top-level roots — the "
                "template expects ONE root (the page title); consider merging the page's <h1>s"
            )

        summary = (f"{rep['roots']} root / {rep['chapters']} chapters / {rep['leaves']} leaves")
        if args.dry_run:
            if printed < args.max_diffs:
                sys.stdout.writelines(difflib.unified_diff(
                    old_text.splitlines(keepends=True), new_text.splitlines(keepends=True),
                    fromfile=str(sidecar), tofile=f"{sidecar} (proposed)"))
                printed += 1
            print(f"[DRY ] {track}/{sidecar.stem}: {summary}")
        else:
            sidecar.write_text(new_text, encoding="utf-8")
            print(f"[OK  ] {track}/{sidecar.stem}: {summary}")

    print(f"\n{'[dry-run] ' if args.dry_run else ''}migrated={stats['migrated']} "
          f"unchanged={stats['same']} blocked={stats['blocked']} orphan={stats['orphan']} "
          f"dead-anchors-dropped={stats['dropped']} multi-root={stats['multiroot']}")
    print("\nper track (migrated / total, blocked):")
    for track in sorted(per_track):
        c = per_track[track]
        print(f"  {track:<12} {c['migrated']:>2}/{c['total']:<3} "
              f"blocked={c['blocked']:<3} unchanged={c['same']}")

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text("\n".join(report_lines) + "\n", encoding="utf-8")
        print(f"\nreport: {args.report}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
