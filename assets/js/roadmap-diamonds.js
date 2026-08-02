(function () {
  var MAX_DIAMONDS = 12;
  var DIAMOND_STORAGE_PREFIX = "sage-roadmap-hub-diamonds";

  function getUserId() {
    if (!window.roadmapState || typeof window.roadmapState.getUser !== "function") {
      return "";
    }

    var user = window.roadmapState.getUser();
    return user && user.id ? String(user.id) : "";
  }

  function getStorageKey() {
    var userId = getUserId();
    return DIAMOND_STORAGE_PREFIX + "-" + (userId || "anonymous");
  }

  function clampDiamonds(value) {
    var parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
      return 0;
    }

    if (parsed > MAX_DIAMONDS) {
      return MAX_DIAMONDS;
    }

    return parsed;
  }

  function readCachedDiamonds() {
    return clampDiamonds(localStorage.getItem(getStorageKey()));
  }

  function writeCachedDiamonds(value) {
    localStorage.setItem(getStorageKey(), String(clampDiamonds(value)));
  }

  function countCompletedRoadmaps() {
    var cards = Array.from(document.querySelectorAll(".roadmap-filter-card"));
    var completed = 0;

    cards.forEach(function (card) {
      var status = String(card.getAttribute("data-progress-status") || "").toLowerCase();
      if (status === "completed") {
        completed += 1;
      }
    });

    return completed;
  }

  function computeDiamondCount() {
    var registeredBonus = getUserId() ? 1 : 0;
    var completedRoadmaps = countCompletedRoadmaps();
    return clampDiamonds(registeredBonus + completedRoadmaps);
  }

  function buildDiamondString(count) {
    var safeCount = clampDiamonds(count);
    return "💎".repeat(safeCount);
  }

  function renderDiamonds(count) {
    var control = document.getElementById("roadmap-diamond-control");
    var gemsElement = document.getElementById("roadmap-diamond-gems");
    if (!control || !gemsElement) {
      return;
    }

    var safeCount = clampDiamonds(count);
    gemsElement.textContent = buildDiamondString(safeCount);
    control.setAttribute("title", "Diamonds earned from completed roadmaps plus registered bonus. Max 12.");
  }

  function refreshDiamonds() {
    var computed = computeDiamondCount();
    writeCachedDiamonds(computed);
    renderDiamonds(computed);
  }

  function initialize() {
    if (!document.getElementById("roadmap-diamond-control")) {
      return;
    }

    renderDiamonds(readCachedDiamonds());
    refreshDiamonds();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initialize();

    window.addEventListener("roadmap-card-status-updated", function () {
      refreshDiamonds();
    });

    window.addEventListener("roadmap-auth-changed", function () {
      initialize();
    });
  });
})();
