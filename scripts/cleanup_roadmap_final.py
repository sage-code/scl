import os
from bs4 import BeautifulSoup
import json

def cleanup_page_final(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')
    main_content = soup.find('main', id='main-content')
    
    if not main_content:
        return

    # Identify the first header (h1 or h2)
    # Anything before this header inside main-content is considered "before the article"
    first_heading = main_content.find(['h1', 'h2'])
    
    if first_heading:
        # Collect all previous siblings to remove
        for sibling in list(first_heading.previous_siblings):
            sibling.decompose()
            
    # Remove everything after the Disclaimer
    # Look for a paragraph containing "Disclaim:" or "Disclaimer:"
    disclaimer = main_content.find(string=lambda text: text and ("Disclaim:" in text or "Disclaimer:" in text))
    
    if disclaimer:
        # Find the parent element of the disclaimer text
        target = disclaimer.parent
        # Go up until we are a direct child of main-content
        while target.parent != main_content:
            target = target.parent
            
        # Remove everything after this target
        for sibling in list(target.find_next_siblings()):
            sibling.decompose()
        # Remove the disclaimer element itself
        target.decompose()

    # Save the cleaned file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))

def process_directory(lang_dir):
    for filename in os.listdir(lang_dir):
        if filename.endswith('.html') and filename != 'index.html':
            print(f"Final cleanup for {filename}...")
            cleanup_page_final(os.path.join(lang_dir, filename))

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Usage: python cleanup_final.py <language_dir>")
    else:
        process_directory(sys.argv[1])
