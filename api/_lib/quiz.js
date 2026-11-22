"use strict";

const publicQuizzes = {
  "css-foundations-A": require("../../roadmaps/css/quiz/foundations-A.json"),
  "css-foundations-B": require("../../roadmaps/css/quiz/foundations-B.json"),
  "css-foundations-C": require("../../roadmaps/css/quiz/foundations-C.json"),
  "go-syntax-A": require("../../roadmaps/go/quiz/syntax-A.json"),
  "go-syntax-B": require("../../roadmaps/go/quiz/syntax-B.json"),
  "go-syntax-C": require("../../roadmaps/go/quiz/syntax-C.json"),
  "html-fundamentals-A": require("../../roadmaps/html/quiz/fundamentals-A.json"),
  "html-fundamentals-B": require("../../roadmaps/html/quiz/fundamentals-B.json"),
  "html-fundamentals-C": require("../../roadmaps/html/quiz/fundamentals-C.json"),
  "javascript-fundamentals-A": require("../../roadmaps/javascript/quiz/fundamentals-A.json"),
  "javascript-fundamentals-B": require("../../roadmaps/javascript/quiz/fundamentals-B.json"),
  "javascript-fundamentals-C": require("../../roadmaps/javascript/quiz/fundamentals-C.json"),
  "python-fundamentals-A": require("../../roadmaps/python/quiz/fundamentals-A.json"),
  "python-fundamentals-B": require("../../roadmaps/python/quiz/fundamentals-B.json"),
  "python-fundamentals-C": require("../../roadmaps/python/quiz/fundamentals-C.json"),
  "dart-fundamentals-A": require("../../roadmaps/dart/quiz/fundamentals-A.json"),
  "dart-fundamentals-B": require("../../roadmaps/dart/quiz/fundamentals-B.json"),
  "dart-fundamentals-C": require("../../roadmaps/dart/quiz/fundamentals-C.json"),
  "tscript-fundamentals-A": require("../../roadmaps/tscript/quiz/fundamentals-A.json"),
  "tscript-fundamentals-B": require("../../roadmaps/tscript/quiz/fundamentals-B.json"),
  "tscript-fundamentals-C": require("../../roadmaps/tscript/quiz/fundamentals-C.json"),
  "react-fundamentals-A": require("../../roadmaps/react/quiz/fundamentals-A.json"),
  "react-fundamentals-B": require("../../roadmaps/react/quiz/fundamentals-B.json"),
  "react-fundamentals-C": require("../../roadmaps/react/quiz/fundamentals-C.json"),
  "vue-fundamentals-A": require("../../roadmaps/vue/quiz/fundamentals-A.json"),
  "vue-fundamentals-B": require("../../roadmaps/vue/quiz/fundamentals-B.json"),
  "vue-fundamentals-C": require("../../roadmaps/vue/quiz/fundamentals-C.json"),
  "flutter-fundamentals-A": require("../../roadmaps/flutter/quiz/fundamentals-A.json"),
  "flutter-fundamentals-B": require("../../roadmaps/flutter/quiz/fundamentals-B.json"),
  "flutter-fundamentals-C": require("../../roadmaps/flutter/quiz/fundamentals-C.json"),
  "wasm-fundamentals-A": require("../../roadmaps/wasm/quiz/fundamentals-A.json"),
  "wasm-fundamentals-B": require("../../roadmaps/wasm/quiz/fundamentals-B.json"),
  "wasm-fundamentals-C": require("../../roadmaps/wasm/quiz/fundamentals-C.json"),
  "svelte-fundamentals-A": require("../../roadmaps/svelte/quiz/fundamentals-A.json"),
  "svelte-fundamentals-B": require("../../roadmaps/svelte/quiz/fundamentals-B.json"),
  "svelte-fundamentals-C": require("../../roadmaps/svelte/quiz/fundamentals-C.json"),
  "ruby-fundamentals-A": require("../../roadmaps/ruby/quiz/fundamentals-A.json"),
  "ruby-fundamentals-B": require("../../roadmaps/ruby/quiz/fundamentals-B.json"),
  "ruby-fundamentals-C": require("../../roadmaps/ruby/quiz/fundamentals-C.json"),
  "php-fundamentals-A": require("../../roadmaps/php/quiz/fundamentals-A.json"),
  "php-fundamentals-B": require("../../roadmaps/php/quiz/fundamentals-B.json"),
  "php-fundamentals-C": require("../../roadmaps/php/quiz/fundamentals-C.json"),
  "node-fundamentals-A": require("../../roadmaps/node/quiz/fundamentals-A.json"),
  "node-fundamentals-B": require("../../roadmaps/node/quiz/fundamentals-B.json"),
  "node-fundamentals-C": require("../../roadmaps/node/quiz/fundamentals-C.json"),
  "c-fundamentals-A": require("../../roadmaps/c/quiz/fundamentals-A.json"),
  "c-fundamentals-B": require("../../roadmaps/c/quiz/fundamentals-B.json"),
  "c-fundamentals-C": require("../../roadmaps/c/quiz/fundamentals-C.json"),
  "cpp-fundamentals-A": require("../../roadmaps/cpp/quiz/fundamentals-A.json"),
  "cpp-fundamentals-B": require("../../roadmaps/cpp/quiz/fundamentals-B.json"),
  "cpp-fundamentals-C": require("../../roadmaps/cpp/quiz/fundamentals-C.json"),
  "rust-fundamentals-A": require("../../roadmaps/rust/quiz/fundamentals-A.json"),
  "rust-fundamentals-B": require("../../roadmaps/rust/quiz/fundamentals-B.json"),
  "rust-fundamentals-C": require("../../roadmaps/rust/quiz/fundamentals-C.json"),
  "assembly-fundamentals-A": require("../../roadmaps/assembly/quiz/fundamentals-A.json"),
  "assembly-fundamentals-B": require("../../roadmaps/assembly/quiz/fundamentals-B.json"),
  "assembly-fundamentals-C": require("../../roadmaps/assembly/quiz/fundamentals-C.json"),
  "bash-fundamentals-A": require("../../roadmaps/bash/quiz/fundamentals-A.json"),
  "bash-fundamentals-B": require("../../roadmaps/bash/quiz/fundamentals-B.json"),
  "bash-fundamentals-C": require("../../roadmaps/bash/quiz/fundamentals-C.json"),
  "swift-fundamentals-A": require("../../roadmaps/swift/quiz/fundamentals-A.json"),
  "swift-fundamentals-B": require("../../roadmaps/swift/quiz/fundamentals-B.json"),
  "swift-fundamentals-C": require("../../roadmaps/swift/quiz/fundamentals-C.json"),
  "julia-fundamentals-A": require("../../roadmaps/julia/quiz/fundamentals-A.json"),
  "julia-fundamentals-B": require("../../roadmaps/julia/quiz/fundamentals-B.json"),
  "julia-fundamentals-C": require("../../roadmaps/julia/quiz/fundamentals-C.json"),
  "csharp-fundamentals-A": require("../../roadmaps/csharp/quiz/fundamentals-A.json"),
  "csharp-fundamentals-B": require("../../roadmaps/csharp/quiz/fundamentals-B.json"),
  "csharp-fundamentals-C": require("../../roadmaps/csharp/quiz/fundamentals-C.json"),
  "java-fundamentals-A": require("../../roadmaps/java/quiz/fundamentals-A.json"),
  "java-fundamentals-B": require("../../roadmaps/java/quiz/fundamentals-B.json"),
  "java-fundamentals-C": require("../../roadmaps/java/quiz/fundamentals-C.json"),
  "scala-fundamentals-A": require("../../roadmaps/scala/quiz/fundamentals-A.json"),
  "scala-fundamentals-B": require("../../roadmaps/scala/quiz/fundamentals-B.json"),
  "scala-fundamentals-C": require("../../roadmaps/scala/quiz/fundamentals-C.json"),
  "plsql-fundamentals-A": require("../../roadmaps/plsql/quiz/fundamentals-A.json"),
  "plsql-fundamentals-B": require("../../roadmaps/plsql/quiz/fundamentals-B.json"),
  "plsql-fundamentals-C": require("../../roadmaps/plsql/quiz/fundamentals-C.json"),
  "kotlin-fundamentals-A": require("../../roadmaps/kotlin/quiz/fundamentals-A.json"),
  "kotlin-fundamentals-B": require("../../roadmaps/kotlin/quiz/fundamentals-B.json"),
  "kotlin-fundamentals-C": require("../../roadmaps/kotlin/quiz/fundamentals-C.json"),
  "nim-fundamentals-A": require("../../roadmaps/nim/quiz/fundamentals-A.json"),
  "nim-fundamentals-B": require("../../roadmaps/nim/quiz/fundamentals-B.json"),
  "nim-fundamentals-C": require("../../roadmaps/nim/quiz/fundamentals-C.json"),
  "zig-fundamentals-A": require("../../roadmaps/zig/quiz/fundamentals-A.json"),
  "zig-fundamentals-B": require("../../roadmaps/zig/quiz/fundamentals-B.json"),
  "zig-fundamentals-C": require("../../roadmaps/zig/quiz/fundamentals-C.json"),
  "fortran-fundamentals-A": require("../../roadmaps/fortran/quiz/fundamentals-A.json"),
  "fortran-fundamentals-B": require("../../roadmaps/fortran/quiz/fundamentals-B.json"),
  "fortran-fundamentals-C": require("../../roadmaps/fortran/quiz/fundamentals-C.json"),
  "ada-fundamentals-A": require("../../roadmaps/ada/quiz/fundamentals-A.json"),
  "ada-fundamentals-B": require("../../roadmaps/ada/quiz/fundamentals-B.json"),
  "ada-fundamentals-C": require("../../roadmaps/ada/quiz/fundamentals-C.json"),
  "elixir-fundamentals-A": require("../../roadmaps/elixir/quiz/fundamentals-A.json"),
  "elixir-fundamentals-B": require("../../roadmaps/elixir/quiz/fundamentals-B.json"),
  "elixir-fundamentals-C": require("../../roadmaps/elixir/quiz/fundamentals-C.json"),
  "odin-fundamentals-A": require("../../roadmaps/odin/quiz/fundamentals-A.json"),
  "odin-fundamentals-B": require("../../roadmaps/odin/quiz/fundamentals-B.json"),
  "odin-fundamentals-C": require("../../roadmaps/odin/quiz/fundamentals-C.json"),
  "cse-fundamentals-A": require("../../roadmaps/cse/quiz/fundamentals-A.json"),
  "cse-fundamentals-B": require("../../roadmaps/cse/quiz/fundamentals-B.json"),
  "cse-fundamentals-C": require("../../roadmaps/cse/quiz/fundamentals-C.json"),
  "dsa-fundamentals-A": require("../../roadmaps/dsa/quiz/fundamentals-A.json"),
  "dsa-fundamentals-B": require("../../roadmaps/dsa/quiz/fundamentals-B.json"),
  "dsa-fundamentals-C": require("../../roadmaps/dsa/quiz/fundamentals-C.json"),
  "pgp-fundamentals-A": require("../../roadmaps/pgp/quiz/fundamentals-A.json"),
  "pgp-fundamentals-B": require("../../roadmaps/pgp/quiz/fundamentals-B.json"),
  "pgp-fundamentals-C": require("../../roadmaps/pgp/quiz/fundamentals-C.json"),
  "tek-fundamentals-A": require("../../roadmaps/tek/quiz/fundamentals-A.json"),
  "tek-fundamentals-B": require("../../roadmaps/tek/quiz/fundamentals-B.json"),
  "tek-fundamentals-C": require("../../roadmaps/tek/quiz/fundamentals-C.json")
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
