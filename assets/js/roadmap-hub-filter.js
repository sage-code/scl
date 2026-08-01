(function () {
  var FILTER_STORAGE_KEY = "sage-roadmap-hub-filter";
  var STATUS_FILTER_STORAGE_KEY = "sage-roadmap-hub-status-filter";
  var REMOTE_PREF_ROADMAP_CODE = "roadmap-hub-preferences";
  var REMOTE_PREF_TOPIC_PREFIX = "status_filter::";

  function getSavedFilter() {
    var value = localStorage.getItem(FILTER_STORAGE_KEY);
    return value || "all";
  }

  function setSavedFilter(value) {
    localStorage.setItem(FILTER_STORAGE_KEY, value || "all");
  }

  function getSavedStatusFilter() {
    var value = localStorage.getItem(STATUS_FILTER_STORAGE_KEY);
    return value || "all";
  }

  function setSavedStatusFilter(value) {
    localStorage.setItem(STATUS_FILTER_STORAGE_KEY, value || "all");
  }

  function getClient() {
    if (!window.supabaseClient || typeof window.supabaseClient.from !== "function") {
      return null;
    }

    return window.supabaseClient;
  }

  function getUserId() {
    if (!window.roadmapState || typeof window.roadmapState.getUser !== "function") {
      return "";
    }

    var user = window.roadmapState.getUser();
    return user && user.id ? String(user.id) : "";
  }

  function isAllowedStatusFilter(value) {
    return value === "all" || value === "in_progress" || value === "not_started" || value === "completed";
  }

  function normalizeStatusFilter(value) {
    var normalized = String(value || "all").trim().toLowerCase();
    return isAllowedStatusFilter(normalized) ? normalized : "all";
  }

  function normalizeCardStatus(value) {
    var status = String(value || "not_started").trim().toLowerCase();
    if (status === "completed" || status === "in_progress" || status === "not_started") {
      return status;
    }

    return "not_started";
  }

  async function loadRemoteStatusFilter() {
    var client = getClient();
    var userId = getUserId();
    if (!client || !userId) {
      return "";
    }

    var result = await client
      .from("roadmap_progress")
      .select("topic_key,updated_at")
      .eq("roadmap_code", REMOTE_PREF_ROADMAP_CODE)
      .like("topic_key", REMOTE_PREF_TOPIC_PREFIX + "%");

    if (result.error) {
      return "";
    }

    var rows = result.data || [];
    if (!rows.length) {
      return "";
    }

    rows.sort(function (a, b) {
      var at = a && a.updated_at ? Date.parse(a.updated_at) : 0;
      var bt = b && b.updated_at ? Date.parse(b.updated_at) : 0;
      return bt - at;
    });

    for (var i = 0; i < rows.length; i += 1) {
      var key = rows[i] && rows[i].topic_key ? String(rows[i].topic_key) : "";
      if (key.indexOf(REMOTE_PREF_TOPIC_PREFIX) !== 0) {
        continue;
      }

      var statusFilter = normalizeStatusFilter(key.slice(REMOTE_PREF_TOPIC_PREFIX.length));
      if (statusFilter) {
        return statusFilter;
      }
    }

    return "";
  }

  async function saveRemoteStatusFilter(value) {
    var client = getClient();
    var userId = getUserId();
    if (!client || !userId) {
      return;
    }

    var normalized = normalizeStatusFilter(value);
    var prefix = REMOTE_PREF_TOPIC_PREFIX;

    await client
      .from("roadmap_progress")
      .delete()
      .eq("roadmap_code", REMOTE_PREF_ROADMAP_CODE)
      .like("topic_key", prefix + "%");

    var topicKey = prefix + normalized;
    await client
      .from("roadmap_progress")
      .upsert([{
        user_id: userId,
        roadmap_code: REMOTE_PREF_ROADMAP_CODE,
        topic_key: topicKey,
        status: "done",
        progress_percent: 100
      }], { onConflict: "user_id,roadmap_code,topic_key" });
  }

  function resolveCardDomain(card) {
    var category = String(card.getAttribute("data-category") || "").trim().toLowerCase();
    return category.indexOf("se-") === 0 ? "engineering" : "programming";
  }

  function hasVisibleCard(lane) {
    var cards = Array.from(lane.querySelectorAll(".roadmap-filter-card"));
    if (cards.length === 0) {
      return true;
    }

    return cards.some(function (card) {
      return !card.classList.contains("d-none");
    });
  }

  function applyFilter(categoryValue, statusValue, cards, lanes, emptyState) {
    var activeCategory = categoryValue || "all";
    var activeStatus = normalizeStatusFilter(statusValue);
    var visibleCount = 0;

    cards.forEach(function (card) {
      var category = String(card.getAttribute("data-category") || "").trim().toLowerCase();
      var domain = resolveCardDomain(card);
      var cardStatus = normalizeCardStatus(card.getAttribute("data-progress-status"));
      var categoryVisible =
        activeCategory === "all" ||
        activeCategory === category ||
        (activeCategory === "engineering" && domain === "engineering") ||
        (activeCategory === "programming" && domain === "programming");
      var statusVisible = activeStatus === "all" || cardStatus === activeStatus;
      var visible = categoryVisible && statusVisible;
      card.classList.toggle("d-none", !visible);
      if (visible) {
        visibleCount += 1;
      }
    });

    lanes.forEach(function (lane) {
      lane.classList.toggle("d-none", !hasVisibleCard(lane));
    });

    if (emptyState) {
      emptyState.classList.toggle("d-none", visibleCount > 0);
    }
  }

  async function setup() {
    var filterSelect = document.getElementById("roadmap-filter-select");
    var statusFilterSelect = document.getElementById("roadmap-status-filter-select");
    var cards = Array.from(document.querySelectorAll(".roadmap-filter-card"));
    var lanes = Array.from(document.querySelectorAll(".home-lane"));
    var emptyState = document.getElementById("roadmap-filter-empty-state");

    if (!filterSelect || !statusFilterSelect || cards.length === 0) {
      return;
    }

    var initialCategory = getSavedFilter();
    if (!filterSelect.querySelector('option[value="' + initialCategory + '"]')) {
      initialCategory = "all";
    }

    var initialStatus = normalizeStatusFilter(getSavedStatusFilter());
    if (!statusFilterSelect.querySelector('option[value="' + initialStatus + '"]')) {
      initialStatus = "all";
    }

    if (getUserId()) {
      try {
        var remoteStatus = await loadRemoteStatusFilter();
        if (remoteStatus && statusFilterSelect.querySelector('option[value="' + remoteStatus + '"]')) {
          initialStatus = remoteStatus;
          setSavedStatusFilter(remoteStatus);
        }
      } catch (_error) {
        /* fallback to local preference */
      }
    }

    filterSelect.value = initialCategory;
    statusFilterSelect.value = initialStatus;
    applyFilter(initialCategory, initialStatus, cards, lanes, emptyState);

    filterSelect.addEventListener("change", function () {
      var value = filterSelect.value || "all";
      setSavedFilter(value);
      applyFilter(value, statusFilterSelect.value || "all", cards, lanes, emptyState);
    });

    statusFilterSelect.addEventListener("change", function () {
      var value = normalizeStatusFilter(statusFilterSelect.value);
      setSavedStatusFilter(value);
      statusFilterSelect.value = value;
      applyFilter(filterSelect.value || "all", value, cards, lanes, emptyState);

      if (getUserId()) {
        saveRemoteStatusFilter(value).catch(function () {
          /* ignore remote save errors for non-blocking UX */
        });
      }
    });

    window.addEventListener("roadmap-card-status-updated", function () {
      applyFilter(filterSelect.value || "all", statusFilterSelect.value || "all", cards, lanes, emptyState);
    });

    window.addEventListener("roadmap-auth-changed", function () {
      if (!getUserId()) {
        return;
      }

      loadRemoteStatusFilter().then(function (remoteStatus) {
        var normalized = normalizeStatusFilter(remoteStatus || "all");
        if (!statusFilterSelect.querySelector('option[value="' + normalized + '"]')) {
          normalized = "all";
        }
        setSavedStatusFilter(normalized);
        statusFilterSelect.value = normalized;
        applyFilter(filterSelect.value || "all", normalized, cards, lanes, emptyState);
      }).catch(function () {
        /* keep local selection */
      });
    });
  }

  document.addEventListener("DOMContentLoaded", setup);
})();
