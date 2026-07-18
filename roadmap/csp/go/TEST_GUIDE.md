# Go Lab Prototype - Testing & Next Steps Guide

## ✅ What Was Built

A new **three-layer architecture** for the Go Programming Laboratory with progress tracking:

```
/csp/go/
├── index.html          ← Lab Hub (NEW) - Progress table with checkboxes
├── topic.html          ← Topic Viewer (NEW) - Displays any topic
├── topics.json         ← Master topics list (NEW)
├── {12}.json           ← Per-topic sidebars (NEW) [overview, syntax, types, arrays, maps, control, functions, objects, errors, files, concurrency, examples]
├── {12}.html           ← Topic content (EXISTING) [reused]
└── PROTOTYPE_SUMMARY.md ← Full architecture docs
```

## 📊 Architecture Overview

```
Entry Point:
  http://localhost:5500/csp/go/index.html

Lab Hub (Progress Table):
  ✓ Shows all 12 topics
  ✓ Checkboxes to mark complete
  ✓ Progress bar (0/12 → 12/12)
  ✓ Links to topic.html?topic=X

Topic Viewer (Single Template):
  ✓ Loads topic-specific sidebar from {topic_name}.json
  ✓ Loads content from {topic_name}.html
  ✓ Progress bar per topic (scroll position)
  ✓ Mobile responsive sidebar toggle

Data Storage:
  ✓ localStorage['go-lab-progress'] - Hub checkboxes
  ✓ localStorage['go-topic-{name}'] - Topic scroll progress
  ✓ Persists across browser sessions
```

## 🧪 Testing Checklist

### Phase 1: Load & Display (Most Critical)

- [ ] **Test 1.1**: Open `/csp/go/index.html`
  - Expected: Page loads with blackboard hero "🚀 Go Programming Laboratory"
  - Expected: Table shows 12 topics (Overview, Syntax, Data Types, Arrays, Maps, Control Flow, Functions, Objects, Errors, Files, Concurrency, Examples)
  - Expected: Progress bar shows "0% Complete (0/12)"

- [ ] **Test 1.2**: Check browser console for errors
  - Open DevTools (F12) → Console tab
  - Expected: No red error messages about missing files
  - If error: Check that topics.json file exists and is valid JSON

### Phase 2: Navigation (Critical Path)

- [ ] **Test 2.1**: Click "Syntax" topic in table
  - Expected: Navigate to `/csp/go/topic.html?topic=syntax`
  - Expected: Page loads without errors
  - Expected: Sidebar shows navigation items from syntax.json

- [ ] **Test 2.2**: Main content loads
  - Expected: Content from syntax.html appears in main area
  - Expected: No blank content area

- [ ] **Test 2.3**: Topic-to-topic navigation
  - In Syntax sidebar, click "Next: Data Types"
  - Expected: URL changes to `?topic=types`
  - Expected: Sidebar updates with types.json content
  - Expected: Content switches to types.html

### Phase 3: Progress Tracking (Important)

- [ ] **Test 3.1**: Checkbox in hub
  - Return to `/csp/go/index.html`
  - Check the checkbox for "Syntax"
  - Expected: Row highlights in green
  - Expected: Progress bar shows "1% Complete (1/12)"

- [ ] **Test 3.2**: Progress persistence
  - Refresh the browser page (F5)
  - Expected: Syntax checkbox still checked
  - Expected: Progress still shows 1/12

- [ ] **Test 3.3**: Multiple topics
  - Check "Syntax", "Types", and "Arrays" checkboxes
  - Expected: Progress shows "3% Complete (3/12)" or similar
  - All 3 rows should be green

### Phase 4: Responsive Design (Medium Priority)

- [ ] **Test 4.1**: Mobile sidebar (use DevTools mobile view)
  - Open DevTools → Click mobile device icon → iPhone SE (375px width)
  - Open any topic page
  - Expected: Sidebar hidden on desktop width (hidden by default on mobile)
  - Click hamburger button (☰)
  - Expected: Sidebar slides in from left
  - Click a topic link
  - Expected: Sidebar closes automatically

- [ ] **Test 4.2**: Desktop layout
  - Toggle back to desktop view (1920px)
  - Expected: Sidebar always visible on left
  - Expected: No hamburger button shown

### Phase 5: Edge Cases (Nice to Have)

- [ ] **Test 5.1**: Invalid topic URL
  - Manual type: `/csp/go/topic.html?topic=invalid_topic`
  - Expected: User-friendly error message (not browser error page)
  - Expected: "Unable to load ./invalid_topic.html" message

