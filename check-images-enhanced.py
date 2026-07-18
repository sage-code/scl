#!/usr/bin/env python3
"""
Enhanced script to validate image references with better categorization
"""
import os
import re
import json
from pathlib import Path
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
    """Check if file exists, with caching"""
    if path not in file_cache:
        file_cache[path] = os.path.isfile(path)
    return file_cache[path]

def get_similar_file(base_path):
    """Find similar file with different extension"""
    base_name = os.path.splitext(base_path)[0]
    directory = os.path.dirname(base_path)
    
    if not os.path.isdir(directory):
        return None
    
    try:
        for file in os.listdir(directory):
            file_path = os.path.join(directory, file)
            if os.path.splitext(file_path)[0] == base_name:
                return file_path
    except:
        pass
    
    return None

def categorize_issue(src, html_file, resolved_path):
    """Categorize the issue type and suggest fix"""
    
    # Pattern 1: /hdw/img/* should be /engineering/hdw/img/*
    if src.startswith('/hdw/img/'):
        corrected_src = src.replace('/hdw/img/', '/engineering/hdw/img/')
        corrected_path = os.path.join(BASE_DIR, corrected_src.lstrip('/'))
        if file_exists(corrected_path):
            return "wrong_path_missing_prefix", corrected_src, f"Should be '{corrected_src}'"
        return "missing_engineering_hw_file", src, f"File not found (also tried '{corrected_src}')"
    
    # Pattern 2: /dsc/img/* should be /engineering/dsc/img/*
    if src.startswith('/dsc/img/'):
        corrected_src = src.replace('/dsc/img/', '/engineering/dsc/img/')
        corrected_path = os.path.join(BASE_DIR, corrected_src.lstrip('/'))
        if file_exists(corrected_path):
            return "wrong_path_missing_prefix", corrected_src, f"Should be '{corrected_src}'"
        return "missing_engineering_ds_file", src, f"File not found (also tried '{corrected_src}')"
    
    # Pattern 3: Absolute path with wrong extension (e.g., .jpg when only .svg exists)
    if src.startswith('/images/'):
        similar = get_similar_file(resolved_path)
        if similar:
            similar_src = '/images/' + os.path.basename(similar)
            return "wrong_file_extension", similar_src, f"File {src} doesn't exist, but {similar_src} does"
    
    # Pattern 4: Relative paths
    if not src.startswith('/') and not src.startswith('http'):
        # Check if should be absolute path
        if '/' in src and not src.startswith('.'):
            # Might be relative path that should be absolute
            potential_absolute = '/' + src
            potential_abs_path = os.path.join(BASE_DIR, src)
            if file_exists(potential_abs_path):
                return "relative_path_should_be_absolute", potential_absolute, f"Should be '{potential_absolute}' (absolute path)"
        return "relative_path_not_found", src, f"Relative path not found"
    
    return "missing_file", src, "File not found"

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
                                    issue_type, expected_src, reason = categorize_issue(src, html_file, full_path)
                                    
                                    issues.append({
                                        "file": relative_file,
                                        "line_number": line_num,
                                        "current_src": src,
                                        "issue_type": issue_type,
                                        "expected_src": expected_src,
                                        "reason": reason
                                    })
                    except Exception as e:
                        print(f"Error processing {html_file}: {e}")

def categorize_by_type(issues):
    """Group issues by type"""
    categories = defaultdict(list)
    for issue in issues:
        categories[issue['issue_type']].append(issue)
    return dict(categories)

def main():
    """Main function"""
    print("Scanning HTML files for image references...")
    scan_html_files()
    
    print(f"Total image tags found: {total_img_tags}")
    print(f"Broken references: {len(issues)}")
    
    # Categorize by type
    by_type_dict = categorize_by_type(issues)
    by_type_count = {k: len(v) for k, v in by_type_dict.items()}
    
    # Create report
    report = {
        "summary": {
            "total_img_tags_scanned": total_img_tags,
            "broken_references": len(issues),
            "by_type": by_type_count
        },
        "issues_by_category": {}
    }
    
    # Add issues grouped by type for easier understanding
    for issue_type in sorted(by_type_dict.keys()):
        issues_of_type = sorted(by_type_dict[issue_type], key=lambda x: (x['file'], x['line_number']))
        report["issues_by_category"][issue_type] = issues_of_type
    
    # Also include flat list for compatibility
    report["issues"] = sorted(issues, key=lambda x: (x['file'], x['line_number']))
    
    # Save report
    report_file = os.path.join(BASE_DIR, "image-validation-report.json")
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nReport saved to: {report_file}")
    print(f"\nBroken references by category:")
    for issue_type in sorted(by_type_count.keys()):
        count = by_type_count[issue_type]
        print(f"  {issue_type}: {count}")
        
        # Show first few examples
        examples = by_type_dict[issue_type][:2]
        for example in examples:
            print(f"    - {example['file']} (line {example['line_number']})")
            print(f"      Current: {example['current_src']}")
            print(f"      Suggested: {example['expected_src']}")

if __name__ == "__main__":
    main()
