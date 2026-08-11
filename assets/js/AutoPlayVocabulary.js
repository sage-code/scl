(function () {
  const ACTIVE_ROW_CLASS = "row-audio-active";
  const LOOP_BTN_ACTIVE_CLASS = "active";

  const audio = new Audio();
  let playbackToken = 0;
  let activeRow = null;
  let activeLoopButton = null;

  function ensureHighlightStyle() {
    if (document.getElementById("vocab-audio-highlight-style")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "vocab-audio-highlight-style";
    style.textContent =
      ".row-audio-active > td{background-color:rgba(13,202,240,0.18)!important;}";
    document.head.appendChild(style);
  }

  function setActiveRow(row) {
    if (activeRow && activeRow !== row) {
      activeRow.classList.remove(ACTIVE_ROW_CLASS);
    }
    activeRow = row;
    if (activeRow) {
      activeRow.classList.add(ACTIVE_ROW_CLASS);
    }
  }

  function clearActiveRow() {
    if (activeRow) {
      activeRow.classList.remove(ACTIVE_ROW_CLASS);
      activeRow = null;
    }
  }

  function setLoopButtonState(button, isPlaying) {
    const icon = button.querySelector("i");
    if (icon) {
      icon.className = isPlaying ? "bi bi-pause-fill me-1" : "bi bi-play-circle-fill me-1";
    }
    button.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    button.classList.toggle(LOOP_BTN_ACTIVE_CLASS, isPlaying);
  }

  function stopAllPlayback() {
    playbackToken += 1;
    audio.pause();
    audio.currentTime = 0;
    clearActiveRow();

    if (activeLoopButton) {
      setLoopButtonState(activeLoopButton, false);
      activeLoopButton = null;
    }

    document
      .querySelectorAll(".row-audio-btn[aria-pressed='true']")
      .forEach((button) => button.setAttribute("aria-pressed", "false"));
  }

  function playSource(src, token) {
    return new Promise((resolve) => {
      const done = () => {
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
        resolve();
      };

      const onEnded = () => done();
      const onError = () => done();

      audio.addEventListener("ended", onEnded, { once: true });
      audio.addEventListener("error", onError, { once: true });

      if (token !== playbackToken) {
        done();
        return;
      }

      audio.src = src;
      audio
        .play()
        .then(() => {
          // Playback started.
        })
        .catch(() => {
          done();
        });
    });
  }

  async function playRowButton(button, token) {
    if (token !== playbackToken) {
      return;
    }

    const src = button.getAttribute("data-audio");
    if (!src) {
      return;
    }

    const row = button.closest("tr");
    setActiveRow(row);

    document
      .querySelectorAll(".row-audio-btn[aria-pressed='true']")
      .forEach((item) => item.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");

    await playSource(src, token);

    if (token === playbackToken) {
      button.setAttribute("aria-pressed", "false");
    }
  }

  async function startTableLoop(loopButton) {
    const table = loopButton.closest("table");
    if (!table) {
      return;
    }

    stopAllPlayback();
    activeLoopButton = loopButton;
    setLoopButtonState(loopButton, true);

    const token = playbackToken;
    const rowButtons = Array.from(table.querySelectorAll("tbody .row-audio-btn"));
    if (!rowButtons.length) {
      setLoopButtonState(loopButton, false);
      activeLoopButton = null;
      return;
    }

    while (token === playbackToken) {
      for (const rowButton of rowButtons) {
        if (token !== playbackToken) {
          break;
        }
        await playRowButton(rowButton, token);
      }
    }
  }

  function handleRowButtonClick(button) {
    stopAllPlayback();
    const token = playbackToken;
    playRowButton(button, token).then(() => {
      if (token === playbackToken) {
        clearActiveRow();
      }
    });
  }

  function handleLoopButtonClick(button) {
    if (button === activeLoopButton) {
      stopAllPlayback();
      return;
    }

    startTableLoop(button).then(() => {
      if (button === activeLoopButton) {
        setLoopButtonState(button, false);
        activeLoopButton = null;
        clearActiveRow();
      }
    });
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const loopButton = event.target.closest(".table-play-all-btn");
      if (loopButton) {
        event.preventDefault();
        handleLoopButtonClick(loopButton);
        return;
      }

      const rowButton = event.target.closest(".row-audio-btn");
      if (rowButton) {
        event.preventDefault();
        handleRowButtonClick(rowButton);
      }
    });
  }

  ensureHighlightStyle();
  bindEvents();
})();
