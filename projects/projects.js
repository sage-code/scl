(function () {
  var tbody = document.getElementById("projects-table-body");
  var addBtn = document.getElementById("projects-add-btn");
  var actionColHead = document.getElementById("projects-action-col");
  var statusBox = document.getElementById("projects-status");
  var dialog = document.getElementById("dialog-project");
  var form = document.getElementById("form-project");

  if (!tbody || !window.sclApi || !window.sclApi.projects) {
    return;
  }

  var state = {
    projects: [],
    categories: [],
    canEdit: false
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

    var colCount = state.canEdit ? 7 : 6;
    if (!state.projects.length) {
      tbody.innerHTML = '<tr><td colspan="' + colCount + '" class="text-center text-secondary">No projects found.</td></tr>';
      return;
    }

    var grouped = [];
    var byCat = new Map();
    state.projects.forEach(function (proj) {
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
        html += "<tr>";
        html += "<td>" + (idx + 1) + "</td>";
        html += '<td class="text-center"><span title="' + escapeHtml(p.status_title) + '" style="cursor:help; color: ' + escapeHtml(p.status_color || "#6c757d") + ';">' + escapeHtml(p.status_icon || "🛠️") + "</span></td>";
        html += '<td class="fixed"><a href="' + escapeHtml(href) + '"' + (isExternal ? ' target="_blank" rel="noopener noreferrer nofollow"' : "") + ">" + escapeHtml(p.name) + "</a></td>";
        html += "<td>" + escapeHtml(p.description) + "</td>";
        html += "<td>" + escapeHtml(p.technology) + "</td>";
        html += '<td class="text-center"><a href="' + escapeHtml(srcHref) + '" target="_blank" rel="noopener noreferrer nofollow" title="GitHub Repository">GitHub</a></td>';
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

    if (state.canEdit) {
      tbody.querySelectorAll(".project-row-edit-btn").forEach(function (btn) {
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

  async function loadProjects() {
    var res = await window.sclApi.projects.list();
    if (res.error) {
      showStatus(statusBox, "Could not refresh projects from database (" + res.error.message + ").", "warning");
      return;
    }
    showStatus(statusBox, "", "info");
    state.projects = Array.isArray(res.data && res.data.projects) ? res.data.projects : [];
    state.categories = Array.isArray(res.data && res.data.categories) ? res.data.categories : [];
    state.canEdit = Boolean(res.data && res.data.can_edit === true);
    renderProjects();
  }

  wireDialog();
  loadProjects();
  window.addEventListener("roadmap-auth-changed", function () {
    loadProjects();
  });
})();
