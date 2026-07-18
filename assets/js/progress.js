/**
 * Sidebar progress + bar: persists per topic in localStorage.
 * Trackable items: checkboxes with data-is-trackable="true".
 * Storage uses anchor ids as keys (with legacy migration from numeric indices).
 * Check state is fully user-controlled (no scroll-based auto-check).
 */

function initializeProgressTracking(config = {}) {
  const defaults = {
    progressBarSelector: '#main-progress',
    checkboxSelector:
      '#bookmark-list input[type="checkbox"][data-is-trackable="true"]',
    storageKeyPrefix: 'progress',
    labId:
      new URLSearchParams(window.location.search).get('lab') || 'default',
    topicId:
      new URLSearchParams(window.location.search).get('topic') || 'default',
    roadmapCourseId: undefined
  };

  const options = { ...defaults, ...config };
  const progressBar = document.querySelector(options.progressBarSelector);
  const checkboxes = document.querySelectorAll(options.checkboxSelector);

  if (!progressBar || checkboxes.length === 0) {
    console.warn('Progress tracking: Missing progress bar or checkboxes');
    return;
  }

  const storageKey = `${options.storageKeyPrefix}-${options.labId}-${options.topicId}`;

  function sectionKeyFromCheckbox(cb) {
    if (cb.dataset.sectionKey) return cb.dataset.sectionKey;
    const link = cb.dataset.link;
    if (link && link.startsWith('#')) return link.slice(1);
    return null;
  }

  function isLegacySavedShape(data) {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;
    return keys.every((k) => /^\d+$/.test(k));
  }

  const updateProgressBar = () => {
    const total = checkboxes.length;
    let checked = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) checked++;
    });
    const pct = total ? (checked / total) * 100 : 0;
    progressBar.style.width = `${Math.min(pct, 100)}%`;
  };

  const saveProgress = () => {
    const progressData = {};
    checkboxes.forEach((cb) => {
      const k = sectionKeyFromCheckbox(cb);
      if (k) progressData[k] = !!cb.checked;
    });
    localStorage.setItem(storageKey, JSON.stringify(progressData));
    updateProgressBar();
    const allDone =
      checkboxes.length > 0 &&
      Array.from(checkboxes).every((c) => c.checked);
    if (allDone && window.sageMarkTopicCompleteFromSections) {
      window.sageMarkTopicCompleteFromSections(
        options.labId,
        options.topicId,
        options.roadmapCourseId
      );
    }
  };

  const restoreProgress = () => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      updateProgressBar();
      return;
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      updateProgressBar();
      return;
    }
    if (isLegacySavedShape(data)) {
      checkboxes.forEach((cb, index) => {
        if (data[index]) cb.checked = true;
      });
    } else {
      checkboxes.forEach((cb) => {
        const k = sectionKeyFromCheckbox(cb);
        if (k && data[k]) cb.checked = true;
      });
    }
    updateProgressBar();
    if (isLegacySavedShape(data)) {
      saveProgress();
    }
  };

  const setupCheckboxListeners = () => {
    checkboxes.forEach((cb) => {
      cb.addEventListener('change', saveProgress);
    });
  };

  restoreProgress();
  setupCheckboxListeners();

  console.log(
    `Progress tracking initialized for ${options.labId}/${options.topicId}`
  );
}
