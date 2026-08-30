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

    # 1. Identify the first meaningful heading (h1 or h2)
    # Remove everything before it
    first_heading = main_content.find(['h1', 'h2'])
    if first_heading:
        for sibling in list(first_heading.previous_siblings):
            sibling.decompose()
            
    # 2. Find the disclaimer/footer section
    # Remove everything from the disclaimer paragraph (or last hr) to the end
    
    # Try finding the disclaimer paragraph first
    disclaimer = main_content.find(string=lambda text: text and ("Disclaim:" in text or "Disclaimer:" in text))
    if disclaimer:
        target = disclaimer.parent
        # Go up until we are a direct child of main-content
        while target.parent != main_content:
            target = target.parent
        
        # Remove everything after this target
        for sibling in list(target.find_next_siblings()):
            sibling.decompose()
        # Remove the disclaimer container itself
        target.decompose()
    else:
        # Fallback to last hr
        hr_tags = main_content.find_all('hr')
        if hr_tags:
            last_hr = hr_tags[-1]
            for sibling in list(last_hr.find_next_siblings()):
                sibling.decompose()
            last_hr.decompose()

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
    process_directory(sys.argv[1])
