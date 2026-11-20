(function () {
  var PLACEHOLDER = "/assets/images/avatar-placeholder.svg";
  var statusEl = document.getElementById("leaderboard-status");
  var bodyEl = document.getElementById("leaderboard-body");

  function setStatus(message, kind) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.className = "alert alert-" + kind + " mb-3";
    statusEl.textContent = message;
  }

  function safeAvatar(url) {
    try {
      var parsed = new URL(url);
      return parsed.protocol === "https:" ? parsed.href : PLACEHOLDER;
    } catch (_error) {
      return PLACEHOLDER;
    }
  }

  function renderLeaders(leaders) {
    bodyEl.replaceChildren();
    leaders.forEach(function (entry) {
      var tr = document.createElement("tr");

      var tdRank = document.createElement("td");
      tdRank.textContent = String(entry.rank);

      var tdUser = document.createElement("td");
      var wrap = document.createElement("div");
      wrap.className = "d-flex align-items-center gap-2";
      var img = document.createElement("img");
      img.src = entry.avatar_url ? safeAvatar(entry.avatar_url) : PLACEHOLDER;
      img.alt = "";
      img.width = 32;
      img.height = 32;
      img.className = "rounded-circle object-fit-cover border border-secondary";
      img.loading = "lazy";
      var nameSpan = document.createElement("span");
      nameSpan.textContent = entry.handle;
      wrap.append(img, nameSpan);
      tdUser.append(wrap);

      var tdQuizzes = document.createElement("td");
      tdQuizzes.className = "text-end";
      tdQuizzes.textContent = String(entry.passed_quizzes || 0);

      var tdTracks = document.createElement("td");
      tdTracks.className = "text-end";
      tdTracks.textContent = String(entry.passed_tracks || 0);

      var tdPoints = document.createElement("td");
      tdPoints.className = "text-end";
      tdPoints.textContent = String(entry.total_points || 0);

      var tdAvg = document.createElement("td");
      tdAvg.className = "text-end";
      tdAvg.textContent = Number(entry.avg_percent || 0).toFixed(1) + "%";

      tr.append(tdRank, tdUser, tdQuizzes, tdTracks, tdPoints, tdAvg);
      bodyEl.append(tr);
    });
  }

  async function init() {
    if (!window.sclApi || !window.sclApi.roadmap) {
      setStatus("Leaderboard API client is not available.", "warning");
      return;
    }
    var res = await window.sclApi.roadmap.leaderboard();
    if (res.error) {
      setStatus(res.error.message || "Could not load leaderboard.", "danger");
      return;
    }
    var leaders = (res.data && Array.isArray(res.data.leaders)) ? res.data.leaders : [];
    renderLeaders(leaders);
    if (leaders.length === 0) {
      setStatus("No quiz scores recorded yet. Take a roadmap quiz to claim the top spot!", "info");
    } else {
      setStatus("Showing top " + leaders.length + " learner(s).", "success");
    }
  }

  init();
})();
