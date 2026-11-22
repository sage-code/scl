"use strict";

const crypto = require("node:crypto");
const { getDb, nowIso } = require("./_lib/db");
const { HttpError, sendJson, readJson, assertSameOriginJson, handle } = require("./_lib/http");
const { readSession, requireRegistered } = require("./_lib/session");
const { getViewerRoleInfo } = require("./_lib/community");

const ALLOWED_STATUS_ICONS = new Set(["🛠️", "⏸️", "✅", "🚀", "🧪", "📦"]);

async function canManageProjects(userId) {
  if (!userId) return false;
  const info = await getViewerRoleInfo(userId);
  if (info.isAdmin || info.isLegacyVerified) return true;
  const role = String(info.role || "").trim().toLowerCase();
  return role === "manager" || role === "mentor";
}

function validateProjectUrl(raw, label) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value || value.length > 500) {
    throw new HttpError(400, `${label} is required and must be 500 characters or fewer.`);
  }
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  let url;
  try {
    url = new URL(value);
  } catch (_error) {
    throw new HttpError(400, `${label} must be a relative path (/...) or HTTPS URL.`);
  }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new HttpError(400, `${label} must use HTTPS (or a local /path) without credentials.`);
  }
  return url.toString();
}

function validateText(raw, label, maxLen) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value || value.length > maxLen) {
    throw new HttpError(400, `${label} must be 1 to ${maxLen} characters.`);
  }
  return value;
}

function validateColor(raw) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
    return value;
  }
  return "#6c757d";
}

function mapProjectRow(row) {
  return {
    id: row.id,
    category: row.category,
    sort_order: Number(row.sort_order || 0),
    status_icon: row.status_icon || "🛠️",
    status_color: row.status_color || "#6c757d",
    status_title: row.status_title || "In progress",
    name: row.name,
    url: row.url,
    description: row.description,
    technology: row.technology,
    source_url: row.source_url
  };
}

async function listProjects() {
  const result = await getDb().execute(
    `select id, category, sort_order, status_icon, status_color, status_title,
            name, url, description, technology, source_url
     from scl_projects
     order by case
       when lower(category) = 'full websites' then 0
       when lower(category) = 'languages' then 1
       else 2
     end, category collate nocase, sort_order asc, created_at asc`
  );
  return result.rows.map(mapProjectRow);
}

module.exports = handle(async (req, res) => {
  if (req.method === "GET") {
    const session = await readSession(req);
    const canEdit = session ? await canManageProjects(session.user.id) : false;
    const projects = await listProjects();
    const categories = [];
    const seen = new Set();
    for (const p of projects) {
      if (!seen.has(p.category)) {
        seen.add(p.category);
        categories.push(p.category);
      }
    }
    sendJson(res, 200, { projects, categories, can_edit: canEdit });
    return;
  }

  if (req.method !== "POST") {
    throw new HttpError(405, "Method not allowed.");
  }

  assertSameOriginJson(req);
  const session = await requireRegistered(req);
  if (!(await canManageProjects(session.user.id))) {
    throw new HttpError(403, "Only Managers and Mentors can edit or add projects.");
  }

  const body = await readJson(req);
  const db = getDb();

  if (body.action === "delete") {
    const id = validateText(body.id, "Project ID", 64);
    await db.execute({ sql: "delete from scl_projects where id = ?", args: [id] });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (body.action === "rename_category") {
    const oldCategory = validateText(body.old_category, "Current category", 60);
    const newCategory = validateText(body.new_category, "New category", 60);
    if (oldCategory !== newCategory) {
      await db.execute({
        sql: "update scl_projects set category = ?, updated_at = ? where category = ?",
        args: [newCategory, nowIso(), oldCategory]
      });
    }
    sendJson(res, 200, { ok: true, category: newCategory });
    return;
  }

  const category = validateText(body.category, "Category", 60);
  const name = validateText(body.name, "Project name", 60);
  const url = validateProjectUrl(body.url, "Project URL");
  const description = validateText(body.description, "Description", 240);
  const technology = validateText(body.technology, "Technology", 120);
  const sourceUrl = validateProjectUrl(body.source_url, "Source URL");
  const statusTitle = validateText(body.status_title || "In progress", "Status tooltip", 160);
  const rawIcon = typeof body.status_icon === "string" ? body.status_icon.trim() : "🛠️";
  const statusIcon = ALLOWED_STATUS_ICONS.has(rawIcon) ? rawIcon : "🛠️";
  const statusColor = validateColor(body.status_color);
  const sortOrder = Number.isFinite(Number(body.sort_order))
    ? Math.max(0, Math.min(999, Math.trunc(Number(body.sort_order))))
    : 0;
  const now = nowIso();

  const existingId = typeof body.id === "string" ? body.id.trim() : "";
  if (existingId) {
    const existing = await db.execute({ sql: "select id from scl_projects where id = ? limit 1", args: [existingId] });
    if (existing.rows.length === 0) {
      throw new HttpError(404, "Project not found.");
    }
    await db.execute({
      sql: `update scl_projects
            set category = ?, sort_order = ?, status_icon = ?, status_color = ?, status_title = ?,
                name = ?, url = ?, description = ?, technology = ?, source_url = ?, updated_at = ?
            where id = ?`,
      args: [category, sortOrder, statusIcon, statusColor, statusTitle, name, url, description, technology, sourceUrl, now, existingId]
    });
    const updated = await db.execute({ sql: "select * from scl_projects where id = ? limit 1", args: [existingId] });
    sendJson(res, 200, { project: mapProjectRow(updated.rows[0]) });
    return;
  }

  const newId = crypto.randomUUID();
  let nextOrder = sortOrder;
  if (!nextOrder) {
    const maxRes = await db.execute({
      sql: "select coalesce(max(sort_order), 0) as m from scl_projects where lower(category) = lower(?)",
      args: [category]
    });
    nextOrder = Number(maxRes.rows[0] ? maxRes.rows[0].m : 0) + 1;
  }

  await db.execute({
    sql: `insert into scl_projects
            (id, category, sort_order, status_icon, status_color, status_title,
             name, url, description, technology, source_url, created_at, updated_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [newId, category, nextOrder, statusIcon, statusColor, statusTitle, name, url, description, technology, sourceUrl, now, now]
  });
  const created = await db.execute({ sql: "select * from scl_projects where id = ? limit 1", args: [newId] });
  sendJson(res, 201, { project: mapProjectRow(created.rows[0]) });
});
