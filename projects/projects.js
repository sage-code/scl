(function () {
  var tbody = document.getElementById("projects-table-body");
  var addBtn = document.getElementById("projects-add-btn");
  var prevBtn = document.getElementById("projects-prev-btn");
  var nextBtn = document.getElementById("projects-next-btn");
  var pageInfo = document.getElementById("projects-page-info");
  var actionColHead = document.getElementById("projects-action-col");
  var statusBox = document.getElementById("projects-status");
  var dialog = document.getElementById("dialog-project");
  var form = document.getElementById("form-project");

  if (!tbody || !window.sclApi || !window.sclApi.projects) {
    return;
  }

  var PAGE_SIZE = 5;
  var state = {
    projects: [],
    categories: [],
    canEdit: false,
    myRequests: {},
    pendingJoinHandled: false,
    currentPage: 1
  };

  var CATEGORY_NEW_VALUE = "__new__";

  function escapeHtml(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showStatus(el, msg, kind) {
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.className = "alert alert-" + (kind || "info") + " mb-2 py-1 px-2 small";
    el.textContent = msg;
    el.hidden = false;
  }

  function safeHref(raw) {
    var val = String(raw || "").trim();
    if (!val) return "#";
    if (val.startsWith("/") && !val.startsWith("//")) return val;
    try {
      var u = new URL(val);
      return u.protocol === "https:" ? u.href : "#";
    } catch (_err) {
      return "#";
    }
  }

  function renderProjects() {
    if (addBtn) {
      addBtn.hidden = !state.canEdit;
    }
    if (actionColHead) {
      actionColHead.hidden = !state.canEdit;
    }

    var colCount = state.canEdit ? 8 : 7;
    var totalProjects = state.projects.length;
    var totalPages = Math.max(1, Math.ceil(totalProjects / PAGE_SIZE));
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }
    if (state.currentPage < 1) {
      state.currentPage = 1;
    }

    if (prevBtn) {
      prevBtn.disabled = state.currentPage <= 1;
    }
    if (nextBtn) {
      nextBtn.disabled = state.currentPage >= totalPages;
    }

    if (!totalProjects) {
      if (pageInfo) {
        pageInfo.textContent = "";
      }
      tbody.innerHTML = '<tr><td colspan="' + colCount + '" class="text-center text-secondary">No projects found.</td></tr>';
      return;
    }

    var startIndex = (state.currentPage - 1) * PAGE_SIZE;
    var pageProjects = state.projects.slice(startIndex, startIndex + PAGE_SIZE);
    if (pageInfo) {
      pageInfo.textContent = "Showing " + (startIndex + 1) + "\u2013" + (startIndex + pageProjects.length)
        + " of " + totalProjects + " (Page " + state.currentPage + " of " + totalPages + ")";
    }

    var grouped = [];
    var byCat = new Map();
    pageProjects.forEach(function (proj) {
      var cat = proj.category || "Other";
      if (!byCat.has(cat)) {
        var bucket = { category: cat, items: [] };
        byCat.set(cat, bucket);
        grouped.push(bucket);
      }
      byCat.get(cat).items.push(proj);
    });

    var html = "";
    grouped.forEach(function (group) {
      html += '<tr class="table-active"><td colspan="' + colCount + '" class="fw-bold text-uppercase">' + escapeHtml(group.category) + "</td></tr>";
      group.items.forEach(function (p, idx) {
        var href = safeHref(p.url);
        var srcHref = safeHref(p.source_url);
        var isExternal = href.indexOf("https://") === 0;
        var reqStatus = state.myRequests[p.id] || "";
        var joinIcon = reqStatus === "approved"
          ? "👍🏾"
          : (reqStatus === "pending" ? "✊🏾" : "✋🏾");
        var joinTitle = reqStatus === "approved"
          ? "Approved contributor"
          : (reqStatus === "pending" ? "Request pending — click to cancel" : ("Request to join " + p.name));
        html += "<tr>";
        html += "<td>" + (idx + 1) + "</td>";
        html += '<td class="text-center"><span title="' + escapeHtml(p.status_title) + '" style="cursor:help; color: ' + escapeHtml(p.status_color || "#6c757d") + ';">' + escapeHtml(p.status_icon || "🛠️") + "</span></td>";
        html += '<td class="fixed"><a href="' + escapeHtml(href) + '"' + (isExternal ? ' target="_blank" rel="noopener noreferrer nofollow"' : "") + ">" + escapeHtml(p.name) + "</a></td>";
        html += "<td>" + escapeHtml(p.description) + "</td>";
        html += "<td>" + escapeHtml(p.technology) + "</td>";
        html += '<td class="text-center"><a href="' + escapeHtml(srcHref) + '" target="_blank" rel="noopener noreferrer nofollow" title="GitHub Repository">GitHub</a></td>';
        html += '<td class="text-center">'
          + '<button type="button" class="btn btn-outline-info btn-sm rounded-circle project-row-edit-btn project-row-join-btn" data-join-id="' + escapeHtml(p.id) + '" aria-label="' + escapeHtml(joinTitle) + '" title="' + escapeHtml(joinTitle) + '">'
          + '<span aria-hidden="true">' + joinIcon + "</span>"
          + "</button></td>";
        if (state.canEdit) {
          html += '<td class="text-center">'
            + '<button type="button" class="btn btn-outline-secondary btn-sm rounded-circle project-row-edit-btn" data-project-id="' + escapeHtml(p.id) + '" aria-label="Edit ' + escapeHtml(p.name) + '" title="Edit project">'
            + '<i class="bi bi-pencil" aria-hidden="true"></i>'
            + "</button></td>";
        }
        html += "</tr>";
      });
    });

    tbody.innerHTML = html;

    tbody.querySelectorAll(".project-row-join-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var projectId = btn.getAttribute("data-join-id");
        if (projectId) {
          requestJoinProject(projectId);
        }
      });
    });

    if (state.canEdit) {
      tbody.querySelectorAll(".project-row-edit-btn[data-project-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-project-id");
          var proj = state.projects.find(function (item) { return item.id === id; });
          if (proj) {
            openProjectModal(proj);
          }
        });
      });
    }
  }

  function populateCategorySelect(selectedCategory) {
    var select = document.getElementById("input-project-category");
    var newWrap = document.getElementById("input-project-new-category-wrap");
    var newInput = document.getElementById("input-project-new-category");
    if (!select) return;

    var cats = state.categories.slice();
    if (selectedCategory && cats.indexOf(selectedCategory) === -1) {
      cats.push(selectedCategory);
    }

    select.innerHTML = "";
    cats.forEach(function (cat) {
      var opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    var newOpt = document.createElement("option");
    newOpt.value = CATEGORY_NEW_VALUE;
    newOpt.textContent = "+ New category…";
    select.appendChild(newOpt);

    if (selectedCategory) {
      select.value = selectedCategory;
    } else if (cats.length > 0) {
      select.value = cats[0];
    } else {
      select.value = CATEGORY_NEW_VALUE;
    }

    var isNew = select.value === CATEGORY_NEW_VALUE;
    if (newWrap) newWrap.hidden = !isNew;
    if (newInput) {
      newInput.required = isNew;
      if (!isNew) newInput.value = "";
    }
  }

  function openProjectModal(proj) {
    if (!dialog || !form) return;
    var isEdit = Boolean(proj && proj.id);
    document.getElementById("dialog-project-title").textContent = isEdit ? ("Edit Project: " + proj.name) : "Add Project";
    document.getElementById("input-project-id").value = isEdit ? proj.id : "";
    populateCategorySelect(isEdit ? proj.category : (state.categories[0] || ""));
    document.getElementById("input-project-name").value = isEdit ? (proj.name || "") : "";
    document.getElementById("input-project-url").value = isEdit ? (proj.url || "") : "";
    document.getElementById("input-project-description").value = isEdit ? (proj.description || "") : "";
    document.getElementById("input-project-technology").value = isEdit ? (proj.technology || "") : "";
    document.getElementById("input-project-source-url").value = isEdit ? (proj.source_url || "") : "";
    document.getElementById("input-project-status-icon").value = isEdit ? (proj.status_icon || "🛠️") : "🛠️";
    document.getElementById("input-project-status-color").value = isEdit ? (proj.status_color || "#6c757d") : "#6c757d";
    document.getElementById("input-project-status-title").value = isEdit ? (proj.status_title || "In progress") : "In progress";
    document.getElementById("input-project-order").value = isEdit ? String(proj.sort_order || 1) : "";

    var deleteBtn = document.getElementById("project-delete-btn");
    if (deleteBtn) {
      deleteBtn.hidden = !isEdit;
    }

    showStatus(document.getElementById("status-project"), "", "info");
    dialog.showModal();
  }

  function wireDialog() {
    if (!dialog || !form) return;

    var catSelect = document.getElementById("input-project-category");
    var newWrap = document.getElementById("input-project-new-category-wrap");
    var newInput = document.getElementById("input-project-new-category");
    if (catSelect) {
      catSelect.addEventListener("change", function () {
        var isNew = catSelect.value === CATEGORY_NEW_VALUE;
        if (newWrap) newWrap.hidden = !isNew;
        if (newInput) {
          newInput.required = isNew;
          if (isNew) newInput.focus();
        }
      });
    }

    dialog.querySelectorAll("[data-dialog-close]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        dialog.close("cancel");
      });
    });

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        openProjectModal(null);
      });
    }

    var deleteBtn = document.getElementById("project-delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async function () {
        var id = document.getElementById("input-project-id").value;
        if (!id) return;
        deleteBtn.disabled = true;
        var res = await window.sclApi.projects.remove(id);
        deleteBtn.disabled = false;
        if (res.error) {
          showStatus(document.getElementById("status-project"), res.error.message, "danger");
          return;
        }
        dialog.close("delete");
        await loadProjects();
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var cat = catSelect.value === CATEGORY_NEW_VALUE
        ? (newInput ? newInput.value.trim() : "")
        : catSelect.value;

      if (!cat) {
        showStatus(document.getElementById("status-project"), "Category is required.", "warning");
        return;
      }

      var payload = {
        id: document.getElementById("input-project-id").value || undefined,
        category: cat,
        name: document.getElementById("input-project-name").value.trim(),
        url: document.getElementById("input-project-url").value.trim(),
        description: document.getElementById("input-project-description").value.trim(),
        technology: document.getElementById("input-project-technology").value.trim(),
        source_url: document.getElementById("input-project-source-url").value.trim(),
        status_icon: document.getElementById("input-project-status-icon").value,
        status_color: document.getElementById("input-project-status-color").value,
        status_title: document.getElementById("input-project-status-title").value.trim(),
        sort_order: Number(document.getElementById("input-project-order").value || 0)
      };

      var saveBtn = document.getElementById("project-save-btn");
      if (saveBtn) saveBtn.disabled = true;
      var res = await window.sclApi.projects.save(payload);
      if (saveBtn) saveBtn.disabled = false;

      if (res.error) {
        showStatus(document.getElementById("status-project"), res.error.message, "danger");
        return;
      }

      dialog.close("save");
      await loadProjects();
    });
  }

  function isRegisteredUser() {
    return Boolean(window.roadmapState && typeof window.roadmapState.isRegistered === "function" && window.roadmapState.isRegistered());
  }

  function renderSummaryStatus() {
    if (!isRegisteredUser()) {
      showStatus(statusBox, "", "info");
      return;
    }

    var user = window.roadmapState && typeof window.roadmapState.getUser === "function"
      ? window.roadmapState.getUser()
      : null;
    var username = (user && (user.handle || user.display_name || user.email)) || "Member";

    var pendingCount = 0;
    var approvedCount = 0;
    Object.keys(state.myRequests || {}).forEach(function (projId) {
      var st = state.myRequests[projId];
      if (st === "approved") {
        approvedCount += 1;
      } else if (st === "pending") {
        pendingCount += 1;
      }
    });

    if (approvedCount > 0 && pendingCount > 0) {
      showStatus(
        statusBox,
        username + ": You are contributor approved for " + approvedCount + " "
          + (approvedCount === 1 ? "project" : "projects") + " and have "
          + pendingCount + " pending " + (pendingCount === 1 ? "request" : "requests") + ".",
        "info"
      );
    } else if (approvedCount > 0) {
      showStatus(
        statusBox,
        username + ": You are contributor approved for " + approvedCount + " "
          + (approvedCount === 1 ? "project" : "projects") + ".",
        "success"
      );
    } else if (pendingCount > 0) {
      showStatus(
        statusBox,
        username + ": You have " + pendingCount + " pending "
          + (pendingCount === 1 ? "request" : "requests") + ".",
        "info"
      );
    } else {
      showStatus(statusBox, "", "info");
    }
  }

  async function requestJoinProject(projectId) {
    if (!isRegisteredUser()) {
      var returnTarget = "/projects/?join=" + encodeURIComponent(projectId);
      window.location.href = "/roadmaps/login.html?return=" + encodeURIComponent(returnTarget);
      return;
    }

    var currentStatus = state.myRequests[projectId] || "";
    if (currentStatus === "approved") {
      renderSummaryStatus();
      return;
    }

    if (currentStatus === "pending") {
      var cancelRes = await window.sclApi.projects.cancelProject(projectId);
      if (cancelRes.error) {
        showStatus(statusBox, cancelRes.error.message || "Could not cancel your request.", "danger");
        return;
      }
      delete state.myRequests[projectId];
      renderProjects();
      renderSummaryStatus();
      return;
    }

    var res = await window.sclApi.projects.join(projectId);
    if (res.error) {
      showStatus(statusBox, res.error.message || "Could not record your request.", "danger");
      return;
    }

    state.myRequests[projectId] = (res.data && res.data.status) || "pending";
    renderProjects();
    renderSummaryStatus();
  }

  async function maybeCompletePendingJoin() {
    if (state.pendingJoinHandled) return;
    var params = new URLSearchParams(window.location.search || "");
    var joinId = params.get("join");
    if (!joinId || !isRegisteredUser()) {
      return;
    }
    state.pendingJoinHandled = true;
    params.delete("join");
    var cleanQuery = params.toString();
    var cleanUrl = window.location.pathname + (cleanQuery ? "?" + cleanQuery : "") + window.location.hash;
    window.history.replaceState({}, "", cleanUrl);
    await requestJoinProject(joinId);
  }

  async function loadProjects() {
    var res = await window.sclApi.projects.list();
    if (res.error) {
      showStatus(statusBox, "Could not refresh projects from database (" + res.error.message + ").", "warning");
      return;
    }
    state.projects = Array.isArray(res.data && res.data.projects) ? res.data.projects : [];
    state.categories = Array.isArray(res.data && res.data.categories) ? res.data.categories : [];
    state.canEdit = Boolean(res.data && res.data.can_edit === true);
    state.myRequests = (res.data && res.data.my_requests && typeof res.data.my_requests === "object") ? res.data.my_requests : {};
    renderProjects();
    renderSummaryStatus();
    await maybeCompletePendingJoin();
  }

  function wirePagination() {
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (state.currentPage > 1) {
          state.currentPage -= 1;
          renderProjects();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        var totalPages = Math.max(1, Math.ceil(state.projects.length / PAGE_SIZE));
        if (state.currentPage < totalPages) {
          state.currentPage += 1;
          renderProjects();
        }
      });
    }
  }

  wireDialog();
  wirePagination();
  loadProjects();
  window.addEventListener("roadmap-auth-changed", function () {
    loadProjects();
  });
})();
