"use strict";

const { getDb } = require("../_lib/db");
const { HttpError, sendJson, handle } = require("../_lib/http");

const WINDOW_DAYS = 30;
const MAX_LEARNERS = 50;

module.exports = handle(async (req, res) => {
  if (req.method !== "GET") {
    throw new HttpError(405, "Method not allowed.");
  }

  const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const db = getDb();
  let result;
  try {
    result = await db.execute({
      sql: `select u.handle,
                   coalesce(u.avatar_url, max(c.avatar_url)) as avatar_url,
                   u.last_seen_at,
                   count(p.topic_key) as total_topics,
                   sum(case when p.status = 'done' or p.progress_percent >= 100 then 1 else 0 end) as completed_topics,
                   group_concat(distinct p.roadmap_code) as tracks_csv,
                   max(p.updated_at) as last_progress_at
            from users u
            left join community_members c on c.user_id = u.id
            left join roadmap_progress p on p.user_id = u.id
            where u.handle is not null
              and (p.updated_at >= ? or u.last_seen_at >= ?)
            group by u.id
            having total_topics > 0 or coalesce(u.avatar_url, max(c.avatar_url)) is not null or u.is_anonymous = 0
            order by coalesce(max(p.updated_at), u.last_seen_at) desc
            limit ?`,
      args: [cutoff, cutoff, MAX_LEARNERS]
    });
  } catch (_error) {
    result = await db.execute({
      sql: `select u.handle, u.avatar_url, u.last_seen_at,
                   count(p.topic_key) as total_topics,
                   sum(case when p.status = 'done' or p.progress_percent >= 100 then 1 else 0 end) as completed_topics,
                   group_concat(distinct p.roadmap_code) as tracks_csv,
                   max(p.updated_at) as last_progress_at
            from users u
            left join roadmap_progress p on p.user_id = u.id
            where u.handle is not null
              and (p.updated_at >= ? or u.last_seen_at >= ?)
            group by u.id
            having total_topics > 0 or u.avatar_url is not null or u.is_anonymous = 0
            order by coalesce(max(p.updated_at), u.last_seen_at) desc
            limit ?`,
      args: [cutoff, cutoff, MAX_LEARNERS]
    });
  }

  const learners = result.rows.map((row) => ({
    handle: row.handle,
    avatar_url: row.avatar_url || null,
    tracks: row.tracks_csv ? String(row.tracks_csv).split(",").filter(Boolean) : [],
    completed_topics: Number(row.completed_topics || 0),
    last_active_at: row.last_progress_at || row.last_seen_at
  }));

  sendJson(res, 200, { learners });
});
