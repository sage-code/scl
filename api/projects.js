"use strict";

const crypto = require("node:crypto");
const { getDb, nowIso } = require("./_lib/db");
const { HttpError, sendJson, readJson, assertSameOriginJson, handle } = require("./_lib/http");
const { readSession, requireRegistered } = require("./_lib/session");
const { getViewerRoleInfo } = require("./_lib/community");
const { sendEmail, siteUrl, escapeHtml } = require("./_lib/mail");

const ALLOWED_STATUS_ICONS = new Set(["🛠️", "⏸️", "✅", "🚀", "🧪", "📦"]);

async function canManageProjects(userId) {
  if (!userId) return false;
  const info = await getViewerRoleInfo(userId);
  if (info.isAdmin || info.isLegacyVerified) return true;
  const role = String(info.role || "").trim().toLowerCase();
  return role === "manager" || role === "mentor";
}

async function isManagerUser(userId) {
  if (!userId) return false;
  const info = await getViewerRoleInfo(userId);
  if (info.isAdmin || info.isLegacyVerified) return true;
  return String(info.role || "").trim().toLowerCase() === "manager";
}

async function notifyManagersOfJoinRequest(req, user, project) {
  const db = getDb();
  let managerRows = [];
  try {
    const res = await db.execute(
      `select distinct u.email
       from users u
       left join community_members c on c.user_id = u.id
       where u.email is not null
         and trim(u.email) != ''
         and u.is_anonymous = 0
         and (lower(coalesce(c.role, '')) = 'manager' or u.is_admin = 1)`
    );
    managerRows = res.rows;
  } catch (_err) {
    return;
  }

  const recipients = managerRows.map((r) => String(r.email || "").trim()).filter(Boolean);
  if (recipients.length === 0) {
    return;
  }

  const username = user.handle || user.email || "A user";
  const projectName = project.name || "a project";
  const base = siteUrl(req);
  const memberRes = await db.execute({
    sql: "select public_id from community_members where user_id = ? limit 1",
    args: [user.id]
  }).catch(() => ({ rows: [] }));
  const publicId = memberRes.rows[0] && memberRes.rows[0].public_id;
  const reviewUrl = publicId
    ? `${base}/community/profile.html?user_id=${encodeURIComponent(publicId)}`
    : `${base}/projects/`;

  const subject = "Sage-Code User Request";
  const text = `${username} has requested to join ${projectName}.\n\nReview request:\n${reviewUrl}`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f5f7;font-family:Segoe UI,Arial,sans-serif;color:#1f2328">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;padding:28px">
    <h1 style="font-size:20px;margin:0 0 12px">Sage-Code User Request</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 20px"><strong>${escapeHtml(username)}</strong> has requested to join <strong>${escapeHtml(projectName)}</strong>.</p>
    <p style="margin:0"><a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#1f6feb;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">Review Request</a></p>
  </div></body></html>`;

  await sendEmail({
    to: recipients,
    subject,
    html,
    text,
    logLabel: "project-join"
  });
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
    const myRequests = {};
    if (session && Number(session.user.is_anonymous) !== 1) {
      try {
        const reqRes = await getDb().execute({
          sql: "select project_id, status from project_contributors where user_id = ?",
          args: [session.user.id]
        });
        for (const r of reqRes.rows) {
          myRequests[r.project_id] = r.status;
        }
      } catch (_err) {
        // Ignore before migration runs.
      }
    }
    sendJson(res, 200, { projects, categories, can_edit: canEdit, my_requests: myRequests });
    return;
  }

  if (req.method !== "POST") {
    throw new HttpError(405, "Method not allowed.");
  }

  assertSameOriginJson(req);
  const session = await requireRegistered(req);
  const body = await readJson(req);
  const db = getDb();

  if (body.action === "join") {
    const projectId = validateText(body.project_id, "Project ID", 64);
    const projRes = await db.execute({
      sql: "select id, name from scl_projects where id = ? limit 1",
      args: [projectId]
    });
    const project = projRes.rows[0];
    if (!project) {
      throw new HttpError(404, "Project not found.");
    }
    const existing = await db.execute({
      sql: "select id, status from project_contributors where project_id = ? and user_id = ? limit 1",
      args: [projectId, session.user.id]
    });
    if (existing.rows[0]) {
      sendJson(res, 200, { ok: true, status: existing.rows[0].status, message: "Your request was recorded." });
      return;
    }
    const now = nowIso();
    await db.execute({
      sql: `insert into project_contributors (id, project_id, user_id, status, created_at, updated_at)
            values (?, ?, ?, 'pending', ?, ?)`,
      args: [crypto.randomUUID(), projectId, session.user.id, now, now]
    });
    await notifyManagersOfJoinRequest(req, session.user, project).catch((err) => {
      console.warn("[projects/join] email notification failed:", err.message);
    });
    sendJson(res, 201, { ok: true, status: "pending", message: "Your request was recorded." });
    return;
  }

  if (body.action === "approve") {
    if (!(await isManagerUser(session.user.id))) {
      throw new HttpError(403, "Only Managers can approve contributor requests.");
    }
    const requestId = validateText(body.request_id, "Request ID", 64);
    const approved = Boolean(body.approved);
    const now = nowIso();
    const newStatus = approved ? "approved" : "pending";
    await db.execute({
      sql: `update project_contributors
            set status = ?, approved_by = ?, approved_at = ?, updated_at = ?
            where id = ?`,
      args: [newStatus, approved ? session.user.id : null, approved ? now : null, now, requestId]
    });
    sendJson(res, 200, { ok: true, status: newStatus });
    return;
  }

  if (body.action === "cancel") {
    const projectId = validateText(body.project_id, "Project ID", 64);
    const existing = await db.execute({
      sql: "select id, status from project_contributors where project_id = ? and user_id = ? limit 1",
      args: [projectId, session.user.id]
    });
    const row = existing.rows[0];
    if (!row) {
      throw new HttpError(404, "Contributor request not found.");
    }
    if (row.status !== "pending") {
      throw new HttpError(400, "Only pending requests can be canceled.");
    }
    await db.execute({ sql: "delete from project_contributors where id = ?", args: [row.id] });
    sendJson(res, 200, { ok: true, canceled: true });
    return;
  }

  if (body.action === "leave") {
    const requestId = validateText(body.request_id, "Request ID", 64);
    const existing = await db.execute({
      sql: "select id, user_id from project_contributors where id = ? limit 1",
      args: [requestId]
    });
    const row = existing.rows[0];
    if (!row) {
      throw new HttpError(404, "Contributor request not found.");
    }
    const isOwner = row.user_id === session.user.id;
    if (!isOwner && !(await isManagerUser(session.user.id))) {
      throw new HttpError(403, "You do not have permission to remove this contributor request.");
    }
    await db.execute({ sql: "delete from project_contributors where id = ?", args: [requestId] });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (!(await canManageProjects(session.user.id))) {
    throw new HttpError(403, "Only Managers and Mentors can edit or add projects.");
  }

  if (body.action === "delete") {
    const id = validateText(body.id, "Project ID", 64);
    await db.execute({ sql: "delete from scl_projects where id = ?", args: [id] });
    sendJson(res, 200, { ok: true });
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
