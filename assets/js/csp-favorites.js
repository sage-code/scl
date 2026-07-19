(function () {
  var ROADMAP_CODE = "csp";
  var FILTER_STORAGE_KEY = "sage-csp-filter";

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

  function favoriteStorageKey() {
    var userId = getUserId();
    if (userId) {
      return "sage-csp-favorites-" + userId;
    }

    return "sage-csp-favorites-anonymous";
  }

  function anonymousFavoriteStorageKey() {
    return "sage-csp-favorites-anonymous";
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

  function readLocalFavorites() {
    return safeParseArray(localStorage.getItem(favoriteStorageKey()));
  }

  function readAnonymousFavorites() {
    return safeParseArray(localStorage.getItem(anonymousFavoriteStorageKey()));
  }

  function saveLocalFavorites(favorites) {
    localStorage.setItem(favoriteStorageKey(), JSON.stringify(Array.from(favorites)));
  }

  function uniq(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function buildFavoriteRow(topicKey, card) {
    var category = card && card.dataset ? (card.dataset.category || "") : "";
    return {
      user_id: getUserId(),
      roadmap_code: ROADMAP_CODE,
      topic_key: topicKey,
      category: category
    };
  }

  async function fetchRemoteFavorites(client) {
    var userId = getUserId();
    if (!client || !userId) {
      return [];
    }

    var result = await client
      .from("roadmap_favorites")
      .select("topic_key")
      .eq("roadmap_code", ROADMAP_CODE);

    if (result.error) {
      console.warn("Unable to load CSP favorites:", result.error.message || result.error);
      return [];
    }

    return (result.data || []).map(function (row) {
      return row.topic_key;
    });
  }

  async function upsertRemoteFavorites(client, topicsByKey, favoriteSet) {
    var userId = getUserId();
    if (!client || !userId) {
      return;
    }

    var payload = Array.from(favoriteSet)
      .filter(Boolean)
      .map(function (topicKey) {
        return buildFavoriteRow(topicKey, topicsByKey[topicKey]);
      });

    if (payload.length === 0) {
      return;
    }

    var result = await client
      .from("roadmap_favorites")
      .upsert(payload, { onConflict: "user_id,roadmap_code,topic_key" });

    if (result.error) {
      console.warn("Unable to save CSP favorites:", result.error.message || result.error);
    }
  }

  async function removeRemoteFavorite(client, topicKey) {
    var userId = getUserId();
    if (!client || !userId || !topicKey) {
      return;
    }

    var result = await client
      .from("roadmap_favorites")
      .delete()
      .eq("roadmap_code", ROADMAP_CODE)
      .eq("topic_key", topicKey);

    if (result.error) {
      console.warn("Unable to remove CSP favorite:", result.error.message || result.error);
    }
  }

  function setEmptyStateVisible(visible) {
    var emptyState = document.getElementById("csp-empty-state");
    if (!emptyState) {
      return;
    }

    if (visible) {
      emptyState.classList.remove("d-none");
    } else {
      emptyState.classList.add("d-none");
    }
  }

  function applyFilter(filterValue, cards, phases, favorites) {
    var cardsShell = document.getElementById("csp-roadmap-cards");
    var isFavoritesMode = filterValue === "favorites";
    var showCategories = filterValue === "all";
    var anyVisible = false;

    if (cardsShell) {
      cardsShell.classList.toggle("csp-favorites-mode", isFavoritesMode);
      cardsShell.classList.toggle("csp-hide-lane-titles", !showCategories);
    }

    cards.forEach(function (card) {
      var topic = card.dataset.topic || "";
      var category = card.dataset.category || "";
      var isFavorite = favorites.has(topic);
      var visible = false;

      if (filterValue === "favorites") {
        visible = isFavorite;
      } else if (filterValue === "all") {
        visible = true;
      } else {
        visible = category === filterValue;
      }

      card.classList.toggle("d-none", !visible);

      if (isFavoritesMode && visible) {
        card.style.order = String(Math.floor(Math.random() * 100000));
      } else {
        card.style.removeProperty("order");
      }

      if (visible) {
        anyVisible = true;
      }
    });

    if (isFavoritesMode) {
      phases.forEach(function (phase) {
        phase.classList.remove("d-none");
      });
      setEmptyStateVisible(!anyVisible);
      return;
    }

    phases.forEach(function (phase) {
      var cardsInPhase = Array.from(phase.querySelectorAll(".csp-roadmap-card"));
      var phaseVisible = cardsInPhase.some(function (card) {
        return !card.classList.contains("d-none");
      });
      phase.classList.toggle("d-none", !phaseVisible);
    });

    setEmptyStateVisible(!anyVisible);
  }

  function syncFavoriteChecks(cards, favorites) {
    cards.forEach(function (card) {
      var topic = card.dataset.topic || "";
      var isFavorite = favorites.has(topic);
      card.classList.toggle("csp-card-favorite", isFavorite);

      var check = card.querySelector(".csp-favorite-check");
      if (check) {
        check.checked = isFavorite;
      }
    });
  }

  function getSavedFilter() {
    var value = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!value) {
      return "all";
    }

    return value;
  }

  function setSavedFilter(value) {
    localStorage.setItem(FILTER_STORAGE_KEY, value || "all");
  }

  async function loadFavorites(client, topicMap) {
    var localFavorites = readLocalFavorites();
    var favoriteList = uniq(localFavorites);
    var userId = getUserId();

    if (!userId || !client) {
      return new Set(favoriteList);
    }

    var anonymousFavorites = readAnonymousFavorites();
    var remoteFavorites = await fetchRemoteFavorites(client);
    var merged = uniq(favoriteList.concat(anonymousFavorites, remoteFavorites));
    var favoriteSet = new Set(merged);

    saveLocalFavorites(favoriteSet);

    if (merged.length !== remoteFavorites.length) {
      await upsertRemoteFavorites(client, topicMap, favoriteSet);
    }

    return favoriteSet;
  }

  async function setup() {
    var filterSelect = document.getElementById("csp-language-filter");
    var cards = Array.from(document.querySelectorAll(".csp-roadmap-card"));
    var phases = Array.from(document.querySelectorAll(".home-lane[data-phase]"));

    if (!filterSelect || cards.length === 0) {
      return;
    }

    var topicMap = {};
    cards.forEach(function (card) {
      var topic = card.dataset.topic || "";
      if (topic) {
        topicMap[topic] = card;
      }
    });

    var client = getClient();
    var favorites = await loadFavorites(client, topicMap);
    syncFavoriteChecks(cards, favorites);

    var initialFilter = getSavedFilter();
    if (!filterSelect.querySelector('option[value="' + initialFilter + '"]')) {
      initialFilter = "all";
    }

    filterSelect.value = initialFilter;
    applyFilter(initialFilter, cards, phases, favorites);

    filterSelect.addEventListener("change", function () {
      var value = filterSelect.value || "all";
      setSavedFilter(value);
      applyFilter(value, cards, phases, favorites);
    });

    cards.forEach(function (card) {
      var check = card.querySelector(".csp-favorite-check");
      var topicKey = card.dataset.topic || "";

      if (!check || !topicKey) {
        return;
      }

      check.addEventListener("change", async function () {
        if (check.checked) {
          favorites.add(topicKey);
        } else {
          favorites.delete(topicKey);
        }

        saveLocalFavorites(favorites);
        syncFavoriteChecks(cards, favorites);
        applyFilter(filterSelect.value || "all", cards, phases, favorites);

        var currentClient = getClient();
        if (!currentClient || !getUserId()) {
          return;
        }

        if (favorites.has(topicKey)) {
          await upsertRemoteFavorites(currentClient, topicMap, new Set([topicKey]));
        } else {
          await removeRemoteFavorite(currentClient, topicKey);
        }
      });
    });
  }

  function initWithAuthRefresh() {
    setup();

    window.addEventListener("roadmap-auth-changed", function () {
      setup();
    });
  }

  document.addEventListener("DOMContentLoaded", initWithAuthRefresh);
})();
