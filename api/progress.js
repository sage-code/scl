"use strict";

// /api/progress — roadmap progress rows for the session's user.
//
//   GET  ?roadmap=<code>[&prefix=<p>]           -> { rows: [{topic_key,status,progress_percent,updated_at}] }
//   POST {roadmap, rows:[...], replace_prefix?}  upsert; replace_prefix first deletes keys with that prefix
//   POST {action:"delete", roadmap, keys?, prefix?}  delete listed keys, a prefix, or the whole roadmap

const { getDb, nowIso } = require("./_lib/db");
const { HttpError, sendJson, getQuery, readJson, assertSameOriginJson, handle } = require("./_lib/http");
const { readSession, requireSession } = require("./_lib/session");
const R = require("./_lib/rows");

const STATUSES = new Set(["todo", "in_progress", "done"]);

function percent(value) {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed > 100 ? 100 : parsed;
}

async function list(req, res) {
  const query = getQuery(req);
  const roadmap = R.roadmapCode(query.roadmap);
  const prefix = R.optionalPrefix(query.prefix);
  const session = await readSession(req);
  if (!session) {
    sendJson(res, 200, { rows: [] });
    return;
  }

  let sql = "select topic_key, status, progress_percent, updated_at from roadmap_progress where user_id = ? and roadmap_code = ?";
  const args = [session.user.id, roadmap];
  if (prefix) {
    sql += ` and ${R.PREFIX_CLAUSE}`;
    args.push(prefix, prefix);
  }

  const result = await getDb().execute({ sql, args });
  sendJson(res, 200, {
    rows: result.rows.map((row) => ({
      topic_key: row.topic_key,
      status: row.status,
      progress_percent: Number(row.progress_percent),
      updated_at: row.updated_at
    }))
  });
}

async function write(req, res) {
  assertSameOriginJson(req);
  const session = await requireSession(req);
  const body = await readJson(req);
  const userId = session.user.id;
  const roadmap = R.roadmapCode(body.roadmap);
  const statements = [];

  if (body.action === "delete") {
    const keys = R.keyList(body.keys);
    const prefix = R.optionalPrefix(body.prefix);
    if (keys) {
      for (const key of keys) {
        statements.push({
          sql: "delete from roadmap_progress where user_id = ? and roadmap_code = ? and topic_key = ?",
          args: [userId, roadmap, key]
        });
      }
    } else if (prefix) {
      statements.push({
        sql: `delete from roadmap_progress where user_id = ? and roadmap_code = ? and ${R.PREFIX_CLAUSE}`,
        args: [userId, roadmap, prefix, prefix]
      });
    } else {
      statements.push({ sql: "delete from roadmap_progress where user_id = ? and roadmap_code = ?", args: [userId, roadmap] });
    }
  } else if (body.action === undefined || body.action === "upsert") {
    const rows = R.rowList(body.rows);
    const replacePrefix = R.optionalPrefix(body.replace_prefix);
    if (replacePrefix) {
      statements.push({
        sql: `delete from roadmap_progress where user_id = ? and roadmap_code = ? and ${R.PREFIX_CLAUSE}`,
        args: [userId, roadmap, replacePrefix, replacePrefix]
      });
    }

    const now = nowIso();
    for (const row of rows) {
      const status = STATUSES.has(row && row.status) ? row.status : "done";
      statements.push({
        sql: `insert into roadmap_progress (user_id, roadmap_code, topic_key, status, progress_percent, created_at, updated_at)
              values (?, ?, ?, ?, ?, ?, ?)
              on conflict (user_id, roadmap_code, topic_key)
              do update set status = excluded.status, progress_percent = excluded.progress_percent, updated_at = excluded.updated_at`,
        args: [userId, roadmap, R.topicKey(row && row.topic_key), status, percent(row && row.progress_percent), now, now]
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
