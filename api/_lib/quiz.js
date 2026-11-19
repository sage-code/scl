"use strict";

const publicQuizzes = {
  "css-foundations-A": require("../../roadmap/css/quiz/foundations-A.json"),
  "css-foundations-B": require("../../roadmap/css/quiz/foundations-B.json"),
  "css-foundations-C": require("../../roadmap/css/quiz/foundations-C.json"),
  "go-syntax-A": require("../../roadmap/go/quiz/syntax-A.json"),
  "go-syntax-B": require("../../roadmap/go/quiz/syntax-B.json"),
  "go-syntax-C": require("../../roadmap/go/quiz/syntax-C.json"),
  "html-fundamentals-A": require("../../roadmap/html/quiz/fundamentals-A.json"),
  "html-fundamentals-B": require("../../roadmap/html/quiz/fundamentals-B.json"),
  "html-fundamentals-C": require("../../roadmap/html/quiz/fundamentals-C.json"),
  "javascript-fundamentals-A": require("../../roadmap/javascript/quiz/fundamentals-A.json"),
  "javascript-fundamentals-B": require("../../roadmap/javascript/quiz/fundamentals-B.json"),
  "javascript-fundamentals-C": require("../../roadmap/javascript/quiz/fundamentals-C.json"),
  "python-fundamentals-A": require("../../roadmap/python/quiz/fundamentals-A.json"),
  "python-fundamentals-B": require("../../roadmap/python/quiz/fundamentals-B.json"),
  "python-fundamentals-C": require("../../roadmap/python/quiz/fundamentals-C.json"),
  "dart-fundamentals-A": require("../../roadmap/dart/quiz/fundamentals-A.json"),
  "dart-fundamentals-B": require("../../roadmap/dart/quiz/fundamentals-B.json"),
  "dart-fundamentals-C": require("../../roadmap/dart/quiz/fundamentals-C.json")
};
const answerKeys = require("./quiz-answer-keys.json");
const { validateQuiz, scoreQuiz, quizStatus } = require("../../assets/js/roadmap-quiz");

function getQuiz(quizId) {
  const publicQuiz = publicQuizzes[quizId];
  const privateSet = answerKeys[quizId];
  if (!publicQuiz || !privateSet) {
    return null;
  }
  if (
    publicQuiz.revision !== privateSet.revision ||
    publicQuiz.track !== privateSet.track ||
    publicQuiz.topic !== privateSet.topic ||
    publicQuiz.level !== privateSet.level ||
    publicQuiz.pointsPossible !== privateSet.pointsPossible
  ) {
    throw new Error(`Public quiz data and private answer key do not match for ${quizId}.`);
  }

  const questions = publicQuiz.questions.map((question) => {
    const privateQuestion = privateSet.questions[question.id];
    if (!privateQuestion) {
      throw new Error(`Private answer key is missing ${quizId}/${question.id}.`);
    }
    return { ...question, ...privateQuestion };
  });
  if (Object.keys(privateSet.questions).length !== questions.length) {
    throw new Error(`Private answer key contains unknown questions for ${quizId}.`);
  }

  const quiz = { ...publicQuiz, questions };
  validateQuiz(quiz, { requireAnswerKey: true });
  return quiz;
}

function qualifiedRoadmaps(attempts) {
  const passed = new Set(
    attempts
      .filter((attempt) => attempt.status === "pass")
      .map((attempt) => `${attempt.quiz_id}:${Number(attempt.revision)}`)
  );
  const groups = new Map();

  Object.values(publicQuizzes).forEach((quiz) => {
    const key = `${quiz.track}:${quiz.topic}`;
    if (!groups.has(key)) {
      groups.set(key, { track: quiz.track, topic: quiz.topic, levels: new Map() });
    }
    groups.get(key).levels.set(quiz.level, quiz);
  });

  return [...groups.values()]
    .filter((group) => ["A", "B", "C"].every((level) => {
      const quiz = group.levels.get(level);
      return quiz && passed.has(`${quiz.id}:${quiz.revision}`);
    }))
    .map(({ track, topic }) => ({ track, topic }))
    .sort((left, right) => left.track.localeCompare(right.track));
}

module.exports = { getQuiz, scoreQuiz, quizStatus, qualifiedRoadmaps };
