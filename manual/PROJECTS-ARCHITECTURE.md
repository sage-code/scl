# Projects Topic Architecture

## Purpose

Define a common topic-page architecture for project namespaces under /projects/* that matches the roadmap topic runtime model.

This keeps project learning tracks consistent with roadmap behavior:
- static HTML generation
- left sidebar navigation from per-topic JSON
- progress checkboxes and read-state persistence
- mobile sidebar toggle

## Route and Source Contract

- Source project topics live under projects/<project-id>/.
- Published routes are /projects/<project-id>/<topic>.html with clean URL support.
- Every topic page MUST have a matching JSON file:
  - projects/<project-id>/<topic>.json
- Track landing page remains:
  - projects/<project-id>/index.html

## Topic Shell Contract

Every project topic page should include:

1. Header placeholder
- header#dynamic-header

2. Sidebar container
- aside.side-bar
- #study-sidebar
- ul#bookmark-list

3. Content container
- main#main-content

4. Footer
- shared footer style used across roadmap/project topics

5. Mobile toggle button
- button#open-sidebar

6. Topic config bootstrap
- window.TOPIC_CONFIG with:
  - labId
  - topicId
  - homeLink
  - labHomeLink
  - inlineContent

7. Runtime scripts
- /assets/js/sage.js
- /assets/js/progress.js
- /assets/js/lab-progress-bridge.js
- /assets/js/topic-loader.js

## Sidebar JSON Shape

Use hierarchical entries (H2 -> H3) to preserve tree navigation semantics.

Example:

```json
[
  {
    "title": "Section",
    "link": "#section",
    "children": [
      {
        "title": "Subsection",
        "link": "#subsection"
      }
    ]
  }
]
```

Rules:
- link values should be local anchor links (#...).
- Keep heading IDs stable across edits.
- Use concise titles; detail belongs in body text.

## Bee Migration Baseline

The Bee track now follows this architecture:
- Topic pages normalized to common shell in projects/bee/*.html.
- Sidebar files added per topic in projects/bee/*.json.
- Objects topic headings now include stable IDs for sidebar mapping.

## Validation

After topic edits:

1. Run npm run build.
2. Verify each topic under public/projects/<project-id>/:
- sidebar renders
- Return to Roadmap link appears
- topic anchors navigate correctly
- progress checkboxes display and persist
3. Run npm run test:local when changing shared runtime behavior.
