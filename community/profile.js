(function () {
  var status = document.getElementById("profile-status");
  var details = document.getElementById("profile-details");
  var title = document.getElementById("profile-title");

  function showStatus(message, kind) {
    status.hidden = !message;
    status.className = "alert alert-" + kind + " mt-4";
    status.textContent = message;
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

  function renderProjects(projects) {
    var list = document.getElementById("profile-projects");
    var empty = document.getElementById("profile-projects-empty");
    list.replaceChildren();
    (projects || []).forEach(function (project) {
      var url;
      try {
        url = new URL(project.url);
      } catch (_error) {
        return;
      }
      if (url.protocol !== "https:" || !project.name) {
        return;
      }

      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = url.href;
      link.textContent = project.name;
      link.target = "_blank";
      link.rel = "noopener noreferrer nofollow";
      item.append(link);
      list.append(item);
    });
    empty.hidden = list.childElementCount > 0;
    list.hidden = list.childElementCount === 0;
  }

  function renderProfile(profile) {
    title.textContent = profile.display_name;
    document.title = profile.display_name + " | Sage-Code Community";
    var qualText = profile.certification_label
      ? (profile.role ? profile.role + " — " : "") + profile.certification_label
      : trackName(profile.qualified_track) + " roadmap qualification";
    document.getElementById("profile-qualification").textContent = qualText;

    var country = document.getElementById("profile-country");
    country.textContent = profile.country_code
      ? countryFlag(profile.country_code) + " " + profile.country_code
      : "";
    country.hidden = !profile.country_code;

    var claimed = profile.claimed_at ? new Date(profile.claimed_at) : null;
    document.getElementById("profile-claimed").textContent = profile.member_since
      ? "Member since " + profile.member_since
      : (claimed && !Number.isNaN(claimed.getTime())
        ? "Claimed " + claimed.toLocaleDateString(undefined, { year: "numeric", month: "long" })
        : "");

    var bio = document.getElementById("profile-bio");
    bio.textContent = profile.bio || "";
    bio.hidden = !profile.bio;

    var avatar = document.getElementById("profile-avatar");
    if (profile.avatar_url) {
      try {
        var avatarUrl = new URL(profile.avatar_url);
        if (avatarUrl.protocol === "https:") {
          avatar.src = avatarUrl.href;
          avatar.alt = "Avatar of " + profile.display_name;
          avatar.hidden = false;
        }
      } catch (_error) {
        avatar.hidden = true;
      }
    }

    var certEmpty = document.getElementById("profile-certificate-empty");
    var certBox = document.getElementById("profile-certificate-box");
    var certLink = document.getElementById("profile-certificate-link");
    if (certBox && certLink && profile.certificate_url) {
      try {
        var certUrl = new URL(profile.certificate_url, window.location.origin);
        if (certUrl.protocol === "https:" || certUrl.protocol === "http:") {
          certLink.href = certUrl.href;
          certBox.hidden = false;
          if (certEmpty) certEmpty.hidden = true;
        }
      } catch (_error) {
        certBox.hidden = true;
      }
    }

    renderProjects(profile.projects);
    details.hidden = false;
    showStatus("", "info");
  }

  async function loadProfile() {
    var publicId = new URLSearchParams(window.location.search).get("public_id");
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
    renderProfile(result.data.profile);
  }

  loadProfile().catch(function (error) {
    showStatus(error.message || "Community profile could not be loaded.", "danger");
  });
})();
