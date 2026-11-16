"use strict";

// Applies database/turso/*.sql to Turso in filename order, once each.
// Runs before the Vercel build (npm run build); skips quietly when Turso
// env vars are absent so local static builds keep working.
//
//   node scripts/db/migrate.js            # uses process env (or env.local)
//   node scripts/db/migrate.js --status   # list applied migrations

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const MIGRATIONS_DIR = path.join(ROOT, "database", "turso");

function loadEnvLocal() {
  const file = path.join(ROOT, "env.local");
  if (!fs.existsSync(file)) {
    return;
  }

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) {
      continue;
    }

    process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
}

function splitStatements(sql) {
  return sql
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main() {
  loadEnvLocal();
  const { getDb, databaseConfig } = require("../../api/_lib/db");

  if (!databaseConfig().url) {
    console.log("[migrate] Turso env not set; skipping database migrations.");
    return;
  }

  const db = getDb();
  await db.execute(
    "create table if not exists schema_migrations (name text primary key, applied_at text not null)"
  );

  const applied = new Set((await db.execute("select name from schema_migrations")).rows.map((row) => row.name));

  if (process.argv.includes("--status")) {
    console.log("[migrate] applied:", [...applied].join(", ") || "(none)");
    return;
  }

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) {
    if (applied.has(name)) {
      continue;
    }

    const statements = splitStatements(fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf8"));
    await db.batch(
      [
        ...statements,
        { sql: "insert into schema_migrations (name, applied_at) values (?, ?)", args: [name, new Date().toISOString()] }
      ],
      "write"
    );
    console.log(`[migrate] applied ${name} (${statements.length} statements)`);
  }

  console.log("[migrate] database is up to date.");
}

main().catch((error) => {
  console.error("[migrate] failed:", error.message);
  process.exit(1);
});
