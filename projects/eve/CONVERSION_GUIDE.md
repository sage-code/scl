# Eve Project Roadmap Conversion Guide

## Status: 4/14 Topics Completed ✅

### Already Updated (with sidebar and roadmap):
- ✅ **index.html** - Main roadmap with progress tracking
- ✅ **features.html** - Learning path sidebar included
- ✅ **syntax.html** - Learning path sidebar included  
- ✅ **types.html** - Learning path sidebar included
- ✅ **control.html** - Learning path sidebar included

### Remaining Files to Convert (9):
1. topology.html
2. concurrency.html (and concurency.html if exists)
3. functions.html
4. classes.html
5. collections.html
6. processing.html
7. algorithms.html
8. library.html
9. command.html
10. databases.html

---

## Conversion Template

For each remaining HTML file, follow this pattern:

### 1. Update the `<head>` section:

Replace:
```html
<link rel="stylesheet" href="/sage.css">
```

With:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<!-- Icon -->
<link rel="icon" type="image/png" href="/images/favicon.ico">
<!-- Eve code highlighter -->
<script src="/projects/eve/js/eve1.js"></script>
<!-- Prism for syntax highlighting -->
<link rel="stylesheet" href="/prism.css">
<script src="/prism.js"></script>
<!-- Sage-Code custom CSS -->
<link rel="stylesheet" href="/sage.css">
<style>
  .side-bar { order: 1; }
  #main-content { order: 2; }
  @media (max-width: 991px) {
    .side-bar { display: none; }
    .side-bar.active {
      display: block;
      position: absolute;
      top: 100px;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(0,0,0,0.95);
    }
  }
</style>
```

### 2. Update the `<body>` opening:

Replace:
```html
<body>
```

With:
```html
<body>
```

### 3. Update the main content structure:

Replace the simple container with this structure:
```html
<div class="container">
  <!-- header -->
  <header id="dynamic-header" class="container-fluid pb-2"></header>

  <div class="container-fluid px-0">
    <div class="row g-0">
      <aside class="side-bar col-lg-3 col-12">
        <div id="study-sidebar" class="sidebar-content shadow-sm p-3 sticky-top">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0">Learning Path</h5>
            <a id="home-link" href="./index.html#topics" class="btn btn-sm btn-secondary" title="Back to topics">↩</a>
          </div>
          <div class="progress mb-3" style="height: 8px;">
            <div id="main-progress" class="progress-bar bg-success" style="width: 0%;"></div>
          </div>
          <hr>
          <ul id="bookmark-list" class="list-unstyled">
          </ul>
        </div>
      </aside>

      <main id="main-content" class="col-lg-9 col-12 p-3">
        <!-- YOUR EXISTING CONTENT GOES HERE -->
      </main>
    </div>
  </div>
</div>
```

### 4. Update the h1 title:

Add `id="title"` to the main h1:
```html
<h1 id="title">Your Topic Title</h1>
```

### 5. Update the footer and closing tags:

Replace the old ending:
```html
<!-- Footer -->
<footer class="footer copyright">
  <p class="x-small text-secondary mb-0">&copy; 2026 Sage-Code Laboratory</p>
</footer>
</div>
<script src="/sage.js"></script>
</body>
</html>
```

With:
```html
    </main>
  </div>
</div>

<!-- Footer -->
<footer class="footer copyright">
  <p class="x-small text-secondary mb-0">&copy; 2026 Sage-Code Laboratory</p>
</footer>

</div>

<!-- Scripts -->
<script src="/common/sidebar-generator.js"></script>
<script src="/common/progress-legacy.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Load sidebar from JSON - Replace 'control' with your filename
    fetch('./FILENAME.json')
      .then(response => response.json())
      .then(data => {
        const bookmarkList = document.getElementById('bookmark-list');
        bookmarkList.innerHTML = '';
        data.forEach((item, index) => {
          const li = document.createElement('li');
          li.className = 'nav-item mb-2';
          li.innerHTML = `
            <input type="checkbox" class="form-check-input me-2" id="nav-${index}" data-isTrackable="true" data-link="${item.link}">
            <a href="${item.link}" class="text-info text-decoration-none">${item.title}</a>
          `;
          bookmarkList.appendChild(li);
        });
      })
      .catch(error => console.error('Error loading sidebar:', error));
    
    // Run Eve syntax highlighting
    if (typeof eve_render === 'function') {
      eve_render();
    }
  });
</script>
<script src="/sage.js"></script>
</body>
</html>
```

### 6. Update internal links:

Change full paths to relative:
- `/projects/eve/syntax/` → `./syntax.html`
- `/projects/eve/types/` → `./types.html`

---

## JSON Files (Already Created)

All JSON sidebar files have been created in the eve directory:
- features.json
- syntax.json
- types.json
- topology.json
- concurrency.json
- functions.json
- classes.json
- collections.json
- control.json
- processing.json
- algorithms.json
- library.json
- command.json
- databases.json

Each contains navigation bookmarks for that topic.

---

## Quick Reference: Files to Update

| File | JSON File | Status |
|------|-----------|--------|
| features.html | features.json | ✅ DONE |
| syntax.html | syntax.json | ✅ DONE |
| types.html | types.json | ✅ DONE |
| control.html | control.json | ✅ DONE |
| topology.html | topology.json | ⏳ TODO |
| concurrency.html | concurrency.json | ⏳ TODO |
| functions.html | functions.json | ⏳ TODO |
| classes.html | classes.json | ⏳ TODO |
| collections.html | collections.json | ⏳ TODO |
| processing.html | processing.json | ⏳ TODO |
| algorithms.html | algorithms.json | ⏳ TODO |
| library.html | library.json | ⏳ TODO |
| command.html | command.json | ⏳ TODO |
| databases.html | databases.json | ⏳ TODO |

---

## Notes:

1. The `.json` files in `/projects/eve/` define the sidebar navigation for each topic
2. The sidebar is automatically populated from these JSON files when a page loads
3. Progress tracking is handled by `/common/roadmap.js` on the index page
4. Individual topic progress is tracked by `/common/progress-legacy.js`
5. All pages now use consistent Bootstrap 5 grid layout (col-lg-3 sidebar, col-lg-9 content)
6. Mobile responsive: sidebar collapses on small screens

---

## Testing the Changes:

1. Open `http://localhost/projects/eve/` 
2. You should see the roadmap table with progress tracking
3. Click on any topic that's been updated (features, syntax, types, control)
4. You should see the sidebar with learning path
5. Check boxes should be clickable and persist in localStorage
6. Back button (↩) should return to index.html#topics
