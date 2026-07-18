/**
 * Bridges lab topic pages (sidebar/detail progress) with roadmap index checkboxes.
 * - Dwell time on a topic page marks the matching roadmap row complete.
 * - All sidebar sections checked also marks the roadmap row complete.
 * - Unchecking a row on the lab index clears detail + read-time for that topic.
 * - When every row in a lab is complete, sets sage_lab_complete_{courseId} for parent UI.
 * - Parent checkbox on CSP hub can clear the whole lab.
 */
(function () {
  function roadmapStorageKey(courseId) {
    return 'sage_progress_' + courseId;
  }

  function detailStorageKey(labId, topicId) {
    return 'progress-' + labId + '-' + topicId;
  }

  function readMsStorageKey(courseId, topicId) {
    return 'sage_read_ms_' + courseId + '_' + topicId;
  }

  function courseIdForLab(labId, explicitCourseId) {
    if (explicitCourseId) return explicitCourseId;
    if (labId === 'engineering') return 'cse-main';
    return labId;
  }

  window.sageCourseIdForLab = courseIdForLab;

  window.sageClearTopicSubProgress = function (courseId, labId, topicId) {
    localStorage.removeItem(detailStorageKey(labId, topicId));
    localStorage.removeItem(readMsStorageKey(courseId, topicId));
  };

  window.sageMarkRoadmapTopic = function (courseId, topicId, done) {
    const k = roadmapStorageKey(courseId);
    const data = JSON.parse(localStorage.getItem(k) || '{}');
    if (done) data[topicId] = true;
    else delete data[topicId];
    localStorage.setItem(k, JSON.stringify(data));
  };

  window.sageNotifyLabFullyComplete = function (courseId) {
    localStorage.setItem('sage_lab_complete_' + courseId, '1');
    window.dispatchEvent(new CustomEvent('sage-lab-progress-changed', { detail: { courseId } }));
  };

  window.sageNotifyLabIncomplete = function (courseId) {
    localStorage.removeItem('sage_lab_complete_' + courseId);
    window.dispatchEvent(new CustomEvent('sage-lab-progress-changed', { detail: { courseId } }));
  };

  window.sageClearEntireLabProgress = function (courseId, labId) {
    localStorage.removeItem(roadmapStorageKey(courseId));
    const prefixDetail = 'progress-' + labId + '-';
    const prefixRead = 'sage_read_ms_' + courseId + '_';
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(prefixDetail) || k.startsWith(prefixRead)) {
        localStorage.removeItem(k);
      }
    }
    localStorage.removeItem('sage_lab_complete_' + courseId);
    window.dispatchEvent(new CustomEvent('sage-lab-progress-changed', { detail: { courseId } }));
  };

  var DWELL_MS = 45000;

  window.sageStartTopicReadTracking = function (cfg) {
    if (!cfg || !cfg.labId || !cfg.topicId) return;
    var courseId = courseIdForLab(cfg.labId, cfg.roadmapCourseId);
    var topicId = cfg.topicId;
    var rk = readMsStorageKey(courseId, topicId);
    var acc = parseInt(localStorage.getItem(rk) || '0', 10);
    if (acc >= DWELL_MS) {
      window.sageMarkRoadmapTopic(courseId, topicId, true);
      return;
    }
    var last = Date.now();
    var finished = false;
    setInterval(function () {
      if (finished) return;
      if (document.visibilityState !== 'visible') {
        last = Date.now();
        return;
      }
      var n = Date.now();
      acc += Math.min(n - last, 4000);
      last = n;
      localStorage.setItem(rk, String(acc));
      if (acc >= DWELL_MS) {
        window.sageMarkRoadmapTopic(courseId, topicId, true);
        finished = true;
      }
    }, 1000);
  };

  window.sageMarkTopicCompleteFromSections = function (labId, topicId, roadmapCourseId) {
    var courseId = courseIdForLab(labId, roadmapCourseId);
    window.sageMarkRoadmapTopic(courseId, topicId, true);
  };

  function initCspParentLabRow() {
    document.querySelectorAll('[data-sage-parent-lab]').forEach(function (el) {
      var courseId = el.getAttribute('data-sage-parent-lab');
      if (!courseId) return;

      function syncFromStorage() {
        el.checked = localStorage.getItem('sage_lab_complete_' + courseId) === '1';
      }

      syncFromStorage();
      window.addEventListener('sage-lab-progress-changed', function (ev) {
        if (ev.detail && ev.detail.courseId === courseId) syncFromStorage();
      });
      window.addEventListener('storage', function (ev) {
        if (ev.key === 'sage_lab_complete_' + courseId) syncFromStorage();
      });

      el.addEventListener('change', function () {
        if (!el.checked) {
          var labId = el.getAttribute('data-sage-parent-lab-id') || courseId;
          window.sageClearEntireLabProgress(courseId, labId);
          syncFromStorage();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initCspParentLabRow);
})();
