"""Create placeholder topic pages + sidebars for the DSA roadmap's planned topics.

The DSA track is authored phase by phase. Topics listed on the index before
their phase is written need a page (so links resolve) and a template-shaped
sidebar JSON. This script creates ONLY missing files and never overwrites
existing content.

Usage:
    python scripts/tools/scaffold_dsa_placeholders.py [--dry-run]
"""
import json
import sys
from pathlib import Path

TRACK = Path("roadmap/dsa")

# slug -> (page title, one-line scope used in the meta description)
PLANNED = {
    "arrays-slices": ("Arrays & Slices", "slice internals, two pointers, sliding window, and prefix sums in Go"),
    "linked-lists": ("Linked Lists", "singly and doubly linked lists, sentinels, and pointer manipulation in Go"),
    "stacks-queues": ("Stacks & Queues", "stacks, queues, ring buffers, deques, and monotonic stacks in Go"),
    "hash-tables": ("Hash Tables", "hashing, collision handling, and map-based problem patterns in Go"),
    "trees": ("Binary Trees & BST", "binary tree traversals and binary search trees in Go"),
    "heaps": ("Heaps & Priority Queues", "binary heaps, container/heap, top-k, and k-way merge in Go"),
    "advanced-trees": ("Advanced Trees", "balanced trees, tries, segment trees, and Fenwick trees in Go"),
    "graphs": ("Graph Traversal", "graph representation, BFS, DFS, topological sort, and union-find in Go"),
    "backtracking": ("Backtracking", "subsets, permutations, constraint search, and pruning in Go"),
    "string-algorithms": ("String Algorithms", "KMP, rolling hash, tries, and suffix arrays in Go"),
    "production-structures": ("Production Structures", "LRU caches, rate limiters, consistent hashing, and concurrent structures in Go"),
    "samples": ("Study Projects", "composed study projects that combine the roadmap's structures and algorithms"),
    "references": ("References", "Go playgrounds, documentation, books, and courses for data structures and algorithms"),
}

PAGE = """<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="description" content="DSA {title_html}: {scope_html}. Planned lesson.">
  <meta name="author" content="Elucian Moise">
  <meta name="keywords" content="dsa, go, {slug}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>DSA {title_html}</title>
  <link rel="canonical" href="https://sagecode.org/roadmap/dsa/{slug}.html">
  <meta name="robots" content="index, follow">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="icon" type="image/png" href="/images/favicon.ico">
  <link rel="stylesheet" href="/assets/prism.css">
  <script src="/assets/prism.js"></script>
  <link rel="stylesheet" href="/assets/css/sage-common.css">
  <link rel="stylesheet" href="/assets/css/content-topic.css">
  <link rel="stylesheet" href="/assets/css/content-sidebar.css">
  <link rel="stylesheet" href="/assets/css/content-code.css">
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
        <h1 id="overview">{title_html}</h1>

        <div class="alert alert-warning shadow-sm" role="status">
          <strong>Status:</strong> Planned lesson — authored in a later phase of the DSA roadmap.
        </div>

        <h2 id="scope">Scope</h2>
        <p>This lesson will cover {scope_html}, with small inline examples and larger runnable demos in the code viewer.</p>

        <h2 id="next-steps">Next Steps</h2>
        <p>Until this lesson is published, continue with the <a href="/roadmap/dsa/">DSA roadmap index</a>.</p>
      </main>
    </div>
  </div>

  <footer class="footer copyright">
    <p class="x-small text-secondary mb-0">&copy; 2026 Sage-Code Laboratory</p>
  </footer>
</div>

<button id="open-sidebar" class="btn btn-primary d-lg-none shadow-lg" type="button">
  <span style="font-size: 24px;">&#9776;</span>
</button>

<script>
  window.TOPIC_CONFIG = {{
    labId: 'dsa',
    topicId: '{slug}',
    homeLink: './index.html#topics',
    labHomeLink: './index.html',
    inlineContent: true
  }};
</script>
<script src="/assets/js/sage.js" defer></script>
<script src="/assets/js/topic-loader.js" defer></script>
</body>
</html>
"""


def sidebar(title):
    # template shape: the h1 is the only root; h2 chapters without h3 are leaves
    return [{"title": title, "link": "#overview", "children": [
        {"title": "Scope", "link": "#scope"},
        {"title": "Next Steps", "link": "#next-steps"},
    ]}]


def main():
    dry = "--dry-run" in sys.argv
    for slug, (title, scope) in PLANNED.items():
        esc = lambda s: s.replace("&", "&amp;")
        page = TRACK / f"{slug}.html"
        data = TRACK / "data" / f"{slug}.json"
        for path, content in (
            (page, PAGE.format(slug=slug, title=title, title_html=esc(title), scope=scope, scope_html=esc(scope))),
            (data, json.dumps(sidebar(title), indent=2) + "\n"),
        ):
            if path.exists():
                print(f"skip   {path} (exists)")
                continue
            print(f"{'would create' if dry else 'create'} {path}")
            if not dry:
                path.write_text(content, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
