import os
import re

def fix_html_files(directory):
    # This regex looks for the duplicated structure:
    # <main id="main-content"...>
    # <div class="container-fluid px-0">...
    # <main id="main-content"...>
    # It attempts to capture the duplicated part to be removed.
    
    # Actually, let's just read the file and do a string replace, it's safer.
    
    for filename in os.listdir(directory):
        if filename.endswith(".html") and filename != "index.html":
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Pattern to match the duplicated block
            # <div class="container-fluid px-0">\n    <div class="row g-0">\n      <aside class="side-bar col-lg-3 col-12">\n.*\n      </aside>\n\n      <main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">\n
            
            # Using a slightly more robust regex
            pattern = re.compile(
                r'<main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">\n'
                r'<div class="container-fluid px-0">\n'
                r'    <div class="row g-0">\n'
                r'      <aside class="side-bar col-lg-3 col-12">\n'
                r'        <div id="study-sidebar" class="sidebar-content shadow-sm p-3 sticky-top">\n'
                r'          <div class="d-flex justify-content-between align-items-center mb-2">\n'
                r'            <h5 class="mb-0">Lab Topics</h5>\n'
                r'          </div>\n'
                r'          <hr>\n'
                r'          <ul id="bookmark-list" class="list-unstyled">\n'
                r'          </ul>\n'
                r'        </div>\n'
                r'      </aside>\n\n'
                r'      <main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">\n',
                re.DOTALL
            )
            
            if pattern.search(content):
                new_content = pattern.sub('', content)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {filename}")
            else:
                print(f"Could not find pattern in {filename}")

fix_html_files("roadmap/java")
