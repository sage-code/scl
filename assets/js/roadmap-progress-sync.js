(function () {
  var SECTION_SEPARATOR = "::";
  var META_PREFIX = "@";

  function getClient() {
    if (!window.supabaseClient || typeof window.supabaseClient.from !== "function") {
      return null;
    }

    return window.supabaseClient;
  }

  function getUser() {
    if (!window.roadmapState || typeof window.roadmapState.getUser !== "function") {
      return null;
    }

    return window.roadmapState.getUser();
  }

  function getUserId() {
    var user = getUser();
    return user && user.id ? String(user.id) : "";
  }

  function isSignedIn() {
    return !!getUserId();
  }

  function buildScopedKey(prefix, parts) {
    var keyParts = [prefix];
    var userId = getUserId();

    if (userId) {
      keyParts.push(userId);
    }

    return keyParts.concat(parts || []).join("-");
  }

  function buildAnonymousKey(prefix, parts) {
    return [prefix].concat(parts || []).join("-");
  }

  function migrateAnonymousKey(prefix, parts) {
    var userKey = buildScopedKey(prefix, parts);
    var anonymousKey = buildAnonymousKey(prefix, parts);

    if (!getUserId() || localStorage.getItem(userKey) || !localStorage.getItem(anonymousKey)) {
      return userKey;
    }

    localStorage.setItem(userKey, localStorage.getItem(anonymousKey));
    return userKey;
  }

  function storageKey(prefix, parts) {
    return isSignedIn() ? migrateAnonymousKey(prefix, parts) : buildAnonymousKey(prefix, parts);
  }

  function roadmapStorageKey(courseId) {
    return storageKey("sage_progress", [courseId]);
  }

  function detailStorageKey(labId, topicId) {
    return storageKey("progress", [labId, topicId]);
  }

  function readMsStorageKey(courseId, topicId) {
    return storageKey("sage_read_ms", [courseId, topicId]);
  }

  function labCompleteStorageKey(courseId) {
    return storageKey("sage_lab_complete", [courseId]);
  }

  function topicSectionKey(topicId, sectionKey) {
    return topicId + SECTION_SEPARATOR + sectionKey;
  }

  function topicMetaKey(topicId, metaType, value) {
    if (!value) {
      return topicId + SECTION_SEPARATOR + META_PREFIX + metaType;
    }

    return topicId + SECTION_SEPARATOR + META_PREFIX + metaType + SECTION_SEPARATOR + value;
  }

  function parseTopicSectionKey(topicKey) {
    var index = topicKey.indexOf(SECTION_SEPARATOR);
    if (index === -1) {
      return null;
    }

    return {
      topicId: topicKey.slice(0, index),
      sectionKey: topicKey.slice(index + SECTION_SEPARATOR.length)
    };
  }

  function isMetaSection(sectionKey) {
    return !!sectionKey && sectionKey.indexOf(META_PREFIX) === 0;
  }

  function lastReadStorageKey(labId, topicId) {
    return storageKey("sage_last_read", [labId, topicId]);
  }

  function navStateStorageKey(labId, topicId) {
    return storageKey("sage_nav_state", [labId, topicId]);
  }

  function normalizePercent(value) {
    var parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
      return 0;
    }

    if (parsed > 100) {
      return 100;
    }

    return parsed;
  }

  async function fetchCourseRows(courseId) {
    var client = getClient();
    var user = getUser();

    if (!client || !user) {
      return [];
    }

    var result = await client
      .from("roadmap_progress")
      .select("topic_key,status,progress_percent,updated_at")
      .eq("roadmap_code", courseId);

    if (result.error) {
      console.warn("Unable to load roadmap progress:", result.error.message || result.error);
      return [];
    }

    return result.data || [];
  }

  function mergeTopicStats(target, percent, done) {
    if (!target) {
      return {
        percent: normalizePercent(percent),
        done: !!done
      };
    }

    var nextPercent = Math.max(target.percent, normalizePercent(percent));
    var nextDone = target.done || !!done || nextPercent >= 100;

    return {
      percent: nextPercent,
      done: nextDone
    };
  }

  async function loadRoadmapProgress(courseId) {
    var rows = await fetchCourseRows(courseId);
    var statsByTopic = {};
    var sectionGroups = {};

    rows.forEach(function (row) {
      var section = parseTopicSectionKey(row.topic_key || "");
      if (section) {
        if (isMetaSection(section.sectionKey)) {
          return;
        }

        if (!sectionGroups[section.topicId]) {
          sectionGroups[section.topicId] = [];
        }

        sectionGroups[section.topicId].push(row);
        return;
      }

      statsByTopic[row.topic_key] = mergeTopicStats(statsByTopic[row.topic_key], row.progress_percent, row.status === "done");
    });

    Object.keys(sectionGroups).forEach(function (topicId) {
      var rowsForTopic = sectionGroups[topicId];
      var total = rowsForTopic.length;
      var completed = rowsForTopic.filter(function (row) {
        return row.status === "done" || normalizePercent(row.progress_percent) >= 100;
      }).length;
      var percent = total ? Math.round((completed / total) * 100) : 0;

      statsByTopic[topicId] = mergeTopicStats(statsByTopic[topicId], percent, completed === total && total > 0);
    });

    return statsByTopic;
  }

  async function loadTopicProgress(courseId, topicId) {
    var rows = await fetchCourseRows(courseId);
    var prefix = topicId + SECTION_SEPARATOR;
    var sectionStates = {};
    var hasSectionRows = false;
    var summaryRow = null;

    rows.forEach(function (row) {
      if (row.topic_key === topicId) {
        summaryRow = row;
        return;
      }

      if (row.topic_key && row.topic_key.indexOf(prefix) === 0) {
        var parsed = parseTopicSectionKey(row.topic_key);
        if (parsed && parsed.topicId === topicId && !isMetaSection(parsed.sectionKey)) {
          hasSectionRows = true;
          sectionStates[parsed.sectionKey] = row.status === "done" || normalizePercent(row.progress_percent) >= 100;
        }
      }
    });

    var sectionKeys = Object.keys(sectionStates);
    var sectionTotal = sectionKeys.length;
    var sectionDone = sectionKeys.filter(function (sectionKey) {
      return !!sectionStates[sectionKey];
    }).length;
    var sectionPercent = sectionTotal ? Math.round((sectionDone / sectionTotal) * 100) : 0;
    var summaryPercent = summaryRow ? normalizePercent(summaryRow.progress_percent) : 0;
    var percent = Math.max(sectionPercent, summaryPercent);
    var done = (summaryRow && (summaryRow.status === "done" || summaryPercent >= 100)) || (sectionTotal > 0 && sectionDone === sectionTotal);

    return {
      sectionStates: sectionStates,
      percent: percent,
      done: !!done,
      hasSectionRows: hasSectionRows,
      fillAllSections: !!done && !hasSectionRows
    };
  }

  async function upsertRows(courseId, rows) {
    var client = getClient();
    var user = getUser();

    if (!client || !user || !rows || rows.length === 0) {
      return false;
    }

    var payload = rows.map(function (row) {
      return {
        user_id: user.id,
        roadmap_code: courseId,
        topic_key: row.topic_key,
        status: row.status,
        progress_percent: normalizePercent(row.progress_percent)
      };
    });

    var result = await client
      .from("roadmap_progress")
      .upsert(payload, { onConflict: "user_id,roadmap_code,topic_key" });

    if (result.error) {
      console.warn("Unable to save roadmap progress:", result.error.message || result.error);
      return false;
    }

    return true;
  }

  async function saveTopicProgress(courseId, topicId, sectionStates) {
    var keys = Object.keys(sectionStates || {});
    if (keys.length === 0) {
      return false;
    }

    var doneCount = 0;
    var rows = keys.map(function (sectionKey) {
      var done = !!sectionStates[sectionKey];
      if (done) {
        doneCount += 1;
      }

      return {
        topic_key: topicSectionKey(topicId, sectionKey),
        status: done ? "done" : "todo",
        progress_percent: done ? 100 : 0
      };
    });

    var percent = Math.round((doneCount / keys.length) * 100);
    rows.push({
      topic_key: topicId,
      status: percent >= 100 ? "done" : (percent > 0 ? "in_progress" : "todo"),
      progress_percent: percent
    });

    return upsertRows(courseId, rows);
  }

  async function saveRoadmapTopic(courseId, topicId, done, percent) {
    if (!topicId) {
      return false;
    }

    return upsertRows(courseId, [{
      topic_key: topicId,
      status: done ? "done" : "todo",
      progress_percent: done ? 100 : normalizePercent(percent)
    }]);
  }

  async function clearTopicProgress(courseId, topicId) {
    var client = getClient();
    if (!client || !getUser()) {
      return false;
    }

    var rows = await fetchCourseRows(courseId);
    var prefix = topicId + SECTION_SEPARATOR;
    var keys = rows
      .filter(function (row) {
        return row.topic_key === topicId || (row.topic_key && row.topic_key.indexOf(prefix) === 0);
      })
      .map(function (row) {
        return row.topic_key;
      });

    if (keys.length === 0) {
      return true;
    }

    var result = await client
      .from("roadmap_progress")
      .delete()
      .eq("roadmap_code", courseId)
      .in("topic_key", keys);

    if (result.error) {
      console.warn("Unable to clear roadmap progress:", result.error.message || result.error);
      return false;
    }

    return true;
  }

  async function clearRoadmapProgress(courseId) {
    var client = getClient();
    if (!client || !getUser()) {
      return false;
    }

    var result = await client
      .from("roadmap_progress")
      .delete()
      .eq("roadmap_code", courseId);

    if (result.error) {
      console.warn("Unable to clear roadmap progress:", result.error.message || result.error);
      return false;
    }

    return true;
  }

  async function saveLastReadPosition(courseId, topicId, sectionId) {
    if (!sectionId) {
      return false;
    }

    var keyPrefix = topicMetaKey(topicId, "last") + SECTION_SEPARATOR;
    var key = topicMetaKey(topicId, "last", sectionId);
    var client = getClient();

    if (!client || !getUser()) {
      return false;
    }

    await client
      .from("roadmap_progress")
      .delete()
      .eq("roadmap_code", courseId)
      .like("topic_key", keyPrefix + "%");

    return upsertRows(courseId, [{
      topic_key: key,
      status: "done",
      progress_percent: 100
    }]);
  }

  async function loadLastReadPosition(courseId, topicId) {
    var rows = await fetchCourseRows(courseId);
    var prefix = topicMetaKey(topicId, "last") + SECTION_SEPARATOR;
    var match = rows.find(function (row) {
      return row.topic_key && row.topic_key.indexOf(prefix) === 0;
    });

    if (!match || !match.topic_key) {
      return "";
    }

    return String(match.topic_key).slice(prefix.length);
  }

  async function saveCollapsedNodes(courseId, topicId, collapsedNodeIds) {
    var client = getClient();
    if (!client || !getUser()) {
      return false;
    }

    var prefix = topicMetaKey(topicId, "collapsed") + SECTION_SEPARATOR;
    await client
      .from("roadmap_progress")
      .delete()
      .eq("roadmap_code", courseId)
      .like("topic_key", prefix + "%");

    var nodeIds = Array.isArray(collapsedNodeIds) ? collapsedNodeIds.filter(Boolean) : [];
    if (nodeIds.length === 0) {
      return true;
    }

    var rows = nodeIds.map(function (nodeId) {
      return {
        topic_key: topicMetaKey(topicId, "collapsed", nodeId),
        status: "done",
        progress_percent: 100
      };
    });

    return upsertRows(courseId, rows);
  }

  async function loadCollapsedNodes(courseId, topicId) {
    var rows = await fetchCourseRows(courseId);
    var prefix = topicMetaKey(topicId, "collapsed") + SECTION_SEPARATOR;

    return rows
      .filter(function (row) {
        return row.topic_key && row.topic_key.indexOf(prefix) === 0;
      })
      .map(function (row) {
        return String(row.topic_key).slice(prefix.length);
      })
      .filter(Boolean);
  }

  window.sageRoadmapProgressSync = {
    isSignedIn: isSignedIn,
    roadmapStorageKey: roadmapStorageKey,
    detailStorageKey: detailStorageKey,
    readMsStorageKey: readMsStorageKey,
    labCompleteStorageKey: labCompleteStorageKey,
    lastReadStorageKey: lastReadStorageKey,
    navStateStorageKey: navStateStorageKey,
    topicSectionKey: topicSectionKey,
    loadRoadmapProgress: loadRoadmapProgress,
    loadTopicProgress: loadTopicProgress,
    saveTopicProgress: saveTopicProgress,
    saveRoadmapTopic: saveRoadmapTopic,
    clearTopicProgress: clearTopicProgress,
    clearRoadmapProgress: clearRoadmapProgress,
    saveLastReadPosition: saveLastReadPosition,
    loadLastReadPosition: loadLastReadPosition,
    saveCollapsedNodes: saveCollapsedNodes,
    loadCollapsedNodes: loadCollapsedNodes,
    fetchCourseRows: fetchCourseRows
  };
})();