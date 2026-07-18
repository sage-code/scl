#!/usr/bin/env python3
"""
Advanced XML Sitemap Generator for CSE Website
Generates SEO-optimized sitemaps with proper priority and changefreq values
"""

import os
from datetime import datetime
from urllib.parse import urljoin

# Configuration
BASE_URL = "https://sagecode.org"
OUTPUT_FILE = "sitemap.xml"
SOURCE_DIR = "./"

# URL priority and change frequency rules based on path patterns
URL_PATTERNS = {
    # Homepage - highest priority
    "index.html": {"priority": 1.0, "changefreq": "weekly"},
    "/index": {"priority": 1.0, "changefreq": "weekly"},
    
    # Main category pages - very high priority
    "/programming/": {"priority": 0.9, "changefreq": "monthly"},
    "/engineering/": {"priority": 0.9, "changefreq": "monthly"},
    "/projects/": {"priority": 0.9, "changefreq": "monthly"},
    "/community/": {"priority": 0.9, "changefreq": "monthly"},
    
    # Core engineering tutorials - high priority
    "/concepts": {"priority": 0.8, "changefreq": "monthly"},
    "/paradigms": {"priority": 0.8, "changefreq": "monthly"},
    "/languages": {"priority": 0.8, "changefreq": "monthly"},
    "/patterns": {"priority": 0.8, "changefreq": "quarterly"},
    "/architecture": {"priority": 0.8, "changefreq": "quarterly"},
    
    # Popular programming languages
    "/python/": {"priority": 0.8, "changefreq": "monthly"},
    "/rust/": {"priority": 0.8, "changefreq": "quarterly"},
    "/javascript/": {"priority": 0.7, "changefreq": "quarterly"},
    "/java/": {"priority": 0.7, "changefreq": "quarterly"},
    "/go/": {"priority": 0.7, "changefreq": "quarterly"},
    
    # Standard tutorials - medium priority
    "/algorithms": {"priority": 0.7, "changefreq": "quarterly"},
    "/structures": {"priority": 0.7, "changefreq": "quarterly"},
    "/databases": {"priority": 0.7, "changefreq": "quarterly"},
    "/algebra": {"priority": 0.7, "changefreq": "quarterly"},
    
    # CSS and HTML sections
    "/css/": {"priority": 0.7, "changefreq": "quarterly"},
    "/html/": {"priority": 0.7, "changefreq": "quarterly"},
    "/dsc/": {"priority": 0.7, "changefreq": "quarterly"},
    
    # Detailed pages - medium-low priority
    "/css/syntax": {"priority": 0.6, "changefreq": "quarterly"},
    "/css/box-model": {"priority": 0.6, "changefreq": "quarterly"},
    "/html/forms": {"priority": 0.6, "changefreq": "quarterly"},
    "/hpc/": {"priority": 0.6, "changefreq": "quarterly"},
    "/osd/": {"priority": 0.6, "changefreq": "quarterly"},
    "/dsk/": {"priority": 0.6, "changefreq": "quarterly"},
    
    # Projects - lower priority
    "/projects/bee/": {"priority": 0.6, "changefreq": "yearly"},
    "/projects/eve/": {"priority": 0.6, "changefreq": "yearly"},
    "/projects/maj/": {"priority": 0.6, "changefreq": "yearly"},
    
    # Utility pages - lowest priority
    "/legal": {"priority": 0.5, "changefreq": "yearly"},
    "/manifesto": {"priority": 0.5, "changefreq": "yearly"},
}


def get_priority_and_freq(url_path):
    """Determine priority and changefreq based on URL patterns"""
    default_priority = 0.6
    default_freq = "quarterly"
    
    # Check for exact and pattern matches
    for pattern, settings in URL_PATTERNS.items():
        if pattern in url_path:
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
    
    # Walk through all directories
    for root, dirs, files in os.walk(source_dir):
        # Skip hidden directories and common non-essential folders
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__']]
        
        for file in sorted(files):
            if file.endswith(".html"):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, source_dir).replace("\\", "/")
                
                # Convert to URL format
                url = urljoin(base_url + "/", relative_path)
                
                # Skip duplicate URLs
                if url not in urls_dict:
                    priority, changefreq = get_priority_and_freq(url)
                    lastmod = get_last_modified(file_path)
                    
                    urls_dict[url] = {
                        "priority": priority,
                        "changefreq": changefreq,
                        "lastmod": lastmod
                    }
    
    print(f"[+] Found {len(urls_dict)} unique URLs")
    
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
        print(f"[✓] Sitemap successfully generated: {output_file}")
        print(f"[✓] Total URLs in sitemap: {len(urls_dict)}")
    except IOError as e:
        print(f"[✗] Error writing sitemap: {e}")


if __name__ == "__main__":
    print("=" * 60)
    print("SEO XML Sitemap Generator")
    print("=" * 60)
    generate_sitemap(BASE_URL, SOURCE_DIR, OUTPUT_FILE)
    print("=" * 60)

