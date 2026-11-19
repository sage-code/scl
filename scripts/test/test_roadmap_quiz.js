"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const answerKeys = require("../../api/_lib/quiz-answer-keys.json");
const { qualifiedRoadmaps } = require("../../api/_lib/quiz");
const publicQuiz = require("../../roadmap/go/quiz/syntax-A.json");
const quiz = withAnswerKey(publicQuiz);
const pilotQuiz = {
  ...quiz,
  questions: quiz.questions.slice(0, 5),
  pointsPossible: 7
};
const {
  quizStatus,
  quizDurationSeconds,
  readQuizStatuses,
  saveQuizStatus,
  scoreQuestion,
  scoreQuiz,
  validateQuiz
} = require("../../assets/js/roadmap-quiz.js");

const roadmapRoot = path.resolve(__dirname, "../../roadmap");
const quizFiles = fs.readdirSync(roadmapRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((track) => {
    const quizDirectory = path.join(roadmapRoot, track.name, "quiz");
    if (!fs.existsSync(quizDirectory)) {
      return [];
    }
    return fs.readdirSync(quizDirectory)
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.join(quizDirectory, file));
  });

const goQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`go${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const htmlQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`html${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const cssQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`css${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const javascriptQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`javascript${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const pythonQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`python${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const dartQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`dart${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const tscriptQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`tscript${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const reactQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`react${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const vueQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`vue${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));

function withAnswerKey(publicData) {
  const privateSet = answerKeys[publicData.id];
  assert.ok(privateSet, `private answer key should exist for ${publicData.id}`);
  return {
    ...publicData,
    questions: publicData.questions.map((question) => ({
      ...question,
      ...privateSet.questions[question.id]
    }))
  };
}

test("validates the Go syntax pilot and its declared point total", () => {
  assert.ok(quizFiles.length > 0, "at least one roadmap quiz JSON file should exist");
  assert.equal(validateQuiz(quiz), true);
  assert.equal(quiz.questions.length, 42);
  assert.equal(quiz.pointsPossible, 61);
});

function assertCompleteQuizSeries(quizzes, track, topic, language, revision) {
  assert.deepEqual(quizzes.map((item) => item.level).sort(), ["A", "B", "C"]);
  quizzes.forEach((item) => {
    assert.equal(item.track, track, `${item.id} should belong to the ${track} roadmap`);
    assert.equal(item.topic, topic, `${item.id} should use the ${topic} topic slug`);
    assert.ok(item.revision >= revision, `${item.id} should use the expected content revision`);
    assert.equal(item.questions.length, 42, `${item.id} should contain 42 questions`);
    const shortExamples = item.questions.filter((question) =>
      question.code &&
      question.code.language === language &&
      question.code.source.length <= 120 &&
      question.code.source.split(/\r?\n/).length <= 4
    );
    assert.ok(
      shortExamples.length >= Math.ceil(item.questions.length * 0.1),
      `${item.id} should have short code examples in at least 10% of its questions`
    );
    assert.ok(
      item.questions.filter((question) => question.type === "multi-select").length >= 5,
      `${item.id} should include several multi-select questions`
    );
    assert.ok(
      item.questions.filter((question) => question.type === "matrix").length >= 3,
      `${item.id} should include several matrix questions`
    );
    const multiAnswerPositions = item.questions
      .filter((question) => question.type === "multi-select")
      .map((question) => question.options
        .map((option, index) => question.correctOptionIds.includes(option.id) ? index : null)
        .filter((index) => index !== null)
        .join(","));
    assert.ok(new Set(multiAnswerPositions).size >= 3, `${item.id} should vary multi-select answer positions`);
    const singleQuestions = item.questions.filter((question) => question.type === "single-choice");
    const answerPositionCounts = [0, 1, 2, 3].map((position) =>
      singleQuestions.filter((question) =>
        question.options.findIndex((option) => option.id === question.correctOptionIds[0]) === position
      ).length
    );
    assert.ok(answerPositionCounts.every((count) => count > 0), `${item.id} should vary single-choice answer positions`);
    assert.ok(
      Math.max(...answerPositionCounts) <= Math.ceil(singleQuestions.length / 2),
      `${item.id} should not overuse one single-choice answer position`
    );
  });
}

test("each Go quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(goQuizzes, "go", "syntax", "go", 2);
});

test("each HTML quiz has 42 questions, brief markup examples, and varied response formats", () => {
  assertCompleteQuizSeries(htmlQuizzes, "html", "fundamentals", "markup", 1);
});

test("each CSS quiz has 42 questions, brief CSS examples, and varied response formats", () => {
  assertCompleteQuizSeries(cssQuizzes, "css", "foundations", "css", 1);
});

test("each JavaScript quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(javascriptQuizzes, "javascript", "fundamentals", "javascript", 1);
});

test("each Python quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(pythonQuizzes, "python", "fundamentals", "python", 1);
});

test("each Dart quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(dartQuizzes, "dart", "fundamentals", "dart", 1);
});

test("each TypeScript quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(tscriptQuizzes, "tscript", "fundamentals", "typescript", 1);
});

test("each React quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(reactQuizzes, "react", "fundamentals", "javascript", 1);
});

test("each Vue quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(vueQuizzes, "vue", "fundamentals", "javascript", 1);
});

for (const file of quizFiles) {
  test(`validates quiz data ${path.relative(roadmapRoot, file)}`, () => {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.equal(validateQuiz(data), true);
    data.questions.forEach((question) => {
      assert.equal(Object.prototype.hasOwnProperty.call(question, "correctOptionIds"), false);
      assert.equal(Object.prototype.hasOwnProperty.call(question, "correctByRow"), false);
      assert.equal(Object.prototype.hasOwnProperty.call(question, "explanation"), false);
    });
    assert.equal(validateQuiz(withAnswerKey(data), { requireAnswerKey: true }), true);
  });
}

test("requires current passing A, B, and C attempts from one roadmap", () => {
  const attempts = [
    { quiz_id: "go-syntax-A", revision: 2, status: "pass" },
    { quiz_id: "go-syntax-B", revision: 2, status: "pass" },
    { quiz_id: "go-syntax-C", revision: 2, status: "pass" },
    { quiz_id: "html-fundamentals-A", revision: 1, status: "pass" },
    { quiz_id: "html-fundamentals-B", revision: 1, status: "fail" },
    { quiz_id: "html-fundamentals-C", revision: 1, status: "pass" }
  ];

  assert.deepEqual(qualifiedRoadmaps(attempts), [{ track: "go", topic: "syntax" }]);
  assert.deepEqual(qualifiedRoadmaps(attempts.slice(0, 2)), []);
  assert.deepEqual(qualifiedRoadmaps([
    ...attempts.slice(0, 2),
    { quiz_id: "go-syntax-C", revision: 1, status: "pass" }
  ]), []);
});

test("awards partial multi-select credit and deducts incorrect selections", () => {
  const question = quiz.questions.find((item) => item.type === "multi-select");
  assert.equal(scoreQuestion(question, ["a"]), 1);
  assert.equal(scoreQuestion(question, ["a", "b"]), 2);
  assert.equal(scoreQuestion(question, ["a", "b", "c"]), 1);
  assert.equal(scoreQuestion(question, ["c", "d"]), 0);
});

test("scores each matrix selection and floors a question at zero", () => {
  const question = quiz.questions.find((item) => item.type === "matrix");
  assert.equal(scoreQuestion(question, {
    func: ["function-declaration"],
    "short-declaration": ["local-declaration"]
  }), 2);
  assert.equal(scoreQuestion(question, {
    func: ["package-import"],
    "short-declaration": ["local-declaration"]
  }), 0);
});

test("calculates quiz totals and rounds percentages to two decimals", () => {
  const answers = {
    q001: ["a"],
    q002: ["b"],
    q003: ["a", "b"],
    q004: {
      func: ["function-declaration"],
      "short-declaration": ["local-declaration"]
    },
    q005: ["c"]
  };
  const result = scoreQuiz(pilotQuiz, answers);
  assert.equal(result.pointsEarned, 7);
  assert.equal(result.pointsPossible, 7);
  assert.equal(result.scorePercent, 100);

  answers.q003 = ["a"];
  const partialResult = scoreQuiz(pilotQuiz, answers);
  assert.equal(partialResult.pointsEarned, 6);
  assert.equal(partialResult.scorePercent, 85.71);
});

test("classifies quiz results at the 70 percent passing threshold", () => {
  assert.equal(quizStatus(69.99), "fail");
  assert.equal(quizStatus(70), "pass");
});

test("sets the quiz timer to two minutes per question", () => {
  assert.equal(quizDurationSeconds(1), 120);
  assert.equal(quizDurationSeconds(5), 600);
  assert.throws(() => quizDurationSeconds(0), /positive integer/);
});

test("persists quiz status and score for the roadmap catalog", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value)
  };
  const scored = { scorePercent: 70 };

  saveQuizStatus(storage, quiz, scored, "2026-11-18T00:00:00.000Z");

  assert.deepEqual(readQuizStatuses(storage)[quiz.id], {
    status: "pass",
    scorePercent: 70,
    completedAt: "2026-11-18T00:00:00.000Z"
  });
});

test("rejects quiz data whose possible-points total is incorrect", () => {
  const invalidQuiz = JSON.parse(JSON.stringify(quiz));
  invalidQuiz.pointsPossible += 1;
  assert.throws(() => validateQuiz(invalidQuiz), /expected 61/);
});
