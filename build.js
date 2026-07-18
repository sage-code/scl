const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const ROOT_PAGES_DIR = ROOT;
const ROADMAP_LABS_DIR = path.join(ROOT, "roadmap", "labs");
const ROADMAP_DIR = path.join(ROOT, "roadmap");
const PROJECTS_DIR = path.join(ROOT, "projects");
const COMMUNITY_DIR = path.join(ROOT, "community");
const LAYOUTS_DIR = path.join(ROOT, "layouts");
const ASSETS_DIR = path.join(ROOT, "assets");

const SYSTEM_RUNTIME_FILES = ["robots.txt", "sitemap.xml"];
const ROADMAP_BASE_FOLDERS = ["cse", "csp", "csa", "dsa", "dsl", "hpc", "tek", "dba", "sml", "osd", "dsk"];

const LAB_ROUTE_MAP = {
  engineering: "cse",
  programming: "csp",
  videos: "videos"
};

function getSupabaseBuildConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  const schema = process.env.SUPABASE_SCHEMA || "public";

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey, schema };
}

function writeSupabaseConfigAsset() {
  const sourcePath = path.join(ASSETS_DIR, "js", "supabase-config.js");
  const destinationPath = path.join(PUBLIC_DIR, "assets", "js", "supabase-config.js");
  const runtimeConfig = getSupabaseBuildConfig();

  if (!fs.existsSync(sourcePath)) {
    return;
  }

  if (!runtimeConfig) {
    copyRecursive(sourcePath, destinationPath);
    return;
  }

  const contents = [
    "// Generated during build from Vercel environment variables.",
    "(function () {",
    "  window.__SUPABASE_CONFIG__ = {",
    `    url: ${JSON.stringify(runtimeConfig.url)},`,
    `    anonKey: ${JSON.stringify(runtimeConfig.anonKey)},`,
    `    schema: ${JSON.stringify(runtimeConfig.schema)}`,
    "  };",
    "})();",
    ""
  ].join("\n");

  ensureDir(path.dirname(destinationPath));
  fs.writeFileSync(destinationPath, contents, "utf8");
}

