import os
import re

def fix_java_html_layout(directory):
    # Pattern to find the closing </aside> and make sure <main> starts after it
    # We look for </aside> followed by content and ensure <main> wraps it.
    
    # Let's target the structure:
    # ... </aside>
    # 
    # <h1 ...>
    
    # We want:
    # ... </aside>
    #
    # <main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">
    # <h1 ...>
    # ...
    # </main>
    
    for filename in os.listdir(directory):
        if filename.endswith(".html") and filename != "index.html":
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if main is missing
            if '<main id="main-content"' not in content:
                # Find </aside>
                aside_end = content.find('</aside>')
                if aside_end == -1:
                    print(f"Skipping {filename}: No </aside> found")
                    continue
                
                # Insert main opening tag after </aside>
                # Find the next h1 to be sure
                h1_start = content.find('<h1', aside_end)
                if h1_start == -1:
                    print(f"Skipping {filename}: No <h1> found")
                    continue
                
                # Split and inject
                new_content = (
                    content[:aside_end + 8] +
                    '\n\n<main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">\n' +
                    content[h1_start:]
                )
                
                # Close </main> before the footer
                footer_start = new_content.find('<hr>', h1_start) # Finding a safe point to close main
                if footer_start == -1:
                     footer_start = new_content.find('<footer', h1_start)
                
                if footer_start != -1:
                    new_content = new_content[:footer_start] + '</main>\n\n' + new_content[footer_start:]
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {filename}")

fix_java_html_layout("roadmap/java")
