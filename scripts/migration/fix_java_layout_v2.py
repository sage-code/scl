import os

def fix_java_layout(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".html") and filename != "index.html":
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find the start of the row
            row_start = content.find('<div class="row g-0">')
            if row_start == -1:
                continue
            
            # Find aside
            aside_start = content.find('<aside', row_start)
            aside_end = content.find('</aside>', aside_start)
            if aside_end == -1:
                continue
            
            # Find footer start to know where content ends
            footer_start = content.find('<hr>', aside_end)
            if footer_start == -1:
                footer_start = content.find('<footer', aside_end)
            
            # Extract content between aside_end and footer
            content_area = content[aside_end+8:footer_start].strip()
            
            # Construct new content structure
            new_structure = (
                '<div class="row g-0">\n'
                '      <aside class="side-bar col-lg-3 col-12">\n' +
                content[aside_start+6:aside_end] +
                '      </aside>\n\n'
                '      <main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">\n' +
                content_area +
                '\n      </main>\n'
                '    </div>'
            )
            
            # Replace the old row content
            row_end = content.find('</div>', footer_start)
            # This is too risky with string slicing.
            
            # Let's use a simpler approach:
            # Just remove all <main> tags and re-insert the correct one
            
            # 1. Clean up existing main tags
            clean_content = content.replace('</main>', '').replace('<main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">', '').replace('<main>', '')
            
            # 2. Re-apply correct structure
            # Actually, I'll just manually fix the one I know is broken first, then see.
            
            print(f"Skipping {filename}: Need better logic.")

print("Need better fix logic.")
