import os
import requests
from bs4 import BeautifulSoup
import json
import re

def slugify(text):
    return re.sub(r'[^a-z0-9]', '-', text.lower()).strip('-')

def fetch_series_articles(series_url):
    response = requests.get(series_url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    articles = []
    
    # Hashnode series pages often load dynamically.
    # For now, we work with what we can scrape from the static HTML.
    for link in soup.find_all('a', href=True):
        href = link['href']
        text = link.get_text().strip()
        
        # Filter for article links:
        if ('ada' in text.lower() or 'ada' in href.lower()) and href.startswith('/'):
             if href not in ['/members', '/archive', '/sitemap.xml', '/rss.xml', '/']:
                 clean_title = text.split('Nov')[0].split('.')[0].strip()
                 if {'title': clean_title, 'url': f"https://sagecode.hashnode.dev{href}"} not in articles:
                     articles.append({'title': clean_title, 'url': f"https://sagecode.hashnode.dev{href}"})
    
    return articles

def fetch_article_content(article_url):
    response = requests.get(article_url)
    soup = BeautifulSoup(response.content, 'html.parser')
    article_body = soup.find('article') or soup.find('div', class_='post-content')
    return str(article_body) if article_body else "<p>Content not found.</p>"

def generate_roadmap(series_name, language_key, articles):
    base_dir = f'roadmap/{language_key}'
    os.makedirs(base_dir, exist_ok=True)
    os.makedirs(f'{base_dir}/data', exist_ok=True)
    
    # Load existing topics if any
    topics_file = f'{base_dir}/data/topic.json'
    topics = []
    if os.path.exists(topics_file):
        with open(topics_file, 'r', encoding='utf-8') as f:
            try:
                topics = json.load(f)
            except:
                topics = []
    
    existing_slugs = [t['id'] for t in topics]
    
    for article in articles:
        slug = slugify(article['title'])
        if slug in existing_slugs:
            print(f"Skipping {slug}, already exists.")
            continue
            
        print(f"Importing {article['title']}...")
        topics.append({
            'id': slug,
            'title': article['title'],
            'url': f'{slug}.html'
        })
        
        # Generate article file
        content = fetch_article_content(article['url'])
        full_html = f"""<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
    <meta charset="utf-8">
    <title>{article['title']}</title>
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
        
    print(f"Generated roadmap for {series_name} in {base_dir}")

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 3:
        print("Usage: python import_series.py <series_url> <language_key>")
    else:
        url = sys.argv[1]
        lang = sys.argv[2]
        print(f"Fetching articles from {url}...")
        articles = fetch_series_articles(url)
        print(f"Found {len(articles)} potential articles (static scrape).")
        generate_roadmap(lang, lang, articles)
