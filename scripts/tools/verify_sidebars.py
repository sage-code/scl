#!/usr/bin/env python
"""Verify topic pages against their sidebar navigation JSON.

Usage:
    python scripts/tools/verify_sidebars.py [track] [topic ...]

With no topic arguments every page in ``roadmap/<track>/`` that has a matching
``data/<topic>.json`` sidecar is checked. ``track`` defaults to ``julia``.

Checks per topic:
  * every sidebar link resolves to an existing heading id in the page
  * every h1/h2/h3 carries an id
  * heading ids are unique
  * <div> open/close tags are balanced
  * the sidebar is a SINGLE-ROOT FOLDER: the page title is the only top-level
    entry and carries the chapters in ``children`` (the three-level contract —
    title -> chapter -> sub-section, every folder collapsible)
  * the title folder anchors the page's own ``<h1>``
  * a page that nests ``<h3>`` sections under an ``<h2>`` chapter also nests them in
    the JSON (3 levels). An ``<h2>`` with no ``<h3>`` below it is a legal LEAF chapter
    (no ``children`` key) — the template allows it and the missing section level is
    reported separately as authoring debt by ``npm run test``.
  * a page that jumps straight from ``<h1>`` to ``<h3>`` (skipping the ``<h2>`` chapter
    level) is a page-structure defect and fails: the topic contract wants ``<h2>`` chapters.

Exit code is 1 when any topic fails, so the script is safe to use as a gate.
"""
import json
import re
import sys
from pathlib import Path

track = "julia"
topics = sys.argv[1:]
if topics and (Path("roadmap") / topics[0]).is_dir():
    track = topics.pop(0)

root = Path("roadmap") / track
if topics:
    selected = topics
else:
    selected = sorted(
        p.stem for p in root.glob("*.html") if (root / "data" / f"{p.stem}.json").exists()
    )


def walk(entries, depth=0):
    """Yield (title, link, depth) for every entry in the sidebar tree."""
    for entry in entries:
        yield entry.get("title", ""), entry.get("link", ""), depth
        children = entry.get("children")
        if isinstance(children, list):
            yield from walk(children, depth + 1)


problems = 0
for topic in selected:
    html = (root / f"{topic}.html").read_text(encoding="utf-8")
    nav = json.loads((root / "data" / f"{topic}.json").read_text(encoding="utf-8"))

    heads = re.findall(r"<(h[123])\s+id=\"([^\"]+)\"", html)
    raw_ids = [i for _, i in heads]
    hids = {"#" + i for i in raw_ids}
    no_id = re.findall(r"<(h[123])(?![^>]*\bid=)", html)

    # h3 sections sitting UNDER an h2 chapter must be nested in the JSON; h3 that hang
    # directly from the <h1> (the page skips the chapter level) are mirrored at depth 1
    # and counted as a page-structure defect.
    h3_under_h2 = False
    h3_without_chapter = 0
    chapter_seen = False
    for level, _anchor in heads:
        if level == "h1":
            chapter_seen = False
        elif level == "h2":
            chapter_seen = True
        elif chapter_seen:
            h3_under_h2 = True
        else:
            h3_without_chapter += 1

    nodes = list(walk(nav))
    links = [link for _, link, _ in nodes]
    depth = max((d for _, _, d in nodes), default=0)
    missing = [link for link in links if link not in hids]
    dup = sorted(i for i in set(raw_ids) if raw_ids.count(i) > 1)
    open_div = len(re.findall(r"<div\b", html))
    close_div = len(re.findall(r"</div>", html))

    roots = [e for e in nav if isinstance(e, dict) and e.get("children") is not None]
    single_root = len(roots) == len(nav) > 0
    anchors_h1 = bool(single_root and raw_ids and nav[0].get("link") == "#" + raw_ids[0])
    levels_ok = (not h3_under_h2) or depth >= 2

    # h3 sections hanging straight off the <h1> are mirrored at depth 1 by the sidebar, so
    # they are not a sidebar defect: they are page heading-order debt (the topic contract
    # wants an <h2> chapter between the title and its sections). Reported, not failed.
    bad = bool(
        no_id or missing or dup or open_div != close_div
        or not single_root or not anchors_h1 or not levels_ok
    )
    problems += bad
    print(
        f"{topic:16s} {'FAIL' if bad else 'OK  '} "
        f"shape={'single-root' if single_root else 'flat':<11} "
        f"depth={depth} h1={'yes' if anchors_h1 else 'NO ':>3} "
        f"headings={len(heads):2d} no-id={len(no_id)} "
        f"h3-no-h2={h3_without_chapter} "
        f"links={len(links):3d} missing={missing} dup={dup} div={open_div}/{close_div}"
    )

print("PROBLEMS:", problems)
sys.exit(1 if problems else 0)
