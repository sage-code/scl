(function () {
  const ACTIVE_ROW_CLASS = "row-audio-active";
  const ACTIVE_BUTTON_CLASS = "row-audio-btn-active";
  const audio = new Audio();

  let loopEnabled = false;
  let loopButtons = [];
  let loopIndex = 0;
  let activeLoopButton = null;
  let activeRowButton = null;

  function ensureHighlightStyle() {
    if (document.getElementById("vocab-audio-highlight-style")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "vocab-audio-highlight-style";
    style.textContent =
      ".row-audio-active > td{background-color:rgba(13,202,240,0.30)!important;box-shadow:inset 0 0 0 1px rgba(13,202,240,0.35);}" +
      ".row-audio-btn." + ACTIVE_BUTTON_CLASS + "{background-color:#0dcaf0!important;color:#081016!important;border-color:#0dcaf0!important;}";
    document.head.appendChild(style);
  }

  function clearRowHighlight() {
    document.querySelectorAll("." + ACTIVE_ROW_CLASS).forEach((row) => row.classList.remove(ACTIVE_ROW_CLASS));
  }

  function setActiveRowButton(button) {
    if (activeRowButton && activeRowButton !== button) {
      activeRowButton.setAttribute("aria-pressed", "false");
      activeRowButton.classList.remove(ACTIVE_BUTTON_CLASS);
    }
    activeRowButton = button;

    if (!button) {
      clearRowHighlight();
      return;
    }

    button.setAttribute("aria-pressed", "true");
    button.classList.add(ACTIVE_BUTTON_CLASS);
    clearRowHighlight();
    const row = button.closest("tr");
    if (row) {
      row.classList.add(ACTIVE_ROW_CLASS);
      row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function setLoopButtonActive(button, isActive) {
    const icon = button.querySelector("i");
    if (icon) {
      icon.className = isActive ? "bi bi-pause-fill" : "bi bi-play-circle-fill";
    }
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  function resetLoopUi() {
    document.querySelectorAll(".table-play-all-btn").forEach((btn) => setLoopButtonActive(btn, false));
    activeLoopButton = null;
  }

  function stopPlayback() {
    loopEnabled = false;
    loopButtons = [];
    loopIndex = 0;
    audio.pause();
    audio.currentTime = 0;

    if (activeRowButton) {
      activeRowButton.setAttribute("aria-pressed", "false");
      activeRowButton.classList.remove(ACTIVE_BUTTON_CLASS);
      activeRowButton = null;
    }

    clearRowHighlight();
    resetLoopUi();
  }

  function playButton(button) {
    const src = button.getAttribute("data-audio");
    if (!src) {
      return;
    }

    setActiveRowButton(button);
    audio.src = src;
    audio.play().catch(function () {
      button.setAttribute("aria-pressed", "false");
      button.classList.remove(ACTIVE_BUTTON_CLASS);
      clearRowHighlight();
    });
  }

  function playNextInLoop() {
    if (!loopEnabled || !loopButtons.length) {
      return;
    }

    if (loopIndex >= loopButtons.length) {
      loopIndex = 0;
    }

    const button = loopButtons[loopIndex];
    loopIndex += 1;
    playButton(button);
  }

  function startLoopFromHeader(loopHeaderButton) {
    const table = loopHeaderButton.closest("table");
    if (!table) {
      return;
    }

    const rowButtons = Array.from(table.querySelectorAll("tbody .row-audio-btn"));
    if (!rowButtons.length) {
      return;
    }

    stopPlayback();
    loopEnabled = true;
    loopButtons = rowButtons;
    loopIndex = 0;
    activeLoopButton = loopHeaderButton;
    setLoopButtonActive(loopHeaderButton, true);
    playNextInLoop();
  }

  audio.addEventListener("ended", function () {
    if (activeRowButton) {
      activeRowButton.setAttribute("aria-pressed", "false");
      activeRowButton.classList.remove(ACTIVE_BUTTON_CLASS);
    }

    if (loopEnabled) {
      playNextInLoop();
      return;
    }

    activeRowButton = null;
    clearRowHighlight();
  });

  audio.addEventListener("error", function () {
    if (loopEnabled) {
      playNextInLoop();
      return;
    }

    if (activeRowButton) {
      activeRowButton.setAttribute("aria-pressed", "false");
      activeRowButton.classList.remove(ACTIVE_BUTTON_CLASS);
      activeRowButton = null;
    }
    clearRowHighlight();
  });

  document.addEventListener("click", function (event) {
    const loopHeaderButton = event.target.closest(".table-play-all-btn");
    if (loopHeaderButton) {
      event.preventDefault();
      if (activeLoopButton === loopHeaderButton && loopEnabled) {
        stopPlayback();
      } else {
        startLoopFromHeader(loopHeaderButton);
      }
      return;
    }

    const rowButton = event.target.closest(".row-audio-btn");
    if (!rowButton) {
      return;
    }

    event.preventDefault();
    stopPlayback();
    playButton(rowButton);
  });

  ensureHighlightStyle();
})();
