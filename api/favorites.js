"use strict";

// /api/favorites — roadmap favorites for the session's user.
//
//   GET  ?roadmap=<code>                         -> { rows: [{topic_key, category}] }
//   POST {roadmap, rows:[{topic_key, category}]} upsert
//   POST {action:"delete", roadmap, keys:[...]}  remove

const { getDb, nowIso } = require("./_lib/db");
const { HttpError, sendJson, getQuery, readJson, assertSameOriginJson, handle } = require("./_lib/http");
const { readSession, requireSession } = require("./_lib/session");
const R = require("./_lib/rows");

async function list(req, res) {
  const roadmap = R.roadmapCode(getQuery(req).roadmap);
  const session = await readSession(req);
  if (!session) {
    sendJson(res, 200, { rows: [] });
    return;
  }

  const result = await getDb().execute({
    sql: "select topic_key, category from roadmap_favorites where user_id = ? and roadmap_code = ?",
    args: [session.user.id, roadmap]
  });
  sendJson(res, 200, { rows: result.rows.map((row) => ({ topic_key: row.topic_key, category: row.category })) });
}

async function write(req, res) {
  assertSameOriginJson(req);
  const session = await requireSession(req);
  const body = await readJson(req);
  const userId = session.user.id;
  const roadmap = R.roadmapCode(body.roadmap);
  const statements = [];

  if (body.action === "delete") {
    for (const key of R.keyList(body.keys) || []) {
      statements.push({
        sql: "delete from roadmap_favorites where user_id = ? and roadmap_code = ? and topic_key = ?",
        args: [userId, roadmap, key]
      });
    }
  } else if (body.action === undefined || body.action === "upsert") {
    const now = nowIso();
    for (const row of R.rowList(body.rows)) {
      const category = row && row.category ? String(row.category).slice(0, 120) : null;
      statements.push({
        sql: `insert into roadmap_favorites (user_id, roadmap_code, topic_key, category, created_at, updated_at)
              values (?, ?, ?, ?, ?, ?)
              on conflict (user_id, roadmap_code, topic_key)
              do update set category = excluded.category, updated_at = excluded.updated_at`,
        args: [userId, roadmap, R.topicKey(row && row.topic_key), category, now, now]
      });
    }
  } else {
    throw new HttpError(400, "Unknown action.");
  }

  if (statements.length > 0) {
    await getDb().batch(statements, "write");
  }
  sendJson(res, 200, { ok: true });
}

module.exports = handle(async (req, res) => {
  if (req.method === "GET") {
    await list(req, res);
    return;
  }
  await write(req, res);
});
