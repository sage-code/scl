(function () {
  function getUserId() {
    if (!window.roadmapState || typeof window.roadmapState.getUser !== "function") {
      return "";
    }

    var user = window.roadmapState.getUser();
    return user && user.id ? String(user.id) : "";
  }

  function storageKey() {
    var userId = getUserId();
    if (userId) {
      return "sage-roadmap-index-in-progress-" + userId;
    }

    return "sage-roadmap-index-in-progress-anonymous";
  }

  function safeParseArray(raw) {
    if (!raw) {
      return [];
    }

    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function uniq(values) {
    return Array.from(new Set((values || []).filter(Boolean)));
  }

  function getSync() {
    return window.sageRoadmapProgressSync || null;
  }

  function aliasesForTrack(trackKey) {
    var key = String(trackKey || "").toLowerCase();
    if (!key) {
      return { courseIds: [], labIds: [] };
    }

    var map = {
      cse: { courseIds: ["cse-main", "cse"], labIds: ["engineering", "cse"] },
      csp: { courseIds: ["csp-main", "csp"], labIds: ["programming", "csp"] },
      dsa: { courseIds: ["dsa-main", "dsa"], labIds: ["dsa"] },
      tek: { courseIds: ["tek-main", "tek"], labIds: ["tek"] },
      dba: { courseIds: ["dba-main", "dba"], labIds: ["dba"] },
      sml: { courseIds: ["sml-main", "sml"], labIds: ["sml"] },
      hpc: { courseIds: ["hpc-main", "hpc"], labIds: ["hpc"] },
      osd: { courseIds: ["osd-main", "osd"], labIds: ["osd"] },
      dsl: { courseIds: ["dsl-main", "dsl"], labIds: ["dsl"] }
    };

    if (map[key]) {
      return {
        courseIds: uniq(map[key].courseIds),
        labIds: uniq(map[key].labIds)
      };
    }

    return {
      courseIds: uniq([key + "-main", key]),
      labIds: uniq([key])
    };
  }

  function hasLocalProgressForAliases(aliases) {
    var courseIds = aliases.courseIds || [];
    var labIds = aliases.labIds || [];
    var keys = [];

    for (var i = 0; i < localStorage.length; i += 1) {
      var key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }

    return keys.some(function (name) {
      var n = String(name || "").toLowerCase();
      return courseIds.some(function (courseId) {
        var c = String(courseId || "").toLowerCase();
        if (!c) return false;
        if (n === "sage_progress_" + c) return true;
        if (n === "sage_lab_complete_" + c) return true;
        if (n.indexOf("sage_progress-") === 0 && n.endsWith("-" + c)) return true;
        if (n.indexOf("sage_read_ms_" + c + "_") === 0) return true;
        if (n.indexOf("sage_read_ms-" + c + "-") === 0) return true;
        return false;
      }) || labIds.some(function (labId) {
        var l = String(labId || "").toLowerCase();
        if (!l) return false;
        if (n.indexOf("progress-" + l + "-") === 0) return true;
        if (n.indexOf("progress-") === 0 && n.indexOf("-" + l + "-") > -1) return true;
        return false;
      });
    });
  }

  async function clearRemoteCourseProgress(courseId) {
    var sync = getSync();
    if (!sync || typeof sync.fetchCourseRows !== "function" || typeof sync.clearTopicProgress !== "function") {
      return;
    }

    var rows = await sync.fetchCourseRows(courseId);
    var seen = {};
    (rows || []).forEach(function (row) {
      var topicKey = row && row.topic_key ? String(row.topic_key) : "";
      if (!topicKey) return;
      var topicId = topicKey.split("::")[0];
      if (!topicId || seen[topicId]) return;
      seen[topicId] = true;
    });

    var topicIds = Object.keys(seen);
    for (var i = 0; i < topicIds.length; i += 1) {
      await sync.clearTopicProgress(courseId, topicIds[i]);
    }
  }

  async function clearAllProgressForTrack(trackKey) {
    var aliases = aliasesForTrack(trackKey);
    var courseIds = aliases.courseIds || [];
    var labIds = aliases.labIds || [];
    var keysToRemove = [];

    for (var i = 0; i < localStorage.length; i += 1) {
      var keyName = localStorage.key(i);
      if (!keyName) continue;

      var keyLower = String(keyName).toLowerCase();
      var matches = courseIds.some(function (courseId) {
        var c = String(courseId || "").toLowerCase();
        if (!c) return false;
        if (keyLower === "sage_progress_" + c) return true;
        if (keyLower === "sage_lab_complete_" + c) return true;
        if (keyLower.indexOf("sage_progress-") === 0 && keyLower.endsWith("-" + c)) return true;
        if (keyLower.indexOf("sage_read_ms_" + c + "_") === 0) return true;
        if (keyLower.indexOf("sage_read_ms-" + c + "-") === 0) return true;
        return false;
      }) || labIds.some(function (labId) {
        var l = String(labId || "").toLowerCase();
        if (!l) return false;
        if (keyLower.indexOf("progress-" + l + "-") === 0) return true;
        if (keyLower.indexOf("progress-") === 0 && keyLower.indexOf("-" + l + "-") > -1) return true;
        return false;
      });

      if (matches) {
        keysToRemove.push(keyName);
      }
    }

    keysToRemove.forEach(function (k) {
      localStorage.removeItem(k);
    });

    if (window.roadmapState && typeof window.roadmapState.getUser === "function" && window.roadmapState.getUser()) {
      for (var j = 0; j < courseIds.length; j += 1) {
        await clearRemoteCourseProgress(courseIds[j]);
      }
    }
  }

  function readInProgressSet() {
    return new Set(uniq(safeParseArray(localStorage.getItem(storageKey()))));
  }

  function writeInProgressSet(progressSet) {
    localStorage.setItem(storageKey(), JSON.stringify(Array.from(progressSet)));
  }

  function topicKeyForCard(card) {
    var anchor = card.querySelector("a.btn");
    if (anchor) {
      var href = anchor.getAttribute("href") || "";
      var match = href.match(/^\/roadmap\/([^\/]+)\/?/i);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }

    var code = card.querySelector(".home-course-code");
    return code ? String(code.textContent || "").trim().toLowerCase() : "";
  }

  function applyVisual(toggle, active) {
    if (!toggle) {
      return;
    }

    toggle.classList.toggle("is-active", !!active);
    toggle.setAttribute("aria-pressed", active ? "true" : "false");
  }

  function ensureActionRow(card, actionButton) {
    var row = card.querySelector(".roadmap-card-actions");
    if (!row) {
      row = document.createElement("div");
      row.className = "roadmap-card-actions";
      actionButton.parentNode.insertBefore(row, actionButton);
      row.appendChild(actionButton);
    }

    return row;
  }

  function enhanceCard(card, progressSet) {
    var actionButton = card.querySelector("a.btn");
    if (!actionButton) {
      return;
    }

    var key = topicKeyForCard(card);
    if (!key) {
      return;
    }

    var row = ensureActionRow(card, actionButton);
    var wrap = row.querySelector(".roadmap-progress-wrap");

    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "roadmap-progress-wrap";

      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "roadmap-progress-toggle";
      toggle.setAttribute("data-topic", key);
      toggle.setAttribute("aria-label", "Toggle roadmap in progress state");

      var label = document.createElement("span");
      label.className = "roadmap-progress-text";
      label.textContent = "In progress";

      wrap.appendChild(toggle);
      wrap.appendChild(label);
      row.insertBefore(wrap, row.firstChild);
    }

    var currentToggle = wrap.querySelector(".roadmap-progress-toggle");
    if (hasLocalProgressForAliases(aliasesForTrack(key))) {
      progressSet.add(key);
      writeInProgressSet(progressSet);
    }
    applyVisual(currentToggle, progressSet.has(key));

    if (currentToggle.dataset.roadmapProgressWired === "true") {
      return;
    }

    currentToggle.dataset.roadmapProgressWired = "true";
    currentToggle.addEventListener("click", async function () {
      var nextSet = readInProgressSet();
      var isActive = nextSet.has(key);

      if (isActive) {
        await clearAllProgressForTrack(key);
        nextSet.delete(key);
      } else {
        nextSet.add(key);
      }

      writeInProgressSet(nextSet);
      applyVisual(currentToggle, !isActive);
    });
  }

  function initialize() {
    if (!document.getElementById("rm-index")) {
      return;
    }

    if (document.getElementById("csp-roadmap-cards")) {
      return;
    }

    var cards = Array.from(document.querySelectorAll(".home-course-card"));
    if (!cards.length) {
      return;
    }

    var progressSet = readInProgressSet();
    cards.forEach(function (card) {
      enhanceCard(card, progressSet);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initialize();

    window.addEventListener("roadmap-auth-changed", function () {
      initialize();
    });
  });
})();
