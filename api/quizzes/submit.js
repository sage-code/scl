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

  sendJson(res, 201, { quiz, scored, completedAt });
});
