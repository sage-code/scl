"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const quiz = require("../../roadmap/go/quiz/syntax-A.json");
const { scoreQuestion, scoreQuiz, validateQuiz } = require("../../assets/js/roadmap-quiz.js");

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

test("validates the Go syntax pilot and its declared point total", () => {
  assert.ok(quizFiles.length > 0, "at least one roadmap quiz JSON file should exist");
  assert.equal(validateQuiz(quiz), true);
  assert.equal(quiz.questions.length, 5);
  assert.equal(quiz.pointsPossible, 7);
});

for (const file of quizFiles) {
  test(`validates quiz data ${path.relative(roadmapRoot, file)}`, () => {
    assert.equal(validateQuiz(JSON.parse(fs.readFileSync(file, "utf8"))), true);
  });
}

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
  const result = scoreQuiz(quiz, answers);
  assert.equal(result.pointsEarned, 7);
  assert.equal(result.pointsPossible, 7);
  assert.equal(result.scorePercent, 100);

  answers.q003 = ["a"];
  const partialResult = scoreQuiz(quiz, answers);
  assert.equal(partialResult.pointsEarned, 6);
  assert.equal(partialResult.scorePercent, 85.71);
});

test("rejects quiz data whose possible-points total is incorrect", () => {
  const invalidQuiz = JSON.parse(JSON.stringify(quiz));
  invalidQuiz.pointsPossible += 1;
  assert.throws(() => validateQuiz(invalidQuiz), /expected 7/);
});
