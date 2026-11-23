"use strict";

const { getDb } = require("../_lib/db");
const { HttpError, sendJson, getQuery, handle } = require("../_lib/http");

const WINDOW_DAYS = 30;
const MAX_LEARNERS = 50;
const MAX_LEADERS = 50;

async function handleLearners(_req, res) {
  const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const db = getDb();
  let result;
  try {
    result = await db.execute({
      sql: `select u.handle,
                   max(c.public_id) as public_id,
                   coalesce(max(c.display_name), u.handle) as display_name,
                   coalesce(u.avatar_url, max(c.avatar_url)) as avatar_url,
                   u.last_seen_at,
                   count(p.topic_key) as total_topics,
                   sum(case when p.topic_key != '@card::status' and (p.status = 'done' or p.progress_percent >= 100) then 1 else 0 end) as completed_topics,
                   group_concat(distinct p.roadmap_code) as tracks_csv,
                   max(p.updated_at) as last_progress_at
            from users u
            join roadmap_progress p on p.user_id = u.id
            left join community_members c on c.user_id = u.id
            where u.handle is not null
              and u.is_anonymous = 0
              and lower(p.roadmap_code) not in ('romanian', 'english', 'roadmap-hub-preferences')
              and (p.updated_at >= ? or u.last_seen_at >= ?)
            group by u.id
            having count(p.topic_key) > 0
            order by max(p.updated_at) desc
            limit ?`,
      args: [cutoff, cutoff, MAX_LEARNERS]
    });
  } catch (_error) {
    result = await db.execute({
      sql: `select u.handle, u.avatar_url, u.last_seen_at,
                   count(p.topic_key) as total_topics,
                   sum(case when p.topic_key != '@card::status' and (p.status = 'done' or p.progress_percent >= 100) then 1 else 0 end) as completed_topics,
                   group_concat(distinct p.roadmap_code) as tracks_csv,
                   max(p.updated_at) as last_progress_at
            from users u
            join roadmap_progress p on p.user_id = u.id
            where u.handle is not null
              and u.is_anonymous = 0
              and lower(p.roadmap_code) not in ('romanian', 'english', 'roadmap-hub-preferences')
              and (p.updated_at >= ? or u.last_seen_at >= ?)
            group by u.id
            having count(p.topic_key) > 0
            order by max(p.updated_at) desc
            limit ?`,
      args: [cutoff, cutoff, MAX_LEARNERS]
    });
  }

  const learners = result.rows.map((row) => ({
    handle: row.handle,
    display_name: row.display_name || row.handle,
    public_id: row.public_id || null,
    avatar_url: row.avatar_url || null,
    tracks: row.tracks_csv ? String(row.tracks_csv).split(",").filter(Boolean) : [],
    completed_topics: Number(row.completed_topics || 0),
    last_active_at: row.last_progress_at || row.last_seen_at
  }));

  sendJson(res, 200, { learners });
}

async function handleLeaderboard(_req, res) {
  const db = getDb();
  let result;
  try {
    result = await db.execute({
      sql: `with best as (
              select user_id, quiz_id, track,
                     max(points_earned) as best_points,
                     max(points_possible) as points_possible,
                     max(score_percent) as best_percent,
                     max(case when status = 'pass' then 1 else 0 end) as passed
              from quiz_attempts
              group by user_id, quiz_id, track
            )
            select u.handle,
                   max(c.public_id) as public_id,
                   coalesce(max(c.display_name), u.handle) as display_name,
                   coalesce(u.avatar_url, max(c.avatar_url)) as avatar_url,
                   sum(best.passed) as passed_quizzes,
                   count(distinct case when best.passed = 1 then best.track end) as passed_tracks,
                   sum(best.best_points) as total_points,
                   round(avg(best.best_percent), 2) as avg_percent
            from best
            join users u on u.id = best.user_id
            left join community_members c on c.user_id = u.id
            where u.handle is not null
            group by u.id
            having passed_quizzes >= 1
            order by passed_quizzes desc, total_points desc, avg_percent desc
            limit ?`,
      args: [MAX_LEADERS]
    });
  } catch (_error) {
    result = await db.execute({
      sql: `with best as (
              select user_id, quiz_id, track,
                     max(points_earned) as best_points,
                     max(points_possible) as points_possible,
                     max(score_percent) as best_percent,
                     max(case when status = 'pass' then 1 else 0 end) as passed
              from quiz_attempts
              group by user_id, quiz_id, track
            )
            select u.handle, u.avatar_url,
                   sum(best.passed) as passed_quizzes,
                   count(distinct case when best.passed = 1 then best.track end) as passed_tracks,
                   sum(best.best_points) as total_points,
                   round(avg(best.best_percent), 2) as avg_percent
            from best
            join users u on u.id = best.user_id
            where u.handle is not null
            group by u.id
            having passed_quizzes >= 1
            order by passed_quizzes desc, total_points desc, avg_percent desc
            limit ?`,
      args: [MAX_LEADERS]
    });
  }

  const leaders = result.rows.map((row, index) => ({
    rank: index + 1,
    handle: row.handle,
    display_name: row.display_name || row.handle,
    public_id: row.public_id || null,
    avatar_url: row.avatar_url || null,
    passed_quizzes: Number(row.passed_quizzes || 0),
    passed_tracks: Number(row.passed_tracks || 0),
    total_points: Number(row.total_points || 0),
    avg_percent: Number(row.avg_percent || 0)
  }));

  sendJson(res, 200, { leaders });
}

const actions = {
  learners: handleLearners,
  leaderboard: handleLeaderboard
};

module.exports = handle(async (req, res) => {
  if (req.method !== "GET") {
    throw new HttpError(405, "Method not allowed.");
  }
  const query = getQuery(req);
  const action = String(query.action || "").replace(/\/+$/, "");
  const fn = Object.prototype.hasOwnProperty.call(actions, action) ? actions[action] : null;
  if (!fn) {
    throw new HttpError(404, "Unknown roadmap action.");
  }
  await fn(req, res);
});
