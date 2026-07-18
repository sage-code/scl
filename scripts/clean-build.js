#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const BUILD_MANIFEST = path.join(ROOT, "manual", "build-manifest.json");

function removePath(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return false;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  return true;
}

function emptyDirectory(targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    return { existed: false, removed: 0 };
  }

  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(targetDir, entry.name);
    fs.rmSync(entryPath, { recursive: true, force: true });
  }

  return { existed: true, removed: entries.length };
}

function runBuild() {
  const result = spawnSync(process.execPath, ["build.js"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: false
  });

  if (typeof result.status === "number") {
    process.exit(result.status);
  }

  process.exit(1);
}

function main() {
  const args = new Set(process.argv.slice(2));
  const shouldRebuild = args.has("--rebuild");

  const cleanedPublic = emptyDirectory(PUBLIC_DIR);
  const removedManifest = removePath(BUILD_MANIFEST);

  if (!cleanedPublic.existed) {
    console.log("Created empty public/ output directory.");
  } else if (cleanedPublic.removed > 0) {
    console.log(`Removed ${cleanedPublic.removed} item(s) from public/ output directory.`);
  } else {
    console.log("public/ output directory was already clean.");
  }

  if (removedManifest) {
    console.log("Removed manual/build-manifest.json.");
  }

  if (shouldRebuild) {
    console.log("Rebuilding static pages...");
    runBuild();
  }
}

main();
