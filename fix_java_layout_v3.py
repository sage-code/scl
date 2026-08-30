import os

def fix_java_layout_v3(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".html") and filename != "index.html":
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            if '<main id="main-content"' in content and content.count('<main id="main-content"') == 1:
                # Assuming it might already be correct if it has exactly one
                continue
                
            # Remove all existing main tags to start fresh for this block
            content = content.replace('</main>', '').replace('<main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">', '').replace('<main>', '')
            
            # Find aside
            aside_end = content.find('</aside>')
            if aside_end == -1:
                print(f"Skipping {filename}: No </aside>")
                continue
            
            # Find the end of the row
            row_end = content.find('</div>\n  </div>', aside_end)
            if row_end == -1:
                # Fallback to just finding the next div
                row_end = content.find('</div>', aside_end + 8)
                
            # Construct new content
            new_content = (
                content[:aside_end + 8] + 
                '\n\n      <main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">\n' +
                content[aside_end + 8:row_end] +
                '\n      </main>\n' +
                content[row_end:]
            )
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed {filename}")

fix_java_layout_v3("roadmap/java")
