# Quick Start Guide - Creating a New Course

This guide shows how to create a new course using the data-driven architecture.

## Step-by-Step Example

Let's create a new course called "Mathematics Fundamentals"

### Step 1: Create the Content File

**File:** `/cse/math-content.html`

```html
<h1>Mathematics Fundamentals</h1>

<div class="alert alert-secondary shadow-sm">
  Introduction to basic mathematical concepts...
</div>

<h2><a id="arithmetic">Arithmetic</a></h2>
<p>Arithmetic is the branch of mathematics...</p>

<h3 id="addition">Addition</h3>
<p>Addition combines two numbers...</p>

<h3 id="subtraction">Subtraction</h3>
<p>Subtraction is the inverse of addition...</p>

<h2><a id="algebra">Algebra</a></h2>
<p>Algebra extends arithmetic with variables...</p>

<h3 id="equations">Equations</h3>
<p>An equation states that two expressions are equal...</p>
```

### Step 2: Create the Sidebar Data

**File:** `/cse/math.json`

```json
[
  {
    "target": "arithmetic",
    "title": "Arithmetic",
    "link": "#arithmetic",
    "children": [
      {
        "target": "addition",
        "title": "Addition",
        "link": "#addition"
      },
      {
        "target": "subtraction",
        "title": "Subtraction",
        "link": "#subtraction"
      }
    ]
  },
  {
    "target": "algebra",
    "title": "Algebra",
    "link": "#algebra",
    "children": [
      {
        "target": "equations",
        "title": "Equations",
        "link": "#equations"
      }
    ]
  }
]
```

### Step 3: Update index.html Configuration

Modify the `SIDEBAR_CONFIG` in `/cse/index.html`:

```javascript
window.SIDEBAR_CONFIG = {
  jsonFile: './math.json',
  contentFile: './math-content.html',
  pageKey: 'math'
};
```

### Step 4: Done!

Visit `/cse/index.html` and it will:
âœ“ Load the sidebar from `math.json`
âœ“ Load content from `math-content.html`
âœ“ Track progress for "math" topic
âœ“ Auto-check sections as you scroll
âœ“ Manage progress in localStorage

---

## File Checklist

For each new course, create/update:

```
â˜ /cse/{course}-content.html    # Main content only
â˜ /cse/{course}.json             # Sidebar structure
â˜ Update SIDEBAR_CONFIG in index.html   # Point to your files
```

## Important Rules

### 1. Content IDs must match JSON targets

âŒ **Wrong:**
```html
<!-- File: algebra-content.html -->
<h2 id="equations">Equations</h2>

<!-- File: algebra.json -->
{
  "target": "linear-eq",  // â† Doesn't match!
}
```

âœ… **Correct:**
```html
<!-- File: algebra-content.html -->
<h2 id="equations">Equations</h2>

<!-- File: algebra.json -->
{
  "target": "equations",  // â† Matches!
}
```

### 2. Content file contains only the inner HTML

âŒ **Wrong - too much markup:**
```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <div class="container">
    <h1>Title</h1>
  </div>
</body>
</html>
```

âœ… **Correct - just the content:**
```html
<h1>Title</h1>
<p>Content here...</p>
```

### 3. Section anchors should match IDs

```html
<!-- Recommended pattern -->
<h3 id="my-section">
  <a id="my-section">My Section</a>
</h3>

<!-- OR simpler -->
<h3 id="my-section">My Section</h3>
```

## JSON Structure Guide

### Simple item (no children):
```json
{
  "target": "item-id",
  "title": "Item Title",
  "link": "#item-id"
}
```

### Item with children:
```json
{
  "target": "parent-id",
  "title": "Parent Title",
  "link": "#parent-id",
  "children": [
    {
      "target": "child-id",
      "title": "Child Title",
      "link": "#child-id"
    }
  ]
}
```

### How it renders in sidebar:
```
â˜‘ Parent Title
  â˜‘ Child Title
```

---

## Tips & Best Practices

### Progress Tracking
- Each course has its own progress storage
- Use meaningful `pageKey` values (e.g., 'concepts', 'algebra', 'algorithms')
- Progress persists across browser sessions

### Content Organization
- Break content into logical sections
- Use heading hierarchy (h1, h2, h3, etc.)
- Keep section IDs URL-friendly (lowercase, hyphens)

### Mobile Optimization
- Content automatically wraps on mobile
- Sidebar becomes dropdown on screens <992px
- Links auto-close sidebar when clicked on mobile

### Code Highlighting
- Use Prism language classes for syntax highlighting:
  ```html
  <pre><code class="language-python">
  print("Hello")
  </code></pre>
  ```
- Prism automatically highlights after content loads

---

## Common Mistakes

### âŒ Wrong JSON format:
```json
// Missing "link" field
[
  {
    "target": "intro",
    "title": "Introduction"
  }
]
```

### âŒ Wrong content ID:
```html
<!-- Content file -->
<h2 id="getting-started">Getting Started</h2>

<!-- JSON with mismatched target -->
{
  "target": "intro"
}
```

### âŒ Full HTML file:
```html
<!-- Don't do this -->
<!DOCTYPE html>
<html><head>...</head><body>
<h1>Title</h1>
</body></html>
```

---

## Testing Your Course

1. **Check sidebar loads:**
   - Open browser console (F12)
   - No errors should appear

2. **Click sidebar links:**
   - Should navigate to correct sections
   - Page should scroll smoothly

3. **Check progress tracking:**
   - Click checkboxes
   - Progress bar should update
   - Refresh page - progress should persist

4. **Test on mobile:**
   - Open in responsive mode (F12)
   - Set width < 600px
   - Sidebar should appear as dropdown

---

## Have Questions?

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.
