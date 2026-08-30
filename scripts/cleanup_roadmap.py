import os
import requests
from bs4 import BeautifulSoup
import json
import re

def cleanup_page(file_path, language_key, topic_id):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')
    article = soup.find('article')
    if not article: return

    # Content identification: Find the first meaningful heading
    first_heading = article.find(['h1', 'h2'])
    
    # Everything after the first heading up to the last hr
    content_tags = []
    if first_heading:
        content_tags = list(first_heading.find_all_next())
        content_tags.insert(0, first_heading)
    else:
        content_tags = list(article.children)

    hr_tags = article.find_all('hr')
    last_hr = hr_tags[-1] if hr_tags else None
    
    final_content = []
    for tag in content_tags:
        if last_hr and tag == last_hr:
            break
        # ONLY keep content-rich tags, discard divs
        if tag.name in ['p', 'h1', 'h2', 'h3', 'pre', 'ul', 'ol', 'hr']:
            final_content.append(tag)

    new_html = f"""<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
  <meta charset="utf-8">
  <title>{soup.title.string if soup.title else 'Ada Lab'}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="icon" type="image/png" href="/images/favicon.ico">
  <link rel="stylesheet" href="/prism.css">
  <link rel="stylesheet" href="/sage.css">
  <script src="/prism.js"></script>
</head>
<body>

<div class="container">
  <header id="dynamic-header" class="container-fluid pb-2"></header>

  <div class="container-fluid px-0">
    <div class="row g-0">
      <aside class="side-bar col-lg-3 col-12">
        <div id="study-sidebar" class="sidebar-content shadow-sm p-3 sticky-top">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0">Lab Topics</h5>
          </div>
          <hr>
          <ul id="bookmark-list" class="list-unstyled"></ul>
        </div>
      </aside>

      <main id="main-content" class="col-lg-9 col-12 order-2 order-lg-1 p-3">
        {"".join([str(t) for t in final_content])}
      </main>
    </div>
  </div>

  <footer class="footer copyright">
    <p class="x-small text-secondary mb-0">&copy; 2026 Sage-Code Laboratory</p>
  </footer>
</div>

<script>
  window.TOPIC_CONFIG = {{
    labId: '{language_key}',
    topicId: '{topic_id}',
    homeLink: './index.html#topics',
    labHomeLink: './index.html',
    inlineContent: true
  }};
</script>
<script src="/assets/js/sage.js" defer></script>
<script src="/assets/js/progress.js" defer></script>
<script src="/assets/js/lab-progress-bridge.js" defer></script>
<script src="/assets/js/topic-loader.js" defer></script>
</body>
</html>
"""
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_html)

def process_directory(lang_dir, language_key):
    topic_json = os.path.join(lang_dir, 'data', 'topic.json')
    with open(topic_json, 'r') as f:
        topics = json.load(f)
    
    mapping = {t['url']: t['id'] for t in topics}
    
    for filename in os.listdir(lang_dir):
        if filename.endswith('.html') and filename != 'index.html':
            if filename in mapping:
                print(f"Cleaning {filename}...")
                cleanup_page(os.path.join(lang_dir, filename), language_key, mapping[filename])
            else:
                print(f"Skipping {filename} (no ID found)")

if __name__ == '__main__':
    import sys
    lang_dir = sys.argv[1]
    language_key = os.path.basename(lang_dir)
    process_directory(lang_dir, language_key)