const ASSET_PATH_REWRITES = [
  { pattern: /(["'])\/(sage\.css)\1/g, replacement: "$1/assets/css/sage.css$1" },
  { pattern: /(["'])\/(carousel\.css)\1/g, replacement: "$1/assets/css/carousel.css$1" },
  { pattern: /(["'])\/(manifesto\.css)\1/g, replacement: "$1/assets/css/manifesto.css$1" },
  { pattern: /(["'])\/(prism\.css)\1/g, replacement: "$1/assets/css/prism.css$1" },
  { pattern: /(["'])\/(sage\.js)\1/g, replacement: "$1/assets/js/sage.js$1" },
  { pattern: /(["'])\/(sidebar\.js)\1/g, replacement: "$1/assets/js/sidebar.js$1" },
  { pattern: /(["'])\/(progress\.js)\1/g, replacement: "$1/assets/js/progress.js$1" },
  { pattern: /(["'])\/(home\.js)\1/g, replacement: "$1/assets/js/home.js$1" },
  { pattern: /(["'])\/(prism\.js)\1/g, replacement: "$1/assets/js/prism.js$1" },
  { pattern: /(["'])\/common\/([^"']+\.js)\1/g, replacement: "$1/assets/js/$2$1" },
  { pattern: /(["'])\.\.\/\.\.\/common\/([^"']+\.js)\1/g, replacement: "$1/assets/js/$2$1" },
  { pattern: /(["'])\.\.\/common\/([^"']+\.js)\1/g, replacement: "$1/assets/js/$2$1" },
  { pattern: /(["'])\.\/common\/([^"']+\.js)\1/g, replacement: "$1/assets/js/$2$1" },
  { pattern: /(["'])common\/([^"']+\.js)\1/g, replacement: "$1/assets/js/$2$1" },
  { pattern: /(["'])\/(images\/)\1/g, replacement: "$1/assets/images/$1" },
  { pattern: /(["'])\.\.\/\.\.\/images\//g, replacement: "$1/assets/images/" },
  { pattern: /(["'])\.\.\/images\//g, replacement: "$1/assets/images/" },
  { pattern: /(["'])\.\/images\//g, replacement: "$1/assets/images/" },
  { pattern: /(["'])images\//g, replacement: "$1/assets/images/" },
  { pattern: /(["'])\.\.\/\.\.\/sage\.css\1/g, replacement: "$1/assets/css/sage.css$1" },
  { pattern: /(["'])\.\.\/sage\.css\1/g, replacement: "$1/assets/css/sage.css$1" },
  { pattern: /(["'])\.\/sage\.css\1/g, replacement: "$1/assets/css/sage.css$1" },
  { pattern: /(["'])sage\.css\1/g, replacement: "$1/assets/css/sage.css$1" },
  { pattern: /(["'])\.\.\/\.\.\/prism\.css\1/g, replacement: "$1/assets/css/prism.css$1" },
  { pattern: /(["'])\.\.\/prism\.css\1/g, replacement: "$1/assets/css/prism.css$1" },
  { pattern: /(["'])\.\/prism\.css\1/g, replacement: "$1/assets/css/prism.css$1" },
  { pattern: /(["'])prism\.css\1/g, replacement: "$1/assets/css/prism.css$1" },
  { pattern: /(["'])\.\.\/\.\.\/prism\.js\1/g, replacement: "$1/assets/js/prism.js$1" },
  { pattern: /(["'])\.\.\/prism\.js\1/g, replacement: "$1/assets/js/prism.js$1" },
  { pattern: /(["'])\.\/prism\.js\1/g, replacement: "$1/assets/js/prism.js$1" },
  { pattern: /(["'])prism\.js\1/g, replacement: "$1/assets/js/prism.js$1" },
  { pattern: /(["'])\.\.\/\.\.\/sage\.js\1/g, replacement: "$1/assets/js/sage.js$1" },
  { pattern: /(["'])\.\.\/sage\.js\1/g, replacement: "$1/assets/js/sage.js$1" },
  { pattern: /(["'])\.\/sage\.js\1/g, replacement: "$1/assets/js/sage.js$1" },
  { pattern: /(["'])sage\.js\1/g, replacement: "$1/assets/js/sage.js$1" }
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanPublicDir() {
  if (fs.existsSync(PUBLIC_DIR)) {
    fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  }
  ensureDir(PUBLIC_DIR);
}

function readTextOrEmpty(filePath) {
  if (!fs.existsSync(filePath)) {
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyHtmlOnlyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sourcePath = path.join(src, entry.name);
    const targetPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyHtmlOnlyRecursive(sourcePath, targetPath);
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".html") &&
      entry.name.toLowerCase() !== "template.html"
    ) {
      ensureDir(path.dirname(targetPath));
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function shouldCopyLabStaticAsset(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const staticAssetExtensions = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".bmp",
    ".ico",
    ".avif",
    ".mp3",
    ".wav",
    ".ogg",
    ".mp4",
    ".webm",
    ".mov",
    ".m4v",
    ".css",
    ".js",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".eot"
  ]);

  return staticAssetExtensions.has(ext);
}

function copyLabStaticAssetsRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sourcePath = path.join(src, entry.name);
    const targetPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyLabStaticAssetsRecursive(sourcePath, targetPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!shouldCopyLabStaticAsset(entry.name)) {
      continue;
    }

    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function collectHtmlFiles(dir, result = []) {
  if (!fs.existsSync(dir)) {
    return result;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(fullPath, result);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      result.push(fullPath);
    }
  }
  return result;
}

function collectTopLevelHtmlFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html"))
    .map((entry) => path.join(dir, entry.name));
}

function sanitizeTitle(raw) {
  return raw
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function detectTitle(content, sourcePath) {
  const explicitMatch = content.match(/<!--\s*@page-title:\s*(.*?)\s*-->/i);
  if (explicitMatch) {
    return explicitMatch[1].trim();
  }

  const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].replace(/<[^>]+>/g, "").trim();
  }

  const fileName = path.basename(sourcePath, ".html");
  return sanitizeTitle(fileName || "Sage-Code");
}

function buildMaintenanceBanner() {
  if ((process.env.MIGRATION_MAINTENANCE_MODE || "").toLowerCase() !== "true") {
    return "";
  }

  return [
    '<div class="migration-banner" role="status" aria-live="polite">',
    "  Maintenance: this page is being migrated to the new static architecture.",
    "</div>"
  ].join("\n");
}

function renderFromTemplate(content, sourcePath, templates) {
  const { baseTemplate, headerTemplate, footerTemplate } = templates;
  const title = detectTitle(content, sourcePath);
  const maintenanceBanner = buildMaintenanceBanner();
  const description = "Sage-Code static page";

  return baseTemplate
    .replace("{{title}}", title)
    .replace("{{meta_description}}", description)
    .replace("{{head_extra}}", "")
    .replace("{{maintenance_banner}}", maintenanceBanner)
    .replace("{{header}}", headerTemplate)
    .replace("{{content}}", content)
    .replace("{{footer}}", footerTemplate);
}

function rewritePublishedRoutePrefix(html, sourcePrefix, publishedPrefix) {
  const pattern = new RegExp(`(["'])\\/${sourcePrefix}\\/`, "gi");
  return html.replace(pattern, `$1/${publishedPrefix}/`);
}

function rewriteAssetPaths(html) {
  let transformed = html;
  for (const rule of ASSET_PATH_REWRITES) {
    transformed = transformed.replace(rule.pattern, rule.replacement);
  }

  // Normalize roadmap publish routes under /roadmap and standalone project routes under /projects.
  transformed = rewritePublishedRoutePrefix(transformed, "engineering", "roadmap/cse");
  transformed = rewritePublishedRoutePrefix(transformed, "programming", "roadmap/csp");
  transformed = rewritePublishedRoutePrefix(transformed, "cse", "roadmap/cse");
  transformed = rewritePublishedRoutePrefix(transformed, "csp", "roadmap/csp");
  transformed = rewritePublishedRoutePrefix(transformed, "csa", "roadmap/csa");
  transformed = rewritePublishedRoutePrefix(transformed, "dsa", "roadmap/dsa");
  transformed = rewritePublishedRoutePrefix(transformed, "itc", "roadmap/hpc");
  transformed = rewritePublishedRoutePrefix(transformed, "hpc", "roadmap/hpc");
  transformed = rewritePublishedRoutePrefix(transformed, "tek", "roadmap/tek");
  transformed = rewritePublishedRoutePrefix(transformed, "ops", "roadmap/tek");
  transformed = rewritePublishedRoutePrefix(transformed, "dba", "roadmap/dba");
  transformed = rewritePublishedRoutePrefix(transformed, "sml", "roadmap/sml");
  transformed = rewritePublishedRoutePrefix(transformed, "osd", "roadmap/osd");
  transformed = rewritePublishedRoutePrefix(transformed, "dsk", "roadmap/dsk");
  transformed = rewritePublishedRoutePrefix(transformed, "das", "roadmap/sml");
  transformed = rewritePublishedRoutePrefix(transformed, "csd", "roadmap/sml");
  transformed = rewritePublishedRoutePrefix(transformed, "pro", "projects");

  // MAJ assets and media now live under the standalone /projects namespace.
  transformed = transformed.replace(/(["'])\/maj\/\.\.\/projects\//gi, "$1/projects/");
  transformed = transformed.replace(/(["'])\/content\/maj\//gi, "$1/projects/maj/");
  transformed = transformed.replace(/(["'])\/maj\//gi, "$1/projects/maj/");
  transformed = transformed.replace(/(["'])\/maj\/img\//gi, "$1/projects/maj/img/");
  transformed = transformed.replace(/(["'])((?:\.\.\/)+)maj\/img\//gi, "$1$2projects/maj/img/");

  // Normalize legacy image roots to the centralized assets folder.
  transformed = transformed.replace(/(["'])\/images\//g, "$1/assets/images/");

  // Several legacy references use .jpg while only .svg diagrams exist in assets/images.
  transformed = transformed.replace(/assets\/images\/(array|decision|ladder|for-loop|while|switch|function)\.jpg/gi, "assets/images/$1.svg");

  return transformed;
}

function getRelativeRootPrefix(sourcePath) {
  const relativePath = path.relative(PUBLIC_DIR, sourcePath);
  if (!relativePath || relativePath.startsWith("..")) {
    return "./";
  }

  const depth = relativePath.split(path.sep).length - 1;
  if (depth <= 0) {
    return "./";
  }

  return "../".repeat(depth);
}

function relativizeInternalRootLinks(html, sourcePath) {
  const prefix = getRelativeRootPrefix(sourcePath);

  let transformed = html;

  // Convert exact site-root links first (e.g., href="/").
  transformed = transformed.replace(/\b(href|src)=(["'])\/\2/gi, (match, attr, quote) => {
    return `${attr}=${quote}${prefix}${quote}`;
  });

  // Convert root-relative href/src links to page-relative paths for local /public serving.
  return transformed.replace(/\b(href|src)=(["'])\/([^"']*)\2/gi, (match, attr, quote, value) => {
    // Keep protocol-relative URLs unchanged.
    if (value.startsWith("/")) {
      return match;
    }

    // Anchor-only references remain unchanged.
    if (value.startsWith("#")) {
      return match;
    }

    const relative = `${prefix}${value}`;
    return `${attr}=${quote}${relative}${quote}`;
  });
}

function normalizeSharedBrandAssets(html, sourcePath) {
  const prefix = getRelativeRootPrefix(sourcePath);
  const logoPath = `${prefix}assets/images/sage-logo.svg`;
  const faviconPath = `${prefix}assets/images/favicon.ico`;

  let transformed = html;
  transformed = transformed.replace(/\bsrc=(['"])(?:[^"']*\/)?sage-logo\.svg\1/gi, (match, quote) => {
    return `src=${quote}${logoPath}${quote}`;
  });

  transformed = transformed.replace(/\bhref=(['"])(?:[^"']*\/)?favicon\.ico\1/gi, (match, quote) => {
    return `href=${quote}${faviconPath}${quote}`;
  });

  return transformed;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSourceRouteForPublicRoute(publicRoute) {
  for (const [sourceRoute, publishedRoute] of Object.entries(LAB_ROUTE_MAP)) {
    if (publishedRoute === publicRoute) {
      return sourceRoute;
    }
  }
  return publicRoute;
}

function resolveContentRouteSourceDir(publicRoute) {
  const directRouteDir = path.join(ROADMAP_DIR, publicRoute);
  if (fs.existsSync(directRouteDir)) {
    return directRouteDir;
  }

  const sourceTopLevelRoute = getSourceRouteForPublicRoute(publicRoute);
  const legacyRouteDir = path.join(ROADMAP_LABS_DIR, sourceTopLevelRoute);
  if (fs.existsSync(legacyRouteDir)) {
    return legacyRouteDir;
  }

  return null;
}

function resolveSidebarJsonPath(publicHtmlPath) {
  const relativePath = path.relative(PUBLIC_DIR, publicHtmlPath);
  if (!relativePath || relativePath.startsWith("..")) {
    return null;
  }

  const publicPathParts = relativePath.split(path.sep);
  if (publicPathParts.length < 2) {
    return null;
  }

  const contentRootOffset = publicPathParts[0].toLowerCase() === "roadmap" ? 1 : 0;
  if (publicPathParts.length < contentRootOffset + 2) {
    return null;
  }

  const topLevelRoute = publicPathParts[contentRootOffset].toLowerCase();
  const isRoadmapRoute = ROADMAP_BASE_FOLDERS.includes(topLevelRoute);
  const isMappedLabRoute = Object.values(LAB_ROUTE_MAP).includes(topLevelRoute);
  if (!isRoadmapRoute && !isMappedLabRoute) {
    return null;
  }

  const contentRouteDir = resolveContentRouteSourceDir(topLevelRoute);
  if (!contentRouteDir) {
    return null;
  }

  const relativeJsonPath = publicPathParts.slice(contentRootOffset + 1).join(path.sep).replace(/\.html$/i, ".json");
  const jsonPath = path.join(contentRouteDir, relativeJsonPath);
  return fs.existsSync(jsonPath) ? jsonPath : null;
}

function renderSidebarItems(items, state = { index: 0 }, level = 0) {
  let html = "";

  for (const item of items) {
    const title = escapeHtml(item.title || "Untitled");
    const link = item.link || (item.target ? `#${item.target}` : "#");
    const safeLink = escapeHtml(link);
    const isAnchorLink = link.startsWith("#");

    if (!isAnchorLink) {
      if (Array.isArray(item.children) && item.children.length > 0) {
        html += renderSidebarItems(item.children, state, level);
      }
      continue;
    }

    const itemId = `sidebar-item-${state.index}`;
    state.index += 1;

    html += `<li class="nav-item mb-2" id="${itemId}" data-sidebar-level="${level}">`;
    html += `<div class="nav-node-row">`;
    const checkboxId = `sidebar-check-${state.index}`;
    html += `<input type="checkbox" class="form-check-input me-2" id="${checkboxId}" data-is-trackable="true" data-link="${safeLink}" data-section-key="${escapeHtml(link.slice(1))}">`;
    html += `<a href="${safeLink}" class="text-info text-decoration-none">${title}</a>`;
    html += `</div>`;

    if (Array.isArray(item.children) && item.children.length > 0) {
      html += `<ul class="list-unstyled ms-4 mt-1" data-sidebar-group="children" data-sidebar-level="${level + 1}">`;
      html += renderSidebarItems(item.children, state, level + 1);
      html += "</ul>";
    }

    html += "</li>";
  }

  return html;
}

function renderReturnToRoadmapItem() {
  return `<li class="nav-item mb-2 return-roadmap-link"><a href="./index.html" class="text-info text-decoration-none">Return to Roadmap</a></li>`;
}

function findBookmarkListBounds(html) {
  const openTagRegex = /<ul[^>]*id=["']bookmark-list["'][^>]*>/i;
  const openMatch = openTagRegex.exec(html);
  if (!openMatch) {
    return null;
  }

  const openStart = openMatch.index;
  const openTag = openMatch[0];
  const openEnd = openStart + openTag.length;

  const ulTagRegex = /<\/?ul\b[^>]*>/gi;
  ulTagRegex.lastIndex = openEnd;
  let depth = 1;

  for (let match = ulTagRegex.exec(html); match; match = ulTagRegex.exec(html)) {
    const token = match[0].toLowerCase();
    if (token.startsWith("</ul")) {
      depth -= 1;
      if (depth === 0) {
        return {
          openStart,
          openEnd,
          closeStart: match.index,
          closeEnd: ulTagRegex.lastIndex,
          openTag
        };
      }
    } else {
      depth += 1;
    }
  }

  return null;
}

function markBookmarkListAsStatic(openTag) {
  if (/\bdata-static-sidebar\s*=\s*["']true["']/i.test(openTag)) {
    return openTag;
  }

  return openTag.replace(/>$/, ' data-static-sidebar="true">');
}

function ensureReturnToRoadmapLink(html) {
  const bounds = findBookmarkListBounds(html);
  if (!bounds) {
    return html;
  }

  const inner = html.slice(bounds.openEnd, bounds.closeStart);
  if (/return-roadmap-link|Return to Roadmap/i.test(inner)) {
    return html;
  }

  const trimmedInner = inner.trimEnd();
  const separator = trimmedInner.length > 0 ? "\n" : "";
  const updatedInner = `${trimmedInner}${separator}${renderReturnToRoadmapItem()}\n`;

  return `${html.slice(0, bounds.openEnd)}${updatedInner}${html.slice(bounds.closeStart)}`;
}

function injectStaticSidebar(html, sourcePath) {
  const bounds = findBookmarkListBounds(html);
  if (!bounds) {
    return html;
  }

  if (/\bdata-static-sidebar\s*=\s*["']true["']/i.test(bounds.openTag)) {
    return html;
  }

  const jsonPath = resolveSidebarJsonPath(sourcePath);
  if (!jsonPath) {
    return html;
  }

  let navItems = [];
  try {
    navItems = JSON.parse(readTextOrEmpty(jsonPath));
  } catch {
    return html;
  }

  if (!Array.isArray(navItems) || navItems.length === 0) {
    return html;
  }

  let transformed = html;
  transformed = transformed.replace(
    /<aside class=["']side-bar\b([^"']*)["']/i,
    '<aside id="topic-sidebar" class="side-bar$1"'
  );

  const refreshedBounds = findBookmarkListBounds(transformed);
  if (!refreshedBounds) {
    return transformed;
  }

  const staticOpenTag = markBookmarkListAsStatic(refreshedBounds.openTag);
  const renderedList = `${renderSidebarItems(navItems)}\n${renderReturnToRoadmapItem()}`;
  transformed =
    `${transformed.slice(0, refreshedBounds.openStart)}` +
    `${staticOpenTag}\n${renderedList}\n` +
    `${transformed.slice(refreshedBounds.closeStart)}`;

  return transformed;
}

function injectInlineHeader(html, headerTemplate) {
  if (!headerTemplate.trim()) {
    return html;
  }

  const headerWithPlaceholderRegex = /<header[^>]*id=["']dynamic-header["'][^>]*>\s*<\/header>/i;
  if (headerWithPlaceholderRegex.test(html)) {
    return html.replace(headerWithPlaceholderRegex, headerTemplate);
  }

  return html;
}

function injectInlineFooter(html, footerTemplate, enforceCommonFooter = false) {
  if (!footerTemplate.trim()) {
    return html;
  }

  const normalizedFooter = footerTemplate.trim();

  const footerWithPlaceholderRegex = /<footer[^>]*id=["']dynamic-footer["'][^>]*>\s*<\/footer>/i;
  if (footerWithPlaceholderRegex.test(html)) {
    return html.replace(footerWithPlaceholderRegex, normalizedFooter);
  }

  if (!enforceCommonFooter) {
    if (/<footer[\s>]/i.test(html)) {
      return html;
    }

    if (/<\/body>/i.test(html)) {
      return html.replace(/<\/body>/i, `${normalizedFooter}\n</body>`);
    }

    return `${html}\n${normalizedFooter}`;
  }

  if (/<footer[\s>]/i.test(html)) {
    return html.replace(/<footer\b[\s\S]*?<\/footer>/i, normalizedFooter);
  }

  const bodyCloseWithContainerEndRegex = /(\s*<\/div>\s*)(<\/body>)/i;
  if (bodyCloseWithContainerEndRegex.test(html)) {
    return html.replace(bodyCloseWithContainerEndRegex, `\n${normalizedFooter}\n$1$2`);
  }

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${normalizedFooter}\n</body>`);
  }

  return `${html}\n${normalizedFooter}`;
}

function shouldEnforceCommonFooter(sourcePath) {
  const normalized = sourcePath.replace(/\\/g, "/").toLowerCase();
  return normalized.includes("/public/") && normalized.endsWith(".html");
}

function makeInlineScriptFileName(sourcePath, index, scriptBody) {
  const relativePath = path.relative(PUBLIC_DIR, sourcePath).replace(/\\/g, "/");
  const sourceStub = relativePath
    .replace(/\.html$/i, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/\//g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const hash = crypto
    .createHash("sha1")
    .update(`${relativePath}:${index}:${scriptBody}`)
    .digest("hex")
    .slice(0, 12);

  return `${sourceStub || "page"}-${index}-${hash}.js`;
}

function externalizeInlineScripts(html, sourcePath) {
  let scriptIndex = 0;
  const scriptTagRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

  return html.replace(scriptTagRegex, (fullMatch, attrs = "", body = "") => {
    const attrsLower = attrs.toLowerCase();
    if (/\bsrc\s*=/.test(attrsLower)) {
      return fullMatch;
    }

    if (/\btype\s*=\s*["']application\/ld\+json["']/.test(attrsLower)) {
      return fullMatch;
    }

    if (!body.trim()) {
      return "";
    }

    scriptIndex += 1;
    const outputFileName = makeInlineScriptFileName(sourcePath, scriptIndex, body);
    const inlineJsRelative = path.posix.join("assets", "js", "inline", outputFileName);
    const inlineJsAbsolute = path.join(PUBLIC_DIR, ...inlineJsRelative.split("/"));

    ensureDir(path.dirname(inlineJsAbsolute));
    fs.writeFileSync(inlineJsAbsolute, `${body.trim()}\n`, "utf8");

    const preserveTypeModule = /\btype\s*=\s*["']module["']/.test(attrsLower) ? ' type="module"' : "";
    const preserveNoModule = /\bnomodule\b/.test(attrsLower) ? " nomodule" : "";
    return `<script${preserveTypeModule}${preserveNoModule} src="/${inlineJsRelative}"></script>`;
  });
}

function optimizeHtmlOutput(html, headerTemplate, footerTemplate, sourcePath) {
  let transformed = html;
  const enforceCommonFooter = shouldEnforceCommonFooter(sourcePath);
  transformed = injectInlineHeader(transformed, headerTemplate);
  transformed = injectInlineFooter(transformed, footerTemplate, enforceCommonFooter);
  transformed = injectStaticSidebar(transformed, sourcePath);
  transformed = ensureReturnToRoadmapLink(transformed);
  transformed = rewriteAssetPaths(transformed);
  transformed = relativizeInternalRootLinks(transformed, sourcePath);
  transformed = normalizeSharedBrandAssets(transformed, sourcePath);

  // Enforce folder-style routes for top-level hubs.
  transformed = transformed.replace(/\b(href|src)=(['"])([^"']*?)roadmap\.html\2/gi, "$1=$2$3roadmap/$2");
  transformed = transformed.replace(/\b(href|src)=(['"])([^"']*?)community\.html\2/gi, "$1=$2$3community/$2");

  transformed = externalizeInlineScripts(transformed, sourcePath);
  return transformed;
}

function copyAssets() {
  copyRecursive(ASSETS_DIR, path.join(PUBLIC_DIR, "assets"));
}

function copySystemRuntimeFiles() {
  for (const fileName of SYSTEM_RUNTIME_FILES) {
    const source = path.join(ROOT, fileName);
    const destination = path.join(PUBLIC_DIR, fileName);
    if (fileName === "sitemap.xml" && fs.existsSync(source)) {
      let sitemap = readTextOrEmpty(source);
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/engineering\//gi, "https://sagecode.org/roadmap/cse/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/programming\//gi, "https://sagecode.org/roadmap/csp/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/cse\//gi, "https://sagecode.org/roadmap/cse/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/csp\//gi, "https://sagecode.org/roadmap/csp/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/csa\//gi, "https://sagecode.org/roadmap/csa/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/dsa\//gi, "https://sagecode.org/roadmap/dsa/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/itc\//gi, "https://sagecode.org/roadmap/hpc/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/hpc\//gi, "https://sagecode.org/roadmap/hpc/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/tek\//gi, "https://sagecode.org/roadmap/tek/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/ops\//gi, "https://sagecode.org/roadmap/tek/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/dba\//gi, "https://sagecode.org/roadmap/dba/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/sml\//gi, "https://sagecode.org/roadmap/sml/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/osd\//gi, "https://sagecode.org/roadmap/osd/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/dsk\//gi, "https://sagecode.org/roadmap/dsk/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/das\//gi, "https://sagecode.org/roadmap/sml/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/csd\//gi, "https://sagecode.org/roadmap/sml/");
      sitemap = sitemap.replace(/https:\/\/sagecode\.org\/pro\//gi, "https://sagecode.org/projects/");
      ensureDir(path.dirname(destination));
      fs.writeFileSync(destination, sitemap, "utf8");
      continue;
    }

    copyRecursive(source, destination);
  }
}

function copyLabHtml() {
  if (!fs.existsSync(ROADMAP_LABS_DIR)) {
    return;
  }

  for (const [sourceDirName, publicDirName] of Object.entries(LAB_ROUTE_MAP)) {
    const sourceDir = path.join(ROADMAP_LABS_DIR, sourceDirName);
    const destinationDir = path.join(PUBLIC_DIR, publicDirName);
    copyHtmlOnlyRecursive(sourceDir, destinationDir);
  }
}

function copyLabStaticAssets() {
  if (!fs.existsSync(ROADMAP_LABS_DIR)) {
    return;
  }

  for (const [sourceDirName, publicDirName] of Object.entries(LAB_ROUTE_MAP)) {
    const sourceDir = path.join(ROADMAP_LABS_DIR, sourceDirName);
    const destinationDir = path.join(PUBLIC_DIR, publicDirName);
    copyLabStaticAssetsRecursive(sourceDir, destinationDir);
  }
}

function shouldCopyProjectStaticAsset(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const staticAssetExtensions = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".bmp",
    ".ico",
    ".avif",
    ".mp3",
    ".wav",
    ".ogg",
    ".mp4",
    ".webm",
    ".mov",
    ".m4v",
    ".css",
    ".js",
    ".json",
    ".pdf",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".eot"
  ]);

  return staticAssetExtensions.has(ext);
}

function copyCommunityContent() {
  if (!fs.existsSync(COMMUNITY_DIR)) {
    return;
  }

  const destinationDir = path.join(PUBLIC_DIR, "community");
  copyHtmlOnlyRecursive(COMMUNITY_DIR, destinationDir);
  copyProjectStaticAssetsRecursive(COMMUNITY_DIR, destinationDir);
}

function copyProjectStaticAssetsRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sourcePath = path.join(src, entry.name);
    const targetPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyProjectStaticAssetsRecursive(sourcePath, targetPath);
      continue;
    }

    if (!entry.isFile() || !shouldCopyProjectStaticAsset(entry.name)) {
      continue;
    }

    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function copyProjectContent() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return;
  }

  const destinationDir = path.join(PUBLIC_DIR, "projects");
  copyHtmlOnlyRecursive(PROJECTS_DIR, destinationDir);
  copyProjectStaticAssetsRecursive(PROJECTS_DIR, destinationDir);
}

function copyRoadmapBaseIndexes() {
  for (const roadmap of ROADMAP_BASE_FOLDERS) {
    const sourceDir = path.join(ROADMAP_DIR, roadmap);
    if (!fs.existsSync(sourceDir)) {
      continue;
    }

    const destinationDir = path.join(PUBLIC_DIR, "roadmap", roadmap);
    copyHtmlOnlyRecursive(sourceDir, destinationDir);
    copyLabStaticAssetsRecursive(sourceDir, destinationDir);

    const sourceIndex = path.join(sourceDir, "index.html");
    if (fs.existsSync(sourceIndex)) {
      const destinationIndex = path.join(destinationDir, "index.html");
      ensureDir(path.dirname(destinationIndex));
      fs.copyFileSync(sourceIndex, destinationIndex);
    }
  }
}

function copyRoadmapLandingPage() {
  const sourceIndex = path.join(ROADMAP_DIR, "index.html");
  if (!fs.existsSync(sourceIndex)) {
    return;
  }

  const destinationIndex = path.join(PUBLIC_DIR, "roadmap", "index.html");
  ensureDir(path.dirname(destinationIndex));
  fs.copyFileSync(sourceIndex, destinationIndex);
}

function copyRoadmapTopLevelPages() {
  if (!fs.existsSync(ROADMAP_DIR)) {
    return;
  }

  for (const entry of fs.readdirSync(ROADMAP_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".html")) {
      continue;
    }

    if (entry.name.toLowerCase() === "index.html") {
      continue;
    }

    const sourcePath = path.join(ROADMAP_DIR, entry.name);
    const destinationPath = path.join(PUBLIC_DIR, "roadmap", entry.name);
    ensureDir(path.dirname(destinationPath));
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

function buildContentPages() {
  const baseTemplate = readTextOrEmpty(path.join(LAYOUTS_DIR, "base.html"));
  const headerTemplate = readTextOrEmpty(path.join(LAYOUTS_DIR, "header.html"));
  const footerTemplate = readTextOrEmpty(path.join(LAYOUTS_DIR, "footer.html"));

  if (!baseTemplate.trim()) {
    return { pageCount: 0, renderedPages: [] };
  }

  const sourceFiles = collectTopLevelHtmlFiles(ROOT_PAGES_DIR);
  const renderedPages = [];

  for (const sourceFile of sourceFiles) {
    const content = readTextOrEmpty(sourceFile);
    const relativePath = path.basename(sourceFile);
    const destinationPath = path.join(PUBLIC_DIR, relativePath);

    const isFullDocument = /<html[\s>]/i.test(content) && /<body[\s>]/i.test(content);
    const output = isFullDocument
      ? content
      : renderFromTemplate(content, sourceFile, {
          baseTemplate,
          headerTemplate,
          footerTemplate
        });

    const optimizedOutput = optimizeHtmlOutput(output, headerTemplate, footerTemplate, destinationPath);

    ensureDir(path.dirname(destinationPath));
    fs.writeFileSync(destinationPath, optimizedOutput, "utf8");
    renderedPages.push(relativePath);
  }

  return {
    pageCount: renderedPages.length,
    renderedPages
  };
}

function optimizePublishedHtmlFiles() {
  const headerTemplate = readTextOrEmpty(path.join(LAYOUTS_DIR, "header.html"));
  const footerTemplate = readTextOrEmpty(path.join(LAYOUTS_DIR, "footer.html"));
  const htmlFiles = collectHtmlFiles(PUBLIC_DIR);
  for (const filePath of htmlFiles) {
    const current = readTextOrEmpty(filePath);
    const transformed = optimizeHtmlOutput(current, headerTemplate, footerTemplate, filePath);
    if (transformed !== current) {
      fs.writeFileSync(filePath, transformed, "utf8");
    }
  }
}

function writeBuildManifest(contentResult) {
  const manifest = {
    generatedAtUtc: new Date().toISOString(),
    pageCount: contentResult.pageCount,
    renderedPages: contentResult.renderedPages,
    maintenanceMode: (process.env.MIGRATION_MAINTENANCE_MODE || "false").toLowerCase() === "true",
    strategy: "incremental-static-migration"
  };

  fs.writeFileSync(
    path.join(ROOT, "manual", "build-manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
}

function main() {
  cleanPublicDir();
  copyAssets();
  writeSupabaseConfigAsset();
  copySystemRuntimeFiles();
  copyLabHtml();
  copyLabStaticAssets();
  copyProjectContent();
  copyCommunityContent();
  copyRoadmapBaseIndexes();
  copyRoadmapTopLevelPages();
  copyRoadmapLandingPage();
  const contentResult = buildContentPages();
  optimizePublishedHtmlFiles();
  writeBuildManifest(contentResult);

  console.log(`Build complete. Rendered ${contentResult.pageCount} page(s) from roadmap root.`);
}

main();