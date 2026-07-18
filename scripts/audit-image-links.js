const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const scanRootArg = process.argv[2] || "public";
const scanRoot = path.resolve(root, scanRootArg);

const IMAGE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp", ".ico", ".avif"
]);

function listFilesRecursively(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFilesRecursively(fullPath, out);
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}

function normalizeUrlCandidate(url) {
  if (!url) return "";
  const firstToken = url.trim().split(/\s+/)[0] || "";
  const clean = firstToken.split("?")[0].split("#")[0];
  try {
    return decodeURIComponent(clean);
  } catch {
    return clean;
  }
}

function isLocalUrl(url) {
  return !/^(https?:|data:|#|\/\/)/i.test(url);
}

function isImagePath(url) {
  const ext = path.extname(url).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

function extractImageRefs(html) {
  const refs = [];
  const patterns = [
    /<img\b[^>]*\bsrc\s*=\s*(["'])([^"']+)\1/gi,
    /\bposter\s*=\s*(["'])([^"']+)\1/gi,
    /\bsrcset\s*=\s*(["'])([^"']+)\1/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const raw = match[2];
      const parts = raw.split(",");
      for (const part of parts) {
        const normalized = normalizeUrlCandidate(part);
        if (!normalized) continue;
        refs.push(normalized);
      }
    }
  }

  return refs;
}

function resolveRef(htmlPath, ref) {
  if (ref.startsWith("/")) {
    return path.join(scanRoot, ref.slice(1));
  }
  return path.resolve(path.dirname(htmlPath), ref);
}

function runAudit() {
  const htmlFiles = listFilesRecursively(scanRoot).filter((f) => f.toLowerCase().endsWith(".html"));
  const issues = [];

  for (const htmlPath of htmlFiles) {
    const html = fs.readFileSync(htmlPath, "utf8");
    const refs = extractImageRefs(html);

    for (const ref of refs) {
      if (!isLocalUrl(ref)) continue;
      if (!isImagePath(ref)) continue;

      const resolved = resolveRef(htmlPath, ref);
      if (!fs.existsSync(resolved)) {
        issues.push({
          file: path.relative(root, htmlPath).replace(/\\/g, "/"),
          ref,
          resolved: path.relative(root, resolved).replace(/\\/g, "/")
        });
      }
    }
  }

  const unique = [];
  const seen = new Set();
  for (const issue of issues) {
    const key = `${issue.file}::${issue.ref}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(issue);
    }
  }

  const byRef = new Map();
  for (const issue of unique) {
    byRef.set(issue.ref, (byRef.get(issue.ref) || 0) + 1);
  }

  const summary = {
    scanRoot: path.relative(root, scanRoot).replace(/\\/g, "/"),
    htmlFilesScanned: htmlFiles.length,
    brokenImageRefs: unique.length,
    topMissingRefs: [...byRef.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([ref, count]) => ({ ref, count }))
  };

  const report = { summary, issues: unique };
  const reportPath = path.join(root, "manual", "image-audit-public.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`Audit complete: ${summary.htmlFilesScanned} HTML files`);
  console.log(`Broken image refs: ${summary.brokenImageRefs}`);
  console.log(`Report: ${path.relative(root, reportPath).replace(/\\/g, "/")}`);
}

runAudit();
