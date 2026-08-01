(function () {
  var FILTER_STORAGE_KEY = "sage-roadmap-hub-filter";

  function getSavedFilter() {
    var value = localStorage.getItem(FILTER_STORAGE_KEY);
    return value || "all";
  }

  function setSavedFilter(value) {
    localStorage.setItem(FILTER_STORAGE_KEY, value || "all");
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

  function applyFilter(value, cards, lanes, emptyState) {
    var active = value || "all";
    var visibleCount = 0;

    cards.forEach(function (card) {
      var category = String(card.getAttribute("data-category") || "").trim().toLowerCase();
      var domain = resolveCardDomain(card);
      var visible =
        active === "all" ||
        active === category ||
        (active === "engineering" && domain === "engineering") ||
        (active === "programming" && domain === "programming");
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

  function setup() {
    var filterSelect = document.getElementById("roadmap-filter-select");
    var cards = Array.from(document.querySelectorAll(".roadmap-filter-card"));
    var lanes = Array.from(document.querySelectorAll(".home-lane"));
    var emptyState = document.getElementById("roadmap-filter-empty-state");

    if (!filterSelect || cards.length === 0) {
      return;
    }

    var initial = getSavedFilter();
    if (!filterSelect.querySelector('option[value="' + initial + '"]')) {
      initial = "all";
    }

    filterSelect.value = initial;
    applyFilter(initial, cards, lanes, emptyState);

    filterSelect.addEventListener("change", function () {
      var value = filterSelect.value || "all";
      setSavedFilter(value);
      applyFilter(value, cards, lanes, emptyState);
    });
  }

  document.addEventListener("DOMContentLoaded", setup);
})();
