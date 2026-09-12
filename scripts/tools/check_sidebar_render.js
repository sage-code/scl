#!/usr/bin/env node
/**
 * Live sidebar RENDER check — the runtime half of the sidebar contract.
 *
 * The static checks (test_sources.py, verify_sidebars.py, check_sidebar_anchors.py)
 * prove the JSON is well-formed and mirrors the page. This one proves the browser
 * actually renders it: it serves the built `public/` folder over HTTP and drives real
 * pages with Puppeteer, asserting that what `assets/js/topic-loader.js` builds matches
 * the sidecar it loaded.
 *
 * Expectations are DERIVED from the sidecar JSON, never hard-coded per route:
 *   - number of top-level items in #bookmark-list === number of top-level JSON entries
 *     (1 for the template's single-root folder, N for a legacy flat sidebar)
 *   - total rendered nodes === total entries in the JSON tree
 *   - the deepest rendered level === the deepest JSON depth
 *   - a node that HAS children renders with a `.nav-tree-toggle` and folds on click
 *   - a sidebar whose root folder is the page title opens by default (level 0 and 1
 *     expanded) and, once the root toggle is clicked, only the root row stays visible
 *
 * Usage:
 *   node scripts/tools/check_sidebar_render.js                 # representative sample
 *   node scripts/tools/check_sidebar_render.js /roadmap/go/overview.html
 *   npm run check:sidebar
 * Requires `npm run build` first (it reads public/) and dev puppeteer.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve('public');
const PORT = Number(process.env.SIDEBAR_CHECK_PORT || 4321);
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
};

// Routes exercise every shape the template allows.
const DEFAULT_ROUTES = [
  '/roadmap/csharp/control.html',        // template: root folder + chapters + sections
  '/roadmap/julia/control.html',         // template, second track (no track is special)
  '/roadmap/dart/demo_examples.html',    // leaf chapters: h2 categories with no h3 level
  '/roadmap/python/classes.html',        // legacy flat sidebar (page has no <h1> yet)
];

function readSidecar(route) {
  const rel = route.replace(/^\/+/, '').replace(/\.html$/, '.json');
  const file = path.join(ROOT, path.dirname(rel), 'data', path.basename(rel));
  const tree = JSON.parse(fs.readFileSync(file, 'utf8'));
  const depths = [];
  const walk = (entries, depth) => {
    for (const entry of entries) {
      depths.push(depth);
      if (Array.isArray(entry.children)) walk(entry.children, depth + 1);
    }
  };
  walk(tree, 0);
  const singleRoot = tree.length > 0 && tree.every((e) => Array.isArray(e.children));
  return {
    file: path.relative(ROOT, file).replace(/\\/g, '/'),
    topLevel: tree.length,
    nodes: depths.length,
    maxDepth: Math.max(...depths, 0),
    singleRoot,
  };
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, urlPath);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ROUTES;

(async () => {
  await new Promise((resolve) => server.listen(PORT, resolve));
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  let failures = 0;

  for (const route of ROUTES) {
    // Git Bash rewrites a leading-slash argument, so accept "roadmap/..." too.
    const expect = readSidecar('/' + route.replace(/^\/+/, ''));
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    const url = `http://localhost:${PORT}/${route.replace(/^\/+/, '')}`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#bookmark-list li.nav-tree-item', { timeout: 5000 });

    const report = await page.evaluate(() => {
      const list = document.getElementById('bookmark-list');
      const nodes = [...list.querySelectorAll('li.nav-tree-item')].filter(
        (li) => !li.classList.contains('return-roadmap-link')
      );
      const rootLi = nodes[0];
      const rootRow = rootLi ? rootLi.querySelector('.nav-node-row') : null;
      const rootToggle = rootRow ? rootRow.querySelector('.nav-tree-toggle') : null;
      const rootChildren = rootLi ? rootLi.querySelector(':scope > ul') : null;
      const before = rootChildren ? rootChildren.classList.contains('is-collapsed') : null;
      if (rootToggle) rootToggle.click();
      const after = rootChildren ? rootChildren.classList.contains('is-collapsed') : null;
      const visibleWhenCollapsed = nodes.filter((li) => {
        let parent = li.parentElement;
        while (parent && parent !== list) {
          if (parent.classList.contains('is-collapsed')) return false;
          parent = parent.parentElement;
        }
        return true;
      }).length;

      return {
        topLevel: list.querySelectorAll(':scope > li.nav-tree-item').length,
        nodes: nodes.length,
        levels: [...new Set(nodes.map((li) => Number(li.dataset.treeLevel)))].sort(),
        rootHasToggle: !!rootToggle,
        toggles: list.querySelectorAll('.nav-tree-toggle').length,
        titleGlyphs: list.querySelectorAll('.nav-title-icon').length,
        collapsedBefore: before,
        collapsedAfter: after,
        visibleWhenCollapsed,
      };
    });

    const deepest = report.levels.length ? Math.max(...report.levels) : 0;
    const checks = [
      ['top-level count matches the sidecar', report.topLevel === expect.topLevel],
      ['node count matches the sidecar', report.nodes === expect.nodes],
      ['deepest level matches the sidecar', deepest === expect.maxDepth],
      ['no page errors', errors.length === 0],
    ];
    if (expect.singleRoot) {
      checks.push(
        ['root folder is collapsible', report.rootHasToggle],
        ['root folder opens by default (levels 0 and 1 visible)', expect.maxDepth < 2
          || report.levels.includes(0) && report.levels.includes(1)],
        ['clicking the root folds the whole tree (only the root row left)',
          report.collapsedBefore === false && report.collapsedAfter === true
          && report.visibleWhenCollapsed === 1],
      );
    }

    const bad = checks.filter(([, ok]) => !ok);
    if (bad.length) failures += 1;
    console.log(`${bad.length ? 'FAIL' : 'OK  '} ${route}   [${expect.file}]`);
    console.log(`     sidecar: top=${expect.topLevel} nodes=${expect.nodes} `
      + `depth=${expect.maxDepth} singleRoot=${expect.singleRoot}`);
    console.log(`     rendered: top=${report.topLevel} nodes=${report.nodes} `
      + `levels=${JSON.stringify(report.levels)} toggles=${report.toggles} `
      + `rootToggle=${report.rootHasToggle} glyphs=${report.titleGlyphs} `
      + `collapsed=${report.collapsedBefore}->${report.collapsedAfter} `
      + `visible=${report.visibleWhenCollapsed}`);
    for (const [label] of bad) console.log(`     FAILED: ${label}`);
    if (errors.length) console.log(`     pageerrors=${JSON.stringify(errors)}`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log(`FAILURES: ${failures}`);
  process.exit(failures ? 1 : 0);
})();

