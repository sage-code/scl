(function () {
  var PLACEHOLDER = "/assets/images/avatar-placeholder.svg";
  var statusEl = document.getElementById("learners-status");
  var bodyEl = document.getElementById("learners-body");

  function setStatus(message, kind) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.className = "alert alert-" + kind + " mb-3";
    statusEl.textContent = message;
  }

  function safeAvatar(url) {
    if (typeof url !== "string" || !url.trim()) {
      return PLACEHOLDER;
    }
    try {
      var parsed = new URL(url.trim(), window.location.origin);
      if (parsed.protocol === "https:") {
        return parsed.href;
      }
      if (parsed.origin === window.location.origin && parsed.pathname.indexOf("/") === 0) {
        return parsed.pathname + parsed.search;
      }
      return PLACEHOLDER;
    } catch (_error) {
      return PLACEHOLDER;
    }
  }

  function formatRelative(iso) {
    if (!iso) return "—";
    var ms = Date.now() - Date.parse(iso);
    if (Number.isNaN(ms) || ms < 0) return "Recently";
    var mins = Math.floor(ms / 60000);
    if (mins < 60) return mins <= 1 ? "Just now" : mins + "m ago";
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    var days = Math.floor(hrs / 24);
    return days + "d ago";
  }

  function trackLabel(code) {
    return window.sclApi && window.sclApi.community && window.sclApi.community.trackLabel
      ? window.sclApi.community.trackLabel(code)
      : code;
  }

  function renderLearners(learners) {
    bodyEl.replaceChildren();
    learners.forEach(function (learner) {
      var tr = document.createElement("tr");

      var tdUser = document.createElement("td");
      var wrap = document.createElement("div");
      wrap.className = "d-flex align-items-center gap-2";
      var img = document.createElement("img");
      img.src = learner.avatar_url ? safeAvatar(learner.avatar_url) : PLACEHOLDER;
      img.alt = "";
      img.width = 32;
      img.height = 32;
      img.className = "rounded-circle object-fit-cover border border-secondary flex-shrink-0";
      img.loading = "lazy";
      img.addEventListener("error", function () {
        if (img.getAttribute("src") !== PLACEHOLDER) {
          img.src = PLACEHOLDER;
        }
      });
      var nameSpan = document.createElement("span");
      nameSpan.textContent = learner.handle;
      wrap.append(img, nameSpan);
      tdUser.append(wrap);

      var tdTracks = document.createElement("td");
      tdTracks.className = "small text-secondary";
      tdTracks.textContent = learner.tracks && learner.tracks.length
        ? learner.tracks.map(trackLabel).join(", ")
        : "Exploring";

      var tdTopics = document.createElement("td");
      tdTopics.className = "text-end";
      tdTopics.textContent = String(learner.completed_topics || 0);

      var tdSeen = document.createElement("td");
      tdSeen.className = "small text-secondary";
      tdSeen.textContent = formatRelative(learner.last_active_at);

      tr.append(tdUser, tdTracks, tdTopics, tdSeen);
      bodyEl.append(tr);
    });
  }

  async function init() {
    if (!window.sclApi || !window.sclApi.roadmap) {
      setStatus("Learner API client is not available.", "warning");
      return;
    }
    var res = await window.sclApi.roadmap.learners();
    if (res.error) {
      if (res.error.status === 401 || res.error.status === 403) {
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.className = "alert alert-warning mb-3";
          statusEl.replaceChildren(
            document.createTextNode("Sign in with a registered account to see who is actively learning. "),
            Object.assign(document.createElement("a"), {
              href: "/roadmaps/login.html?return=%2Froadmaps%2Flearners.html",
              className: "alert-link",
              textContent: "Sign In"
            }),
            document.createTextNode(" or "),
            Object.assign(document.createElement("a"), {
              href: "/roadmaps/register.html?return=%2Froadmaps%2Flearners.html",
              className: "alert-link",
              textContent: "Sign Up / Register"
            }),
            document.createTextNode(".")
          );
        }
        return;
      }
      setStatus(res.error.message || "Could not load active learners.", "danger");
      return;
    }
    var learners = (res.data && Array.isArray(res.data.learners)) ? res.data.learners : [];
    renderLearners(learners);
    if (learners.length === 0) {
      setStatus("No recent learner activity yet. Check off topics on a roadmap to appear here.", "info");
    } else {
      setStatus(learners.length + " active learner(s) in the last 30 days.", "success");
    }
  }

  init();
})();
