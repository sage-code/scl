/**
 * Sidebar progress + bar: persists per topic in localStorage, scroll-sync from #main-content.
 * Trackable items: checkboxes with data-is-trackable="true" (dataset.isTrackable in JS).
 * Storage uses anchor ids as keys (with legacy migration from numeric indices).
 * Scroll auto-check stays off for autoCheckDelayMs (default 1 min); manual checks work immediately.
 */

function initializeProgressTracking(config = {}) {
  const defaults = {
    progressBarSelector: '#main-progress',
    checkboxSelector:
      '#bookmark-list input[type="checkbox"][data-is-trackable="true"]',
    contentSelector: '#main-content',
    storageKeyPrefix: 'progress',
    labId:
      new URLSearchParams(window.location.search).get('lab') || 'default',
    topicId:
      new URLSearchParams(window.location.search).get('topic') || 'default',
    roadmapCourseId: undefined,
    /** No scroll-based auto-check until this many ms after init (manual check always works). */
    autoCheckDelayMs: 15 * 1000
  };

  const options = { ...defaults, ...config };
  const progressBar = document.querySelector(options.progressBarSelector);
  const checkboxes = document.querySelectorAll(options.checkboxSelector);
  const mainContent = document.querySelector(options.contentSelector);

  if (!progressBar || checkboxes.length === 0) {
    console.warn('Progress tracking: Missing progress bar or checkboxes');
    return;
  }

  const storageKey = `${options.storageKeyPrefix}-${options.labId}-${options.topicId}`;
  const autoCheckNotBefore = Date.now() + Math.max(0, options.autoCheckDelayMs);

  function sectionKeyFromCheckbox(cb) {
    if (cb.dataset.sectionKey) return cb.dataset.sectionKey;
    const link = cb.dataset.link;
    if (link && link.startsWith('#')) return link.slice(1);
    return null;
  }

  function querySectionEl(id) {
    if (!mainContent || !id) return null;
    try {
      return mainContent.querySelector('#' + CSS.escape(id));
    } catch (e) {
      return mainContent.querySelector('[id="' + id.replace(/"/g, '') + '"]');
    }
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

  const setupAutoProgress = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < autoCheckNotBefore) return;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const id = el.id;
          if (!id) return;
          const checkbox = Array.from(checkboxes).find(
            (cb) => sectionKeyFromCheckbox(cb) === id
          );
          if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            saveProgress();
          }
        });
      },
      {
        root: null,
        rootMargin: '-10% 0px -30% 0px',
        threshold: 0
      }
    );

    const seen = new Set();
    checkboxes.forEach((cb) => {
      const key = sectionKeyFromCheckbox(cb);
      if (!key || seen.has(key)) return;
      const target = querySectionEl(key);
      if (target) {
        seen.add(key);
        observer.observe(target);
      }
    });
  };

  const setupCheckboxListeners = () => {
    checkboxes.forEach((cb) => {
      cb.addEventListener('change', saveProgress);
    });
  };

  restoreProgress();
  setupCheckboxListeners();
  setupAutoProgress();

  console.log(
    `Progress tracking initialized for ${options.labId}/${options.topicId}`
  );
}
