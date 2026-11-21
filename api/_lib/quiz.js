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
  "dart-fundamentals-C": require("../../roadmap/dart/quiz/fundamentals-C.json"),
  "tscript-fundamentals-A": require("../../roadmap/tscript/quiz/fundamentals-A.json"),
  "tscript-fundamentals-B": require("../../roadmap/tscript/quiz/fundamentals-B.json"),
  "tscript-fundamentals-C": require("../../roadmap/tscript/quiz/fundamentals-C.json"),
  "react-fundamentals-A": require("../../roadmap/react/quiz/fundamentals-A.json"),
  "react-fundamentals-B": require("../../roadmap/react/quiz/fundamentals-B.json"),
  "react-fundamentals-C": require("../../roadmap/react/quiz/fundamentals-C.json"),
  "vue-fundamentals-A": require("../../roadmap/vue/quiz/fundamentals-A.json"),
  "vue-fundamentals-B": require("../../roadmap/vue/quiz/fundamentals-B.json"),
  "vue-fundamentals-C": require("../../roadmap/vue/quiz/fundamentals-C.json"),
  "flutter-fundamentals-A": require("../../roadmap/flutter/quiz/fundamentals-A.json"),
  "flutter-fundamentals-B": require("../../roadmap/flutter/quiz/fundamentals-B.json"),
  "flutter-fundamentals-C": require("../../roadmap/flutter/quiz/fundamentals-C.json"),
  "wasm-fundamentals-A": require("../../roadmap/wasm/quiz/fundamentals-A.json"),
  "wasm-fundamentals-B": require("../../roadmap/wasm/quiz/fundamentals-B.json"),
  "wasm-fundamentals-C": require("../../roadmap/wasm/quiz/fundamentals-C.json"),
  "svelte-fundamentals-A": require("../../roadmap/svelte/quiz/fundamentals-A.json"),
  "svelte-fundamentals-B": require("../../roadmap/svelte/quiz/fundamentals-B.json"),
  "svelte-fundamentals-C": require("../../roadmap/svelte/quiz/fundamentals-C.json"),
  "ruby-fundamentals-A": require("../../roadmap/ruby/quiz/fundamentals-A.json"),
  "ruby-fundamentals-B": require("../../roadmap/ruby/quiz/fundamentals-B.json"),
  "ruby-fundamentals-C": require("../../roadmap/ruby/quiz/fundamentals-C.json"),
  "php-fundamentals-A": require("../../roadmap/php/quiz/fundamentals-A.json"),
  "php-fundamentals-B": require("../../roadmap/php/quiz/fundamentals-B.json"),
  "php-fundamentals-C": require("../../roadmap/php/quiz/fundamentals-C.json"),
  "node-fundamentals-A": require("../../roadmap/node/quiz/fundamentals-A.json"),
  "node-fundamentals-B": require("../../roadmap/node/quiz/fundamentals-B.json"),
  "node-fundamentals-C": require("../../roadmap/node/quiz/fundamentals-C.json"),
  "c-fundamentals-A": require("../../roadmap/c/quiz/fundamentals-A.json"),
  "c-fundamentals-B": require("../../roadmap/c/quiz/fundamentals-B.json"),
  "c-fundamentals-C": require("../../roadmap/c/quiz/fundamentals-C.json"),
  "cpp-fundamentals-A": require("../../roadmap/cpp/quiz/fundamentals-A.json"),
  "cpp-fundamentals-B": require("../../roadmap/cpp/quiz/fundamentals-B.json"),
  "cpp-fundamentals-C": require("../../roadmap/cpp/quiz/fundamentals-C.json"),
  "rust-fundamentals-A": require("../../roadmap/rust/quiz/fundamentals-A.json"),
  "rust-fundamentals-B": require("../../roadmap/rust/quiz/fundamentals-B.json"),
  "rust-fundamentals-C": require("../../roadmap/rust/quiz/fundamentals-C.json"),
  "assembly-fundamentals-A": require("../../roadmap/assembly/quiz/fundamentals-A.json"),
  "assembly-fundamentals-B": require("../../roadmap/assembly/quiz/fundamentals-B.json"),
  "assembly-fundamentals-C": require("../../roadmap/assembly/quiz/fundamentals-C.json"),
  "bash-fundamentals-A": require("../../roadmap/bash/quiz/fundamentals-A.json"),
  "bash-fundamentals-B": require("../../roadmap/bash/quiz/fundamentals-B.json"),
  "bash-fundamentals-C": require("../../roadmap/bash/quiz/fundamentals-C.json"),
  "swift-fundamentals-A": require("../../roadmap/swift/quiz/fundamentals-A.json"),
  "swift-fundamentals-B": require("../../roadmap/swift/quiz/fundamentals-B.json"),
  "swift-fundamentals-C": require("../../roadmap/swift/quiz/fundamentals-C.json"),
  "julia-fundamentals-A": require("../../roadmap/julia/quiz/fundamentals-A.json"),
  "julia-fundamentals-B": require("../../roadmap/julia/quiz/fundamentals-B.json"),
  "julia-fundamentals-C": require("../../roadmap/julia/quiz/fundamentals-C.json"),
  "csharp-fundamentals-A": require("../../roadmap/csharp/quiz/fundamentals-A.json"),
  "csharp-fundamentals-B": require("../../roadmap/csharp/quiz/fundamentals-B.json"),
  "csharp-fundamentals-C": require("../../roadmap/csharp/quiz/fundamentals-C.json"),
  "java-fundamentals-A": require("../../roadmap/java/quiz/fundamentals-A.json"),
  "java-fundamentals-B": require("../../roadmap/java/quiz/fundamentals-B.json"),
  "java-fundamentals-C": require("../../roadmap/java/quiz/fundamentals-C.json"),
  "scala-fundamentals-A": require("../../roadmap/scala/quiz/fundamentals-A.json"),
  "scala-fundamentals-B": require("../../roadmap/scala/quiz/fundamentals-B.json"),
  "scala-fundamentals-C": require("../../roadmap/scala/quiz/fundamentals-C.json"),
  "plsql-fundamentals-A": require("../../roadmap/plsql/quiz/fundamentals-A.json"),
  "plsql-fundamentals-B": require("../../roadmap/plsql/quiz/fundamentals-B.json"),
  "plsql-fundamentals-C": require("../../roadmap/plsql/quiz/fundamentals-C.json"),
  "kotlin-fundamentals-A": require("../../roadmap/kotlin/quiz/fundamentals-A.json"),
  "kotlin-fundamentals-B": require("../../roadmap/kotlin/quiz/fundamentals-B.json"),
  "kotlin-fundamentals-C": require("../../roadmap/kotlin/quiz/fundamentals-C.json"),
  "nim-fundamentals-A": require("../../roadmap/nim/quiz/fundamentals-A.json"),
  "nim-fundamentals-B": require("../../roadmap/nim/quiz/fundamentals-B.json"),
  "nim-fundamentals-C": require("../../roadmap/nim/quiz/fundamentals-C.json"),
  "zig-fundamentals-A": require("../../roadmap/zig/quiz/fundamentals-A.json"),
  "zig-fundamentals-B": require("../../roadmap/zig/quiz/fundamentals-B.json"),
  "zig-fundamentals-C": require("../../roadmap/zig/quiz/fundamentals-C.json"),
  "fortran-fundamentals-A": require("../../roadmap/fortran/quiz/fundamentals-A.json"),
  "fortran-fundamentals-B": require("../../roadmap/fortran/quiz/fundamentals-B.json"),
  "fortran-fundamentals-C": require("../../roadmap/fortran/quiz/fundamentals-C.json"),
  "ada-fundamentals-A": require("../../roadmap/ada/quiz/fundamentals-A.json"),
  "ada-fundamentals-B": require("../../roadmap/ada/quiz/fundamentals-B.json"),
  "ada-fundamentals-C": require("../../roadmap/ada/quiz/fundamentals-C.json"),
  "elixir-fundamentals-A": require("../../roadmap/elixir/quiz/fundamentals-A.json"),
  "elixir-fundamentals-B": require("../../roadmap/elixir/quiz/fundamentals-B.json"),
  "elixir-fundamentals-C": require("../../roadmap/elixir/quiz/fundamentals-C.json"),
  "odin-fundamentals-A": require("../../roadmap/odin/quiz/fundamentals-A.json"),
  "odin-fundamentals-B": require("../../roadmap/odin/quiz/fundamentals-B.json"),
  "odin-fundamentals-C": require("../../roadmap/odin/quiz/fundamentals-C.json"),
  "cse-fundamentals-A": require("../../roadmap/cse/quiz/fundamentals-A.json"),
  "cse-fundamentals-B": require("../../roadmap/cse/quiz/fundamentals-B.json"),
  "cse-fundamentals-C": require("../../roadmap/cse/quiz/fundamentals-C.json"),
  "dsa-fundamentals-A": require("../../roadmap/dsa/quiz/fundamentals-A.json"),
  "dsa-fundamentals-B": require("../../roadmap/dsa/quiz/fundamentals-B.json"),
  "dsa-fundamentals-C": require("../../roadmap/dsa/quiz/fundamentals-C.json"),
  "pgp-fundamentals-A": require("../../roadmap/pgp/quiz/fundamentals-A.json"),
  "pgp-fundamentals-B": require("../../roadmap/pgp/quiz/fundamentals-B.json"),
  "pgp-fundamentals-C": require("../../roadmap/pgp/quiz/fundamentals-C.json"),
  "tek-fundamentals-A": require("../../roadmap/tek/quiz/fundamentals-A.json"),
  "tek-fundamentals-B": require("../../roadmap/tek/quiz/fundamentals-B.json"),
  "tek-fundamentals-C": require("../../roadmap/tek/quiz/fundamentals-C.json")
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
