(function (root, factory) {
  const api = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.RoadmapQuiz = api;
  }
  if (root && root.document) {
    const start = () => api.start(root.document, root);
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const IDENTIFIER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const QUIZ_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*-[ABC]$/;

  function requireCondition(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function validateIdentifier(value, label) {
    requireCondition(typeof value === "string" && IDENTIFIER.test(value), `${label} must be a lowercase identifier.`);
  }

  function validateIdList(values, label, allowedIds) {
    requireCondition(Array.isArray(values) && values.length > 0, `${label} must be a non-empty array.`);
    requireCondition(new Set(values).size === values.length, `${label} must not contain duplicate IDs.`);
    for (const value of values) {
      requireCondition(typeof value === "string" && allowedIds.has(value), `${label} contains an unknown ID.`);
    }
  }

  function validateQuiz(quiz) {
    requireCondition(quiz && typeof quiz === "object" && !Array.isArray(quiz), "Quiz data must be an object.");
    requireCondition(quiz.schemaVersion === 1, "Unsupported quiz schema version.");
    requireCondition(Number.isInteger(quiz.revision) && quiz.revision > 0, "Quiz revision must be a positive integer.");
    requireCondition(typeof quiz.id === "string" && QUIZ_ID.test(quiz.id), "Quiz ID must end with level A, B, or C.");
    requireCondition(typeof quiz.name === "string" && quiz.name.trim().length > 0, "Quiz name is required.");
    validateIdentifier(quiz.track, "Track");
    validateIdentifier(quiz.topic, "Topic");
    requireCondition(["A", "B", "C"].includes(quiz.level), "Quiz level must be A, B, or C.");
    requireCondition(Number.isInteger(quiz.pointsPossible) && quiz.pointsPossible > 0, "Possible points must be a positive integer.");
    requireCondition(Array.isArray(quiz.questions) && quiz.questions.length > 0, "Quiz must contain at least one question.");

    const questionIds = new Set();
    let calculatedPoints = 0;

    for (const question of quiz.questions) {
      requireCondition(question && typeof question === "object", "Each question must be an object.");
      validateIdentifier(question.id, "Question ID");
      requireCondition(!questionIds.has(question.id), `Duplicate question ID: ${question.id}.`);
      questionIds.add(question.id);
      requireCondition(typeof question.prompt === "string" && question.prompt.trim().length > 0, `Question ${question.id} needs a prompt.`);
      requireCondition(typeof question.explanation === "string" && question.explanation.trim().length > 0, `Question ${question.id} needs an explanation.`);

      if (question.code !== undefined) {
        requireCondition(
          question.code && typeof question.code.language === "string" && IDENTIFIER.test(question.code.language),
          `Question ${question.id} has an invalid code language.`
        );
        requireCondition(typeof question.code.source === "string", `Question ${question.id} code source must be text.`);
      }

      if (question.type === "single-choice" || question.type === "multi-select") {
        requireCondition(Array.isArray(question.options) && question.options.length === 4, `Question ${question.id} must have four options.`);
        const optionIds = new Set();
        for (const option of question.options) {
          requireCondition(option && typeof option.id === "string" && IDENTIFIER.test(option.id), `Question ${question.id} has an invalid option ID.`);
          requireCondition(!optionIds.has(option.id), `Question ${question.id} has duplicate option IDs.`);
          requireCondition(typeof option.text === "string" && option.text.trim().length > 0, `Question ${question.id} has an empty option.`);
          optionIds.add(option.id);
        }
        validateIdList(question.correctOptionIds, `Question ${question.id} correct options`, optionIds);
        if (question.type === "single-choice") {
          requireCondition(question.correctOptionIds.length === 1, `Question ${question.id} must have one correct option.`);
          calculatedPoints += 1;
        } else {
          requireCondition(question.correctOptionIds.length >= 2, `Question ${question.id} must have at least two correct options.`);
          calculatedPoints += question.correctOptionIds.length;
        }
        continue;
      }

      if (question.type === "matrix") {
        requireCondition(Array.isArray(question.rows) && question.rows.length > 0, `Question ${question.id} needs rows.`);
        requireCondition(Array.isArray(question.columns) && question.columns.length > 0, `Question ${question.id} needs columns.`);
        const rowIds = new Set();
        const columnIds = new Set();
        for (const row of question.rows) {
          requireCondition(row && typeof row.id === "string" && IDENTIFIER.test(row.id), `Question ${question.id} has an invalid row ID.`);
          requireCondition(!rowIds.has(row.id) && typeof row.label === "string" && row.label.trim().length > 0, `Question ${question.id} has a duplicate or unlabeled row.`);
          rowIds.add(row.id);
        }
        for (const column of question.columns) {
          requireCondition(column && typeof column.id === "string" && IDENTIFIER.test(column.id), `Question ${question.id} has an invalid column ID.`);
          requireCondition(!columnIds.has(column.id) && typeof column.label === "string" && column.label.trim().length > 0, `Question ${question.id} has a duplicate or unlabeled column.`);
          columnIds.add(column.id);
        }
        requireCondition(question.selectionByRow && typeof question.selectionByRow === "object", `Question ${question.id} needs selection modes.`);
        requireCondition(question.correctByRow && typeof question.correctByRow === "object", `Question ${question.id} needs correct row answers.`);
        for (const row of question.rows) {
          const mode = question.selectionByRow[row.id];
          const correct = question.correctByRow[row.id];
          requireCondition(mode === "single" || mode === "multiple", `Question ${question.id} has an invalid selection mode for ${row.id}.`);
          validateIdList(correct, `Question ${question.id} answers for ${row.id}`, columnIds);
          requireCondition(mode !== "single" || correct.length === 1, `Question ${question.id} row ${row.id} needs one correct column.`);
          calculatedPoints += correct.length;
        }
        requireCondition(
          Object.keys(question.selectionByRow).length === rowIds.size && Object.keys(question.correctByRow).length === rowIds.size,
          `Question ${question.id} row answer maps must match its rows.`
        );
        continue;
      }

      throw new Error(`Question ${question.id} has an unsupported type.`);
    }

    requireCondition(calculatedPoints === quiz.pointsPossible, `Quiz pointsPossible is ${quiz.pointsPossible}; expected ${calculatedPoints}.`);
    return true;
  }

  function correctSelectionIds(question) {
    if (question.type === "matrix") {
      return Object.entries(question.correctByRow).flatMap(([rowId, columnIds]) =>
        columnIds.map((columnId) => `${rowId}:${columnId}`)
      );
    }
    return question.correctOptionIds;
  }

  function selectedSelectionIds(question, answer) {
    if (question.type !== "matrix") {
      return Array.isArray(answer) ? [...new Set(answer)] : [];
    }
    if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
      return [];
    }
    return [...new Set(Object.entries(answer).flatMap(([rowId, columnIds]) =>
      Array.isArray(columnIds) ? columnIds.map((columnId) => `${rowId}:${columnId}`) : []
    ))];
  }

  function scoreQuestion(question, answer) {
    const correct = new Set(correctSelectionIds(question));
    const selected = selectedSelectionIds(question, answer);
    const rawPoints = selected.reduce((total, selection) => total + (correct.has(selection) ? 1 : -1), 0);
    return Math.max(0, rawPoints);
  }

  function scoreQuiz(quiz, answers) {
    validateQuiz(quiz);
    const questionResults = quiz.questions.map((question) => {
      const answer = answers && Object.prototype.hasOwnProperty.call(answers, question.id) ? answers[question.id] : null;
      return {
        questionId: question.id,
        pointsEarned: scoreQuestion(question, answer),
        pointsPossible: correctSelectionIds(question).length,
        selectedAnswer: answer
      };
    });
    const pointsEarned = questionResults.reduce((total, result) => total + result.pointsEarned, 0);
    return {
      pointsEarned,
      pointsPossible: quiz.pointsPossible,
      scorePercent: Math.round((pointsEarned / quiz.pointsPossible) * 10000) / 100,
      questions: questionResults
    };
  }

  function element(documentRef, tag, text, className) {
    const node = documentRef.createElement(tag);
    if (text !== undefined) {
      node.textContent = text;
    }
    if (className) {
      node.className = className;
    }
    return node;
  }

  function hasAnswer(answer) {
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return answer && typeof answer === "object" && Object.values(answer).some((values) => Array.isArray(values) && values.length > 0);
  }

  function cloneAnswer(answer) {
    if (!answer || typeof answer !== "object") {
      return answer;
    }
    return JSON.parse(JSON.stringify(answer));
  }

  function appendCode(documentRef, parent, code, windowRef) {
    if (!code) {
      return;
    }
    const pre = element(documentRef, "pre", undefined, "quiz-code rounded p-3");
    const codeNode = element(documentRef, "code", code.source);
    codeNode.classList.add(`language-${code.language}`);
    pre.append(codeNode);
    parent.append(pre);
    if (windowRef.Prism && windowRef.Prism.languages[code.language]) {
      windowRef.Prism.highlightElement(codeNode);
    }
  }

  function renderChoices(documentRef, parent, question, answers) {
    const selected = new Set(Array.isArray(answers[question.id]) ? answers[question.id] : []);
    question.options.forEach((option, index) => {
      const label = element(documentRef, "label", undefined, "form-check d-block mb-2");
      const input = element(documentRef, "input", undefined, "form-check-input");
      input.type = question.type === "single-choice" ? "radio" : "checkbox";
      input.name = `answer-${question.id}`;
      input.value = option.id;
      input.checked = selected.has(option.id);
      input.dataset.answer = "true";
      input.setAttribute("aria-label", option.text);
      const text = element(documentRef, "span", ` ${String.fromCharCode(65 + index)}. ${option.text}`, "form-check-label");
      label.append(input, text);
      parent.append(label);
    });
  }

  function renderMatrix(documentRef, parent, question, answers) {
    const tableWrap = element(documentRef, "div", undefined, "table-responsive quiz-matrix");
    const table = element(documentRef, "table", undefined, "table table-bordered table-dark align-middle mb-0");
    const caption = element(documentRef, "caption", "Choose the matching value in each row.", "visually-hidden");
    const head = element(documentRef, "thead");
    const headRow = element(documentRef, "tr");
    const itemHeader = element(documentRef, "th", "Item", "text-start");
    itemHeader.scope = "col";
    headRow.append(itemHeader);
    question.columns.forEach((column) => {
      const header = element(documentRef, "th", column.label, "text-center");
      header.scope = "col";
      headRow.append(header);
    });
    head.append(headRow);
    const body = element(documentRef, "tbody");

    question.rows.forEach((row) => {
      const tableRow = element(documentRef, "tr");
      const rowHeader = element(documentRef, "th", row.label, "text-start");
      rowHeader.scope = "row";
      tableRow.append(rowHeader);
      const selectedForRow = new Set(answers[question.id] && answers[question.id][row.id] || []);
      question.columns.forEach((column) => {
        const cell = element(documentRef, "td");
        const input = element(documentRef, "input");
        input.type = question.selectionByRow[row.id] === "single" ? "radio" : "checkbox";
        input.name = `answer-${question.id}-${row.id}`;
        input.value = column.id;
        input.checked = selectedForRow.has(column.id);
        input.dataset.answer = "true";
        input.dataset.rowId = row.id;
        input.setAttribute("aria-label", `${row.label}: ${column.label}`);
        cell.append(input);
        tableRow.append(cell);
      });
      body.append(tableRow);
    });

    table.append(caption, head, body);
    tableWrap.append(table);
    parent.append(tableWrap);
  }

  function selectedAnswerLabels(question, answer) {
    if (question.type === "matrix") {
      const rows = new Map(question.rows.map((row) => [row.id, row.label]));
      const columns = new Map(question.columns.map((column) => [column.id, column.label]));
      return Object.entries(answer || {}).flatMap(([rowId, columnIds]) =>
        (Array.isArray(columnIds) ? columnIds : []).map((columnId) => `${rows.get(rowId) || rowId}: ${columns.get(columnId) || columnId}`)
      );
    }
    const options = new Map(question.options.map((option) => [option.id, option.text]));
    return (Array.isArray(answer) ? answer : []).map((id) => options.get(id) || id);
  }

  function correctAnswerLabels(question) {
    if (question.type === "matrix") {
      return selectedAnswerLabels(question, question.correctByRow);
    }
    const options = new Map(question.options.map((option) => [option.id, option.text]));
    return question.correctOptionIds.map((id) => options.get(id) || id);
  }

  function showResults(documentRef, quiz, scored) {
    const resultSection = documentRef.getElementById("quiz-results");
    const score = documentRef.getElementById("quiz-score");
    const review = documentRef.getElementById("quiz-review");
    score.textContent = `${scored.pointsEarned} / ${scored.pointsPossible} points (${scored.scorePercent}%)`;
    review.replaceChildren();

    quiz.questions.forEach((question, index) => {
      const result = scored.questions[index];
      const article = element(documentRef, "article", undefined, "quiz-review-item py-3");
      const heading = element(documentRef, "h3", `Question ${index + 1}: ${result.pointsEarned} / ${result.pointsPossible} points`, "h5");
      const yourAnswer = element(documentRef, "p", undefined, "mb-1");
      yourAnswer.append(element(documentRef, "strong", "Your answer: "));
      yourAnswer.append(documentRef.createTextNode(selectedAnswerLabels(question, result.selectedAnswer).join("; ") || "No answer"));
      const correctAnswer = element(documentRef, "p", undefined, "mb-1");
      correctAnswer.append(element(documentRef, "strong", "Correct answer: "));
      correctAnswer.append(documentRef.createTextNode(correctAnswerLabels(question).join("; ")));
      const explanation = element(documentRef, "p", question.explanation, "text-secondary mb-0");
      article.append(heading, yourAnswer, correctAnswer, explanation);
      review.append(article);
    });

    resultSection.hidden = false;
    documentRef.getElementById("quiz-content").hidden = true;
  }

  function start(documentRef, windowRef) {
    const app = documentRef.getElementById("quiz-content");
    const status = documentRef.getElementById("quiz-status");
    if (!app || !status) {
      return;
    }

    const setError = (error) => {
      status.hidden = false;
      status.className = "alert alert-danger";
      status.textContent = error.message || String(error);
    };

    async function loadQuiz() {
      const params = new URLSearchParams(windowRef.location.search);
      const track = params.get("track");
      const topic = params.get("topic");
      const level = params.get("level");
      if (!IDENTIFIER.test(track || "") || !IDENTIFIER.test(topic || "") || !["A", "B", "C"].includes(level)) {
        throw new Error("This quiz link is invalid. Open a quiz from its roadmap page.");
      }

      const response = await windowRef.fetch(`/roadmap/${track}/quiz/${topic}-${level}.json`);
      if (!response.ok) {
        throw new Error(`Quiz could not be loaded (HTTP ${response.status}).`);
      }
      const quiz = await response.json();
      validateQuiz(quiz);
      if (quiz.track !== track || quiz.topic !== topic || quiz.level !== level) {
        throw new Error("The loaded quiz does not match the selected roadmap link.");
      }
      return quiz;
    }

    loadQuiz().then((quiz) => {
      const title = documentRef.getElementById("quiz-title");
      title.textContent = quiz.name;
      documentRef.title = `${quiz.name} | Sage-Code`;
      documentRef.getElementById("quiz-name").textContent = `${quiz.name} · ${quiz.questions.length} questions`;
      status.hidden = true;
      app.hidden = false;

      const answers = {};
      let questionIndex = 0;
      const questionContainer = documentRef.getElementById("quiz-question");
      const previous = documentRef.getElementById("quiz-previous");
      const next = documentRef.getElementById("quiz-next");
      const submit = documentRef.getElementById("quiz-submit");
      const progress = documentRef.getElementById("quiz-progress");
      const progressBar = progress.parentElement;

      questionContainer.addEventListener("change", (event) => {
        if (!event.target.matches("input[data-answer]")) {
          return;
        }
        const question = quiz.questions[questionIndex];
        if (question.type === "matrix") {
          const selections = {};
          question.rows.forEach((row) => {
            selections[row.id] = Array.from(
              questionContainer.querySelectorAll(`input[data-answer][data-row-id="${row.id}"]:checked`),
              (input) => input.value
            );
          });
          answers[question.id] = selections;
        } else {
          answers[question.id] = Array.from(
            questionContainer.querySelectorAll("input[data-answer]:checked"),
            (input) => input.value
          );
        }
        documentRef.getElementById("quiz-answered-label").textContent =
          `${Object.values(answers).filter(hasAnswer).length} answered`;
      });

      function render() {
        const question = quiz.questions[questionIndex];
        const fieldset = element(documentRef, "fieldset", undefined, "border-0 p-0 m-0");
        const legend = element(documentRef, "legend", `Question ${questionIndex + 1}. ${question.prompt}`, "h5");
        fieldset.append(legend);
        appendCode(documentRef, fieldset, question.code, windowRef);
        if (question.type === "multi-select") {
          fieldset.append(element(documentRef, "p", "Select all that apply.", "small text-secondary"));
        }
        if (question.type === "single-choice" || question.type === "multi-select") {
          renderChoices(documentRef, fieldset, question, answers);
        } else {
          renderMatrix(documentRef, fieldset, question, answers);
        }
        questionContainer.replaceChildren(fieldset);

        const percent = Math.round(((questionIndex + 1) / quiz.questions.length) * 100);
        progress.style.width = `${percent}%`;
        progressBar.setAttribute("aria-valuenow", String(percent));
        documentRef.getElementById("quiz-progress-label").textContent = `Question ${questionIndex + 1} of ${quiz.questions.length}`;
        const answered = Object.values(answers).filter(hasAnswer).length;
        documentRef.getElementById("quiz-answered-label").textContent = `${answered} answered`;
        previous.disabled = questionIndex === 0;
        next.hidden = questionIndex === quiz.questions.length - 1;
        submit.hidden = questionIndex !== quiz.questions.length - 1;
      }

      previous.addEventListener("click", () => {
        if (questionIndex > 0) {
          questionIndex -= 1;
          render();
        }
      });
      next.addEventListener("click", () => {
        if (questionIndex < quiz.questions.length - 1) {
          questionIndex += 1;
          render();
        }
      });

      let resultFile;
      documentRef.getElementById("quiz-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const scored = scoreQuiz(quiz, answers);
        resultFile = {
          quiz: {
            id: quiz.id,
            name: quiz.name,
            revision: quiz.revision,
            track: quiz.track,
            topic: quiz.topic,
            level: quiz.level
          },
          completedAt: new Date().toISOString(),
          pointsEarned: scored.pointsEarned,
          pointsPossible: scored.pointsPossible,
          scorePercent: scored.scorePercent,
          questions: scored.questions.map((result, index) => ({
            ...result,
            prompt: quiz.questions[index].prompt,
            explanation: quiz.questions[index].explanation,
            correctAnswer: cloneAnswer(quiz.questions[index].correctOptionIds || quiz.questions[index].correctByRow)
          }))
        };
        showResults(documentRef, quiz, scored);
      });

      documentRef.getElementById("quiz-download").addEventListener("click", () => {
        if (!resultFile) {
          setError(new Error("Submit the quiz before downloading results."));
          return;
        }
        const blob = new Blob([JSON.stringify(resultFile, null, 2)], { type: "application/json" });
        const url = windowRef.URL.createObjectURL(blob);
        const link = element(documentRef, "a");
        link.href = url;
        link.download = `quiz-${quiz.id}-results.json`;
        documentRef.body.append(link);
        link.click();
        link.remove();
        windowRef.setTimeout(() => windowRef.URL.revokeObjectURL(url), 1000);
      });

      render();
    }).catch(setError);
  }

  return {
    validateQuiz,
    scoreQuestion,
    scoreQuiz,
    start
  };
});
