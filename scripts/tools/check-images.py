#!/usr/bin/env python3
"""
Script to validate image references in HTML files
"""
import os
import re
import json
from pathlib import Path
from collections import defaultdict

# Base directory
BASE_DIR = r"c:\Users\eluci\sage-code\cse"

# Directories to scan
HTML_DIRS = [
    os.path.join(BASE_DIR, "programming"),
    os.path.join(BASE_DIR, "engineering")
]

# Pattern to extract img src attributes
IMG_PATTERN = re.compile(r'<img[^>]+src="([^"]*)"', re.IGNORECASE)

# Store results
issues = []
total_img_tags = 0
file_cache = {}  # Cache for file existence checks

def file_exists(path):
    """Check if file exists, with caching"""
    if path not in file_cache:
        file_cache[path] = os.path.isfile(path)
    return file_cache[path]

def resolve_image_path(src, html_file):
    """
    Resolve image path to absolute file system path
    Returns tuple: (resolved_path, issue_type, reason)
    """
    # Skip external URLs
    if src.startswith('http://') or src.startswith('https://'):
        return None, "external_url", "External URL"
    
    # If absolute path (starts with /)
    if src.startswith('/'):
        full_path = os.path.join(BASE_DIR, src.lstrip('/'))
        if file_exists(full_path):
            return full_path, None, None
        else:
            return full_path, "missing_file", f"File not found at {src}"
    
    # Relative path
    html_dir = os.path.dirname(html_file)
    relative_path = os.path.normpath(os.path.join(html_dir, src))
    
    if file_exists(relative_path):
        return relative_path, None, None
    
    return relative_path, "relative_path", f"Relative path '{src}' not found"

def get_line_number(file_path, src):
    """Get the line number where this img src appears"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                if f'src="{src}"' in line or f"src='{src}'" in line:
                    return line_num
    except:
        pass
    return None

def scan_html_files():
    """Scan all HTML files for image references"""
    global total_img_tags
    
    for html_dir in HTML_DIRS:
        for root, dirs, files in os.walk(html_dir):
            for file in files:
                if file.endswith('.html'):
                    html_file = os.path.join(root, file)
                    relative_file = os.path.relpath(html_file, BASE_DIR)
                    
                    try:
                        with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            matches = IMG_PATTERN.finditer(content)
                            
                            for match in matches:
                                total_img_tags += 1
                                src = match.group(1)
                                line_num = get_line_number(html_file, src)
                                
                                # Get position in content for line number calculation if needed
                                if not line_num:
                                    pos = match.start()
                                    line_num = content[:pos].count('\n') + 1
                                
                                resolved_path, issue_type, reason = resolve_image_path(src, html_file)
                                
                                # Only add broken references
                                if issue_type and issue_type != "external_url":
                                    issues.append({
                                        "file": relative_file,
                                        "line_number": line_num,
                                        "current_src": src,
                                        "issue_type": issue_type,
                                        "resolved_path": resolved_path,
                                        "reason": reason
                                    })
                    except Exception as e:
                        print(f"Error processing {html_file}: {e}")

def categorize_issues(issues):
    """Categorize issues by type"""
    categories = defaultdict(int)
    for issue in issues:
        categories[issue['issue_type']] += 1
    return dict(categories)

def main():
    """Main function"""
    print("Scanning HTML files for image references...")
    scan_html_files()
    
    print(f"Total image tags found: {total_img_tags}")
    print(f"Broken references: {len(issues)}")
    
    # Categorize
    by_type = categorize_issues(issues)
    
    # Create report
    report = {
        "summary": {
            "total_img_tags_scanned": total_img_tags,
            "broken_references": len(issues),
            "by_type": by_type
        },
        "issues": [
            {
                "file": issue['file'],
                "line_number": issue['line_number'],
                "current_src": issue['current_src'],
                "issue_type": issue['issue_type'],
                "expected_src": issue['current_src'],  # Could be improved
                "reason": issue['reason']
            }
            for issue in sorted(issues, key=lambda x: (x['file'], x['line_number']))
        ]
    }
    
    # Save report
    report_file = os.path.join(BASE_DIR, "image-validation-report.json")
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nReport saved to: {report_file}")
    print(f"\nBroken references by type:")
    for issue_type, count in by_type.items():
        print(f"  {issue_type}: {count}")

if __name__ == "__main__":
    main()
