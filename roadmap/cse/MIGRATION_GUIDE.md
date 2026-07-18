# Migration Guide - Converting Existing Pages

This guide shows how to convert existing engineering course pages to use the new data-driven architecture.

## Current State

Currently, pages like `/cse/concepts.html` are **_monolithic_** - they contain:
1. Full HTML structure (head, body, layout)
2. Header/footer hardcoded
3. Sidebar markup inline
4. Main content mixed with layout HTML
5. All CSS and scripts loaded in every page

## New State

With the new architecture, each page has:
1. **index.html** - Reusable template (shared)
2. **{name}-content.html** - Content only (one per topic)
3. **{name}.json** - Sidebar structure (one per topic)

## What Changes for Users?

### Before (Old Architecture)
```
User accesses:  /cse/concepts.html
           â†“
         Page loads full HTML with all layout
         Page is 700+ KB, loads everything
```

### After (New Architecture)
```
User accesses:  /cse/index.html?course=concepts
           â†“
         Template loads (50 KB)
         Sidebar JSON loaded (2 KB)
         Content file loaded (100 KB)
         Total: ~150 KB, lighter and reusable
```

## Migration Process

### Example: Converting algebra.html

#### Current State:
```
/cse/algebra.html (800 KB)
  - Full HTML markup
  - All CSS/JS loaded
  - Sidebar hardcoded
  - All content inline
```

#### Step 1: Extract Content
Create `/cse/algebra-content.html`:

**Before (in algebra.html):**
```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
<header>...</header>
<aside>...</aside>
<main>
  <h1>Algebra</h1>
  <h2><a id="equations">Equations</a></h2>
  ...
</main>
</body>
</html>
```

**After (in algebra-content.html):**
```html
<h1>Algebra</h1>

<h2><a id="equations">Equations</a></h2>
<p>Content here...</p>

<h2><a id="functions">Functions</a></h2>
<p>Content here...</p>
```

#### Step 2: Create Sidebar JSON
Create `/cse/algebra.json`:

**Examine the old HTML sidebar:**
```html
<ul id="bookmark-list">
  <li class="nav-item mb-2">
    <input type="checkbox" data-target="equations">
    <a href="#equations">Equations</a>
    <ul class="list-unstyled ms-4">
      <li><input type="checkbox" data-target="linear">
        <a href="#linear">Linear Equations</a>
      </li>
    </ul>
  </li>
</ul>
```

**Convert to JSON:**
```json
[
  {
    "target": "equations",
    "title": "Equations",
    "link": "#equations",
    "children": [
      {
        "target": "linear",
        "title": "Linear Equations",
        "link": "#linear"
      }
    ]
  }
]
```

#### Step 3: Update index.html
Change the SIDEBAR_CONFIG:
```javascript
window.SIDEBAR_CONFIG = {
  jsonFile: './algebra.json',
  contentFile: './algebra-content.html',
  pageKey: 'algebra'
};
```

#### Step 4: Delete Old File (or Archive)
- Keep original as backup: `algebra.html.bak`
- Optional: Create redirect from old URL to new

---

## Content Extraction Checklist

When extracting content from an old page:

### âœ“ Keep These Elements:
- All `<h1>`, `<h2>`, `<h3>` headings
- All `<p>` paragraphs and text content
- All `<img>` images (update src paths if needed)
- All `<pre><code>` code blocks
- All `<table>` tables
- All `<ul>`, `<ol>` lists
- All `<blockquote>` quotes
- All `<div class="alert">` alerts
- Internal `#anchor` links
- IDs on all sections (`id="section-name"`)

### âœ— Remove These Elements:
- `<!DOCTYPE html>`
- `<html>`, `<head>`, `<body>` tags
- `<link>` stylesheets (already in index.html)
- `<script>` tags (load from index.html)
- Navigation headers/footers
- Sidebar markup
- Layout wrapper divs like `<main class="col-lg-9">`

### âš  Update These:
- Image paths: `/images/file.svg` (usually OK as-is)
- Cross-page links: `/cse/other.html` â†’ `/index.html` (might need updating)
- Content paths in JSON

---

## Sidebar JSON Creation Checklist

For each section in the content:

