#!/usr/bin/env python3
"""
Auto-discovery and indexing of roadmap content.
Scans roadmap/ directory for topics and generates a comprehensive roadmap index.
Runs during the build process to keep the roadmap catalog up-to-date.
"""

import os
import json
import re
from pathlib import Path
from datetime import datetime

ROOT = Path.cwd()
ROADMAP_DIR = ROOT / "roadmap"
OUTPUT_INDEX = ROADMAP_DIR / "roadmap-index.json"

# Tracks defined in build.js
ROADMAP_BASE_FOLDERS = ["cse", "csp", "csa", "dsa", "dsl", "hpc", "tek", "dba", "sml", "osd", "dsk"]

# Files to exclude when discovering topics
EXCLUDE_FILES = {"index.html", "login.html", "profile.html", "register.html", "reset-password.html", "unregister.html", "README.md"}


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


def discover_topics(track_path):
    """Discover all topics in a track directory."""
    topics = []
    
    if not track_path.exists():
        return topics
    
    for entry in sorted(track_path.iterdir()):
        if not entry.is_dir():
            continue
        
        # Skip excluded entries
        if entry.name in EXCLUDE_FILES or entry.name.startswith("."):
            continue
        
        index_file = entry / "index.html"
        if not index_file.exists():
            continue
        
        # Read the index.html file
        try:
            with open(index_file, "r", encoding="utf-8") as f:
                html_content = f.read()
        except Exception as e:
            print(f"[WARN] Could not read {index_file}: {e}")
            continue
        
        # Extract metadata
        title = extract_title_from_html(html_content)
        description = extract_description_from_html(html_content)
        
        if not title:
            title = entry.name.replace("-", " ").title()
        
        topic = {
            "name": entry.name,
            "title": title,
            "description": description or "",
            "path": f"/roadmap/{entry.parent.name}/{entry.name}/index.html",
            "url": f"/roadmap/{entry.parent.name}/{entry.name}/"
        }
        
        topics.append(topic)
    
    return topics


def discover_roadmaps():
    """Discover all roadmaps across all tracks."""
    roadmaps = {}
    
    for track_name in ROADMAP_BASE_FOLDERS:
        track_path = ROADMAP_DIR / track_name
        if not track_path.exists():
            continue
        
        topics = discover_topics(track_path)
        if topics:
            roadmaps[track_name] = {
                "track": track_name,
                "path": f"/roadmap/{track_name}/",
                "topics": topics,
                "count": len(topics)
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
