#!/usr/bin/env node
"use strict";

/**
 * Idempotent migration tool for legacy file-based community members
 * (`community/members.json` + `community/vcp/<slug>.html`) into Turso
 * (`users` + `community_members`) and Vercel Blob.
 *
 * Existing files in `community/` are NEVER modified or deleted by this script.
 *
 * Usage:
 *   node scripts/tools/migrate_legacy_community_users.js --dry-run
 *   node scripts/tools/migrate_legacy_community_users.js --apply [--emails .temp/legacy-member-emails.json]
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..", "..");
const MEMBERS_JSON = path.join(ROOT, "community", "members.json");
const VCP_DIR = path.join(ROOT, "community", "vcp");

function loadEnvLocal() {
  const file = path.join(ROOT, "env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
}

function stripTags(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function mimeForExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function extractContacts(html) {
  const contact = {};
  for (const m of html.matchAll(/<a[^>]+href="(https:\/\/[^"]+)"[^>]*>/gi)) {
    const href = m[1];
    let host;
    try {
      host = new URL(href).hostname.toLowerCase();
    } catch (_error) {
      continue;
    }
    if (!contact.linkedin && host.includes("linkedin.com")) {
      contact.linkedin = href;
    } else if (!contact.github && host.includes("github.com")) {
      contact.github = href;
    } else if (!contact.x && (host === "x.com" || host.endsWith(".x.com") || host.includes("twitter.com"))) {
      contact.x = href;
    } else if (!contact.bluesky && host.includes("bsky.app")) {
      contact.bluesky = href;
    }
  }
  return contact;
}

function extractProjects(html) {
  const sectionMatch = html.match(/<h2[^>]*>\s*Projects\s*<\/h2>([\s\S]*?)(?:<h2|<hr|<footer|$)/i);
  if (!sectionMatch) {
    return [];
  }
  const sectionHtml = sectionMatch[1];
  const projects = [];
  const seenUrls = new Set();

  for (const rowMatch of sectionHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = rowMatch[1];
    const linkMatch = rowHtml.match(/<a[^>]+href="(https:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const href = linkMatch[1];
    const name = stripTags(linkMatch[2]) || href;
    if (seenUrls.has(href) || projects.length >= 5) continue;
    seenUrls.add(href);

    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => stripTags(c[1]));
    const description = cells.length >= 4 ? cells[3].slice(0, 200) : "";
    projects.push(description ? { name: name.slice(0, 80), url: href, description } : { name: name.slice(0, 80), url: href });
  }
  return projects;
}

function extractEducationParagraphs(html) {
  const eduMatch = html.match(/<h2[^>]*>\s*Education\s*<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!eduMatch) {
    return [];
  }
  const body = stripTags(eduMatch[1]).slice(0, 1000);
  return body ? [{ heading: "Education", body }] : [];
}

function parseLegacyMember(entry) {
  const htmlPath = path.join(VCP_DIR, `${entry.slug}.html`);
  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, "utf8") : "";

  const bioMatch = html.match(/<div class="alert alert-secondary[^"]*">([\s\S]*?)<\/div>/i);
  const bio = bioMatch ? stripTags(bioMatch[1]).slice(0, 500) : `${entry.role} (${entry.certification})`;

  const avatarMatch = html.match(/<img[^>]+src="(\/community\/images\/[^"]+)"/i);
  const certMatch = html.match(/<a[^>]+href="(\/community\/certificate\/[^"]+)"/i);

  const contact = extractContacts(html);
  const projects = extractProjects(html);
  const paragraphs = extractEducationParagraphs(html);

  return {
    slug: entry.slug,
    display_name: entry.name,
    role: entry.role,
    certification_label: entry.certification,
    member_since: Number(entry.since),
    bio,
    avatar_rel: avatarMatch ? avatarMatch[1].replace(/^\//, "") : null,
    certificate_rel: certMatch ? certMatch[1].replace(/^\//, "") : null,
    contact,
    projects,
    paragraphs
  };
}

async function uploadBlobIfNeeded(relPath, blobKeyPrefix, mediaStoreId, mediaToken, existingUrl) {
  if (!relPath) return existingUrl || null;
  if (existingUrl && existingUrl.startsWith("https://")) return existingUrl;
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[warn] missing local asset: ${relPath}`);
    return null;
  }
  if (!mediaStoreId || !mediaToken) {
    return `/${relPath.replace(/\\/g, "/")}`;
  }
  const { put } = require("@vercel/blob");
  const bytes = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase() || ".jpg";
  const blob = await put(`${blobKeyPrefix}${ext}`, bytes, {
    access: "public",
    addRandomSuffix: true,
    contentType: mimeForExt(fullPath),
    token: mediaToken
  });
  return blob.url;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const emailsIdx = process.argv.indexOf("--emails");
  const emailsPath = emailsIdx !== -1 ? process.argv[emailsIdx + 1] : null;
  const emailMap = emailsPath && fs.existsSync(emailsPath)
    ? JSON.parse(fs.readFileSync(emailsPath, "utf8"))
    : {};

  const entries = JSON.parse(fs.readFileSync(MEMBERS_JSON, "utf8"));
  const parsed = entries.map(parseLegacyMember);

  console.log(`Legacy community members parsed: ${parsed.length} (mode: ${apply ? "APPLY" : "DRY-RUN"})`);
  for (const m of parsed) {
    const emailNote = emailMap[m.slug] ? `email=${emailMap[m.slug]}` : "email=(none)";
    console.log(
      `  - ${m.slug}: ${m.display_name} | ${m.role} | ${m.certification_label} | since=${m.member_since} | ` +
      `avatar=${m.avatar_rel || "none"} | cert=${m.certificate_rel || "none"} | links=${m.projects.length} | ${emailNote}`
    );
  }

  if (!apply) {
    console.log("Dry-run complete. Re-run with --apply to upsert into Turso and upload assets to Vercel Blob.");
    return;
  }

  loadEnvLocal();
  const { getDb, nowIso, databaseConfig } = require("../../api/_lib/db");
  if (!databaseConfig().url) {
    throw new Error("Turso database URL is not configured (set TURSO_DATABASE_URL / env.local).");
  }

  const db = getDb();
  const mediaStoreId = String(process.env.MEDIA_STORE_ID || "").trim();
  const mediaToken = String(process.env.MEDIA_READ_WRITE_TOKEN || "").trim();
  const now = nowIso();

  for (const m of parsed) {
    const email = emailMap[m.slug] ? String(emailMap[m.slug]).trim().toLowerCase() : null;
    const existingUser = await db.execute({
      sql: email
        ? "select id, handle, avatar_url from users where handle = ? or email = ? limit 1"
        : "select id, handle, avatar_url from users where handle = ? limit 1",
      args: email ? [m.slug, email] : [m.slug]
    });

    let userId;
    if (existingUser.rows[0]) {
      userId = existingUser.rows[0].id;
    } else {
      userId = crypto.randomUUID();
      await db.execute({
        sql: `insert into users (id, handle, email, is_anonymous, email_verified_at, created_at, updated_at, last_seen_at)
              values (?, ?, ?, 0, ?, ?, ?, ?)`,
        args: [userId, m.slug, email, email ? now : null, now, now, now]
      });
    }

    const existingMember = await db.execute({
      sql: "select avatar_url, certificate_url from community_members where user_id = ? or public_id = ? limit 1",
      args: [userId, m.slug]
    });
    const prevAvatar = existingMember.rows[0] && existingMember.rows[0].avatar_url;
    const prevCert = existingMember.rows[0] && existingMember.rows[0].certificate_url;

    const avatarUrl = await uploadBlobIfNeeded(
      m.avatar_rel,
      `community/${mediaStoreId}/legacy/${m.slug}/avatar`,
      mediaStoreId,
      mediaToken,
      prevAvatar
    );
    const certUrl = await uploadBlobIfNeeded(
      m.certificate_rel,
      `community/${mediaStoreId}/legacy/${m.slug}/certificate`,
      mediaStoreId,
      mediaToken,
      prevCert
    );

    await db.execute({
      sql: `insert into community_members
              (user_id, public_id, display_name, avatar_url, bio, projects_json,
               contact_json, paragraphs_json,
               qualified_track, qualified_topic, role, certification_label, certificate_url,
               member_since, is_legacy_verified, is_published, claimed_at, created_at, updated_at)
            values (?, ?, ?, ?, ?, ?, ?, ?, 'cse', 'fundamentals', ?, ?, ?, ?, 1, 1, ?, ?, ?)
            on conflict (user_id) do update set
              display_name = excluded.display_name,
              avatar_url = coalesce(excluded.avatar_url, community_members.avatar_url),
              bio = excluded.bio,
              projects_json = excluded.projects_json,
              contact_json = excluded.contact_json,
              paragraphs_json = excluded.paragraphs_json,
              role = excluded.role,
              certification_label = excluded.certification_label,
              certificate_url = coalesce(excluded.certificate_url, community_members.certificate_url),
              member_since = excluded.member_since,
              is_legacy_verified = 1,
              is_published = 1,
              updated_at = excluded.updated_at`,
      args: [
        userId,
        m.slug,
        m.display_name,
        avatarUrl,
        m.bio,
        JSON.stringify(m.projects),
        JSON.stringify(m.contact || {}),
        JSON.stringify(m.paragraphs || []),
        m.role,
        m.certification_label,
        certUrl,
        m.member_since,
        `${m.member_since}-01-01T00:00:00.000Z`,
        now,
        now
      ]
    });

    console.log(`[migrated] ${m.slug} -> user_id=${userId}`);
  }
}

main().catch((error) => {
  console.error("[migrate-legacy] failed:", error.message);
  process.exit(1);
});
