document.addEventListener('DOMContentLoaded', () => {
  const roadmapTable = document.querySelector('[data-sage-roadmap]');
  if (!roadmapTable) return;

  const sync = window.sageRoadmapProgressSync || null;
  const courseId = roadmapTable.getAttribute('data-sage-roadmap');
  const labId = roadmapTable.getAttribute('data-lab-id') || courseId;
  const checkboxes = roadmapTable.querySelectorAll('.topic-check');
  const progressBar = document.getElementById('roadmap-progress');
  const savedProgress = readLocalProgress();
  let remoteProgress = {};

  function resolveTrackId() {
    const value = String(labId || '').toLowerCase();
    if (value === 'engineering') return 'cse';
    if (value === 'programming') return 'csp';
    return value;
  }

  function canonicalizeTopicLinks() {
    const trackId = resolveTrackId();
    const canonicalTracks = new Set(['tek', 'dsa', 'dba', 'dsl', 'sml']);
    if (!canonicalTracks.has(trackId)) {
      return;
    }

    roadmapTable.querySelectorAll('tr[data-topic]').forEach((row) => {
      const topicId = String(row.getAttribute('data-topic') || '').trim();
      if (!topicId) return;

      const anchor = row.querySelector('a[href]');
      if (!anchor) return;

      anchor.setAttribute('href', `/roadmap/${trackId}/${topicId}.html`);
    });
  }

  canonicalizeTopicLinks();

  function getStorageKey() {
    if (sync && typeof sync.roadmapStorageKey === 'function') {
      return sync.roadmapStorageKey(courseId);
    }

    return `sage_progress_${courseId}`;
  }

  function readLocalProgress() {
    try {
      return JSON.parse(localStorage.getItem(getStorageKey())) || {};
    } catch (_) {
      return {};
    }
  }

  function persist() {
    localStorage.setItem(getStorageKey(), JSON.stringify(savedProgress));
  }

  function getTopicId(check) {
    const row = check.closest('tr');
    return row && row.getAttribute('data-topic');
  }

  function setRowState(check, on) {
    const row = check.closest('tr');
    if (!row) return;
    check.checked = on;
    row.classList.toggle('table-active', on);
  }

  function computeBarPercent() {
    if (Object.keys(remoteProgress).length > 0) {
      let sum = 0;
      let total = 0;

      checkboxes.forEach((check) => {
        const topicId = getTopicId(check);
        if (!topicId) return;
        total += 1;
        sum += remoteProgress[topicId] ? (remoteProgress[topicId].percent || 0) : 0;
      });

      return total ? Math.round(sum / total) : 0;
    }

    const total = checkboxes.length;
    const completed = roadmapTable.querySelectorAll('.topic-check:checked').length;
    return total ? Math.round((completed / total) * 100) : 0;
  }

  function updateUI() {
    if (!progressBar) return;
    const total = checkboxes.length;
    const completed = roadmapTable.querySelectorAll('.topic-check:checked').length;
    const percent = computeBarPercent();
    progressBar.style.width = percent + '%';
    progressBar.textContent = percent + '% Complete';

    if (total > 0 && completed === total) {
      if (window.sageNotifyLabFullyComplete) window.sageNotifyLabFullyComplete(courseId);
    } else if (window.sageNotifyLabIncomplete) {
      window.sageNotifyLabIncomplete(courseId);
    }
  }

  function applyRoadmapToDom(data) {
    checkboxes.forEach((check) => {
      const topicId = getTopicId(check);
      if (!topicId) return;
      const entry = data[topicId];
      const on = !!(entry && entry.done);
      setRowState(check, on);
    });
  }

  function restoreLocalRoadmap() {
    Object.keys(savedProgress).forEach((k) => delete savedProgress[k]);
    const local = readLocalProgress();
    Object.assign(savedProgress, local);
    remoteProgress = {};
    applyRoadmapToDom(Object.fromEntries(Object.keys(savedProgress).map((topicId) => [topicId, { done: !!savedProgress[topicId], percent: savedProgress[topicId] ? 100 : 0 }] )));
    updateUI();
  }

  async function hydrateRemoteRoadmap() {
    if (!sync || typeof sync.loadRoadmapProgress !== 'function' || !window.roadmapState || typeof window.roadmapState.getUser !== 'function') {
      return;
    }

    if (!window.roadmapState.getUser()) {
      remoteProgress = {};
      restoreLocalRoadmap();
      return;
    }

    try {
      const remote = await sync.loadRoadmapProgress(courseId);
      remoteProgress = remote || {};
      Object.keys(savedProgress).forEach((k) => delete savedProgress[k]);
      checkboxes.forEach((check) => {
        const topicId = getTopicId(check);
        const entry = topicId && remoteProgress[topicId];
        if (!topicId) return;
        if (entry) {
          savedProgress[topicId] = !!entry.done;
          setRowState(check, !!entry.done);
        } else {
          const localOn = !!readLocalProgress()[topicId];
          savedProgress[topicId] = localOn;
          setRowState(check, localOn);
        }
      });
      persist();
      updateUI();
    } catch (error) {
      console.warn('Unable to hydrate roadmap progress:', error);
      restoreLocalRoadmap();
    }
  }

  async function syncRemoteTopic(topicId, checked) {
    if (!sync || !window.roadmapState || typeof window.roadmapState.getUser !== 'function' || !window.roadmapState.getUser()) {
      return;
    }

    if (checked) {
      await sync.saveRoadmapTopic(courseId, topicId, true, 100);
      return;
    }

    if (sync.clearTopicProgress) {
      await sync.clearTopicProgress(courseId, topicId);
    }
  }

  checkboxes.forEach((check) => {
    const topicId = getTopicId(check);
    if (!topicId) return;

    const local = readLocalProgress();
    const remoteEntry = remoteProgress[topicId];
    const initialOn = remoteEntry ? !!remoteEntry.done : !!local[topicId];
    setRowState(check, initialOn);

    check.addEventListener('change', () => {
      if (check.checked) {
        savedProgress[topicId] = true;
        remoteProgress[topicId] = { done: true, percent: 100 };
        setRowState(check, true);
      } else {
        delete savedProgress[topicId];
        delete remoteProgress[topicId];
        setRowState(check, false);
        if (window.sageClearTopicSubProgress) {
          window.sageClearTopicSubProgress(courseId, labId, topicId);
        }
      }

      persist();
      updateUI();
      syncRemoteTopic(topicId, check.checked).catch((error) => {
        console.warn('Unable to synchronize roadmap topic:', error);
      });
    });
  });

  window.addEventListener('storage', (ev) => {
    if (ev.key !== getStorageKey() || ev.newValue == null) return;
    try {
      const next = JSON.parse(ev.newValue);
      Object.keys(savedProgress).forEach((k) => delete savedProgress[k]);
      Object.assign(savedProgress, next);
      remoteProgress = {};
      applyRoadmapToDom(Object.fromEntries(Object.keys(savedProgress).map((topicId) => [topicId, { done: !!savedProgress[topicId], percent: savedProgress[topicId] ? 100 : 0 }] )));
      updateUI();
    } catch (_) {
      /* ignore */
    }
  });

  window.addEventListener('roadmap-auth-changed', () => {
    hydrateRemoteRoadmap();
  });

  hydrateRemoteRoadmap();
});
