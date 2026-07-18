# Go Programming Lab - New Architecture Prototype

## Architecture Overview

This document describes the improved architecture for the Go Programming Laboratory that tracks progress and provides topic-specific navigation.

### Directory Structure

```
/csp/go/
├── index.html              # Lab Hub - Progress tracking table
├── topic.html              # Topic Viewer - Loads topic-specific content
├── topics.json             # Master list of 12 topics for index.html
├── {topic_name}.html       # Content for each topic (12 files)
├── {topic_name}.json       # Sidebar navigation for each topic (12 files)
└── template.html           # (DEPRECATED - replaced by topic.html)
```

### Key Components

#### 1. **index.html** - Laboratory Hub
- **Purpose**: Main entry point showing all 12 topics in a progress table
- **Features**:
  - Progress bar showing overall completion (# completed / 12 topics)
  - Interactive table with checkboxes for each topic
  - Links to `topic.html?topic={topic_name}`
  - Sticky progress tracking via localStorage
  - Responsive design
- **Data Source**: `topics.json` (12 topics with descriptions)
- **Storage**: `localStorage['go-lab-progress']` - saves completed topics

#### 2. **topic.html** - Topic Viewer Template
- **Purpose**: Single template for viewing any topic's content
- **Features**:
  - Reads URL parameter: `?topic=syntax`
  - Loads topic-specific sidebar from `{topic_name}.json`
  - Loads content from `{topic_name}.html`
  - Progress tracking with scroll-position detection
  - Mobile-responsive sidebar toggle
  - Prism.js syntax highlighting
  - Back button to return to lab hub
- **URL Pattern**: `/csp/go/topic.html?topic=arrays`
- **Configuration**: `window.SIDEBAR_CONFIG` set dynamically per topic

#### 3. **topics.json** - Master Topics List
- **Purpose**: Defines all 12 topics for the index table
- **Format**: Array of topic objects
```json
[
  {
    "target": "overview",
    "title": "Overview",
    "description": "Understand Go's history..."
  },
  ...
]
```

#### 4. **{topic_name}.json** - Per-Topic Sidebars
- **Purpose**: Navigation sidebar for each topic (not shared globally)
- **Example Files**: `syntax.json`, `types.json`, `arrays.json`, etc.
- **Format**: Array of navigation items
```json
[
  {"title": "Go Syntax Basics", "link": "#basics"},
  {"title": "Comments", "link": "#comments"},
  {"title": "Next: Data Types", "link": "./topic.html?topic=types"}
]
```

#### 5. **{topic_name}.html** - Topic Content
- **Purpose**: HTML content for each topic
- **Files**: `overview.html`, `syntax.html`, `types.html`, `arrays.html`, etc.
- **Existing**: All 12 files already present in `/csp/go/`

### Data Flow & Navigation

```
User starts at:
  /csp/index.html (Super page - all 15 languages)
         ↓
  /csp/go/index.html (Lab Hub - 12 topics with progress)
         ↓
  Click "Arrays" topic
         ↓
  /csp/go/topic.html?topic=arrays
         ↓
  Loads: arrays.json (sidebar) + arrays.html (content)
         ↓
  Sidebar shows 5 sections: Arrays, Declaration, Slices, Operations, Dynamic Growth
         ↓
  Progress tracked: scroll position + checkbox on hub page
         ↓
  Click "Next: Maps" in sidebar
         ↓
  /csp/go/topic.html?topic=maps
```

### Progress Tracking

#### Hub-Level Progress
- **Storage**: `localStorage['go-lab-progress']`
- **Format**: 
```json
{
  "overview": { "completedAt": "2026-02-27T..." },
  "syntax": { "completedAt": "2026-02-27T..." },
  "types": { "completedAt": "2026-02-27T..." }
}
```
- **UI**: Checkbox on table row, highlights completed topics

#### Topic-Level Progress
- **Storage**: `localStorage['go-topic-{topic_name}']`
- **Format**: 
```json
{
  "scrollProgress": 45.5
}
```
- **UI**: Sidebar progress bar shows scroll position through content

### Key Differences from Previous Architecture

| Aspect | Old (template.html) | New (topic.html) |
|--------|-----------------|-------------------|
| Sidebar Navigation | Global `sidebar.json` for all 12 topics | Per-topic `{topic_name}.json` |
| Index Layer | Card-based hub (not tracked) | Progress table with checkboxes |
| Topic Identification | Parameter: `?topic=xyz` ✓ (unchanged) | Parameter: `?topic=xyz` ✓ (unchanged) |
| Hub Storage | None | `localStorage['go-lab-progress']` |
| Intended Use | Quick linking | Structured learning path |

### Testing Checklist

To verify the prototype works:

1. **Load Hub**
   - [ ] Visit `/csp/go/index.html`
   - [ ] See 12 topics in table
   - [ ] Progress bar shows 0/12
   - [ ] No checkboxes selected

2. **Open a Topic**
   - [ ] Click "Overview" topic
   - [ ] Page loads to `/csp/go/topic.html?topic=overview`
   - [ ] Sidebar shows 5 sections from `overview.json`
   - [ ] Main content loads from `overview.html`
   - [ ] Back button (↩) returns to hub

3. **Progress Tracking**
   - [ ] Check "Overview" checkbox in sidebar
   - [ ] Return to hub (click back button)
   - [ ] Hub shows 1/12 completed (8.33%)
   - [ ] Overview row highlighted in green
   - [ ] Refresh page - progress persists

4. **Navigation Between Topics**
   - [ ] From overview sidebar, click "Next: Syntax"
   - [ ] Page loads `topic.html?topic=syntax`
   - [ ] Sidebar updates with syntax.json content
   - [ ] Content updates to syntax.html

5. **Responsive Design**
   - [ ] On mobile, sidebar hidden by default
   - [ ] Click toggle button (☰) shows sidebar
   - [ ] Clicking topic link closes sidebar
   - [ ] Progress bar visible on all screens

### Replication Instructions

To replicate this pattern to other programming languages (Julia, Dart, Python, etc.):

1. **Copy structure**:
   ```bash
   cp -r /csp/go/* /csp/julia/
   (then customize)
   ```

2. **Update files for Julia**:
   - Rename `topics.json` entries (e.g., "Overview" → "Julia Overview")
   - Update `{topic_name}.json` files with Julia-specific content sections
   - Keep `topic.html` as-is (reusable template)
   - Keep existing `{topic_name}.html` content files

3. **Update `/csp/julia/index.html`**:
   - Change: `localStorage['go-lab-progress']` → `localStorage['julia-lab-progress']`
   - Change: `data-sage-lab="go"` → `data-sage-lab="julia"`
   - Change: `jsonFile: './topics.json'` path stays same

### Files Created for Prototype

✅ `/csp/go/index.html` - Lab hub with progress table (NEW)
✅ `/csp/go/topic.html` - Topic viewer template (NEW - replaces template.html)
✅ `/csp/go/topics.json` - Master topics list (NEW)
✅ `/csp/go/{topic_name}.json` - Per-topic sidebars (12 files, NEW/UPDATED)
✨ `/csp/go/{topic_name}.html` - Content (existing, reused)

### Configuration Variables

In `topic.html` script:
```javascript
window.SIDEBAR_CONFIG = {
  jsonFile: `./${topicId}.json`,      // Load topic-specific JSON
  contentFile: `./${topicId}.html`,   // Load topic content
  pageKey: topicId,                   // For localStorage keys
  labId: 'go'                          // Lab identifier
};
```

### Next Steps

1. ✅ Test prototype in browser
2. Test progress persistence across sessions
3. Verify mobile responsiveness
4. Then replicate to other 14 programming languages
5. Consider: Shared global progress bar across all languages

---

**Status**: Prototype ready for testing
**Created**: 2026-02-27
**Lab ID**: go
**Topics**: 12
**Architecture Pattern**: Hub (progress table) → Topic Viewer (topic-specific sidebar + content)
