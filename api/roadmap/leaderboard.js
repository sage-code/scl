"use strict";

const { getDb } = require("../_lib/db");
const { HttpError, sendJson, handle } = require("../_lib/http");

const MAX_LEADERS = 50;

module.exports = handle(async (req, res) => {
  if (req.method !== "GET") {
    throw new HttpError(405, "Method not allowed.");
  }

  // Best attempt per (user_id, quiz_id) so retakes keep the learner's highest score.
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
});
