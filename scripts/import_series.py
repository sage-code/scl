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
    
    for link in soup.find_all('a', href=True):
        href = link['href']
        text = link.get_text().strip()
        
        # Filter for article links:
        # 1. Must have "ada" in the text or href
        # 2. Must not be a nav link
        if ('ada' in text.lower() or 'ada' in href.lower()) and href.startswith('/'):
             # Avoid nav links
             if href not in ['/members', '/archive', '/sitemap.xml', '/rss.xml', '/']:
                 # Clean up title: remove "Nov 27, 2023·6 min read·34" etc.
                 
                 # Let's clean the title by taking only the part before the first "." or "Nov"
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
    
    # Generate data/topic.json
    topics = []
    for i, article in enumerate(articles):
        slug = slugify(article['title'])
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
            
    with open(f'{base_dir}/data/topic.json', 'w', encoding='utf-8') as f:
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
        print(f"Found {len(articles)} articles.")
        for a in articles:
            print(f" - {a['title']}: {a['url']}")
        generate_roadmap(lang, lang, articles)
