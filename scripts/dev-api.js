"use strict";

// Local stand-in for `vercel dev`: serves public/ and routes /api/* to the same
// handlers Vercel runs. Reads env.local for Turso and Resend settings.
//
//   npm run build && npm run dev:api      -> http://localhost:3000/roadmaps/

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const PORT = Number(process.env.PORT) || 3000;

for (const line of (fs.existsSync(path.join(ROOT, "env.local")) ? fs.readFileSync(path.join(ROOT, "env.local"), "utf8") : "").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (match && process.env[match[1]] === undefined) {
    process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
}

const routes = [
  { pattern: /^\/api\/auth\/([a-z]+)\/?$/, handler: () => require("../api/auth/[action].js"), param: "action" },
  { pattern: /^\/api\/progress\/?$/, handler: () => require("../api/progress.js") },
  { pattern: /^\/api\/projects\/?$/, handler: () => require("../api/projects.js") },
  { pattern: /^\/api\/favorites\/?$/, handler: () => require("../api/favorites.js") },
  { pattern: /^\/api\/profile\/avatar\/?$/, handler: () => require("../api/profile/avatar.js") },
  { pattern: /^\/api\/quizzes\/submit\/?$/, handler: () => require("../api/quizzes/submit.js") },
  { pattern: /^\/api\/roadmap\/([a-z]+)\/?$/, handler: () => require("../api/roadmap/[action].js"), param: "action" },
  { pattern: /^\/api\/community\/avatar\/?$/, handler: () => require("../api/community/avatar.js") },
  { pattern: /^\/api\/community\/directory\/?$/, handler: () => require("../api/community/directory.js") },
  { pattern: /^\/api\/community\/member\/?$/, handler: () => require("../api/community/member.js") },
  { pattern: /^\/api\/community\/profile\/?$/, handler: () => require("../api/community/profile.js") },
  { pattern: /^\/api\/community\/testimonial\/?$/, handler: () => require("../api/community/testimonial.js") }
];

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml"
};

function serveStatic(req, res, pathname) {
  const safe = path.normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  const base = path.join(PUBLIC_DIR, safe);
  if (!base.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  const candidates = [base, `${base}.html`, path.join(base, "index.html")];
  const file = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!file) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  res.setHeader("Content-Type", TYPES[path.extname(file).toLowerCase()] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  for (const route of routes) {
    const match = url.pathname.match(route.pattern);
    if (match) {
      req.query = Object.fromEntries(url.searchParams.entries());
      if (route.param) {
        req.query[route.param] = match[1];
      }
      await route.handler()(req, res);
      return;
    }
  }
  serveStatic(req, res, url.pathname);
}).listen(PORT, () => {
  console.log(`[dev-api] http://localhost:${PORT}/roadmaps/  (API + public/)`);
});
