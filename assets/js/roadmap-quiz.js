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
  const PASSING_SCORE_PERCENT = 70;
  const QUIZ_STATUS_STORAGE_KEY = "sage-roadmap-quiz-status";
  const SECONDS_PER_QUESTION = 120;
  const TIMER_UPDATE_INTERVAL_MS = 5000;

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

  function validateQuiz(quiz, options) {
    const requireAnswerKey = options === true || !!(options && options.requireAnswerKey);
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
    let hasAnswerKey = true;

    for (const question of quiz.questions) {
      requireCondition(question && typeof question === "object", "Each question must be an object.");
      validateIdentifier(question.id, "Question ID");
      requireCondition(!questionIds.has(question.id), `Duplicate question ID: ${question.id}.`);
      questionIds.add(question.id);
      requireCondition(typeof question.prompt === "string" && question.prompt.trim().length > 0, `Question ${question.id} needs a prompt.`);
      if (question.explanation !== undefined) {
        requireCondition(typeof question.explanation === "string" && question.explanation.trim().length > 0, `Question ${question.id} has an invalid explanation.`);
      } else {
        hasAnswerKey = false;
        requireCondition(!requireAnswerKey, `Question ${question.id} needs a private explanation.`);
      }

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
        if (question.correctOptionIds !== undefined) {
          validateIdList(question.correctOptionIds, `Question ${question.id} correct options`, optionIds);
        } else {
          hasAnswerKey = false;
          requireCondition(!requireAnswerKey, `Question ${question.id} needs private correct options.`);
        }
        if (question.type === "single-choice") {
          if (question.correctOptionIds !== undefined) {
            requireCondition(question.correctOptionIds.length === 1, `Question ${question.id} must have one correct option.`);
          }
          calculatedPoints += 1;
        } else if (question.correctOptionIds !== undefined) {
          requireCondition(question.correctOptionIds.length >= 2, `Question ${question.id} must have at least two correct options.`);
          calculatedPoints += question.correctOptionIds.length;
        } else {
          hasAnswerKey = false;
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
        const hasRowAnswers = question.correctByRow && typeof question.correctByRow === "object";
        if (!hasRowAnswers) {
          hasAnswerKey = false;
          requireCondition(!requireAnswerKey, `Question ${question.id} needs private correct row answers.`);
        }
        for (const row of question.rows) {
          const mode = question.selectionByRow[row.id];
          requireCondition(mode === "single" || mode === "multiple", `Question ${question.id} has an invalid selection mode for ${row.id}.`);
          if (hasRowAnswers) {
            const correct = question.correctByRow[row.id];
            validateIdList(correct, `Question ${question.id} answers for ${row.id}`, columnIds);
            requireCondition(mode !== "single" || correct.length === 1, `Question ${question.id} row ${row.id} needs one correct column.`);
            calculatedPoints += correct.length;
          }
        }
        requireCondition(
          Object.keys(question.selectionByRow).length === rowIds.size &&
            (!hasRowAnswers || Object.keys(question.correctByRow).length === rowIds.size),
          `Question ${question.id} row maps must match its rows.`
        );
        continue;
      }

      throw new Error(`Question ${question.id} has an unsupported type.`);
    }

    if (hasAnswerKey) {
      requireCondition(calculatedPoints === quiz.pointsPossible, `Quiz pointsPossible is ${quiz.pointsPossible}; expected ${calculatedPoints}.`);
    }
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
    validateQuiz(quiz, { requireAnswerKey: true });
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

  function quizStatus(scorePercent) {
    return scorePercent >= PASSING_SCORE_PERCENT ? "pass" : "fail";
  }

  function quizDurationSeconds(questionCount) {
    requireCondition(Number.isInteger(questionCount) && questionCount > 0, "Question count must be a positive integer.");
    return questionCount * SECONDS_PER_QUESTION;
  }

  function roadmapTitle(track) {
    if (track === "go") {
      return "Go";
    }
    if (track === "html") {
      return "HTML";
    }
    if (track === "css") {
      return "CSS";
    }
    if (track === "javascript") {
      return "JavaScript";
    }
    return track.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  function readQuizStatuses(storage) {
    const stored = storage.getItem(QUIZ_STATUS_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const statuses = JSON.parse(stored);
    requireCondition(statuses && typeof statuses === "object" && !Array.isArray(statuses), "Saved quiz status data is invalid.");
    return statuses;
  }

  function saveQuizStatus(storage, quiz, scored, completedAt) {
    const statuses = readQuizStatuses(storage);
    statuses[quiz.id] = {
      status: quizStatus(scored.scorePercent),
      scorePercent: scored.scorePercent,
      completedAt
    };
    storage.setItem(QUIZ_STATUS_STORAGE_KEY, JSON.stringify(statuses));
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
      const text = element(documentRef, "span", ` ${index + 1}: ${option.text}`, "form-check-label");
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
    const outcome = documentRef.getElementById("quiz-outcome");
    const review = documentRef.getElementById("quiz-review");
    const passed = quizStatus(scored.scorePercent) === "pass";
    score.textContent = `${scored.scorePercent}% (${scored.pointsEarned} / ${scored.pointsPossible} points)`;
    outcome.textContent = passed ? "Pass" : "Fail";
    outcome.className = `badge ${passed ? "text-bg-success" : "text-bg-danger"}`;
    review.replaceChildren();

    const wrapper = element(documentRef, "div", undefined, "table-responsive");
    const table = element(documentRef, "table", undefined, "table table-bordered table-striped table-dark align-middle quiz-results-table mb-0");
    table.append(element(documentRef, "caption", "Question-by-question quiz results", "visually-hidden"));

    const thead = element(documentRef, "thead");
    const headerRow = element(documentRef, "tr");
    ["#", "Question", "Your answer", "Correct answer", "Explanation", "Score"].forEach((label) => {
      const th = element(documentRef, "th", label);
      th.scope = "col";
      headerRow.append(th);
    });
    thead.append(headerRow);

    const tbody = element(documentRef, "tbody");
    quiz.questions.forEach((question, index) => {
      const result = scored.questions[index];
      const row = element(documentRef, "tr");

      const numCell = element(documentRef, "th", String(index + 1), "text-nowrap");
      numCell.scope = "row";

      const promptCell = element(documentRef, "td", question.prompt, "quiz-results-prompt");
      const yourCell = element(documentRef, "td", selectedAnswerLabels(question, result.selectedAnswer).join("; ") || "No answer");
      const correctCell = element(documentRef, "td", correctAnswerLabels(question).join("; "));
      const explanationCell = element(documentRef, "td", question.explanation, "text-secondary small");

      const scoreCell = element(documentRef, "td", undefined, "text-nowrap text-center");
      const scoreClass = result.pointsEarned === result.pointsPossible
        ? "text-bg-success"
        : result.pointsEarned > 0
          ? "text-bg-warning"
          : "text-bg-danger";
      scoreCell.append(element(documentRef, "span", `${result.pointsEarned} / ${result.pointsPossible}`, `badge ${scoreClass}`));

      row.append(numCell, promptCell, yourCell, correctCell, explanationCell, scoreCell);
      tbody.append(row);
    });

    const tfoot = element(documentRef, "tfoot");
    const totalRow = element(documentRef, "tr", undefined, "fw-semibold");
    const totalLabel = element(documentRef, "th", "Total");
    totalLabel.scope = "row";
    totalLabel.colSpan = 5;
    const totalScore = element(documentRef, "td", `${scored.pointsEarned} / ${scored.pointsPossible} (${scored.scorePercent}%)`, "text-nowrap text-center");
    totalRow.append(totalLabel, totalScore);
    tfoot.append(totalRow);

    table.append(thead, tbody, tfoot);
    wrapper.append(table);
    review.append(wrapper);

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
      if (!windowRef.sclApi || !windowRef.sclApi.auth) {
        throw new Error("Quiz services are unavailable. Reload the page and try again.");
      }
      const session = await windowRef.sclApi.auth.anonymous();
      if (session.error) {
        throw new Error(session.error.message);
      }

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
      documentRef.getElementById("quiz-description").textContent =
        `Assess your ${roadmapTitle(quiz.track)} skills with ${quiz.questions.length} questions. You have two minutes per question; a score of at least 70% passes.`;
      const roadmapLink = documentRef.getElementById("quiz-roadmap-link");
      roadmapLink.href = `/roadmap/${quiz.track}/`;
      roadmapLink.textContent = `Return to the ${roadmapTitle(quiz.track)} roadmap`;
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
      const timer = documentRef.getElementById("quiz-timer");
      const timerProgress = documentRef.getElementById("quiz-timer-progress");
      const timerText = documentRef.getElementById("quiz-timer-text");
      const quizForm = documentRef.getElementById("quiz-form");
      const timerDuration = quizDurationSeconds(quiz.questions.length);
      const timerDeadline = Date.now() + timerDuration * 1000;
      let timerInterval;
      let timeExpired = false;

      function updateTimer() {
        const remainingSeconds = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
        const elapsedRatio = (timerDuration - remainingSeconds) / timerDuration;
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = String(remainingSeconds % 60).padStart(2, "0");
        timerText.textContent = `${minutes}:${seconds}`;
        timerProgress.style.strokeDashoffset = String(125.66 * elapsedRatio);
        timer.dataset.timeLow = String(remainingSeconds <= 30);

        if (remainingSeconds === 0 && !timeExpired) {
          timeExpired = true;
          windowRef.clearInterval(timerInterval);
          quizForm.requestSubmit();
        }
      }

      timerInterval = windowRef.setInterval(updateTimer, TIMER_UPDATE_INTERVAL_MS);
      updateTimer();

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
        const examplePanel = documentRef.getElementById("quiz-example-panel");
        const exampleContainer = documentRef.getElementById("quiz-example");
        exampleContainer.replaceChildren();
        examplePanel.hidden = !question.code;
        if (question.code) {
          appendCode(documentRef, exampleContainer, question.code, windowRef);
        }

        const prompt = element(documentRef, "p", question.prompt, "quiz-question-prompt mb-4");
        prompt.id = "quiz-question-prompt";
        const fieldset = element(documentRef, "fieldset", undefined, "border-0 p-0 m-0");
        fieldset.setAttribute("aria-labelledby", prompt.id);
        fieldset.append(element(documentRef, "legend", "Answer choices", "visually-hidden"));
        if (question.type === "multi-select") {
          fieldset.append(element(documentRef, "p", "Select all that apply.", "small text-secondary"));
        }
        if (question.type === "single-choice" || question.type === "multi-select") {
          renderChoices(documentRef, fieldset, question, answers);
        } else {
          renderMatrix(documentRef, fieldset, question, answers);
        }
        questionContainer.replaceChildren(prompt, fieldset);

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
      quizForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        windowRef.clearInterval(timerInterval);
        documentRef.getElementById("quiz-timeout-notice").hidden = !timeExpired;
        submit.disabled = true;
        let response;
        try {
          response = await windowRef.fetch("/api/quizzes/submit/", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ quiz_id: quiz.id, answers })
          });
        } catch (_error) {
          submit.disabled = false;
          setError(new Error("Quiz submission failed because the network could not be reached. Try again."));
          return;
        }

        let payload;
        try {
          payload = await response.json();
        } catch (_error) {
          submit.disabled = false;
          setError(new Error("Quiz submission returned an invalid response. Try again."));
          return;
        }
        if (!response.ok) {
          submit.disabled = false;
          setError(new Error(payload.error || `Quiz submission failed (HTTP ${response.status}).`));
          return;
        }
        if (!payload.quiz || payload.quiz.id !== quiz.id || !payload.scored || !payload.completedAt) {
          submit.disabled = false;
          setError(new Error("Quiz submission returned incomplete results. Try again."));
          return;
        }

        const scoredQuiz = payload.quiz;
        const scored = payload.scored;
        const completedAt = payload.completedAt;
        validateQuiz(scoredQuiz, { requireAnswerKey: true });
        const statusSaveWarning = documentRef.getElementById("quiz-status-save-warning");
        try {
          saveQuizStatus(windowRef.localStorage, scoredQuiz, scored, completedAt);
          statusSaveWarning.hidden = true;
        } catch (error) {
          statusSaveWarning.hidden = false;
          statusSaveWarning.textContent = `Quiz result was saved on the server, but this browser could not save the catalog status: ${error.message || String(error)}`;
        }
        resultFile = {
          quiz: {
            id: scoredQuiz.id,
            name: scoredQuiz.name,
            revision: scoredQuiz.revision,
            track: scoredQuiz.track,
            topic: scoredQuiz.topic,
            level: scoredQuiz.level
          },
          completedAt,
          pointsEarned: scored.pointsEarned,
          pointsPossible: scored.pointsPossible,
          scorePercent: scored.scorePercent,
          questions: scored.questions.map((result, index) => ({
            ...result,
            prompt: scoredQuiz.questions[index].prompt,
            explanation: scoredQuiz.questions[index].explanation,
            correctAnswer: cloneAnswer(scoredQuiz.questions[index].correctOptionIds || scoredQuiz.questions[index].correctByRow)
          }))
        };
        showResults(documentRef, scoredQuiz, scored);
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
    quizStatus,
    quizDurationSeconds,
    readQuizStatuses,
    saveQuizStatus,
    start
  };
});
