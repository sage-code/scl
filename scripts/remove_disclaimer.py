import os
from bs4 import BeautifulSoup

def remove_disclaimer_and_footer(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')
    main_content = soup.find('main', id='main-content')
    if not main_content: return

    # Find the disclaimer paragraph
    disclaimer = main_content.find(string=lambda text: text and ("Disclaim:" in text or "Disclaimer:" in text))
    
    if disclaimer:
        # The disclaimer is usually inside a p tag, which might be in a div
        target = disclaimer.parent
        
        # Remove the disclaimer itself
        target.decompose()
        
        # Remove everything after the disclaimer container (social links/footer junk)
        for sibling in list(target.find_next_siblings()):
            sibling.decompose()
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))

def process_directory(lang_dir):
    for filename in os.listdir(lang_dir):
        if filename.endswith('.html') and filename != 'index.html':
            print(f"Removing disclaimer/footer from {filename}...")
            remove_disclaimer_and_footer(os.path.join(lang_dir, filename))

if __name__ == '__main__':
    import sys
    process_directory(sys.argv[1])
