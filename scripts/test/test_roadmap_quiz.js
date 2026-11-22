"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const answerKeys = require("../../api/_lib/quiz-answer-keys.json");
const { qualifiedRoadmaps } = require("../../api/_lib/quiz");
const publicQuiz = require("../../roadmaps/go/quiz/syntax-A.json");
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

const roadmapRoot = path.resolve(__dirname, "../../roadmaps");
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
const flutterQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`flutter${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const wasmQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`wasm${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const svelteQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`svelte${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const rubyQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`ruby${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const phpQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`php${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const nodeQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`node${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const cQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`c${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const cppQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`cpp${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const rustQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`rust${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const assemblyQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`assembly${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const bashQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`bash${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const swiftQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`swift${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const juliaQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`julia${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const csharpQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`csharp${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const javaQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`java${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const scalaQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`scala${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const plsqlQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`plsql${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const kotlinQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`kotlin${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const nimQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`nim${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const zigQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`zig${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const fortranQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`fortran${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const adaQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`ada${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const elixirQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`elixir${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const odinQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`odin${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const cseQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`cse${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const dsaQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`dsa${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const pgpQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`pgp${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const tekQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`tek${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const dbaQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`dba${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const smlQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`sml${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const hpcQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`hpc${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const osdQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`osd${path.sep}quiz${path.sep}`))
  .map((file) => withAnswerKey(JSON.parse(fs.readFileSync(file, "utf8"))));
const dslQuizzes = quizFiles
  .filter((file) => path.relative(roadmapRoot, file).startsWith(`dsl${path.sep}quiz${path.sep}`))
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

test("each Flutter quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(flutterQuizzes, "flutter", "fundamentals", "dart", 1);
});

test("each WebAssembly quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(wasmQuizzes, "wasm", "fundamentals", "wasm", 1);
});

test("each Svelte quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(svelteQuizzes, "svelte", "fundamentals", "javascript", 1);
});

test("each Ruby quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(rubyQuizzes, "ruby", "fundamentals", "ruby", 1);
});

test("each PHP quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(phpQuizzes, "php", "fundamentals", "php", 1);
});

test("each Node.js quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(nodeQuizzes, "node", "fundamentals", "javascript", 1);
});

test("each C quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(cQuizzes, "c", "fundamentals", "c", 1);
});

test("each C++ quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(cppQuizzes, "cpp", "fundamentals", "cpp", 1);
});

test("each Rust quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(rustQuizzes, "rust", "fundamentals", "rust", 1);
});

test("each Assembly quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(assemblyQuizzes, "assembly", "fundamentals", "nasm", 1);
});

test("each Bash quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(bashQuizzes, "bash", "fundamentals", "bash", 1);
});

test("each Swift quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(swiftQuizzes, "swift", "fundamentals", "swift", 1);
});

test("each Julia quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(juliaQuizzes, "julia", "fundamentals", "julia", 1);
});

test("each C# quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(csharpQuizzes, "csharp", "fundamentals", "csharp", 1);
});

test("each Java quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(javaQuizzes, "java", "fundamentals", "java", 1);
});

test("each Scala quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(scalaQuizzes, "scala", "fundamentals", "scala", 1);
});

test("each PL/SQL quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(plsqlQuizzes, "plsql", "fundamentals", "plsql", 1);
});

test("each Kotlin quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(kotlinQuizzes, "kotlin", "fundamentals", "kotlin", 1);
});

test("each Nim quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(nimQuizzes, "nim", "fundamentals", "nim", 1);
});

test("each Zig quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(zigQuizzes, "zig", "fundamentals", "zig", 1);
});

test("each Fortran quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(fortranQuizzes, "fortran", "fundamentals", "fortran", 1);
});

test("each Ada quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(adaQuizzes, "ada", "fundamentals", "ada", 1);
});

test("each Elixir quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(elixirQuizzes, "elixir", "fundamentals", "elixir", 1);
});

test("each Odin quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(odinQuizzes, "odin", "fundamentals", "odin", 1);
});

test("each CSE quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(cseQuizzes, "cse", "fundamentals", "python", 1);
});

test("each DSA quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(dsaQuizzes, "dsa", "fundamentals", "go", 1);
});

test("each PGP quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(pgpQuizzes, "pgp", "fundamentals", "python", 1);
});

test("each TEK quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(tekQuizzes, "tek", "fundamentals", "bash", 1);
});

test("each DBA quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(dbaQuizzes, "dba", "fundamentals", "sql", 1);
});

test("each SML quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(smlQuizzes, "sml", "fundamentals", "python", 1);
});

test("each HPC quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(hpcQuizzes, "hpc", "fundamentals", "bash", 1);
});

test("each OSD quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(osdQuizzes, "osd", "fundamentals", "bash", 1);
});

test("each DSL quiz has 42 questions, brief code examples, and varied response formats", () => {
  assertCompleteQuizSeries(dslQuizzes, "dsl", "fundamentals", "ocaml", 1);
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
