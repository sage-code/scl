(function () {
  var MAX_PROJECTS = 5;
  var MAX_PARAGRAPHS = 5;
  var AVATAR_PLACEHOLDER = "/assets/images/avatar-placeholder.svg";

  var status = document.getElementById("profile-status");
  var details = document.getElementById("profile-details");
  var title = document.getElementById("profile-title");
  var ownerBar = document.getElementById("profile-owner-bar");
  var editorSection = document.getElementById("profile-editor");

  var currentProfile = null;
  var isOwner = false;

  function showStatus(message, kind) {
    status.hidden = !message;
    status.className = "alert alert-" + kind + " mt-3";
    status.textContent = message;
  }

  function showSaveStatus(message, kind) {
    var box = document.getElementById("profile-save-status");
    if (!box) return;
    box.hidden = !message;
    box.className = "alert alert-" + kind;
    box.textContent = message;
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

  function renderHighlights(profile) {
    var qualText = profile.certification_label
      ? profile.certification_label
      : trackName(profile.qualified_track) + " roadmap qualification";
    document.getElementById("profile-qualification").textContent = qualText;

    var bio = document.getElementById("profile-bio");
    var bioEmpty = document.getElementById("profile-bio-empty");
    bio.textContent = profile.bio || "";
    bio.hidden = !profile.bio;
    bioEmpty.hidden = Boolean(profile.bio);
  }

  function renderEducation(educationText, paragraphs) {
    var eduEl = document.getElementById("profile-education");
    var eduEmpty = document.getElementById("profile-education-empty");
    var container = document.getElementById("profile-paragraphs");

    eduEl.textContent = educationText || "";
    eduEl.hidden = !educationText;

    container.replaceChildren();
    var list = Array.isArray(paragraphs) ? paragraphs : [];
    list.forEach(function (item) {
      if (!item || !item.body || item.heading === "Education") return;
      var block = document.createElement("div");
      block.className = "mb-3";
      if (item.heading) {
        var h3 = document.createElement("h3");
        h3.className = "h5 mb-1";
        h3.textContent = item.heading;
        block.append(h3);
      }
      var p = document.createElement("p");
      p.className = "mb-0";
      p.textContent = item.body;
      block.append(p);
      container.append(block);
    });
    container.hidden = container.childElementCount === 0;
    eduEmpty.hidden = Boolean(educationText) || container.childElementCount > 0;
  }

  function renderContact(contact) {
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

  function renderProjects(projects) {
    var section = document.getElementById("profile-projects-section");
    var tbody = document.getElementById("profile-projects-body");
    tbody.replaceChildren();

    var index = 0;
    (projects || []).forEach(function (project) {
      var href = safeHttpsUrl(project && project.url);
      if (!href || !project.name) {
        return;
      }
      index += 1;
      var tr = document.createElement("tr");

      var tdNum = document.createElement("td");
      tdNum.textContent = String(index);

      var tdName = document.createElement("td");
      var link = document.createElement("a");
      link.href = href;
      link.textContent = project.name;
      link.target = "_blank";
      link.rel = "noopener noreferrer nofollow";
      tdName.append(link);

      var tdDesc = document.createElement("td");
      tdDesc.className = project.description ? "" : "text-secondary";
      tdDesc.textContent = project.description || "—";

      tr.append(tdNum, tdName, tdDesc);
      tbody.append(tr);
    });

    section.hidden = tbody.childElementCount === 0;
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
      li.append(link);
      list.append(li);
    });

    var hasCerts = list.childElementCount > 0;
    list.hidden = !hasCerts;
    empty.hidden = hasCerts;
  }

  function renderVcpStatus(profile) {
    var badge = document.getElementById("profile-vcp-status");
    var certs = Array.isArray(profile.certificates) ? profile.certificates : [];
    var verified = Boolean(profile.vcp_verified || profile.is_legacy_verified || certs.length > 0 || profile.certificate_url);
    badge.replaceChildren();
    if (verified) {
      badge.className = "badge bg-success-subtle text-success-emphasis border border-success-subtle";
      var icon = document.createElement("i");
      icon.className = "bi bi-patch-check-fill me-1";
      icon.setAttribute("aria-hidden", "true");
      badge.append(icon, document.createTextNode("VCP Verified"));
    } else {
      badge.className = "badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle";
      badge.textContent = "VCP Unverified";
    }
  }

  function renderProfile(profile) {
    currentProfile = profile;
    title.textContent = profile.display_name;
    document.title = profile.display_name + " | Sage-Code Community";

    document.getElementById("profile-position").textContent = profile.role || "VCP Graduate";
    renderVcpStatus(profile);

    var metaParts = [];
    if (profile.country_code) {
      metaParts.push(countryFlag(profile.country_code) + " " + profile.country_code);
    }
    var claimed = profile.claimed_at ? new Date(profile.claimed_at) : null;
    if (profile.member_since) {
      metaParts.push("Member since " + profile.member_since);
    } else if (claimed && !Number.isNaN(claimed.getTime())) {
      metaParts.push("Member since " + claimed.toLocaleDateString(undefined, { year: "numeric", month: "long" }));
    }
    var metaEl = document.getElementById("profile-meta");
    metaEl.textContent = metaParts.join(" · ");
    metaEl.hidden = metaParts.length === 0;

    var avatar = document.getElementById("profile-avatar");
    var safeAvatar = safeHttpsUrl(profile.avatar_url);
    avatar.src = safeAvatar || AVATAR_PLACEHOLDER;
    avatar.alt = "Avatar of " + profile.display_name;

    renderHighlights(profile);
    renderEducation(profile.education, profile.paragraphs);
    renderContact(profile.contact);
    renderProjects(profile.projects);
    renderCertificates(profile);

    ownerBar.hidden = !isOwner;
    if (!isOwner) {
      editorSection.hidden = true;
    }

    details.hidden = false;
    showStatus("", "info");
  }

  function addParagraphRow(item) {
    var list = document.getElementById("edit-paragraphs-list");
    if (list.childElementCount >= MAX_PARAGRAPHS) return;

    var row = document.createElement("div");
    row.className = "border border-secondary-subtle rounded p-3";
    row.setAttribute("data-edit-paragraph", "");

    var headerRow = document.createElement("div");
    headerRow.className = "d-flex gap-2 mb-2 align-items-center";

    var headingInput = document.createElement("input");
    headingInput.type = "text";
    headingInput.className = "form-control form-control-sm";
    headingInput.maxLength = 80;
    headingInput.placeholder = "Section heading (optional)";
    headingInput.value = item && item.heading ? item.heading : "";
    headingInput.setAttribute("data-paragraph-heading", "");

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-outline-danger btn-sm flex-shrink-0";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", function () {
      row.remove();
    });

    headerRow.append(headingInput, removeBtn);

    var bodyInput = document.createElement("textarea");
    bodyInput.className = "form-control form-control-sm";
    bodyInput.rows = 3;
    bodyInput.maxLength = 1000;
    bodyInput.placeholder = "Write a paragraph…";
    bodyInput.value = item && item.body ? item.body : "";
    bodyInput.setAttribute("data-paragraph-body", "");

    row.append(headerRow, bodyInput);
    list.append(row);
  }

  function addProjectRow(project) {
    var list = document.getElementById("edit-projects-list");
    if (list.childElementCount >= MAX_PROJECTS) return null;

    var row = document.createElement("div");
    row.className = "border border-secondary-subtle rounded p-3";
    row.setAttribute("data-edit-project", "");

    var topRow = document.createElement("div");
    topRow.className = "row g-2 mb-2";

    var nameCol = document.createElement("div");
    nameCol.className = "col-md-5";
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "form-control form-control-sm";
    nameInput.maxLength = 80;
    nameInput.placeholder = "Project name";
    nameInput.value = project && project.name ? project.name : "";
    nameInput.setAttribute("data-project-name", "");
    nameCol.append(nameInput);

    var urlCol = document.createElement("div");
    urlCol.className = "col-md-5";
    var urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.className = "form-control form-control-sm";
    urlInput.maxLength = 500;
    urlInput.placeholder = "https://example.com";
    urlInput.value = project && project.url ? project.url : "";
    urlInput.setAttribute("data-project-url", "");
    urlCol.append(urlInput);

    var btnCol = document.createElement("div");
    btnCol.className = "col-md-2 d-grid";
    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-outline-danger btn-sm";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", function () {
      row.remove();
    });
    btnCol.append(removeBtn);

    topRow.append(nameCol, urlCol, btnCol);

    var descInput = document.createElement("input");
    descInput.type = "text";
    descInput.className = "form-control form-control-sm";
    descInput.maxLength = 200;
    descInput.placeholder = "Project description";
    descInput.value = project && project.description ? project.description : "";
    descInput.setAttribute("data-project-desc", "");

    row.append(topRow, descInput);
    list.append(row);
    return nameInput;
  }

  function populateEditor(profile) {
    if (!isOwner || !profile) return;
    document.getElementById("edit-display-name").value = profile.display_name || "";
    document.getElementById("edit-role").value = profile.role || "";
    document.getElementById("edit-country-code").value = profile.country_code || "";
    document.getElementById("edit-bio").value = profile.bio || "";
    document.getElementById("edit-education").value = profile.education || "";
    document.getElementById("edit-publish").checked = true;

    var contact = profile.contact && typeof profile.contact === "object" ? profile.contact : {};
    document.getElementById("edit-contact-website").value = contact.website || "";
    document.getElementById("edit-contact-github").value = contact.github || "";
    document.getElementById("edit-contact-linkedin").value = contact.linkedin || "";
    document.getElementById("edit-contact-x").value = contact.x || "";
    document.getElementById("edit-contact-bluesky").value = contact.bluesky || "";
    document.getElementById("edit-contact-discord").value = contact.discord || "";
    document.getElementById("edit-contact-email").value = contact.email || "";

    var paragraphsList = document.getElementById("edit-paragraphs-list");
    paragraphsList.replaceChildren();
    (profile.paragraphs || []).forEach(addParagraphRow);

    var projectsList = document.getElementById("edit-projects-list");
    projectsList.replaceChildren();
    (profile.projects || []).forEach(addProjectRow);
    showSaveStatus("", "info");
  }

  function openEditor(focusNewProject) {
    if (!isOwner || !currentProfile) return;
    populateEditor(currentProfile);
    editorSection.hidden = false;
    if (focusNewProject) {
      var newInput = addProjectRow({});
      if (newInput) {
        newInput.focus();
        return;
      }
    }
    editorSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function wireOwnerControls() {
    document.getElementById("profile-edit-toggle").addEventListener("click", function () {
      if (!isOwner) return;
      if (editorSection.hidden) {
        openEditor(false);
      } else {
        editorSection.hidden = true;
      }
    });

    document.getElementById("profile-add-project-btn").addEventListener("click", function () {
      if (!isOwner) return;
      openEditor(true);
    });

    document.getElementById("profile-cancel-btn").addEventListener("click", function () {
      editorSection.hidden = true;
      showSaveStatus("", "info");
    });

    document.getElementById("edit-add-paragraph").addEventListener("click", function () {
      if (!isOwner) return;
      addParagraphRow({});
    });

    document.getElementById("edit-add-project").addEventListener("click", function () {
      if (!isOwner) return;
      var input = addProjectRow({});
      if (input) input.focus();
    });

    document.getElementById("profile-edit-form").addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!isOwner || !currentProfile) return;

      var saveBtn = document.getElementById("profile-save-btn");
      saveBtn.disabled = true;
      showSaveStatus("", "info");

      var projects = Array.from(document.querySelectorAll("[data-edit-project]")).map(function (row) {
        return {
          name: row.querySelector("[data-project-name]").value.trim(),
          url: row.querySelector("[data-project-url]").value.trim(),
          description: row.querySelector("[data-project-desc]").value.trim()
        };
      }).filter(function (project) {
        return project.name || project.url || project.description;
      });

      var paragraphs = Array.from(document.querySelectorAll("[data-edit-paragraph]")).map(function (row) {
        return {
          heading: row.querySelector("[data-paragraph-heading]").value.trim(),
          body: row.querySelector("[data-paragraph-body]").value.trim()
        };
      }).filter(function (item) {
        return item.heading || item.body;
      });

      var contact = {
        website: document.getElementById("edit-contact-website").value.trim(),
        github: document.getElementById("edit-contact-github").value.trim(),
        linkedin: document.getElementById("edit-contact-linkedin").value.trim(),
        x: document.getElementById("edit-contact-x").value.trim(),
        bluesky: document.getElementById("edit-contact-bluesky").value.trim(),
        discord: document.getElementById("edit-contact-discord").value.trim(),
        email: document.getElementById("edit-contact-email").value.trim()
      };

      var result = await window.sclApi.community.saveProfile({
        qualified_track: currentProfile.qualified_track,
        display_name: document.getElementById("edit-display-name").value,
        role: document.getElementById("edit-role").value,
        country_code: document.getElementById("edit-country-code").value,
        bio: document.getElementById("edit-bio").value,
        education: document.getElementById("edit-education").value,
        projects: projects,
        paragraphs: paragraphs,
        contact: contact,
        publish: document.getElementById("edit-publish").checked
      });

      saveBtn.disabled = false;
      if (result.error) {
        showSaveStatus(result.error.message, "danger");
        return;
      }

      if (result.data && result.data.profile) {
        if (!result.data.profile.published) {
          showSaveStatus("Your profile is now private and unlisted from the community directory.", "info");
          return;
        }
        renderProfile(result.data.profile);
        editorSection.hidden = true;
      }
    });
  }

  async function loadProfile() {
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
    renderProfile(result.data.profile);
    if (isOwner) {
      wireOwnerControls();
    }
  }

  loadProfile().catch(function (error) {
    showStatus(error.message || "Community profile could not be loaded.", "danger");
  });
})();