```
For each major <h2>:
  â˜ Create JSON item with:
    - target = section id
    - title = h2 text
    - link = "#" + section id
  
  For each <h3> under that <h2>:
    â˜ Add child item with:
      - target = h3 id
      - title = h3 text
      - link = "#" + h3 id
```

Example:
```html
<!-- Content -->
<h2 id="chapter1">Chapter 1</h2>
  <h3 id="intro">Introduction</h3>
  <h3 id="basics">Basics</h3>
<h2 id="chapter2">Chapter 2</h2>
```

Becomes:
```json
[
  {
    "target": "chapter1",
    "title": "Chapter 1",
    "link": "#chapter1",
    "children": [
      {"target": "intro", "title": "Introduction", "link": "#intro"},
      {"target": "basics", "title": "Basics", "link": "#basics"}
    ]
  },
  {
    "target": "chapter2",
    "title": "Chapter 2",
    "link": "#chapter2"
  }
]
```

---

## File Size Reduction

### Before (Old Pattern)
```
concepts.html:        800 KB
algorithms.html:      750 KB
architecture.html:    820 KB
Total:              2,370 KB
```

Each page duplicates:
- HTML skeleton
- CSS imports
- JS imports
- Header markup
- Sidebar markup
- Footer markup

### After (New Pattern)
```
index.html:               50 KB (shared)
concepts-content.html:   100 KB
concepts.json:             2 KB
algorithms-content.html: 120 KB
algorithms.json:           3 KB
architecture.json:         3 KB
sidebar-data.js:          6 KB
Total:                   ~284 KB
```

**Savings: 88% file size reduction!**

---

## Browser History & Back Button

The new architecture uses standard anchor links (`#section-id`), so:

âœ“ Back button works correctly
âœ“ Anchor navigation works
âœ“ Bookmarking sections works
âœ“ Sharing links with anchors works

URL format remains: `https://domain/cse/index.html#section-name`

---

## URL Considerations

### Current URL (Old):
```
https://sagecode.org/cse/concepts.html
```

### New URL (New):
```
https://sagecode.org/cse/index.html
```

### Options:

**Option A: Keep Both (Backward Compatible)**
- Old URL redirects to new: `concepts.html â†’ index.html + config`
- Users with old bookmarks still work

**Option B: Update All Links**
- Update all navigation to point to `/cse/index.html`
- Update sitemap.xml

**Option C: Domain Redirect**
- Use Apache/nginx rules: `concepts.html` â†’ `index.html`
- Transparent to users

---

## Migration Order

Recommended order (easiest to hardest):

1. **concepts.html** â† Already done!
2. **algebra.html** - Similar structure to concepts
3. **algorithms.html** - Large content, clear sections
4. **architecture.html** - Architecture heavy
5. Progressive refactoring of others

---

## Testing After Migration

For each migrated page:

```
â˜ All sections load with correct IDs
â˜ Sidebar renders from JSON correctly
â˜ Progress tracking works
â˜ Links navigate to correct sections
â˜ Mobile toggle button works
â˜ Code highlighting works (Prism)
â˜ Images display correctly
â˜ Tables render properly
â˜ All links work (internal and external)
â˜ Breadcrumbs update correctly
```

---

## Rollback Plan

If issues occur:

1. Keep original file as backup: `concepts.html.bak`
2. Can quickly restore if needed
3. Test thoroughly before deleting original
4. Keep in version control for recovery

---

## Benefits of Migration

### For Users:
- Faster page loads
- Consistent interface across topics
- Better mobile experience
- Progress synced across topics

### For Developers:
- DRY principle (Don't Repeat Yourself)
- Easier to update shared layout
- Simpler to add new topics
- Better content/structure separation
- Easier to maintain

### For Site Performance:
- Smaller file sizes
- Reduced bandwidth
- Faster initial load
- Reusable components
- Easier caching

---

## Future Possibilities

Once migration is complete:

1. **Generate index pages automatically** from JSON
2. **Dynamic topic list** on main page
3. **Search across all topics** with shared infrastructure
4. **Export to PDF** using shared template
5. **Ebook generation** from content files
6. **Interactive exercises** in reusable format
7. **Dark/light theme** switching globally
8. **Multilingual support** with JSON translations

---

## Questions?

- See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- See [QUICKSTART.md](./QUICKSTART.md) for implementation guide
- Review example files: concepts-content.html, concepts.json

