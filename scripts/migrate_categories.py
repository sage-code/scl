import os
import re

def migrate_roadmap_categories():
    # Targets: Any row that acts as a header (contains "Phase X: ..." or similar)
    # We want to replace existing classes with 'roadmap-phase-row' and the header with 'roadmap-phase'
    
    for root, dirs, files in os.walk('roadmap'):
        if 'index.html' in files:
            path = os.path.join(root, 'index.html')
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            
            # Pattern 1: <tr class="table-group-header"><th colspan="4" class="...">Phase Text</th></tr>
            new_content = re.sub(
                r'<tr\s+class="table-group-header">\s*<th\s+colspan="4"[^>]*>(.*?)</th>\s*</tr>',
                r'<tr class="roadmap-phase-row"><th colspan="4" class="roadmap-phase">\1</th></tr>',
                new_content, flags=re.DOTALL | re.IGNORECASE
            )
            
            # Pattern 2: <tr class="category-separator/table-secondary"><td colspan="4"><strong>Phase Text</strong></td></tr>
            # We want to convert to <tr class="roadmap-phase-row"><th colspan="4" class="roadmap-phase">PHASE TEXT</th></tr>
            def repl_pattern2(match):
                # match.group(2) is the content (should be <strong>Text</strong> or similar)
                # We need to strip the <strong> tags or keep them? The <th> already styles it.
                # Let's extract the text content.
                content = match.group(2)
                # Remove <strong> and </strong> if present
                content = re.sub(r'</?strong>', '', content, flags=re.IGNORECASE)
                return f'<tr class="roadmap-phase-row"><th colspan="4" class="roadmap-phase">{content.strip()}</th></tr>'

            new_content = re.sub(
                r'<tr\s+class="(category-separator|table-secondary)">\s*<td\s+colspan="4">(.*?)</td>\s*</tr>',
                repl_pattern2,
                new_content, flags=re.DOTALL | re.IGNORECASE
            )

            # Ensure text inside is uppercase
            # Find the roadmap-phase-row and uppercase the text content inside
            new_content = re.sub(r'(<th[^>]*class="roadmap-phase"[^>]*>)(.*?)(</th>)', 
                                lambda m: m.group(1) + m.group(2).upper() + m.group(3), 
                                new_content, flags=re.DOTALL | re.IGNORECASE)

            if new_content != content:
                print(f"Updated: {path}")
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)

if __name__ == '__main__':
    migrate_roadmap_categories()