- [ ] **Test 5.2**: Missing JSON file
  - Try a topic that doesn't have a .json file
  - Expected: Sidebar shows error or placeholder
  - Content should still try to load

- [ ] **Test 5.3**: Deep linking
  - Copy URL: `http://localhost:5500/csp/go/topic.html?topic=functions`
  - Send to another browser/device
  - Expected: Topic loads correctly without going through hub first

## 📋 Per-Topic Testing

If you want to test each topic thoroughly, verify all 12 have:
- [ ] overview.json + overview.html
- [ ] syntax.json + syntax.html
- [ ] types.json + types.html
- [ ] arrays.json + arrays.html
- [ ] maps.json + maps.html
- [ ] control.json + control.html
- [ ] functions.json + functions.html
- [ ] objects.json + objects.html
- [ ] errors.json + errors.html
- [ ] files.json + files.html
- [ ] concurrency.json + concurrency.html
- [ ] examples.json + examples.html

Run quick test for each:
```
1. Click topic in hub
2. Verify sidebar has 5+ navigation items
3. Verify main content is not blank
4. Click "Next: X" link to verify navigation
```

## 🚀 If All Tests Pass

You can proceed to:

1. **Test Score**: ✅ **Prototype Ready for Production**

2. **Next Phase**: Replicate to other programming languages
   ```
   /csp/julia/   (follow same pattern)
   /csp/dart/
   /csp/python/
   /csp/javascript/
   ... (15 languages total)
   ```

3. **Automation**: Create a script to auto-generate structure for new languages

4. **Enhancement**: Add features like:
   - Auto-mark complete on 90% scroll
   - Quiz at end of each topic
   - Estimated reading time
   - Difficulty badges

## ⚠️ If Tests Fail

### Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **404 Not Found** | "Failed to load topics.json" in console | Verify file exists: `/csp/go/topics.json` |
| **Blank Table** | Table shows header but no rows | Check topics.json is valid JSON; use JSON linter |
| **Sidebar Empty** | No navigation items in topic page | Verify `{topic_name}.json` files exist (e.g., syntax.json) |
| **Content Blank** | Main area shows "Loading..." forever | Check topic.html file exists; verify {topic_name}.html files exist |
| **Sidebar Stuck** | On mobile, sidebar won't close after clicking | Check if burger menu button element has correct ID |
| **Progress Not Saving** | Checkbox unchecks after refresh | Check browser allows localStorage; may need CORS setup |

### Debug Steps

1. **Open Browser DevTools (F12)**
2. **Go to Console tab**
3. **Check for red errors** - note the exact error message
4. **Check Network tab** - look for failed requests (404 errors in resources)
5. **Check Storage** - DevTools → Storage → LocalStorage → check for `go-lab-progress`

## 📈 Success Metrics

You'll know the prototype is working when:

✅ Hub page loads without errors
✅ Clicking any topic navigates successfully  
✅ Sidebar shows topic-specific navigation (not identical for all topics)
✅ Content displays in main area
✅ Progress checkboxes persist after refresh
✅ Mobile sidebar toggle works  
✅ "Next: X" links in sidebars navigate correctly
✅ No console error messages

## 🎯 Next Steps (After Prototype Validation)

Once prototype is tested and working:

### Week 1: Replicate to All Languages
- Create `/csp/julia/` with same structure
- Create `/csp/dart/` with same structure
- ... repeat for all 15 programming languages

### Week 2-3: Testing & Polish
- Test all 15 language labs
- Fix any UI inconsistencies
- Add missing content files if needed

### Week 4: Enhancement
- Add quiz system
- Add difficulty badges
- Add estimated reading times
- Add "related topics" links

### Month 2: Analytics
- Track which topics take longest
- Track completion rates
- Identify difficult topics
- Generate learning reports

## 📞 Quick Reference

**Hub URL**: http://localhost:5500/csp/go/index.html
**Topic URL Example**: http://localhost:5500/csp/go/topic.html?topic=syntax
**Files to Check if Errors**:
- `/csp/go/topics.json` - Master list
- `/csp/go/{topic_name}.json` - Each navigation file
- `/csp/go/{topic_name}.html` - Each content file
- `/csp/go/topic.html` - Viewer template
- Browser DevTools Console - For JavaScript errors

---

## ✨ Ready to Test?

1. Open: http://localhost:5500/csp/go/index.html
2. Follow the **Testing Checklist** above
3. Report results
4. If ✅ all pass → Ready for replication to other languages
5. If ❌ any fail → Use **Common Issues** table to troubleshoot

**Status**: Prototype complete and ready for QA testing

Good luck! 🚀
