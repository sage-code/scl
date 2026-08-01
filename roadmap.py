#!/usr/bin/env python3
"""Generate roadmap/roadmap-index.json from top-level roadmap folders."""

import json
import re
from pathlib import Path
from datetime import datetime

ROOT = Path.cwd()
ROADMAP_DIR = ROOT / "roadmap"
OUTPUT_INDEX = ROADMAP_DIR / "roadmap-index.json"

ENGINEERING_TRACKS = {"cse", "dsa", "dsl", "hpc", "tek", "dba", "sml", "osd"}
EXCLUDE_DIRS = {"assets", "labs"}


def extract_title_from_html(html_content):
    """Extract page title from HTML content."""
    # Try <title> tag first
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html_content, re.IGNORECASE)
    if title_match:
        return title_match.group(1).strip()
    
    # Try <h1> tag
    h1_match = re.search(r'<h1[^>]*>([^<]+)</h1>', html_content, re.IGNORECASE)
    if h1_match:
        return h1_match.group(1).strip()
    
    return None


def extract_description_from_html(html_content):
    """Extract description from meta tag or first paragraph."""
    # Try meta description
    meta_match = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', html_content, re.IGNORECASE)
    if meta_match:
        return meta_match.group(1).strip()
    
    # Try meta og:description
    og_match = re.search(r'<meta\s+property="og:description"\s+content="([^"]+)"', html_content, re.IGNORECASE)
    if og_match:
        return og_match.group(1).strip()
    
    # Try first paragraph
    p_match = re.search(r'<p[^>]*>([^<]+)</p>', html_content, re.IGNORECASE)
    if p_match:
        text = p_match.group(1).strip()
        if text and len(text) > 10:
            return text[:200]  # Limit to 200 chars
    
    return None


def discover_roadmaps():
    """Discover all top-level roadmap folders that expose index.html."""
    roadmaps = {}

    for entry in sorted(ROADMAP_DIR.iterdir()):
        if not entry.is_dir():
            continue

        name = entry.name.strip().lower()
        if not name or name.startswith(".") or name in EXCLUDE_DIRS:
            continue

        index_file = entry / "index.html"
        if not index_file.exists():
            continue

        try:
            with open(index_file, "r", encoding="utf-8") as file_handle:
                html_content = file_handle.read()
        except Exception as error:
            print(f"[WARN] Could not read {index_file}: {error}")
            continue

        title = extract_title_from_html(html_content) or name.replace("-", " ").title()
        description = extract_description_from_html(html_content) or ""
        kind = "engineering" if name in ENGINEERING_TRACKS else "language"

        roadmaps[name] = {
            "track": name,
            "kind": kind,
            "title": title,
            "description": description,
            "path": f"/roadmap/{name}/index.html",
            "url": f"/roadmap/{name}/",
            "topics": [],
            "count": 1,
        }

    return roadmaps


def generate_index(roadmaps):
    """Generate comprehensive roadmap index."""
    index = {
        "generated": datetime.now().isoformat(),
        "total_tracks": len(roadmaps),
        "total_topics": sum(r["count"] for r in roadmaps.values()),
        "tracks": roadmaps
    }
    
    return index


def write_index(index):
    """Write index to JSON file."""
    try:
        with open(OUTPUT_INDEX, "w", encoding="utf-8") as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
        
        total_topics = index["total_topics"]
        total_tracks = index["total_tracks"]
        print(f"[OK] Roadmap index generated: {total_topics} topics across {total_tracks} tracks")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to write roadmap index: {e}")
        return False


def main():
    """Main entry point."""
    print("[INFO] Discovering roadmaps...")
    roadmaps = discover_roadmaps()
    
    if not roadmaps:
        print("[WARN] No roadmaps discovered")
        return
    
    index = generate_index(roadmaps)
    write_index(index)


if __name__ == "__main__":
    main()
