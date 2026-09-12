#!/usr/bin/env python3
"""Generate tracking/roadmaps-status.json for the Sage-Code SCL roadmap migration.

Classification per track:
  converted      - all topic pages have matching data/<topic>.json sidebar files,
                   no legacy topic.html remains, topic pages carry real content
  not_updated    - implemented topics but legacy artifacts remain (topic.html) or
                   per-topic sidebar JSONs are missing (incomplete migration)
  not_implemented- scaffold/placeholder tracks (no topic pages, empty data/ dir,
                   or topic pages are unstubbed "work in progress"/"to be replaced")
"""

import json
import os
import re
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "roadmap")
OUT = os.path.join(ROOT, "tracking", "roadmaps-status.json")

SKIP_PAGES = {
    "login.html", "register.html", "profile.html",
    "unregister.html", "reset-password.html", "code-viewer.html",
}

WIP = re.compile(
    r"To be replaced|Work In Progress|Work in progress|"
    r"under construction|template page you should not find",
    re.I,
)

NOTES = {
    "assembly": (
        'Full track: 17 topic pages with hierarchical data/*.json sidebars, '
        "20 demo programs (16 x86-64 NASM + 4 ARM64), references page, and "
        "track-specific SVG diagrams. Primary dialect x86-64 with NASM; "
        "ARM64, RISC-V, and WebAssembly covered in the Flavors lesson."
    ),
    "carbon": (
        'Most topic pages are bare "Work In Progress" stubs; data/ has '
        "sidebar JSONs but content is not written."
    ),
    "swift": (
        'All topic pages are "Work in progress!" / "Template page for '
        "tutorials\" placeholders (about 3.6 KB each); track index lacks a "
        "topics dashboard."
    ),
    "zig": "Scaffold only: single index.html, empty data/ folder; no topic pages.",
    "ada": (
        "Topic pages exist but per-topic sidebar JSONs are missing (only "
        "data/topic.json present); listed for cleanup in tracking/MIGRATION_PLAN.md "
        "and tracking/TODO.md."
    ),
    "cse": (
        "Legacy topic.html redirect remains and data/topic.json is missing; "
        "flagged as urgent in tracking/TODO.md and MIGRATION_PLAN.md."
    ),
    "go": (
        "Legacy topic.html redirect remains and data/topic.json is missing; "
        "flagged as urgent in tracking/TODO.md and MIGRATION_PLAN.md."
    ),
}


