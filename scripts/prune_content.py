import os
from bs4 import BeautifulSoup

def prune_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')
    main_content = soup.find('main', id='main-content')
    
    if not main_content:
        return

    # 1. Identify first meaningful heading (h1, h2)
    # Remove everything before it
    first_heading = main_content.find(['h1', 'h2'])
    if first_heading:
        for sibling in list(first_heading.previous_siblings):
            sibling.decompose()
            
    # 2. Find disclaimer/footer and remove it and everything after
    # Look for 'Disclaim:' text in any element
    disclaim = main_content.find(string=lambda text: text and "Disclaim:" in text)
    if disclaim:
        target = disclaim.parent
        while target.parent != main_content:
            target = target.parent
        
        # Remove everything after target
        for sibling in list(target.find_next_siblings()):
            sibling.decompose()
        # Remove target
        target.decompose()
    else:
        # Fallback: Remove all <hr> and everything after the last one
        hr_tags = main_content.find_all('hr')
        if hr_tags:
            last_hr = hr_tags[-1]
            for sibling in list(last_hr.find_next_siblings()):
                sibling.decompose()
            last_hr.decompose()

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))

def process_directory(lang_dir):
    for filename in os.listdir(lang_dir):
        if filename.endswith('.html') and filename != 'index.html':
            print(f"Pruning {filename}...")
            prune_content(os.path.join(lang_dir, filename))

if __name__ == '__main__':
    import sys
    process_directory(sys.argv[1])
