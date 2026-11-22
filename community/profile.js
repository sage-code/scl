(function () {
  var MAX_PROJECTS = 5;
  var MAX_EDUCATION = 10;
  var AVATAR_PLACEHOLDER = "/assets/images/avatar-placeholder.svg";

  var statusEl = document.getElementById("profile-status");
  var detailsEl = document.getElementById("profile-details");
  var titleEl = document.getElementById("profile-title");

  var currentProfile = null;
  var isOwner = false;
  var canEdit = false;
  var allowedRoles = [];
  var canAddTestimonial = false;
  var canApproveProjects = false;
  var projectsEditMode = false;
  var editingProjectIndex = -1;
  var draftProjects = [];
  var educationEditMode = false;
  var editingEducationIndex = -1;
  var draftEducation = [];

  function showStatus(message, kind) {
    statusEl.hidden = !message;
    statusEl.className = "alert alert-" + kind + " mt-3";
    statusEl.textContent = message;
  }

  function showInlineStatus(id, message, kind) {
    var el = document.getElementById(id);
    if (!el) return;
    el.hidden = !message;
    el.className = "alert alert-" + kind + " mt-2 mb-2 py-1 px-2 small";
    el.textContent = message;
  }

  function trackName(track) {
    return window.sclApi && window.sclApi.community && window.sclApi.community.trackLabel
      ? window.sclApi.community.trackLabel(track)
      : track;
  }

  function countryFlag(countryCode) {
    if (typeof countryCode !== "string" || !/^[A-Z]{2}$/.test(countryCode)) {
      return "";
    }
    return String.fromCodePoint.apply(null, countryCode.split("").map(function (letter) {
      return 0x1f1e6 + letter.charCodeAt(0) - 65;
    }));
  }

  function resolveProfileId() {
    var params = new URLSearchParams(window.location.search);
    var fromQuery = params.get("user_id") || params.get("user-id") || params.get("public_id") || params.get("id");
    if (fromQuery) {
      return fromQuery.trim();
    }
    var match = window.location.pathname.match(/^\/community\/profile\/([^/]+)\/?$/);
    if (match && match[1] && match[1] !== "profile.html") {
      return decodeURIComponent(match[1]);
    }
    return "";
  }

  function safeHttpsUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
      return "";
    }
    try {
      var parsed = new URL(value.trim());
      return parsed.protocol === "https:" ? parsed.href : "";
    } catch (_error) {
      return "";
    }
  }

  function repoMeta(repoUrl) {
    var href = safeHttpsUrl(repoUrl);
    if (!href) return null;
    try {
      var host = new URL(href).hostname.toLowerCase();
      if (host.indexOf("github.com") !== -1) {
        return { href: href, icon: "bi-github", label: "GitHub repository" };
      }
      if (host.indexOf("gitlab.com") !== -1) {
        return { href: href, icon: "bi-gitlab", label: "GitLab repository" };
      }
      if (host.indexOf("bitbucket.org") !== -1) {
        return { href: href, icon: "bi-git", label: "Bitbucket repository" };
      }
      return { href: href, icon: "bi-git", label: "Source repository" };
    } catch (_error) {
      return null;
    }
  }

  function buildSavePayload(overrides) {
    var payload = {
      qualified_track: currentProfile.qualified_track,
      display_name: currentProfile.display_name,
      role: currentProfile.role || "Student",
      certification_label: currentProfile.certification_label || "",
      country_code: currentProfile.country_code || "",
      bio: currentProfile.bio || "",
      projects: currentProfile.projects || [],
      education_rows: currentProfile.education_rows || [],
      contact: currentProfile.contact || {},
      publish: true
    };
    if (!isOwner && currentProfile.public_id) {
      payload.target_public_id = currentProfile.public_id;
    }
    Object.keys(overrides || {}).forEach(function (key) {
      payload[key] = overrides[key];
    });
    return payload;
  }

  function countryName(countryCode) {
    var normalized = String(countryCode || "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) {
      return "";
    }
    try {
      if (typeof Intl !== "undefined" && Intl.DisplayNames) {
        var names = new Intl.DisplayNames(["en"], { type: "region" });
        var resolved = names.of(normalized);
        if (resolved && resolved.toUpperCase() !== normalized && resolved !== "Unknown Region") {
          return resolved;
        }
      }
    } catch (_error) {
      // Ignore unsupported Intl.DisplayNames
    }
    return "";
  }

  function renderIdentity(profile) {
    titleEl.textContent = profile.display_name;
    document.title = profile.display_name + " | Sage-Code Community";
    document.getElementById("profile-role").textContent = profile.role || "Student";

    var originEl = document.getElementById("profile-origin");
    var normalizedCountry = String(profile.country_code || "").trim().toUpperCase();
    var resolvedName = countryName(normalizedCountry);
    if (normalizedCountry && resolvedName) {
      originEl.textContent = countryFlag(normalizedCountry) + " " + resolvedName;
      originEl.hidden = false;
    } else {
      originEl.textContent = "";
      originEl.hidden = true;
    }

    var claimed = profile.claimed_at ? new Date(profile.claimed_at) : null;
    var sinceText = "";
    if (profile.member_since) {
      sinceText = "Member since " + profile.member_since;
    } else if (claimed && !Number.isNaN(claimed.getTime())) {
      sinceText = "Member since " + claimed.toLocaleDateString(undefined, { year: "numeric", month: "long" });
    }
    var metaEl = document.getElementById("profile-meta");
    metaEl.textContent = sinceText;
    metaEl.hidden = !sinceText;

    var avatar = document.getElementById("profile-avatar");
    var safeAvatar = safeHttpsUrl(profile.avatar_url);
    avatar.src = safeAvatar || AVATAR_PLACEHOLDER;
    avatar.alt = "Avatar of " + profile.display_name;
  }

  function renderQualificationPanel(profile) {
    var qualText = profile.certification_label
      ? profile.certification_label
      : trackName(profile.qualified_track) + " Developer";
    document.getElementById("profile-qualification").textContent = qualText;

    var bio = document.getElementById("profile-bio");
    var bioEmpty = document.getElementById("profile-bio-empty");
    bio.textContent = profile.bio || "";
    bio.hidden = !profile.bio;
    bioEmpty.hidden = Boolean(profile.bio);
  }

  function syncProjectsFromInputs(rowEl, index) {
    if (!rowEl || index < 0 || index >= draftProjects.length) return;
    var nameInput = rowEl.querySelector("[data-inline-project-name]");
    var urlInput = rowEl.querySelector("[data-inline-project-url]");
    var repoInput = rowEl.querySelector("[data-inline-project-repo]");
    var descInput = rowEl.querySelector("[data-inline-project-desc]");
    if (!nameInput || !urlInput || !repoInput || !descInput) return;
    draftProjects[index] = {
      name: nameInput.value.trim(),
      url: urlInput.value.trim(),
      repo_url: repoInput.value.trim(),
      description: descInput.value.trim()
    };
  }

  function renderProjectsTable() {
    var section = document.getElementById("profile-projects-section");
    var table = document.getElementById("profile-projects-table");
    var tbody = document.getElementById("profile-projects-body");
    var empty = document.getElementById("profile-projects-empty");
    var saveBtn = document.getElementById("projects-save-btn");
    var cancelBtn = document.getElementById("projects-cancel-btn");
    var editBtn = document.getElementById("projects-edit-btn");
    var hintEl = document.getElementById("projects-edit-hint");
    tbody.replaceChildren();

    var list = projectsEditMode ? draftProjects : (currentProfile.projects || []);
    list.forEach(function (project, idx) {
      var tr = document.createElement("tr");
      var tdNum = document.createElement("td");
      tdNum.textContent = String(idx + 1);

      if (projectsEditMode && idx === editingProjectIndex) {
        var tdName = document.createElement("td");
        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "form-control form-control-sm";
        nameInput.maxLength = 80;
        nameInput.placeholder = "Project name";
        nameInput.value = project.name || "";
        nameInput.setAttribute("data-inline-project-name", "");
        tdName.append(nameInput);

        var tdHome = document.createElement("td");
        var urlInput = document.createElement("input");
        urlInput.type = "url";
        urlInput.className = "form-control form-control-sm";
        urlInput.maxLength = 500;
        urlInput.placeholder = "https://example.com";
        urlInput.value = project.url || "";
        urlInput.setAttribute("data-inline-project-url", "");
        tdHome.append(urlInput);

        var tdRepo = document.createElement("td");
        var repoInput = document.createElement("input");
        repoInput.type = "url";
        repoInput.className = "form-control form-control-sm";
        repoInput.maxLength = 500;
        repoInput.placeholder = "https://github.com/user/repo";
        repoInput.value = project.repo_url || "";
        repoInput.setAttribute("data-inline-project-repo", "");
        tdRepo.append(repoInput);

        var tdDesc = document.createElement("td");
        var descWrap = document.createElement("div");
        descWrap.className = "d-flex gap-2 align-items-center";
        var descInput = document.createElement("input");
        descInput.type = "text";
        descInput.className = "form-control form-control-sm";
        descInput.maxLength = 200;
        descInput.placeholder = "Project description";
        descInput.value = project.description || "";
        descInput.setAttribute("data-inline-project-desc", "");

        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "btn btn-outline-danger btn-sm flex-shrink-0";
        delBtn.title = "Remove row";
        delBtn.textContent = "×";
        delBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          draftProjects.splice(idx, 1);
          editingProjectIndex = -1;
          renderProjectsTable();
        });

        descWrap.append(descInput, delBtn);
        tdDesc.append(descWrap);
        tr.append(tdNum, tdName, tdHome, tdRepo, tdDesc);
        tbody.append(tr);
        setTimeout(function () { nameInput.focus(); }, 0);
        return;
      }

      var tdNameView = document.createElement("td");
      tdNameView.textContent = (project && project.name) || "(Untitled)";

      var href = safeHttpsUrl(project && project.url);
      var tdHomeView = document.createElement("td");
      if (href) {
        var homeLink = document.createElement("a");
        homeLink.href = href;
        homeLink.textContent = href.replace(/^https?:\/\//, "").replace(/\/$/, "");
        homeLink.target = "_blank";
        homeLink.rel = "noopener noreferrer nofollow";
        tdHomeView.append(homeLink);
      } else {
        tdHomeView.className = "text-secondary";
        tdHomeView.textContent = "—";
      }

      var tdRepoView = document.createElement("td");
      tdRepoView.className = "text-center";
      var repo = repoMeta(project && project.repo_url);
      if (repo) {
        var repoLink = document.createElement("a");
        repoLink.href = repo.href;
        repoLink.target = "_blank";
        repoLink.rel = "noopener noreferrer nofollow";
        repoLink.className = "btn btn-outline-secondary btn-sm";
        repoLink.title = repo.label;
        repoLink.setAttribute("aria-label", repo.label);
        var repoIcon = document.createElement("i");
        repoIcon.className = "bi " + repo.icon;
        repoIcon.setAttribute("aria-hidden", "true");
        repoLink.append(repoIcon);
        tdRepoView.append(repoLink);
      } else {
        tdRepoView.className = "text-center text-secondary";
        tdRepoView.textContent = "—";
      }

      var tdDescView = document.createElement("td");
      tdDescView.className = project && project.description ? "" : "text-secondary";
      tdDescView.textContent = (project && project.description) || "—";

      if (projectsEditMode) {
        tr.className = "profile-row-selectable";
        tr.title = "Click to edit row";
        tr.addEventListener("click", function (e) {
          if (e.target.closest("a")) {
            e.preventDefault();
          }
          var activeRow = tbody.querySelector("[data-inline-project-name]");
          if (activeRow) {
            syncProjectsFromInputs(activeRow.closest("tr"), editingProjectIndex);
          }
          editingProjectIndex = idx;
          renderProjectsTable();
        });
      }

      tr.append(tdNum, tdNameView, tdHomeView, tdRepoView, tdDescView);
      tbody.append(tr);
    });

    var hasRows = list.length > 0;
    table.hidden = !hasRows;
    empty.hidden = hasRows || !canEdit;
    saveBtn.hidden = !projectsEditMode;
    cancelBtn.hidden = !projectsEditMode;
    editBtn.hidden = projectsEditMode;
    hintEl.hidden = !projectsEditMode;
    section.hidden = !canEdit && !hasRows;
  }

  function syncEducationFromInputs(rowEl, index) {
    if (!rowEl || index < 0 || index >= draftEducation.length) return;
    var instInput = rowEl.querySelector("[data-inline-edu-inst]");
    var countryInput = rowEl.querySelector("[data-inline-edu-country]");
    var startInput = rowEl.querySelector("[data-inline-edu-start]");
    var endInput = rowEl.querySelector("[data-inline-edu-end]");
    if (!instInput || !countryInput || !startInput || !endInput) return;
    draftEducation[index] = {
      institution: instInput.value.trim(),
      country: countryInput.value.trim(),
      year_started: startInput.value.trim(),
      year_ended: endInput.value.trim()
    };
  }

  function renderEducationTable() {
    var table = document.getElementById("profile-education-table");
    var tbody = document.getElementById("profile-education-body");
    var empty = document.getElementById("profile-education-empty");
    var legacyEl = document.getElementById("profile-education-legacy");
    var saveBtn = document.getElementById("education-save-btn");
    var cancelBtn = document.getElementById("education-cancel-btn");
    var editBtn = document.getElementById("education-edit-btn");
    var hintEl = document.getElementById("education-edit-hint");
    tbody.replaceChildren();

    var legacyText = currentProfile.education || "";
    legacyEl.textContent = legacyText;
    legacyEl.hidden = !legacyText;

    var list = educationEditMode ? draftEducation : (currentProfile.education_rows || []);
    list.forEach(function (row, idx) {
      var tr = document.createElement("tr");

      if (educationEditMode && idx === editingEducationIndex) {
        var tdInst = document.createElement("td");
        var instInput = document.createElement("input");
        instInput.type = "text";
        instInput.className = "form-control form-control-sm";
        instInput.maxLength = 120;
        instInput.placeholder = "University / School";
        instInput.value = row.institution || "";
        instInput.setAttribute("data-inline-edu-inst", "");
        tdInst.append(instInput);

        var tdCountry = document.createElement("td");
        var countryInput = document.createElement("input");
        countryInput.type = "text";
        countryInput.className = "form-control form-control-sm";
        countryInput.maxLength = 80;
        countryInput.placeholder = "Country";
        countryInput.value = row.country || "";
        countryInput.setAttribute("data-inline-edu-country", "");
        tdCountry.append(countryInput);

        var tdStart = document.createElement("td");
        var startInput = document.createElement("input");
        startInput.type = "text";
        startInput.className = "form-control form-control-sm";
        startInput.maxLength = 20;
        startInput.placeholder = "2020";
        startInput.value = row.year_started || "";
        startInput.setAttribute("data-inline-edu-start", "");
        tdStart.append(startInput);

        var tdEnd = document.createElement("td");
        var endWrap = document.createElement("div");
        endWrap.className = "d-flex gap-2 align-items-center";
        var endInput = document.createElement("input");
        endInput.type = "text";
        endInput.className = "form-control form-control-sm";
        endInput.maxLength = 20;
        endInput.placeholder = "2024";
        endInput.value = row.year_ended || "";
        endInput.setAttribute("data-inline-edu-end", "");

        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "btn btn-outline-danger btn-sm flex-shrink-0";
        delBtn.title = "Remove row";
        delBtn.textContent = "×";
        delBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          draftEducation.splice(idx, 1);
          editingEducationIndex = -1;
          renderEducationTable();
        });

        endWrap.append(endInput, delBtn);
        tdEnd.append(endWrap);
        tr.append(tdInst, tdCountry, tdStart, tdEnd);
        tbody.append(tr);
        setTimeout(function () { instInput.focus(); }, 0);
        return;
      }

      var tdInstView = document.createElement("td");
      tdInstView.textContent = row.institution || "—";
      var tdCountryView = document.createElement("td");
      tdCountryView.textContent = row.country || "—";
      var tdStartView = document.createElement("td");
      tdStartView.textContent = row.year_started || "—";
      var tdEndView = document.createElement("td");
      tdEndView.textContent = row.year_ended || "—";

      if (educationEditMode) {
        tr.className = "profile-row-selectable";
        tr.title = "Click to edit row";
        tr.addEventListener("click", function () {
          var activeRow = tbody.querySelector("[data-inline-edu-inst]");
          if (activeRow) {
            syncEducationFromInputs(activeRow.closest("tr"), editingEducationIndex);
          }
          editingEducationIndex = idx;
          renderEducationTable();
        });
      }

      tr.append(tdInstView, tdCountryView, tdStartView, tdEndView);
      tbody.append(tr);
    });

    var hasRows = list.length > 0;
    table.hidden = !hasRows;
    empty.hidden = hasRows || Boolean(legacyText);
    saveBtn.hidden = !educationEditMode;
    cancelBtn.hidden = !educationEditMode;
    editBtn.hidden = educationEditMode;
    hintEl.hidden = !educationEditMode;
  }

  function renderCertificates(profile) {
    var empty = document.getElementById("profile-certificate-empty");
    var list = document.getElementById("profile-certificates-list");
    list.replaceChildren();

    var certs = Array.isArray(profile.certificates) ? profile.certificates.slice() : [];
    if (certs.length === 0 && profile.certificate_url) {
      certs.push({
        title: profile.certification_label || "Certificate of Completion",
        url: profile.certificate_url
      });
    }

    certs.forEach(function (cert) {
      if (!cert || !cert.url) return;
      var safeUrl;
      try {
        var parsed = new URL(cert.url, window.location.origin);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return;
        safeUrl = parsed.href;
      } catch (_error) {
        return;
      }
      var li = document.createElement("li");
      var link = document.createElement("a");
      link.href = safeUrl;
      link.className = "btn btn-outline-primary btn-sm";
      if (safeUrl.indexOf(window.location.origin) !== 0) {
        link.target = "_blank";
        link.rel = "noopener noreferrer nofollow";
      }
      var icon = document.createElement("i");
      icon.className = "bi bi-patch-check-fill me-1";
      icon.setAttribute("aria-hidden", "true");
      link.append(icon, document.createTextNode(cert.title || "View Certificate"));

      if (/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(safeUrl) || safeUrl.indexOf("/community/certificate/") !== -1) {
        link.addEventListener("click", function (e) {
          var dlg = document.getElementById("dialog-certificate");
          var img = document.getElementById("certificate-modal-img");
          var dlgTitle = document.getElementById("dialog-certificate-title");
          if (dlg && img) {
            e.preventDefault();
            img.src = safeUrl;
            img.alt = cert.title || "Certificate";
            if (dlgTitle) dlgTitle.textContent = cert.title || "Certificate";
            dlg.showModal();
          }
        });
      }

      li.append(link);
      list.append(li);
    });

    var hasCerts = list.childElementCount > 0;
    list.hidden = !hasCerts;
    empty.hidden = hasCerts;
  }

  function renderContact(contact, displayName) {
    var headingEl = document.getElementById("profile-contact-heading");
    if (headingEl) {
      headingEl.textContent = "Contact " + (displayName || "member") + " on social platforms:";
    }
    var linksEl = document.getElementById("profile-contact-links");
    var extraEl = document.getElementById("profile-contact-extra");
    var emptyEl = document.getElementById("profile-contact-empty");
    linksEl.replaceChildren();
    extraEl.replaceChildren();

    var data = contact && typeof contact === "object" ? contact : {};
    var specs = [
      { key: "website", label: "Website", icon: "bi-globe" },
      { key: "github", label: "GitHub", icon: "bi-github" },
      { key: "linkedin", label: "LinkedIn", icon: "bi-linkedin" },
      { key: "x", label: "X", icon: "bi-twitter-x" },
      { key: "bluesky", label: "Bluesky", icon: "bi-bluesky" }
    ];

    specs.forEach(function (spec) {
      var href = safeHttpsUrl(data[spec.key]);
      if (!href) return;
      var anchor = document.createElement("a");
      anchor.href = href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer nofollow";
      anchor.className = "btn btn-outline-secondary social-btn";
      anchor.title = spec.label;
      anchor.setAttribute("aria-label", spec.label);
      var icon = document.createElement("i");
      icon.className = "bi " + spec.icon;
      icon.setAttribute("aria-hidden", "true");
      anchor.append(icon);
      linksEl.append(anchor);
    });

    if (typeof data.discord === "string" && data.discord.trim()) {
      var discordLine = document.createElement("p");
      discordLine.className = "mb-1";
      discordLine.textContent = "Discord: " + data.discord.trim();
      extraEl.append(discordLine);
    }

    if (typeof data.email === "string" && data.email.trim()) {
      var emailLine = document.createElement("p");
      emailLine.className = "mb-0";
      emailLine.textContent = "Email: " + data.email.trim();
      extraEl.append(emailLine);
    }

    var hasContent = linksEl.childElementCount > 0 || extraEl.childElementCount > 0;
    emptyEl.hidden = hasContent;
  }

  function renderTestimonials(profile) {
    var section = document.getElementById("profile-testimonials-section");
    var grid = document.getElementById("profile-testimonials-grid");
    var addBtn = document.getElementById("testimonial-add-btn");
    grid.replaceChildren();

    var items = Array.isArray(profile.testimonials) ? profile.testimonials : [];
    var colClass = items.length === 1 ? "col-12" : "col-lg-6";

    items.forEach(function (item) {
      var col = document.createElement("div");
      col.className = colClass;

      var card = document.createElement("article");
      card.className = "card-slate p-4 h-100 d-flex flex-column justify-content-between";

      var quote = document.createElement("p");
      quote.className = "mb-3";
      quote.textContent = item.content || "";

      var footer = document.createElement("div");
      footer.className = "d-flex justify-content-between align-items-center gap-2 pt-2 border-top border-secondary-subtle";

      var author = document.createElement("div");
      author.className = "small";
      var strong = document.createElement("strong");
      strong.textContent = item.author_name || "Mentor";
      var roleSpan = document.createElement("span");
      roleSpan.className = "text-secondary ms-2";
      roleSpan.textContent = item.author_role || "Mentor";
      author.append(strong, roleSpan);

      footer.append(author);

      if (item.can_delete) {
        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "btn btn-outline-danger btn-sm";
        delBtn.textContent = "Remove";
        delBtn.addEventListener("click", async function () {
          delBtn.disabled = true;
          var res = await window.sclApi.community.deleteTestimonial(item.id);
          if (!res.error) {
            currentProfile.testimonials = (currentProfile.testimonials || []).filter(function (t) {
              return t.id !== item.id;
            });
            renderTestimonials(currentProfile);
          } else {
            delBtn.disabled = false;
          }
        });
        footer.append(delBtn);
      }

      card.append(quote, footer);
      col.append(card);
      grid.append(col);
    });

    addBtn.hidden = !canAddTestimonial;
    section.hidden = items.length === 0 && !canAddTestimonial;
  }

  function formatRoadmapDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toISOString().slice(0, 10);
  }

  function formatQuizScore(val) {
    if (val === null || val === undefined || Number.isNaN(Number(val))) {
      return "—";
    }
    return Math.round(Number(val)) + "%";
  }

  function renderRoadmapsTable(profile) {
    var section = document.getElementById("profile-roadmaps-section");
    var tbody = document.getElementById("profile-roadmaps-body");
    if (!section || !tbody) return;

    var roadmaps = Array.isArray(profile && profile.roadmaps) ? profile.roadmaps : [];
    tbody.replaceChildren();

    if (roadmaps.length === 0) {
      section.hidden = true;
      return;
    }

    roadmaps.forEach(function (item) {
      var tr = document.createElement("tr");

      var tdCode = document.createElement("td");
      var link = document.createElement("a");
      link.href = item.url || ("/roadmaps/" + encodeURIComponent(item.code) + "/");
      link.textContent = item.label || String(item.code || "").toUpperCase();
      tdCode.append(link);

      var tdStart = document.createElement("td");
      tdStart.textContent = formatRoadmapDate(item.started_at);

      var tdStatus = document.createElement("td");
      tdStatus.textContent = item.status || "In Progress";

      var tdA = document.createElement("td");
      tdA.className = "text-center";
      tdA.textContent = formatQuizScore(item.quiz_a);

      var tdB = document.createElement("td");
      tdB.className = "text-center";
      tdB.textContent = formatQuizScore(item.quiz_b);

      var tdC = document.createElement("td");
      tdC.className = "text-center";
      tdC.textContent = formatQuizScore(item.quiz_c);

      tr.append(tdCode, tdStart, tdStatus, tdA, tdB, tdC);
      tbody.append(tr);
    });

    section.hidden = false;
  }

  function renderContributorTable(profile) {
    var section = document.getElementById("profile-contributor-section");
    var tbody = document.getElementById("profile-contributor-body");
    var actionCol = document.getElementById("contributor-action-col");
    if (!section || !tbody) return;

    var requests = Array.isArray(profile && profile.project_requests) ? profile.project_requests : [];
    tbody.replaceChildren();

    if (requests.length === 0) {
      section.hidden = true;
      return;
    }

    var canRemove = isOwner || canApproveProjects;
    if (actionCol) {
      actionCol.hidden = !canRemove;
    }

    requests.forEach(function (item) {
      var tr = document.createElement("tr");

      var tdProject = document.createElement("td");
      var href = String(item.project_url || "").trim();
      if (href && (href.startsWith("/") || href.startsWith("https://"))) {
        var link = document.createElement("a");
        link.href = href;
        link.textContent = item.project_name || "Project";
        if (href.startsWith("https://")) {
          link.target = "_blank";
          link.rel = "noopener noreferrer nofollow";
        }
        tdProject.append(link);
      } else {
        tdProject.textContent = item.project_name || "Project";
      }

      var tdStatus = document.createElement("td");
      tdStatus.textContent = item.status === "approved" ? "Approved" : "Pending";

      var tdApproved = document.createElement("td");
      tdApproved.className = "text-center";
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "form-check-input";
      checkbox.checked = item.status === "approved";
      checkbox.disabled = !canApproveProjects;
      checkbox.setAttribute("aria-label", "Approved for " + (item.project_name || "project"));
      if (canApproveProjects) {
        checkbox.addEventListener("change", async function () {
          checkbox.disabled = true;
          var res = await window.sclApi.projects.approveContributor(item.id, checkbox.checked);
          checkbox.disabled = false;
          if (res.error) {
            checkbox.checked = !checkbox.checked;
            showInlineStatus("status-contributor", res.error.message, "danger");
            return;
          }
          item.status = (res.data && res.data.status) || (checkbox.checked ? "approved" : "pending");
          tdStatus.textContent = item.status === "approved" ? "Approved" : "Pending";
          showInlineStatus("status-contributor", "", "info");
        });
      }
      tdApproved.append(checkbox);

      tr.append(tdProject, tdStatus, tdApproved);

      if (canRemove) {
        var tdAction = document.createElement("td");
        tdAction.className = "text-center";
        var cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn-outline-danger btn-sm";
        cancelBtn.title = "Cancel request and unsubscribe";
        cancelBtn.setAttribute("aria-label", "Cancel request and unsubscribe from " + (item.project_name || "project"));
        cancelBtn.textContent = "×";
        cancelBtn.addEventListener("click", async function () {
          cancelBtn.disabled = true;
          var res = await window.sclApi.projects.leaveProject(item.id);
          cancelBtn.disabled = false;
          if (res.error) {
            showInlineStatus("status-contributor", res.error.message, "danger");
            return;
          }
          currentProfile.project_requests = (currentProfile.project_requests || []).filter(function (r) {
            return r.id !== item.id;
          });
          renderContributorTable(currentProfile);
          showInlineStatus("status-contributor", "", "info");
        });
        tdAction.append(cancelBtn);
        tr.append(tdAction);
      }

      tbody.append(tr);
    });

    section.hidden = false;
  }

  function renderProfile(profile) {
    currentProfile = profile;
    renderIdentity(profile);
    renderQualificationPanel(profile);
    renderProjectsTable();
    renderRoadmapsTable(profile);
    renderContributorTable(profile);
    renderEducationTable();
    renderCertificates(profile);
    renderContact(profile.contact, profile.display_name);
    renderTestimonials(profile);

    detailsEl.hidden = false;
    showStatus("", "info");
  }

  function wireDialogCloseButtons() {
    document.querySelectorAll("[data-dialog-close]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dlg = document.getElementById(btn.getAttribute("data-dialog-close"));
        if (dlg && dlg.open) dlg.close("cancel");
      });
    });
  }

  function wireOwnerControls() {
    document.getElementById("edit-avatar-btn").hidden = !isOwner;
    document.getElementById("edit-identity-btn").hidden = false;
    document.getElementById("edit-highlights-btn").hidden = false;
    document.getElementById("projects-owner-controls").hidden = false;
    document.getElementById("education-owner-controls").hidden = false;
    document.getElementById("edit-contacts-btn").hidden = false;

    // Avatar crop & upload
    var avatarInput = document.getElementById("profile-avatar-input");
    var cropper = window.sclAvatarCropper
      ? window.sclAvatarCropper.init({
          onConfirm: async function (optimized) {
            var res = await window.sclApi.community.uploadAvatar(optimized.file);
            if (res.error) {
              showStatus(res.error.message, "danger");
              return;
            }
            if (res.data && res.data.avatar_url) {
              currentProfile.avatar_url = res.data.avatar_url;
              renderIdentity(currentProfile);
            }
          },
          onError: function (msg) {
            showStatus(msg, "danger");
          }
        })
      : null;

    document.getElementById("edit-avatar-btn").addEventListener("click", function () {
      avatarInput.click();
    });

    avatarInput.addEventListener("change", function () {
      var file = avatarInput.files && avatarInput.files[0];
      avatarInput.value = "";
      if (!file) return;
      if (cropper) {
        cropper.openFile(file);
      }
    });

    // Identity modal
    var dialogIdentity = document.getElementById("dialog-identity");
    document.getElementById("edit-identity-btn").addEventListener("click", function () {
      document.getElementById("input-display-name").value = currentProfile.display_name || "";
      var roleGroup = document.getElementById("input-role-group");
      var roleSelect = document.getElementById("input-role");
      var currentRole = currentProfile.role || "Student";
      roleSelect.replaceChildren();
      if (allowedRoles.length > 0) {
        allowedRoles.forEach(function (r) {
          var opt = document.createElement("option");
          opt.value = r;
          opt.textContent = r;
          roleSelect.append(opt);
        });
        roleSelect.value = allowedRoles.indexOf(currentRole) !== -1 ? currentRole : allowedRoles[0];
        roleGroup.hidden = false;
      } else {
        var opt = document.createElement("option");
        opt.value = currentRole;
        opt.textContent = currentRole;
        roleSelect.append(opt);
        roleSelect.value = currentRole;
        roleGroup.hidden = true;
      }
      var countryInput = document.getElementById("input-country-code");
      var countryPreview = document.getElementById("input-country-preview");
      countryInput.value = currentProfile.country_code || "";
      if (countryPreview) {
        var initCode = String(countryInput.value || "").trim().toUpperCase();
        var initName = countryName(initCode);
        countryPreview.textContent = initName ? (countryFlag(initCode) + " " + initName) : "";
        countryPreview.className = "small text-light fw-medium";
      }
      showInlineStatus("status-identity", "", "info");
      dialogIdentity.showModal();
    });
    document.getElementById("input-country-code").addEventListener("input", function (e) {
      var countryPreview = document.getElementById("input-country-preview");
      if (!countryPreview) return;
      var code = String(e.target.value || "").trim().toUpperCase();
      var name = countryName(code);
      if (name) {
        countryPreview.textContent = countryFlag(code) + " " + name;
        countryPreview.className = "small text-light fw-medium";
      } else if (code.length === 2) {
        countryPreview.textContent = "Unknown country code";
        countryPreview.className = "small text-warning";
      } else {
        countryPreview.textContent = "";
        countryPreview.className = "small text-light fw-medium";
      }
    });
    document.getElementById("form-identity").addEventListener("submit", async function (e) {
      e.preventDefault();
      var payloadOverrides = {
        display_name: document.getElementById("input-display-name").value,
        country_code: document.getElementById("input-country-code").value
      };
      if (allowedRoles.length > 0) {
        payloadOverrides.role = document.getElementById("input-role").value;
      }
      var res = await window.sclApi.community.saveProfile(buildSavePayload(payloadOverrides));
      if (res.error) {
        showInlineStatus("status-identity", res.error.message, "danger");
        return;
      }
      currentProfile = res.data.profile;
      renderIdentity(currentProfile);
      dialogIdentity.close("save");
    });

    // Position / Description modal
    var dialogHighlights = document.getElementById("dialog-highlights");
    document.getElementById("edit-highlights-btn").addEventListener("click", function () {
      document.getElementById("input-qualification").value = currentProfile.certification_label || "";
      document.getElementById("input-bio").value = currentProfile.bio || "";
      showInlineStatus("status-highlights", "", "info");
      dialogHighlights.showModal();
    });
    document.getElementById("form-highlights").addEventListener("submit", async function (e) {
      e.preventDefault();
      var res = await window.sclApi.community.saveProfile(buildSavePayload({
        certification_label: document.getElementById("input-qualification").value,
        bio: document.getElementById("input-bio").value
      }));
      if (res.error) {
        showInlineStatus("status-highlights", res.error.message, "danger");
        return;
      }
      currentProfile = res.data.profile;
      renderQualificationPanel(currentProfile);
      dialogHighlights.close("save");
    });

    // Projects in-place table editing
    document.getElementById("projects-edit-btn").addEventListener("click", function () {
      if (projectsEditMode) {
        projectsEditMode = false;
        editingProjectIndex = -1;
        showInlineStatus("status-projects", "", "info");
        renderProjectsTable();
        return;
      }
      draftProjects = (currentProfile.projects || []).map(function (p) {
        return { name: p.name || "", url: p.url || "", repo_url: p.repo_url || "", description: p.description || "" };
      });
      projectsEditMode = true;
      editingProjectIndex = draftProjects.length ? 0 : -1;
      showInlineStatus("status-projects", "", "info");
      renderProjectsTable();
    });

    document.getElementById("projects-add-btn").addEventListener("click", function () {
      if (!projectsEditMode) {
        draftProjects = (currentProfile.projects || []).map(function (p) {
          return { name: p.name || "", url: p.url || "", repo_url: p.repo_url || "", description: p.description || "" };
        });
        projectsEditMode = true;
      } else {
        var active = document.querySelector("[data-inline-project-name]");
        if (active) syncProjectsFromInputs(active.closest("tr"), editingProjectIndex);
      }
      if (draftProjects.length >= MAX_PROJECTS) {
        showInlineStatus("status-projects", "You can list up to " + MAX_PROJECTS + " projects.", "warning");
        return;
      }
      draftProjects.push({ name: "", url: "", repo_url: "", description: "" });
      editingProjectIndex = draftProjects.length - 1;
      showInlineStatus("status-projects", "", "info");
      renderProjectsTable();
    });

    document.getElementById("projects-cancel-btn").addEventListener("click", function () {
      projectsEditMode = false;
      editingProjectIndex = -1;
      showInlineStatus("status-projects", "", "info");
      renderProjectsTable();
    });

    document.getElementById("projects-save-btn").addEventListener("click", async function () {
      var active = document.querySelector("[data-inline-project-name]");
      if (active) syncProjectsFromInputs(active.closest("tr"), editingProjectIndex);

      var cleaned = draftProjects.filter(function (p) {
        return p.name || p.url || p.repo_url || p.description;
      });
      var res = await window.sclApi.community.saveProfile(buildSavePayload({ projects: cleaned }));
      if (res.error) {
        showInlineStatus("status-projects", res.error.message, "danger");
        return;
      }
      currentProfile = res.data.profile;
      projectsEditMode = false;
      editingProjectIndex = -1;
      showInlineStatus("status-projects", "", "info");
      renderProjectsTable();
    });

    // Education in-place table editing
    document.getElementById("education-edit-btn").addEventListener("click", function () {
      if (educationEditMode) {
        educationEditMode = false;
        editingEducationIndex = -1;
        showInlineStatus("status-education", "", "info");
        renderEducationTable();
        return;
      }
      draftEducation = (currentProfile.education_rows || []).map(function (r) {
        return { institution: r.institution || "", country: r.country || "", year_started: r.year_started || "", year_ended: r.year_ended || "" };
      });
      educationEditMode = true;
      editingEducationIndex = draftEducation.length ? 0 : -1;
      showInlineStatus("status-education", "", "info");
      renderEducationTable();
    });

    document.getElementById("education-add-btn").addEventListener("click", function () {
      if (!educationEditMode) {
        draftEducation = (currentProfile.education_rows || []).map(function (r) {
          return { institution: r.institution || "", country: r.country || "", year_started: r.year_started || "", year_ended: r.year_ended || "" };
        });
        educationEditMode = true;
      } else {
        var active = document.querySelector("[data-inline-edu-inst]");
        if (active) syncEducationFromInputs(active.closest("tr"), editingEducationIndex);
      }
      if (draftEducation.length >= MAX_EDUCATION) {
        showInlineStatus("status-education", "You can list up to " + MAX_EDUCATION + " education entries.", "warning");
        return;
      }
      draftEducation.push({ institution: "", country: "", year_started: "", year_ended: "" });
      editingEducationIndex = draftEducation.length - 1;
      showInlineStatus("status-education", "", "info");
      renderEducationTable();
    });

    document.getElementById("education-cancel-btn").addEventListener("click", function () {
      educationEditMode = false;
      editingEducationIndex = -1;
      showInlineStatus("status-education", "", "info");
      renderEducationTable();
    });

    document.getElementById("education-save-btn").addEventListener("click", async function () {
      var active = document.querySelector("[data-inline-edu-inst]");
      if (active) syncEducationFromInputs(active.closest("tr"), editingEducationIndex);

      var cleaned = draftEducation.filter(function (r) {
        return r.institution || r.country || r.year_started || r.year_ended;
      });
      var res = await window.sclApi.community.saveProfile(buildSavePayload({ education_rows: cleaned }));
      if (res.error) {
        showInlineStatus("status-education", res.error.message, "danger");
        return;
      }
      currentProfile = res.data.profile;
      educationEditMode = false;
      editingEducationIndex = -1;
      showInlineStatus("status-education", "", "info");
      renderEducationTable();
    });

    // Contacts modal
    var dialogContacts = document.getElementById("dialog-contacts");
    document.getElementById("edit-contacts-btn").addEventListener("click", function () {
      var c = currentProfile.contact || {};
      document.getElementById("input-contact-website").value = c.website || "";
      document.getElementById("input-contact-github").value = c.github || "";
      document.getElementById("input-contact-linkedin").value = c.linkedin || "";
      document.getElementById("input-contact-x").value = c.x || "";
      document.getElementById("input-contact-bluesky").value = c.bluesky || "";
      document.getElementById("input-contact-discord").value = c.discord || "";
      document.getElementById("input-contact-email").value = c.email || "";
      showInlineStatus("status-contacts", "", "info");
      dialogContacts.showModal();
    });
    document.getElementById("form-contacts").addEventListener("submit", async function (e) {
      e.preventDefault();
      var contact = {
        website: document.getElementById("input-contact-website").value.trim(),
        github: document.getElementById("input-contact-github").value.trim(),
        linkedin: document.getElementById("input-contact-linkedin").value.trim(),
        x: document.getElementById("input-contact-x").value.trim(),
        bluesky: document.getElementById("input-contact-bluesky").value.trim(),
        discord: document.getElementById("input-contact-discord").value.trim(),
        email: document.getElementById("input-contact-email").value.trim()
      };
      var res = await window.sclApi.community.saveProfile(buildSavePayload({ contact: contact }));
      if (res.error) {
        showInlineStatus("status-contacts", res.error.message, "danger");
        return;
      }
      currentProfile = res.data.profile;
      renderContact(currentProfile.contact, currentProfile.display_name);
      dialogContacts.close("save");
    });
  }

  function wireMentorTestimonialControls() {
    var dialogTestimonial = document.getElementById("dialog-testimonial");
    document.getElementById("testimonial-add-btn").addEventListener("click", function () {
      document.getElementById("input-testimonial-content").value = "";
      showInlineStatus("status-testimonial", "", "info");
      dialogTestimonial.showModal();
    });
    document.getElementById("form-testimonial").addEventListener("submit", async function (e) {
      e.preventDefault();
      var content = document.getElementById("input-testimonial-content").value.trim();
      var res = await window.sclApi.community.addTestimonial(currentProfile.public_id, content);
      if (res.error) {
        showInlineStatus("status-testimonial", res.error.message, "danger");
        return;
      }
      dialogTestimonial.close("save");
      currentProfile.testimonials = [res.data.testimonial].concat(currentProfile.testimonials || []);
      renderTestimonials(currentProfile);
    });
  }

  async function loadProfile() {
    wireDialogCloseButtons();
    var publicId = resolveProfileId();
    if (!publicId) {
      showStatus("Community profile not found.", "warning");
      return;
    }
    var result = await window.sclApi.community.member(publicId);
    if (result.error) {
      showStatus(result.error.status === 404
        ? "This profile is not available or is no longer listed."
        : result.error.message, result.error.status === 404 ? "warning" : "danger");
      return;
    }
    isOwner = Boolean(result.data && result.data.is_owner === true);
    canEdit = Boolean(result.data && (result.data.can_edit === true || isOwner));
    allowedRoles = Array.isArray(result.data && result.data.allowed_roles) ? result.data.allowed_roles : [];
    canAddTestimonial = Boolean(result.data && result.data.can_add_testimonial === true);
    canApproveProjects = Boolean(result.data && result.data.can_approve_projects === true);
    renderProfile(result.data.profile);
    if (canEdit) {
      wireOwnerControls();
    }
    if (canAddTestimonial) {
      wireMentorTestimonialControls();
    }
  }

  loadProfile().catch(function (error) {
    showStatus(error.message || "Community profile could not be loaded.", "danger");
  });
})();
