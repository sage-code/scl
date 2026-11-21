"use strict";

const crypto = require("node:crypto");
const { getDb, nowIso } = require("../_lib/db");
const { HttpError, sendJson, readJson, assertSameOriginJson, handle } = require("../_lib/http");
const { requireSession } = require("../_lib/session");
const { getQuiz, scoreQuiz, quizStatus } = require("../_lib/quiz");

module.exports = handle(async (req, res) => {
  if (req.method !== "POST") {
    throw new HttpError(405, "Method not allowed.");
  }
  assertSameOriginJson(req);
  const session = await requireSession(req);
  const body = await readJson(req);
  const quiz = getQuiz(body.quiz_id);
  if (!quiz) {
    throw new HttpError(404, "This quiz is unavailable.");
  }
  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
    throw new HttpError(400, "Quiz answers must be an object.");
  }

  const scored = scoreQuiz(quiz, body.answers);
  const completedAt = nowIso();
  await getDb().execute({
    sql: `insert into quiz_attempts
            (id, user_id, quiz_id, track, topic, level, revision, points_earned, points_possible, score_percent, status, completed_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(),
      session.user.id,
      quiz.id,
      quiz.track,
      quiz.topic,
      quiz.level,
      quiz.revision,
      scored.pointsEarned,
      scored.pointsPossible,
      scored.scorePercent,
      quizStatus(scored.scorePercent),
      completedAt
    ]
  });

  if (Number(session.user.is_anonymous) !== 1 && session.user.email_verified_at) {
    try {
      await getDb().execute({
        sql: `update community_members
              set is_published = 1,
                  claimed_at = coalesce(claimed_at, ?),
                  qualified_track = case when qualified_track = '' then ? else qualified_track end,
                  qualified_topic = case when qualified_topic = '' then ? else qualified_topic end,
                  updated_at = ?
              where user_id = ? and is_published = 0`,
        args: [completedAt, quiz.track, quiz.topic, completedAt, session.user.id]
      });
    } catch (_error) {
      // Minimal test schemas may omit community_members.
    }
  }

  sendJson(res, 201, { quiz, scored, completedAt });
});
