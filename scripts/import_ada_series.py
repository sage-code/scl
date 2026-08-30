import os
import requests
from bs4 import BeautifulSoup
import json
import re

def slugify(text):
    return re.sub(r'[^a-z0-9]', '-', text.lower()).strip('-')

urls = [
    "https://sagecode.hashnode.dev/ada-generics",
    "https://sagecode.hashnode.dev/ada-oop",
    "https://sagecode.hashnode.dev/ada-io",
    "https://sagecode.hashnode.dev/ada-enumeration",
    "https://sagecode.hashnode.dev/ada-strings",
    "https://sagecode.hashnode.dev/ada-exceptions",
    "https://sagecode.hashnode.dev/ada-records",
    "https://sagecode.hashnode.dev/ada-arrays",
    "https://sagecode.hashnode.dev/ada-packages",
    "https://sagecode.hashnode.dev/ada-subprograms",
    "https://sagecode.hashnode.dev/ada-loops",
    "https://sagecode.hashnode.dev/ada-conditionals",
    "https://sagecode.hashnode.dev/ada-expressions",
    "https://sagecode.hashnode.dev/data-types",
    "https://sagecode.hashnode.dev/ada-syntax",
    "https://sagecode.hashnode.dev/ada-curriculum",
    "https://sagecode.hashnode.dev/ada-overview"
]

def fetch_article_content(article_url):
    response = requests.get(article_url)
    soup = BeautifulSoup(response.content, 'html.parser')
    article_body = soup.find('article') or soup.find('div', class_='post-content')
    return str(article_body) if article_body else "<p>Content not found.</p>"

def generate_roadmap(language_key):
    base_dir = f'roadmap/{language_key}'
    os.makedirs(base_dir, exist_ok=True)
    os.makedirs(f'{base_dir}/data', exist_ok=True)
    
    topics_file = f'{base_dir}/data/topic.json'
    topics = []
    if os.path.exists(topics_file):
        with open(topics_file, 'r', encoding='utf-8') as f:
            try:
                topics = json.load(f)
            except:
                topics = []
    
    existing_slugs = [t['id'] for t in topics]
    
    for url in urls:
        slug = url.split('/')[-1]
        if slug in existing_slugs:
            print(f"Skipping {slug}, already exists.")
            continue
            
        print(f"Importing {slug}...")
        
        # We need a title. For now just use slug, maybe we can fetch it.
        # Let's try to fetch title from H1 tag.
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        h1 = soup.find('h1')
        title = h1.get_text().strip() if h1 else slug.replace('-', ' ').title()
        
        topics.append({
            'id': slug,
            'title': title,
            'url': f'{slug}.html'
        })
        
        content = fetch_article_content(url)
        full_html = f"""<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
    <meta charset="utf-8">
    <title>{title}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/sage.css">
</head>
<body>
<div class="container">
    <main id="main-content">
        {content}
    </main>
</div>
</body>
</html>"""
        with open(f'{base_dir}/{slug}.html', 'w', encoding='utf-8') as f:
            f.write(full_html)
            
    with open(topics_file, 'w', encoding='utf-8') as f:
        json.dump(topics, f, indent=2)
        
    print(f"Generated roadmap in {base_dir}")

if __name__ == '__main__':
    generate_roadmap('ada')
