#!/usr/bin/env python3
"""
Advanced XML Sitemap Generator for Sage-Code SCL
Generates SEO-optimized sitemaps with proper priority and changefreq values
Excludes template files, drafts, and non-indexable pages
"""

import os
from datetime import datetime
from urllib.parse import urljoin

# Configuration
BASE_URL = "https://sagecode.org"
OUTPUT_FILE = "sitemap.xml"
SOURCE_DIR = "./"

# Files and patterns to exclude from sitemap
EXCLUDE_PATTERNS = {
    "template.html",           # Template files
    "topic_template.html",     # Topic template
    "roadmap_template.html",   # Roadmap template
    "template.json",           # JSON templates
    "-content.html",           # Content fragment files
    "/components/",            # Non-route components folder
    "index.html" if os.path.exists("components") else None,  # components/index if exists
    # Add specific drafting/WIP pages if needed
}

# Remove None entries
EXCLUDE_PATTERNS = {p for p in EXCLUDE_PATTERNS if p}

# URL priority and change frequency rules based on path patterns
# Organized by actual Sage-Code SCL structure: /roadmap/<track>/<topic>
URL_PATTERNS = {
    # Homepage - highest priority
    "index.html": {"priority": 1.0, "changefreq": "weekly"},
    
    # Main roadmap hub - very high priority
    "/roadmap/": {"priority": 0.95, "changefreq": "weekly"},
    "/roadmap/index": {"priority": 0.95, "changefreq": "weekly"},
    
    # Roadmap auth pages - high priority
    "/roadmap/login": {"priority": 0.8, "changefreq": "monthly"},
    "/roadmap/register": {"priority": 0.8, "changefreq": "monthly"},
    "/roadmap/profile": {"priority": 0.8, "changefreq": "monthly"},
    "/roadmap/reset-password": {"priority": 0.7, "changefreq": "yearly"},
    
    # Roadmap track hubs (learning paths) - high priority
    "/roadmap/cse/": {"priority": 0.9, "changefreq": "monthly"},
    "/roadmap/csp/": {"priority": 0.9, "changefreq": "monthly"},
    "/roadmap/dsa/": {"priority": 0.9, "changefreq": "monthly"},
    "/roadmap/dba/": {"priority": 0.9, "changefreq": "monthly"},
    "/roadmap/dsl/": {"priority": 0.9, "changefreq": "monthly"},
    "/roadmap/hpc/": {"priority": 0.8, "changefreq": "quarterly"},
    "/roadmap/tek/": {"priority": 0.8, "changefreq": "quarterly"},
    "/roadmap/sml/": {"priority": 0.8, "changefreq": "quarterly"},
    "/roadmap/osd/": {"priority": 0.8, "changefreq": "quarterly"},
    
    # Popular programming languages (topics)
    "/roadmap/csp/python/": {"priority": 0.85, "changefreq": "monthly"},
    "/roadmap/csp/javascript/": {"priority": 0.85, "changefreq": "monthly"},
    "/roadmap/csp/svelte/": {"priority": 0.85, "changefreq": "monthly"},
    "/roadmap/csp/react/": {"priority": 0.85, "changefreq": "monthly"},
    "/roadmap/csp/typescript/": {"priority": 0.85, "changefreq": "monthly"},
    "/roadmap/csp/rust/": {"priority": 0.85, "changefreq": "quarterly"},
    "/roadmap/csp/go/": {"priority": 0.85, "changefreq": "quarterly"},
    "/roadmap/csp/java/": {"priority": 0.8, "changefreq": "quarterly"},
    "/roadmap/csp/cpp/": {"priority": 0.8, "changefreq": "quarterly"},
    "/roadmap/csp/csharp/": {"priority": 0.8, "changefreq": "quarterly"},
    
    # Core CSE topics
    "/roadmap/cse/": {"priority": 0.9, "changefreq": "monthly"},
    
    # Standard DSA topics
    "/roadmap/dsa/": {"priority": 0.9, "changefreq": "monthly"},
    
    # Database and infrastructure topics
    "/roadmap/dba/": {"priority": 0.85, "changefreq": "quarterly"},
    "/roadmap/hpc/": {"priority": 0.8, "changefreq": "quarterly"},
    "/roadmap/osd/": {"priority": 0.8, "changefreq": "quarterly"},
    
    # Topic index pages - medium-high priority
    "/roadmap/csp/": {"priority": 0.85, "changefreq": "monthly"},
    "/roadmap/csp/html/": {"priority": 0.8, "changefreq": "quarterly"},
    "/roadmap/csp/css/": {"priority": 0.8, "changefreq": "quarterly"},
    "/roadmap/csp/script/": {"priority": 0.8, "changefreq": "quarterly"},
    
    # Projects - medium priority
    "/projects/": {"priority": 0.8, "changefreq": "monthly"},
    "/projects/bee/": {"priority": 0.75, "changefreq": "yearly"},
    "/projects/eve/": {"priority": 0.75, "changefreq": "yearly"},
    "/projects/maj/": {"priority": 0.75, "changefreq": "yearly"},
    
    # Community section - medium priority
    "/community/": {"priority": 0.75, "changefreq": "monthly"},
    "/community/vip/": {"priority": 0.7, "changefreq": "yearly"},
    
    # Utility pages - low priority
    "/legal": {"priority": 0.5, "changefreq": "yearly"},
    "/manifesto": {"priority": 0.5, "changefreq": "yearly"},
}


