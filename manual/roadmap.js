document.addEventListener('DOMContentLoaded', () => {
  const roadmapTable = document.querySelector('[data-sage-roadmap]');
  if (!roadmapTable) return;

  const courseId = roadmapTable.getAttribute('data-sage-roadmap');
  const labId = roadmapTable.getAttribute('data-lab-id') || courseId;
  const storageKey = `sage_progress_${courseId}`;
  const checkboxes = roadmapTable.querySelectorAll('.topic-check');
  const progressBar = document.getElementById('roadmap-progress');

  const savedProgress = JSON.parse(localStorage.getItem(storageKey)) || {};

  function persist() {
    localStorage.setItem(storageKey, JSON.stringify(savedProgress));
  }

  function updateUI() {
    if (!progressBar) return;
    const total = checkboxes.length;
    const completed = roadmapTable.querySelectorAll('.topic-check:checked').length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
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
      const row = check.closest('tr');
      const topicId = row && row.getAttribute('data-topic');
      if (!topicId) return;
      const on = !!data[topicId];
      check.checked = on;
      row.classList.toggle('table-active', on);
    });
  }

  checkboxes.forEach((check) => {
    const row = check.closest('tr');
    const topicId = row && row.getAttribute('data-topic');
    if (!topicId) return;

    if (savedProgress[topicId]) {
      check.checked = true;
      row.classList.add('table-active');
    }

    check.addEventListener('change', () => {
      if (check.checked) {
        savedProgress[topicId] = true;
        row.classList.add('table-active');
      } else {
        delete savedProgress[topicId];
        row.classList.remove('table-active');
        if (window.sageClearTopicSubProgress) {
          window.sageClearTopicSubProgress(courseId, labId, topicId);
        }
      }
      persist();
      updateUI();
    });
  });

  window.addEventListener('storage', (ev) => {
    if (ev.key !== storageKey || ev.newValue == null) return;
    try {
      const next = JSON.parse(ev.newValue);
      Object.keys(savedProgress).forEach((k) => delete savedProgress[k]);
      Object.assign(savedProgress, next);
      applyRoadmapToDom(savedProgress);
      updateUI();
    } catch (_) {
      /* ignore */
    }
  });

  updateUI();
});
