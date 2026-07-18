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
  const sync = window.sageRoadmapProgressSync || null;

  if (!progressBar || checkboxes.length === 0) {
    console.warn('Progress tracking: Missing progress bar or checkboxes');
    return;
  }

  let remoteProgressPercent = null;

  function getCourseId() {
    return options.roadmapCourseId || options.labId;
  }

  function getStorageKey() {
    if (sync && typeof sync.detailStorageKey === 'function') {
      return sync.detailStorageKey(options.labId, options.topicId);
    }

    return `${options.storageKeyPrefix}-${options.labId}-${options.topicId}`;
  }

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

  function readStoredProgress() {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function persistLocalProgress() {
    const progressData = {};
    checkboxes.forEach((cb) => {
      const key = sectionKeyFromCheckbox(cb);
      if (key) progressData[key] = !!cb.checked;
    });

    localStorage.setItem(getStorageKey(), JSON.stringify(progressData));
  }

  function applyProgressData(data, fillAllSections = false) {
    if (!data) {
      if (fillAllSections) {
        checkboxes.forEach((cb) => {
          cb.checked = true;
        });
      }
      return;
    }

    let matchedAny = false;
    checkboxes.forEach((cb) => {
      const key = sectionKeyFromCheckbox(cb);
      if (key && Object.prototype.hasOwnProperty.call(data, key)) {
        cb.checked = !!data[key];
        matchedAny = true;
      }
    });

    if (fillAllSections && !matchedAny) {
      checkboxes.forEach((cb) => {
        cb.checked = true;
      });
    }
  }

  function computeProgressPercent() {
    if (typeof remoteProgressPercent === 'number') {
      return remoteProgressPercent;
    }

    const total = checkboxes.length;
    let checked = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) checked++;
    });

    return total ? (checked / total) * 100 : 0;
  }

  const updateProgressBar = () => {
    const pct = computeProgressPercent();
    progressBar.style.width = `${Math.min(pct, 100)}%`;
  };

  function buildSectionStateMap() {
    const progressData = {};
    checkboxes.forEach((cb) => {
      const key = sectionKeyFromCheckbox(cb);
      if (key) progressData[key] = !!cb.checked;
    });
    return progressData;
  }

  function syncRemoteProgress() {
    if (!sync || typeof sync.saveTopicProgress !== 'function' || !window.roadmapState || typeof window.roadmapState.getUser !== 'function') {
      return;
    }

    if (!window.roadmapState.getUser()) {
      return;
    }

    sync.saveTopicProgress(getCourseId(), options.topicId, buildSectionStateMap()).catch((error) => {
      console.warn('Unable to synchronize topic progress:', error);
    });
  }

  const saveProgress = () => {
    persistLocalProgress();
    remoteProgressPercent = null;
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
    syncRemoteProgress();
  };

  function restoreLocalProgress() {
    const data = readStoredProgress();
    if (!data) {
      updateProgressBar();
      return;
    }

    if (isLegacySavedShape(data)) {
      checkboxes.forEach((cb, index) => {
        if (data[index]) cb.checked = true;
      });
    } else {
      applyProgressData(data);
    }

    updateProgressBar();
    if (isLegacySavedShape(data)) {
      persistLocalProgress();
    }
  }

  async function restoreProgress() {
    restoreLocalProgress();

    if (!sync || typeof sync.loadTopicProgress !== 'function' || !window.roadmapState || typeof window.roadmapState.getUser !== 'function') {
      return;
    }

    if (!window.roadmapState.getUser()) {
      return;
    }

    try {
      const remote = await sync.loadTopicProgress(getCourseId(), options.topicId);
      if (!remote) {
        return;
      }

      remoteProgressPercent = typeof remote.percent === 'number' ? remote.percent : null;
      applyProgressData(remote.sectionStates, remote.fillAllSections);
      persistLocalProgress();
      updateProgressBar();
    } catch (error) {
      console.warn('Unable to hydrate topic progress:', error);
    }
  }

  const setupCheckboxListeners = () => {
    checkboxes.forEach((cb) => {
      cb.addEventListener('change', saveProgress);
    });
  };

  function handleAuthChange() {
    remoteProgressPercent = null;
    restoreProgress();
  }

  restoreProgress();
  setupCheckboxListeners();

  window.addEventListener('roadmap-auth-changed', handleAuthChange);

  console.log(
    `Progress tracking initialized for ${options.labId}/${options.topicId}`
  );
}
