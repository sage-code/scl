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
    var loginPath = inPublicPreview ? "/public/roadmap/login.html" : "/roadmap/login.html";
    var profilePath = inPublicPreview ? "/public/roadmap/profile.html" : "/roadmap/profile.html";
    return loginPath + "?next=" + encodeURIComponent(profilePath);
  }

  function formatIdentity() {
    if (!state.user) {
      return "Learner";
    }

    var handle = state.user.handle || state.user.display_name;
    if (!handle && state.user.email) {
      handle = state.user.email.split("@")[0];
    }

    return handle || "Learner";
  }

  function renderRoadmapTitle() {
    setText(document.getElementById("roadmap-user-title"), "User: " + formatIdentity());
  }

  function renderRoadmapActions() {
    var registered = isRegistered();
    var loginAction = document.getElementById("roadmap-login-action");
    var profileAction = document.getElementById("roadmap-profile-action");
    var registerAction = document.getElementById("roadmap-register-action");

    if (loginAction) {
      setButtonLabel(loginAction, registered ? "SIGN OUT" : "SIGN IN");
      setHref(loginAction, registered ? "#roadmap-logout" : "/roadmap/login.html");
      loginAction.setAttribute("aria-label", registered ? "Sign out of roadmap account" : "Sign in to roadmap account");
    }

    if (profileAction) {
      setDisabledLink(profileAction, false);
      setHref(profileAction, "/roadmap/profile.html");
      profileAction.setAttribute("aria-label", "Open your learner profile");
      profileAction.setAttribute("title", "Update your username or profile picture (" + formatIdentity() + ")");
    }

    if (registerAction) {
      if (registered) {
        setButtonLabel(registerAction, "REMOVE");
        setButtonIcon(registerAction, "bi bi-person-dash");
        setHref(registerAction, "/roadmap/unregister.html");
        registerAction.setAttribute("aria-label", "Remove the current roadmap account");
        registerAction.setAttribute("title", "Open the unregister form to delete this account");
      } else {
        setButtonLabel(registerAction, "REGISTER");
        setButtonIcon(registerAction, "bi bi-person-plus");
        setHref(registerAction, "/roadmap/register.html");
        registerAction.setAttribute("aria-label", "Register a roadmap account");
        registerAction.setAttribute("title", "Create a new roadmap account");
      }
    }
  }

  function formatProfile(user) {
    return [
      "Display Name: " + (user.display_name || "(not set)"),
      "Handle: " + (user.handle || "(not set)"),
      "Email: " + (user.email || "(not set)") + (user.email && !user.email_verified ? " (not confirmed yet)" : ""),
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
    var removeAvatarBtn = document.getElementById("profile-avatar-remove");
    var registeredSection = document.getElementById("profile-registered-section");
    var guestNote = document.getElementById("profile-guest-register-note");
    var registered = isRegistered();

    if (avatarImg) {
      avatarImg.src = (state.user && state.user.avatar_url) ? state.user.avatar_url : "/assets/images/avatar-placeholder.svg";
    }
    if (removeAvatarBtn) {
      removeAvatarBtn.hidden = !(state.user && state.user.avatar_url);
    }
    if (registeredSection) {
      registeredSection.hidden = !registered;
    }
    if (guestNote) {
      guestNote.hidden = registered;
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
    window.location.href = "/roadmap/";
  }

  function wireLogoutAction() {
    var loginAction = document.getElementById("roadmap-login-action");
    if (!loginAction || loginAction.dataset.roadmapWired === "true") {
      return;
    }

    loginAction.dataset.roadmapWired = "true";
    loginAction.addEventListener("click", function (event) {
      if (!isRegistered()) {
        return;
      }

      event.preventDefault();
      signOut();
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
