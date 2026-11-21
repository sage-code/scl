(function () {
  var status = document.getElementById("vcp-claim-status");
  var signIn = document.getElementById("vcp-claim-sign-in");
  var verifyEmail = document.getElementById("vcp-claim-verify-email");
  var form = document.getElementById("vcp-claim-form");
  var formStatus = document.getElementById("vcp-claim-form-status");
  var submitButton = document.getElementById("vcp-claim-submit");
  var trackSelect = document.getElementById("vcp-qualified-track");
  var avatarInput = document.getElementById("vcp-avatar");
  var avatarPreview = document.getElementById("vcp-avatar-preview");
  var avatarRemoveButton = document.getElementById("vcp-avatar-remove");
  var publicProfileLink = document.getElementById("vcp-public-profile-link");
  var consent = document.getElementById("vcp-public-consent");
  var previewUrl = null;
  var hasSavedAvatar = false;
  var maxAvatarBytes = 2 * 1024 * 1024;
  var allowedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];

  function showMessage(target, message, kind) {
    target.hidden = false;
    target.className = "alert alert-" + kind;
    target.textContent = message;
  }

  function trackName(track) {
    return window.sclApi && window.sclApi.community && window.sclApi.community.trackLabel
      ? window.sclApi.community.trackLabel(track)
      : track;
  }

  function updatePublicProfileLink(profile) {
    if (profile && profile.published && profile.public_id) {
      publicProfileLink.href = "/community/profile.html?user_id=" + encodeURIComponent(profile.public_id);
      publicProfileLink.hidden = false;
    } else {
      publicProfileLink.removeAttribute("href");
      publicProfileLink.hidden = true;
    }
  }

  function setPreview(url, saved) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    if (typeof saved === "boolean") {
      hasSavedAvatar = saved;
    }
    if (url) {
      if (url.indexOf("blob:") === 0) {
        previewUrl = url;
      }
      avatarPreview.src = url;
      avatarPreview.hidden = false;
    } else {
      avatarPreview.removeAttribute("src");
      avatarPreview.hidden = true;
    }
    avatarRemoveButton.hidden = !hasSavedAvatar;
  }

  function showSignIn() {
    status.hidden = true;
    signIn.hidden = false;
    verifyEmail.hidden = true;
    form.hidden = true;
  }

  function fillProfile(profile, tracks) {
    trackSelect.replaceChildren();
    tracks.forEach(function (track) {
      var option = document.createElement("option");
      option.value = track.track;
      option.textContent = trackName(track.track);
      trackSelect.append(option);
    });

    if (profile) {
      document.getElementById("vcp-display-name").value = profile.display_name || "";
      document.getElementById("vcp-country-code").value = profile.country_code || "";
      document.getElementById("vcp-bio").value = profile.bio || "";
      consent.checked = !!profile.published;
      if (profile.qualified_track && tracks.some(function (track) { return track.track === profile.qualified_track; })) {
        trackSelect.value = profile.qualified_track;
      }
      (profile.projects || []).slice(0, 5).forEach(function (project, index) {
        var row = form.querySelectorAll("[data-project]")[index];
        row.querySelector("[data-project-name]").value = project.name || "";
        row.querySelector("[data-project-url]").value = project.url || "";
      });
      setPreview(profile.avatar_url || "", !!profile.avatar_url);
      updatePublicProfileLink(profile);
    } else {
      setPreview("", false);
      updatePublicProfileLink(null);
    }
    updateSubmitLabel();
  }

  function updateSubmitLabel() {
    submitButton.textContent = consent.checked ? "Claim VCP authentication" : "Save private profile";
  }

  async function loadProfile() {
    var result = await window.sclApi.community.profile();
    if (result.error) {
      if (result.error.status === 401) {
        showSignIn();
        return;
      }
      throw new Error(result.error.message);
    }

    signIn.hidden = true;
    if (!result.data.email_verified) {
      status.hidden = true;
      verifyEmail.hidden = false;
      form.hidden = true;
      return;
    }
    verifyEmail.hidden = true;

    if (!result.data.eligible) {
      form.hidden = true;
      showMessage(status, "You are not qualified yet. Pass sets A, B, and C for at least one roadmap, then return to claim your profile.", "info");
      return;
    }

    status.hidden = true;
    fillProfile(result.data.profile, result.data.qualified_tracks);
    form.hidden = false;
  }

  async function uploadAvatar(file) {
    var response;
    try {
      response = await fetch("/api/community/avatar/", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": file.type },
        body: file
      });
    } catch (_error) {
      throw new Error("Avatar upload failed because the network could not be reached.");
    }

    var result;
    try {
      result = await response.json();
    } catch (_error) {
      throw new Error("Avatar upload returned an invalid response.");
    }
    if (!response.ok) {
      var errMsg = (result && typeof result.error === "string" && result.error)
        || (result && result.error && typeof result.error.message === "string" && result.error.message)
        || "Avatar upload failed.";
      throw new Error(errMsg);
    }
    return result;
  }

  document.getElementById("vcp-resend-verification").addEventListener("click", async function (event) {
    var button = event.currentTarget;
    button.disabled = true;
    var result = await window.sclApi.auth.resendConfirmation();
    button.disabled = false;
    if (result.error) {
      showMessage(verifyEmail, result.error.message, "danger");
      return;
    }
    if (result.data.already_verified) {
      showMessage(verifyEmail, "Your email is confirmed. Reload this page to check quiz qualification.", "success");
    } else if (result.data.email_sent) {
      showMessage(verifyEmail, "A new confirmation link has been sent to your account email.", "success");
    } else {
      showMessage(verifyEmail, "A confirmation link could not be sent right now. Try again later.", "warning");
    }
  });

  avatarInput.addEventListener("change", function () {
    var file = avatarInput.files && avatarInput.files[0];
    if (!file) {
      return;
    }
    if (allowedAvatarTypes.indexOf(file.type) === -1 || file.size > maxAvatarBytes) {
      avatarInput.value = "";
      setPreview("");
      showMessage(formStatus, "Choose a JPEG, PNG, or WebP image up to 2 MB.", "danger");
      return;
    }
    formStatus.hidden = true;
    setPreview(URL.createObjectURL(file));
  });

  avatarRemoveButton.addEventListener("click", async function () {
    avatarRemoveButton.disabled = true;
    formStatus.hidden = true;
    var result = await window.sclApi.community.removeAvatar();
    avatarRemoveButton.disabled = false;
    if (result.error) {
      showMessage(formStatus, result.error.message, "danger");
      return;
    }
    avatarInput.value = "";
    setPreview("", false);
    showMessage(
      formStatus,
      (result.data && result.data.warning) || "Your avatar has been removed.",
      result.data && result.data.warning ? "warning" : "success"
    );
  });

  consent.addEventListener("change", updateSubmitLabel);

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    submitButton.disabled = true;
    formStatus.hidden = true;
    var projects = Array.from(form.querySelectorAll("[data-project]")).map(function (row) {
      return {
        name: row.querySelector("[data-project-name]").value.trim(),
        url: row.querySelector("[data-project-url]").value.trim()
      };
    }).filter(function (project) {
      return project.name || project.url;
    });

    var result = await window.sclApi.community.saveProfile({
      qualified_track: trackSelect.value,
      display_name: document.getElementById("vcp-display-name").value,
      country_code: document.getElementById("vcp-country-code").value,
      bio: document.getElementById("vcp-bio").value,
      projects: projects,
      publish: consent.checked
    });
    if (result.error) {
      showMessage(formStatus, result.error.message, "danger");
      submitButton.disabled = false;
      return;
    }

    updatePublicProfileLink(result.data && result.data.profile);

    var file = avatarInput.files && avatarInput.files[0];
    if (file) {
      try {
        var upload = await uploadAvatar(file);
        setPreview(upload.avatar_url, true);
        avatarInput.value = "";
        if (upload.warning) {
          showMessage(formStatus, upload.warning, "warning");
          submitButton.disabled = false;
          return;
        }
      } catch (error) {
        showMessage(formStatus, "Profile fields were saved, but " + error.message, "danger");
        submitButton.disabled = false;
        return;
      }
    }

    showMessage(
      formStatus,
      consent.checked
        ? "Your qualified VCP profile is published in the community directory."
        : "Your profile is saved privately. Select the public listing option when you are ready to claim.",
      "success"
    );
    submitButton.disabled = false;
  });

  loadProfile().catch(function (error) {
    showMessage(status, error.message || String(error), "danger");
  });
})();
