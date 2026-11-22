(function () {
  // Roadmap identity state. Every visitor has a user: when there is no session
  // the page asks the API to create an anonymous one, so progress always syncs.
  // getUser() returns that user (anonymous or registered); use isRegistered()
  // for anything that depends on having an account (login/logout, profile).
  var state = {
    api: null,
    user: null,
    initialized: false,
    pending: null
  };

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function setButtonLabel(anchor, value) {
    if (!anchor) {
      return;
    }

    var label = anchor.querySelector("span");
    if (label) {
      label.textContent = value;
      return;
    }

    anchor.textContent = value;
  }

  function setButtonIcon(anchor, iconClass) {
    if (!anchor) {
      return;
    }

    var icon = anchor.querySelector("i");
    if (icon) {
      icon.className = iconClass;
    }
  }

  function setHref(element, value) {
    if (element) {
      element.setAttribute("href", value);
    }
  }

  function setDisabledLink(element, disabled) {
    if (!element) {
      return;
    }

    if (disabled) {
      element.classList.add("disabled");
      element.setAttribute("aria-disabled", "true");
      element.setAttribute("tabindex", "-1");
    } else {
      element.classList.remove("disabled");
      element.removeAttribute("aria-disabled");
      element.removeAttribute("tabindex");
    }
  }

  function isRegistered() {
    return !!(state.user && !state.user.is_anonymous);
  }

  function getProfileRedirectUrl() {
    var inPublicPreview = (window.location.pathname || "").indexOf("/public/") === 0;
    var loginPath = inPublicPreview ? "/public/roadmaps/login.html" : "/roadmaps/login.html";
    var profilePath = inPublicPreview ? "/public/roadmaps/profile.html" : "/roadmaps/profile.html";
    return loginPath + "?next=" + encodeURIComponent(profilePath);
  }

  function formatIdentity() {
    if (!state.user) {
      return "Anonymous";
    }

    var handle = state.user.handle || state.user.display_name;
    if (!handle && state.user.email) {
      handle = state.user.email.split("@")[0];
    }

    return handle || "Anonymous";
  }

  function currentReturnParam() {
    var path = window.location.pathname || "/roadmaps/";
    if (path.indexOf("/community/") === 0 || path.indexOf("/roadmaps/") === 0) {
      return "?return=" + encodeURIComponent(path);
    }
    return "";
  }

  function renderRoadmapTitle() {
    var role = (state.user && state.user.role) ? state.user.role : "Student";
    var idText = formatIdentity().replace(/^Learner-/i, "");
    setText(document.getElementById("roadmap-user-title"), role + ":" + idText);

    var userAvatar = document.getElementById("roadmap-user-avatar");
    if (userAvatar) {
      var placeholder = "/assets/images/avatar-placeholder.svg";
      var avatarUrl = (state.user && typeof state.user.avatar_url === "string" && state.user.avatar_url.trim())
        ? state.user.avatar_url.trim()
        : placeholder;
      userAvatar.src = avatarUrl;
      userAvatar.alt = idText + " avatar";
      if (userAvatar.dataset.fallbackWired !== "true") {
        userAvatar.dataset.fallbackWired = "true";
        userAvatar.addEventListener("error", function () {
          if (userAvatar.getAttribute("src") !== placeholder) {
            userAvatar.src = placeholder;
          }
        });
      }
    }

    var userLink = document.getElementById("roadmap-user-link");
    if (userLink) {
      var confirmedMember = isRegistered() && !!(state.user && state.user.email_verified);
      var publicId = state.user && (state.user.community_public_id || state.user.handle);
      if (confirmedMember && publicId) {
        setHref(userLink, "/community/profile.html?user_id=" + encodeURIComponent(publicId));
        userLink.setAttribute("aria-label", "Open community profile for " + idText);
        userLink.setAttribute("title", "View your community profile");
      } else {
        setHref(userLink, "/roadmaps/profile.html" + currentReturnParam());
        userLink.setAttribute("aria-label", "Open your profile");
        userLink.setAttribute("title", "Open your learner profile");
      }
    }
  }

  function renderRoadmapActions() {
    var registered = isRegistered();
    var returnSuffix = currentReturnParam();
    var loginAction = document.getElementById("roadmap-login-action");
    var profileAction = document.getElementById("roadmap-profile-action");
    var registerAction = document.getElementById("roadmap-register-action");
    var primaryAction = document.getElementById("roadmap-primary-action");
    var learnersAction = document.getElementById("roadmap-learners-action");
    var topScoreAction = document.getElementById("roadmap-top-score-action");

    if (primaryAction) {
      if (registered) {
        setButtonLabel(primaryAction, "Your Profile");
        setButtonIcon(primaryAction, "bi bi-person-circle");
        setHref(primaryAction, "/roadmaps/profile.html" + returnSuffix);
        primaryAction.setAttribute("aria-label", "Open your profile");
      } else {
        setButtonLabel(primaryAction, "Sign In");
        setButtonIcon(primaryAction, "bi bi-box-arrow-in-right");
        setHref(primaryAction, "/roadmaps/login.html" + returnSuffix);
        primaryAction.setAttribute("aria-label", "Sign in to roadmap account");
      }
    }

    if (learnersAction) {
      setDisabledLink(learnersAction, !registered);
      learnersAction.setAttribute("title", registered ? "See who is actively learning" : "Sign in to see who is learning");
    }

    if (topScoreAction) {
      setDisabledLink(topScoreAction, !registered);
      topScoreAction.setAttribute("title", registered ? "View quiz leaderboard" : "Sign in to view top scores");
    }

    if (loginAction) {
      setButtonLabel(loginAction, registered ? "SIGN OUT" : "SIGN IN");
      setButtonIcon(loginAction, registered ? "bi bi-box-arrow-right" : "bi bi-box-arrow-in-right");
      setHref(loginAction, registered ? "#roadmap-logout" : ("/roadmaps/login.html" + returnSuffix));
      loginAction.setAttribute("aria-label", registered ? "Sign out of roadmap account" : "Sign in to roadmap account");
    }

    if (profileAction) {
      setDisabledLink(profileAction, false);
      setHref(profileAction, "/roadmaps/profile.html" + returnSuffix);
      profileAction.setAttribute("aria-label", "Open your learner profile");
      profileAction.setAttribute("title", "Update your username or profile picture (" + formatIdentity() + ")");
    }

    if (registerAction) {
      if (registered) {
        setButtonLabel(registerAction, "FORGET");
        setButtonIcon(registerAction, "bi bi-person-dash");
        setHref(registerAction, "/roadmaps/unregister.html" + returnSuffix);
        registerAction.setAttribute("aria-label", "Forget and remove the current roadmap account");
        registerAction.setAttribute("title", "Open the unregister form to delete this account");
      } else {
        setButtonLabel(registerAction, "REGISTER");
        setButtonIcon(registerAction, "bi bi-person-plus");
        setHref(registerAction, "/roadmaps/register.html" + returnSuffix);
        registerAction.setAttribute("aria-label", "Register a roadmap account");
        registerAction.setAttribute("title", "Create a new roadmap account");
      }
    }
  }

  function resolveCountryName(code) {
    var normalized = String(code || "").trim().toUpperCase();
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

  function resolveCountryDisplay(code) {
    var normalized = String(code || "").trim().toUpperCase();
    var name = resolveCountryName(normalized);
    return name ? (name + " (" + normalized + ")") : "";
  }

  function renderCountryPreview(el, code) {
    if (!el) return;
    el.textContent = "";
    var normalized = String(code || "").trim().toUpperCase();
    var name = resolveCountryName(normalized);
    if (!name) return;
    var flag = document.createElement("span");
    flag.className = "fi fi-" + normalized.toLowerCase() + " me-1";
    flag.setAttribute("aria-hidden", "true");
    el.append(flag, document.createTextNode(name));
  }

  function formatProfile(user) {
    var countryDisplay = resolveCountryDisplay(user.country_code);
    return [
      "Display Name: " + (user.display_name || "(not set)"),
      "Handle: " + (user.handle || "(not set)"),
      "Email: " + (user.email || "(not set)") + (user.email && !user.email_verified ? " (not confirmed yet)" : ""),
      "Country: " + (countryDisplay || "(not set)"),
      "Created: " + (user.created_at || "(unknown)")
    ].join("\n");
  }

  function renderProfileSummary() {
    var summary = document.getElementById("roadmap-current-user");
    if (!summary) {
      return;
    }

    if (!isRegistered()) {
      summary.textContent = "Guest learner: " + formatIdentity() + ". You can customize your username and picture now without an email, or register later to sync across devices.";
      return;
    }

    summary.textContent = [
      "User: " + formatIdentity(),
      "Email: " + (state.user.email || ""),
      "Status: signed in" + (state.user.email_verified ? "" : " (confirm your email to sign in on other devices)")
    ].join("\n");
  }

  function renderProfileOutput() {
    var output = document.getElementById("profile-output");
    if (!output) {
      return;
    }

    if (!state.user) {
      output.textContent = "Loading your learner profile...";
      return;
    }

    if (!isRegistered()) {
      output.textContent = [
        "Username: " + formatIdentity(),
        "Status: Guest learner (no email required)",
        "Picture: " + (state.user.avatar_url ? "Custom uploaded picture" : "Generic faceless avatar")
      ].join("\n");
      return;
    }

    output.textContent = formatProfile(state.user);
  }

  function populateProfileInputs() {
    var profileForm = document.getElementById("roadmap-profile-form");
    var avatarImg = document.getElementById("profile-avatar-img");
    var avatarControls = document.getElementById("profile-avatar-controls");
    var avatarGuestNote = document.getElementById("profile-avatar-guest-note");
    var removeAvatarBtn = document.getElementById("profile-avatar-remove");
    var registeredSection = document.getElementById("profile-registered-section");
    var guestNote = document.getElementById("profile-guest-register-note");
    var communityLinkWrap = document.getElementById("profile-community-link-wrap");
    var communityLink = document.getElementById("profile-community-link");
    var registered = isRegistered();
    var confirmedMember = registered && !!(state.user && state.user.email_verified);

    if (avatarImg) {
      avatarImg.src = (state.user && state.user.avatar_url) ? state.user.avatar_url : "/assets/images/avatar-placeholder.svg";
    }
    if (avatarControls) {
      avatarControls.hidden = !confirmedMember;
    }
    if (avatarGuestNote) {
      avatarGuestNote.hidden = confirmedMember;
    }
    if (removeAvatarBtn) {
      removeAvatarBtn.hidden = !(confirmedMember && state.user && state.user.avatar_url);
    }
    if (registeredSection) {
      registeredSection.hidden = !registered;
    }
    if (guestNote) {
      guestNote.hidden = registered;
    }
    if (communityLinkWrap && communityLink) {
      var publicId = state.user && (state.user.community_public_id || state.user.handle);
      if (confirmedMember && publicId) {
        communityLink.href = "/community/profile.html?user_id=" + encodeURIComponent(publicId);
        communityLinkWrap.hidden = false;
      } else {
        communityLinkWrap.hidden = true;
      }
    }

    if (!profileForm) {
      return;
    }

    var elements = profileForm.elements;
    if (elements.handle && state.user) {
      elements.handle.value = state.user.handle || formatIdentity();
    }

    if (elements.email) {
      elements.email.value = registered ? (state.user.email || "") : "";
    }

    if (elements.country_code) {
      elements.country_code.value = registered ? (state.user.country_code || "") : "";
      var countryPreview = document.getElementById("profile-country-preview");
      if (countryPreview) {
        if (registered) {
          renderCountryPreview(countryPreview, elements.country_code.value);
        } else {
          countryPreview.textContent = "";
        }
      }
    }

    if (elements.password) {
      elements.password.value = "";
    }

    if (elements.confirm_password) {
      elements.confirm_password.value = "";
    }
  }

  function renderState() {
    renderRoadmapTitle();
    renderRoadmapActions();
    renderProfileSummary();
    renderProfileOutput();
    populateProfileInputs();

    var stateStatus = document.getElementById("roadmap-state-status");
    if (stateStatus) {
      var verified = new URLSearchParams(window.location.search || "").get("verified") === "1";
      stateStatus.textContent = isRegistered()
        ? ((verified ? "Email confirmed. " : "") + "Signed in as " + formatIdentity())
        : "Anonymous session: progress is saved for this browser. Login to sync across devices.";
    }
  }

  function emitAuthChange() {
    window.dispatchEvent(new CustomEvent("roadmap-auth-changed", {
      detail: {
        user: state.user,
        profile: state.user,
        registered: isRegistered()
      }
    }));
  }

  function setUser(user) {
    state.user = user || null;
    renderState();
    emitAuthChange();
    return state;
  }

  // Loads the session; creates an anonymous user when there is none.
  // Concurrent callers share one in-flight request.
  function refresh() {
    if (!state.api) {
      return Promise.resolve(state);
    }

    if (state.pending) {
      return state.pending;
    }

    state.pending = (async function () {
      var result = await state.api.auth.session();
      var user = result.data ? result.data.user : null;

      if (!user && !result.error) {
        var created = await state.api.auth.anonymous();
        user = created.data ? created.data.user : null;
      }

      return setUser(user);
    })().finally(function () {
      state.pending = null;
    });

    return state.pending;
  }

  // Applies a user object returned by a login/register/profile call without
  // another round trip.
  function applyUser(user) {
    return setUser(user);
  }

  async function signOut() {
    if (!state.api) {
      return;
    }

    await state.api.auth.logout();
    state.user = null;
    window.location.href = "/roadmaps/";
  }

  function wireLogoutAction() {
    var loginAction = document.getElementById("roadmap-login-action");
    if (loginAction && loginAction.dataset.roadmapWired !== "true") {
      loginAction.dataset.roadmapWired = "true";
      loginAction.addEventListener("click", function (event) {
        if (!isRegistered()) {
          return;
        }

        event.preventDefault();
        signOut();
      });
    }

    ["roadmap-learners-action", "roadmap-top-score-action"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.dataset.roadmapGateWired === "true") {
        return;
      }
      el.dataset.roadmapGateWired = "true";
      el.addEventListener("click", function (event) {
        if (!isRegistered()) {
          event.preventDefault();
        }
      });
    });
  }

  function wireProfileLock() {
    var profileAction = document.getElementById("roadmap-profile-action");
    if (!profileAction || profileAction.dataset.roadmapProfileWired === "true") {
      return;
    }

    profileAction.dataset.roadmapProfileWired = "true";
    profileAction.addEventListener("click", function (event) {
      if (isRegistered()) {
        return;
      }

      event.preventDefault();
      window.location.href = getProfileRedirectUrl();
    });
  }

  async function initialize(api) {
    if (!api || state.initialized) {
      return state;
    }

    state.api = api;
    state.initialized = true;
    wireLogoutAction();
    return refresh();
  }

  window.roadmapState = {
    initialize: initialize,
    refresh: refresh,
    applyUser: applyUser,
    signOut: signOut,
    isRegistered: isRegistered,
    getUser: function () {
      return state.user;
    },
    getProfile: function () {
      return state.user;
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.sclApi) {
      renderState();
      return;
    }

    initialize(window.sclApi);
  });
})();
