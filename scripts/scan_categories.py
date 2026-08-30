import os
import re

def find_roadmap_indices():
    indices = []
    for root, dirs, files in os.walk('roadmap'):
        if 'index.html' in files:
            indices.append(os.path.join(root, 'index.html'))
    return indices

def scan_files(files):
    # Regex to look for common category-like patterns (often inside <tr> or headers)
    # The user wants "PHASE X: ..." style or similar.
    # I'll look for strings that look like section headers in the tables.
    category_pattern = re.compile(r'<tr[^>]*class="[^"]*category-separator[^"]*"', re.IGNORECASE)
    
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'category-separator' in content:
                print(f"Found category-separator in: {file}")
            # Also look for things like "Phase" or common header text in tables
            if 'Phase' in content:
                print(f"Possible phase header in: {file}")

if __name__ == '__main__':
    indices = find_roadmap_indices()
    scan_files(indices)