def collect_metrics(track):
    track_dir = os.path.join(BASE, track)
    topics = sorted(
        f for f in os.listdir(track_dir)
        if f.endswith(".html")
        and f not in SKIP_PAGES
        and f not in ("index.html", "topic.html")
    )

    data_dir = os.path.join(track_dir, "data")
    data_files = os.listdir(data_dir) if os.path.isdir(data_dir) else []
    json_files = [f for f in data_files if f.endswith(".json")]

    sizes = []
    wip_pages = []
    for page in topics:
        path = os.path.join(track_dir, page)
        size = os.path.getsize(path)
        sizes.append(size)
        text = open(path, encoding="utf-8", errors="ignore").read()
        if size < 6000 and WIP.search(text):
            wip_pages.append(page)

    missing_jsons = sorted(
        page.replace(".html", ".json")
        for page in topics
        if page.replace(".html", ".json") not in data_files
    )

    sorted_sizes = sorted(sizes)
    median = sorted_sizes[len(sorted_sizes) // 2] if sorted_sizes else 0

    return {
        "topic_pages": len(topics),
        "wip_pages": wip_pages,
        "placeholder_ratio": round(len(wip_pages) / len(topics), 2) if topics else 0.0,
        "median_topic_kb": round(median / 1024, 1),
        "sidebar_json_count": len(json_files),
        "missing_sidebar_jsons": missing_jsons,
        "has_data_topic_json": "topic.json" in data_files,
        "empty_data_dir": len(data_files) == 0,
        "has_legacy_topic_html": os.path.exists(os.path.join(track_dir, "topic.html")),
    }


def classify(track, metrics):
    if metrics["topic_pages"] == 0:
        return "not_implemented"
    if metrics["placeholder_ratio"] >= 0.5 and metrics["median_topic_kb"] < 5.0:
        return "not_implemented"
    if metrics["has_legacy_topic_html"] or metrics["missing_sidebar_jsons"]:
        return "not_updated"
    return "converted"


def collect_navigation_metrics(track):
    """Inspect roadmap/<track>/index.html against the roadmap index standard.

    New standard (see agents/gemini/README.md section 9):
      - progress bar element with id="roadmap-progress"
      - table with data-sage-roadmap / data-lab-id attributes
      - section (phase) rows using class "roadmap-phase-row"/"roadmap-phase"
      - topic rows using data-topic + class "topic-check"
      - roadmap.js progress script loaded
    """
    index_path = os.path.join(BASE, track, "index.html")
    text = ""
    if os.path.exists(index_path):
        try:
            text = open(index_path, encoding="utf-8", errors="ignore").read()
        except OSError:
            text = ""
    return {
        "has_progress_bar": "roadmap-progress" in text,
        "has_data_attributes": "data-sage-roadmap" in text and "data-lab-id" in text,
        "has_roadmap_script": "roadmap.js" in text,
        "phase_rows": text.count("roadmap-phase"),
        "topic_rows": text.count("data-topic="),
    }


def classify_navigation(metrics):
    if not metrics["has_progress_bar"] or not metrics["has_roadmap_script"]:
        return "needs-rebuild"
    if metrics["phase_rows"] == 0:
        return "needs-phases"
    return "standard"


NAVIGATION_NOTES = {
    "hpc": "Progress bar and scripts present but table has no phase/section rows.",
    "java": "Progress bar and scripts present but phases use separator-row instead of roadmap-phase.",
    "sml": "Progress bar and scripts present but table has no phase/section rows.",
}


def build_navigation_issues(track, navigation, navigation_status):
    issues = []
    if navigation_status == "needs-phases":
        issues.append(
            NAVIGATION_NOTES.get(
                track,
                "Progress bar and scripts present but table is not organized "
                "in phase/section rows.",
            )
        )
    elif navigation_status == "needs-rebuild":
        missing = []
        if not navigation["has_progress_bar"]:
            missing.append("progress bar (roadmap-progress)")
        if not navigation["has_roadmap_script"]:
            missing.append("roadmap.js progress script")
        if not navigation["has_data_attributes"]:
            missing.append("data-sage-roadmap/data-lab-id table attributes")
        if navigation["phase_rows"] == 0:
            missing.append("roadmap-phase section rows")
        issues.append(
            "Index lacks the navigation standard: {}.".format(
                " and ".join(sorted(missing))
            )
        )
    return issues


def build_issues(track, metrics, status):
    issues = []
    if status == "not_implemented":
        if track in NOTES:
            issues.append(NOTES[track])
    else:
        if metrics["has_legacy_topic_html"]:
            if not metrics["has_data_topic_json"]:
                issues.append(
                    "Legacy topic.html redirect file still present and "
                    "data/topic.json is missing; per the migration plan "
                    "topic.json should be generated from topic.html."
                )
            else:
                issues.append("Legacy topic.html redirect file still present.")
        if metrics["missing_sidebar_jsons"]:
            sample = ", ".join(metrics["missing_sidebar_jsons"][:5])
            issues.append(
                "Missing sidebar JSON for {} of {} topic pages "
                "(e.g. {}).".format(
                    len(metrics["missing_sidebar_jsons"]),
                    metrics["topic_pages"],
                    sample,
                )
            )
        if metrics["wip_pages"]:
            sample = ", ".join(metrics["wip_pages"][:6])
            issues.append(
                "{} topic page(s) still carry WIP/placeholder markers "
                "({}).".format(len(metrics["wip_pages"]), sample)
            )
    return issues


def main():
    tracks = sorted(d for d in os.listdir(BASE) if os.path.isdir(os.path.join(BASE, d)))

    index_path = os.path.join(BASE, "roadmap-index.json")
    with open(index_path, encoding="utf-8") as handle:
        index = json.load(handle)["tracks"]

    status_groups = {"converted": [], "not_updated": [], "not_implemented": []}
    navigation_groups = {"standard": [], "needs-phases": [], "needs-rebuild": []}
    track_list = []

    for track in tracks:
        metrics = collect_metrics(track)
        status = classify(track, metrics)
        status_groups[status].append(track)

        navigation = collect_navigation_metrics(track)
        navigation_status = classify_navigation(navigation)
        navigation_groups[navigation_status].append(track)

        entry = index.get(track, {})
        records = dict(metrics)
        records.update(
            {
                "track": track,
                "title": entry.get("title", ""),
                "kind": entry.get("kind", ""),
                "url": entry.get("url", "/roadmap/{}/".format(track)),
                "path": "roadmap/{}".format(track),
                "status": status,
                "issues": build_issues(track, metrics, status),
                "navigation_status": navigation_status,
                "navigation_issues": build_navigation_issues(
                    track, navigation, navigation_status
                ),
            }
        )
        track_list.append(records)

    sorted_by_track = sorted(track_list, key=lambda item: item["track"])

    document = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "about": "Roadmap migration status for the Sage-Code SCL site",
        "architecture_reference": [
            "New architecture: data-driven sidebar. Topic pages use "
            "window.TOPIC_CONFIG + assets/js/topic-loader.js, and every topic has "
            "a matching hierarchical sidebar JSON in roadmap/<track>/data/<topic>.json; "
            "the track home is a generated index.html.",
            "Old/legacy architecture: monolithic topic.html pages and static "
            "sidebars without per-topic JSON.",
            "Migration plan: tracking/MIGRATION_PLAN.md; TODO: tracking/TODO.md.",
        ],
        "classification_rules": {
            "converted": (
                "All topic pages have matching data/<topic>.json sidebar files; "
                "no legacy topic.html remains; topic pages carry real content. "
                "data/topic.json is only required while a track still carries a "
                "legacy topic.html; fully converted tracks render the topics hub "
                "from index.html. Residual WIP markers are advisory only."
            ),
            "not_updated": (
                "Track has implemented topics but retains legacy artifacts "
                "(topic.html) or is missing per-topic sidebar JSONs "
                "(incomplete migration)."
            ),
            "not_implemented": (
                "Scaffold/placeholder: no topic pages, empty data/ directory, or "
                "topic pages are unstubbed work-in-progress / to-be-replaced "
                "placeholders."
            ),
        },
        "navigation_rules": {
            "standard": (
                "index.html implements the roadmap index standard: progress bar, "
                "roadmap.js progress script, data-sage-roadmap/data-lab-id table "
                "attributes, roadmap-phase section rows, and data-topic rows."
            ),
            "needs-phases": (
                "index.html has the progress bar and roadmap.js but its topic "
                "table is not organized in roadmap-phase section rows."
            ),
            "needs-rebuild": (
                "index.html is a legacy/index style page without the progress "
                "bar or roadmap.js, so it lacks the navigation standard."
            ),
        },
        "summary": {
            "total_tracks": len(tracks),
            "converted": len(status_groups["converted"]),
            "not_updated": len(status_groups["not_updated"]),
            "not_implemented": len(status_groups["not_implemented"]),
        },
        "navigation_summary": {
            "total_tracks": len(tracks),
            "standard": len(navigation_groups["standard"]),
            "needs_phases": len(navigation_groups["needs-phases"]),
            "needs_rebuild": len(navigation_groups["needs-rebuild"]),
        },
        "status_groups": {
            group: sorted(names) for group, names in status_groups.items()
        },
        "navigation_groups": {
            group: sorted(names) for group, names in navigation_groups.items()
        },
        "tracks": sorted_by_track,
    }

    with open(OUT, "w", encoding="utf-8") as handle:
        json.dump(document, handle, indent=2, ensure_ascii=False)
        handle.write("\n")

    print("Wrote", os.path.relpath(OUT, ROOT))
    print("Summary:", json.dumps(document["summary"]))
    for group, names in document["status_groups"].items():
        print("{} ({}) : {}".format(group, len(names), ", ".join(names)))
    print("Navigation:", json.dumps(document["navigation_summary"]))
    for group, names in document["navigation_groups"].items():
        print("nav {} ({}) : {}".format(group, len(names), ", ".join(names)))


if __name__ == "__main__":
    main()
