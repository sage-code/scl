#!/usr/bin/env python3
"""
Final validation script to generate the exact JSON format requested
"""
import os
import re
import json
from collections import defaultdict

BASE_DIR = r"c:\Users\eluci\sage-code\cse"

HTML_DIRS = [
    os.path.join(BASE_DIR, "programming"),
    os.path.join(BASE_DIR, "engineering")
]

IMG_PATTERN = re.compile(r'<img[^>]+src="([^"]*)"', re.IGNORECASE)

issues = []
total_img_tags = 0
file_cache = {}

def file_exists(path):
    if path not in file_cache:
        file_cache[path] = os.path.isfile(path)
    return file_cache[path]

def get_suggestion(src, html_file, resolved_path):
    """Generate expected_src suggestion"""
    
    # Pattern 1: /hdw/img/* should be /engineering/hdw/img/*
    if src.startswith('/hdw/img/'):
        return src.replace('/hdw/img/', '/engineering/hdw/img/')
    
    # Pattern 2: /dsc/img/* should be /engineering/dsc/img/*
    if src.startswith('/dsc/img/'):
        return src.replace('/dsc/img/', '/engineering/dsc/img/')
    
    # Pattern 3: Relative path without leading slash
    if not src.startswith('/') and not src.startswith('http'):
        if '/' in src and not src.startswith('.'):
            return '/' + src
        # For ../../ paths, suggest absolute path
        if src.startswith('..'):
            return '/images/' + os.path.basename(src)
    
    return src

def categorize_issue(src):
    """Categorize the issue"""
    
    if src.startswith('/hdw/img/') or src.startswith('/dsc/img/'):
        return "wrong_path"
    
    if src.endswith('.jpg') and '/images/' in src:
        return "wrong_extension"
    
    if not src.startswith('/') and not src.startswith('http'):
        return "relative_path"
    
    return "missing_file"

def get_line_number(file_path, src):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                if f'src="{src}"' in line or f"src='{src}'" in line:
                    return line_num
    except:
        pass
    return None

def scan_html_files():
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
                                
                                # Skip external URLs
                                if src.startswith('http://') or src.startswith('https://'):
                                    continue
                                
                                line_num = get_line_number(html_file, src)
                                if not line_num:
                                    pos = match.start()
                                    line_num = content[:pos].count('\n') + 1
                                
                                # Check if file exists
                                if src.startswith('/'):
                                    full_path = os.path.join(BASE_DIR, src.lstrip('/'))
                                else:
                                    html_dir_path = os.path.dirname(html_file)
                                    full_path = os.path.normpath(os.path.join(html_dir_path, src))
                                
                                if not file_exists(full_path):
                                    issue_type = categorize_issue(src)
                                    expected_src = get_suggestion(src, html_file, full_path)
                                    
                                    # Determine reason
                                    if issue_type == "wrong_path":
                                        reason = "Path missing '/engineering/' prefix"
                                    elif issue_type == "wrong_extension":
                                        reason = "File references .jpg but only .svg exists"
                                    elif issue_type == "relative_path":
                                        reason = f"Relative path not found (tried: {full_path})"
                                    else:
                                        reason = f"File does not exist"
                                    
                                    issues.append({
                                        "file": relative_file.replace('\\', '/'),
                                        "line_number": line_num,
                                        "current_src": src,
                                        "issue_type": issue_type,
                                        "expected_src": expected_src,
                                        "reason": reason
                                    })
                    except Exception as e:
                        pass

def main():
    scan_html_files()
    
    # Count by type
    by_type = defaultdict(int)
    for issue in issues:
        by_type[issue['issue_type']] += 1
    
    # Create final report
    report = {
        "summary": {
            "total_img_tags_scanned": total_img_tags,
            "broken_references": len(issues),
            "by_type": dict(by_type)
        },
        "issues": sorted(issues, key=lambda x: (x['file'], x['line_number']))
    }
    
    # Save report
    report_file = os.path.join(BASE_DIR, "image-validation-report-final.json")
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
