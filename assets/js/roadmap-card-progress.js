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

  var STATUS_NOT_STARTED = "not_started";
  var STATUS_IN_PROGRESS = "in_progress";
  var STATUS_COMPLETED = "completed";

  var STATUS_LABELS = {};
  STATUS_LABELS[STATUS_NOT_STARTED] = "Not Started";
  STATUS_LABELS[STATUS_IN_PROGRESS] = "In Progress";
  STATUS_LABELS[STATUS_COMPLETED] = "Completed";

  var LEGACY_STATUS_VALUE = "in_progress";

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

  function safeParseObject(raw) {
    if (!raw) {
      return {};
    }

    try {
      var parsed = JSON.parse(raw);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        return {};
      }

      return parsed;
    } catch (_error) {
      return {};
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

  function normalizeStatus(status) {
    var value = String(status || "").toLowerCase();
    if (value === STATUS_COMPLETED) {
      return STATUS_COMPLETED;
    }

    if (value === STATUS_IN_PROGRESS || value === LEGACY_STATUS_VALUE) {
      return STATUS_IN_PROGRESS;
    }

    return STATUS_NOT_STARTED;
  }

  function nextStatus(currentStatus) {
    if (currentStatus === STATUS_NOT_STARTED) {
      return STATUS_IN_PROGRESS;
    }

    if (currentStatus === STATUS_IN_PROGRESS) {
      return STATUS_COMPLETED;
    }

    return STATUS_NOT_STARTED;
  }

  function readStatusMap() {
    var raw = localStorage.getItem(storageKey());
    var legacyItems = uniq(safeParseArray(raw));
    if (legacyItems.length > 0) {
      var legacyMap = {};
      legacyItems.forEach(function (key) {
        legacyMap[key] = STATUS_IN_PROGRESS;
      });
      return legacyMap;
    }

    var parsed = safeParseObject(raw);
    var map = {};

    Object.keys(parsed).forEach(function (key) {
      if (!key) {
        return;
      }

      var normalized = normalizeStatus(parsed[key]);
      if (normalized !== STATUS_NOT_STARTED) {
        map[key] = normalized;
      }
    });

    return map;
  }

  function writeStatusMap(statusMap) {
    localStorage.setItem(storageKey(), JSON.stringify(statusMap || {}));
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

  function applyVisual(wrap, status) {
    if (!wrap) {
      return;
    }

    var toggle = wrap.querySelector(".roadmap-progress-toggle");
    var label = wrap.querySelector(".roadmap-progress-text");
    var normalized = normalizeStatus(status);

    if (!toggle || !label) {
      return;
    }

    toggle.classList.toggle("is-in-progress", normalized === STATUS_IN_PROGRESS);
    toggle.classList.toggle("is-completed", normalized === STATUS_COMPLETED);
    toggle.setAttribute("aria-label", "Roadmap panel status: " + STATUS_LABELS[normalized]);
    toggle.dataset.status = normalized;
    label.textContent = STATUS_LABELS[normalized];
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

  function enhanceCard(card, statusMap) {
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
      toggle.setAttribute("aria-label", "Roadmap panel status: Not Started");

      var label = document.createElement("span");
      label.className = "roadmap-progress-text";
      label.textContent = "Not Started";

      wrap.appendChild(toggle);
      wrap.appendChild(label);
      row.insertBefore(wrap, row.firstChild);
    }

    var currentToggle = wrap.querySelector(".roadmap-progress-toggle");
    if (hasLocalProgressForAliases(aliasesForTrack(key))) {
      statusMap[key] = STATUS_IN_PROGRESS;
      writeStatusMap(statusMap);
    }

    var currentStatus = normalizeStatus(statusMap[key]);
    if (currentStatus === STATUS_NOT_STARTED) {
      delete statusMap[key];
    } else {
      statusMap[key] = currentStatus;
    }

    applyVisual(wrap, currentStatus);

    if (currentToggle.dataset.roadmapProgressWired === "true") {
      return;
    }

    currentToggle.dataset.roadmapProgressWired = "true";
    currentToggle.addEventListener("click", async function () {
      var nextMap = readStatusMap();
      var previous = normalizeStatus(nextMap[key]);
      var next = nextStatus(previous);

      if (next === STATUS_NOT_STARTED) {
        await clearAllProgressForTrack(key);
      } else {
        nextMap[key] = next;
      }

      if (next === STATUS_NOT_STARTED) {
        delete nextMap[key];
      }

      writeStatusMap(nextMap);
      applyVisual(wrap, next);
    });
  }

  function normalizeStatusMap(statusMap) {
    var map = statusMap || {};
    var changed = false;

    Object.keys(map).forEach(function (key) {
      var normalized = normalizeStatus(map[key]);
      if (normalized === STATUS_NOT_STARTED) {
        delete map[key];
        changed = true;
        return;
      }

      if (map[key] !== normalized) {
        map[key] = normalized;
        changed = true;
      }
    });

    if (changed) {
      writeStatusMap(map);
    }

    return map;
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

    var statusMap = normalizeStatusMap(readStatusMap());
    cards.forEach(function (card) {
      enhanceCard(card, statusMap);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initialize();

    window.addEventListener("roadmap-auth-changed", function () {
      initialize();
    });
  });
})();