def should_exclude(file_path, relative_path, url):
    """Check if file should be excluded from sitemap"""
    
    # Exclude sitemap and robots files
    if file_path.endswith(("sitemap.xml", "robots.txt")):
        return True
    
    # Exclude template files
    for exclude_pattern in EXCLUDE_PATTERNS:
        if exclude_pattern in relative_path or exclude_pattern in url:
            return True
    
    # Exclude files in excluded directories
    if "/node_modules/" in relative_path or "/__pycache__/" in relative_path:
        return True
    
    # Exclude hidden files/directories
    if "/.git" in relative_path or "/." in relative_path:
        return True
    
    # Exclude old structure routes that don't exist in current build
    old_routes = [
        "/engineering/",
        "/programming/",
        "/concepts/",
        "/paradigms/",
        "/structures/",
        "/algorithms/",
        "/components/",
    ]
    
    for old_route in old_routes:
        if old_route in url:
            return True
    
    return False


def get_priority_and_freq(url_path):
    """Determine priority and changefreq based on URL patterns"""
    default_priority = 0.6
    default_freq = "quarterly"
    
    # Check for exact and pattern matches (longer patterns first for specificity)
    sorted_patterns = sorted(URL_PATTERNS.keys(), key=len, reverse=True)
    for pattern in sorted_patterns:
        if pattern in url_path:
            settings = URL_PATTERNS[pattern]
            return settings["priority"], settings["changefreq"]
    
    return default_priority, default_freq


def get_last_modified(file_path):
    """Get file modification date or return today's date"""
    try:
        timestamp = os.path.getmtime(file_path)
        mod_date = datetime.fromtimestamp(timestamp)
        return mod_date.strftime("%Y-%m-%d")
    except:
        return datetime.now().strftime("%Y-%m-%d")


def generate_sitemap(base_url, source_dir, output_file):
    """Generate comprehensive XML sitemap with SEO optimization"""
    
    # Dictionary to store unique URLs (avoid duplicates)
    urls_dict = {}
    
    print("[*] Scanning for HTML files...")
    excluded_count = 0
    
    # Walk through all directories
    for root, dirs, files in os.walk(source_dir):
        # Skip hidden directories and common non-essential folders
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', '.git', 'public']]
        
        for file in sorted(files):
            if file.endswith(".html"):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, source_dir).replace("\\", "/")
                
                # Convert to URL format
                url = urljoin(base_url + "/", relative_path)
                
                # Check if file should be excluded
                if should_exclude(file_path, relative_path, url):
                    excluded_count += 1
                    print(f"  [SKIP] {relative_path}")
                    continue
                
                # Skip duplicate URLs
                if url not in urls_dict:
                    priority, changefreq = get_priority_and_freq(url)
                    lastmod = get_last_modified(file_path)
                    
                    urls_dict[url] = {
                        "priority": priority,
                        "changefreq": changefreq,
                        "lastmod": lastmod
                    }
                    print(f"  [ADD]  {relative_path} (priority: {priority}, freq: {changefreq})")
    
    print(f"\n[+] Found {len(urls_dict)} valid URLs")
    print(f"[+] Excluded {excluded_count} files (templates, drafts, etc.)")
    
    # Generate XML content
    sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n'
    
    # Sort URLs for consistent output
    for url in sorted(urls_dict.keys()):
        data = urls_dict[url]
        sitemap_content += '  <url>\n'
        sitemap_content += f'    <loc>{url}</loc>\n'
        sitemap_content += f'    <lastmod>{data["lastmod"]}</lastmod>\n'
        sitemap_content += f'    <changefreq>{data["changefreq"]}</changefreq>\n'
        sitemap_content += f'    <priority>{data["priority"]}</priority>\n'
        sitemap_content += '  </url>\n\n'
    
    sitemap_content += '</urlset>\n'
    
    # Write to file
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(sitemap_content)
        print(f"\n[OK] Sitemap successfully generated: {output_file}")
        print(f"[OK] Total URLs in sitemap: {len(urls_dict)}")
    except IOError as e:
        print(f"[ERROR] Error writing sitemap: {e}")


if __name__ == "__main__":
    print("=" * 70)
    print("SEO XML Sitemap Generator - Sage-Code SCL")
    print("=" * 70)
    generate_sitemap(BASE_URL, SOURCE_DIR, OUTPUT_FILE)
    print("=" * 70)

