(function () {
  var state = {
    client: null,
    session: null,
    user: null,
    profile: null,
    initialized: false
  };

  function getText(value) {
    return value ? String(value) : "";
  }

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

  function formatIdentity() {
    if (!state.user) {
      return "Anonymous";
    }

    var profile = state.profile || {};
    var metadata = state.user.user_metadata || {};
    var handle = profile.handle || metadata.handle || profile.display_name || metadata.display_name;

    if (!handle && state.user.email) {
      handle = state.user.email.split("@")[0];
    }

    return handle || "User Handler";
  }

  function renderRoadmapTitle() {
    var title = document.getElementById("roadmap-user-title");
    if (!title) {
      return;
    }

    setText(title, "User: " + formatIdentity());
  }

  function renderRoadmapActions() {
    var loginAction = document.getElementById("roadmap-login-action");
    var profileAction = document.getElementById("roadmap-profile-action");
    var registerAction = document.getElementById("roadmap-register-action");

    if (loginAction) {
      setButtonLabel(loginAction, state.user ? "LOG-OUT" : "LOGIN");
      setHref(loginAction, state.user ? "#roadmap-logout" : "/roadmap/login.html");
      loginAction.setAttribute("aria-label", state.user ? "Log out of roadmap account" : "Sign in to roadmap account");
    }

    if (profileAction) {
      setDisabledLink(profileAction, !state.user);
      setHref(profileAction, state.user ? "/roadmap/profile.html" : "#roadmap-profile-disabled");
      profileAction.setAttribute("aria-label", state.user ? "Open current roadmap profile" : "Profile is available after sign in");
      profileAction.setAttribute("title", state.user ? ("Signed in as " + formatIdentity()) : "Sign in to unlock profile");
    }

    if (registerAction) {
      if (state.user) {
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

  function renderProfileSummary() {
    var summary = document.getElementById("roadmap-current-user");
    if (!summary) {
      return;
    }

    if (!state.user) {
      summary.textContent = "You are not signed in. Use the login page or register a new roadmap account.";
      return;
    }

    var parts = [
      "User: " + formatIdentity(),
      "Email: " + getText(state.user.email),
      "Status: signed in"
    ];

    summary.textContent = parts.join("\n");
  }

  function formatProfile(profile) {
    if (!profile) {
      return "No profile found.";
    }

    return [
      "Display Name: " + (getText(profile.display_name) || "(not set)"),
      "Handle: " + (getText(profile.handle) || "(not set)"),
      "Email: " + (getText(profile.email) || "(not set)"),
      "Created: " + (getText(profile.created_at) || "(unknown)")
    ].join("\n");
  }

  function renderProfileOutput() {
    var output = document.getElementById("profile-output");
    if (!output) {
      return;
    }

    if (!state.user) {
      output.textContent = "Sign in to load your roadmap profile.";
      return;
    }

    output.textContent = formatProfile(state.profile);
  }

  function populateProfileInputs() {
    var profileForm = document.getElementById("roadmap-profile-form");
    if (!profileForm) {
      return;
    }

    var handleField = profileForm.elements.handle;
    var emailField = profileForm.elements.email;
    var passwordField = profileForm.elements.password;
    var confirmField = profileForm.elements.confirm_password;

    if (handleField && state.user) {
      handleField.value = state.profile && state.profile.handle ? state.profile.handle : formatIdentity();
    }

    if (emailField && state.user) {
      emailField.value = state.user.email || "";
    }

    if (passwordField) {
      passwordField.value = "";
    }

    if (confirmField) {
      confirmField.value = "";
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
      stateStatus.textContent = state.user
        ? ("Signed in as " + formatIdentity())
        : "Signed out. Login to activate profile and password tools.";
    }
  }

  async function loadProfile(client, user) {
    if (!user) {
      return null;
    }

    var query = client
      .from("user_profiles")
      .select("id, handle, display_name, email, created_at")
      .eq("id", user.id)
      .maybeSingle();

    var result = await query;
    if (result.error) {
      return null;
    }

    return result.data || null;
  }

  async function syncSession(session) {
    state.session = session || null;
    state.user = session && session.user ? session.user : null;
    state.profile = null;

    if (state.client && state.user) {
      state.profile = await loadProfile(state.client, state.user);
    }

    renderState();
    return state;
  }

  async function refresh() {
    if (!state.client) {
      return state;
    }

    var sessionResult = await state.client.auth.getSession();
    await syncSession(sessionResult && sessionResult.data ? sessionResult.data.session : null);
    return state;
  }

  async function signOut() {
    if (!state.client) {
      return;
    }

    await state.client.auth.signOut();
    await refresh();
    window.location.href = "/roadmap/";
  }

  function wireLogoutAction() {
    var loginAction = document.getElementById("roadmap-login-action");
    if (!loginAction || loginAction.dataset.roadmapWired === "true") {
      return;
    }

    loginAction.dataset.roadmapWired = "true";
    loginAction.addEventListener("click", function (event) {
      if (!state.user) {
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
      if (state.user) {
        return;
      }

      event.preventDefault();
    });
  }

  function wireRegisterLock() {
    return;
  }

  async function initialize(client) {
    if (!client || state.initialized) {
      return state;
    }

    state.client = client;
    state.initialized = true;

    var sessionResult = await client.auth.getSession();
    await syncSession(sessionResult && sessionResult.data ? sessionResult.data.session : null);

    client.auth.onAuthStateChange(function (_event, session) {
      syncSession(session);
    });

    wireLogoutAction();
    wireProfileLock();
    wireRegisterLock();
    return state;
  }

  window.roadmapState = {
    initialize: initialize,
    refresh: refresh,
    signOut: signOut,
    getUser: function () {
      return state.user;
    },
    getProfile: function () {
      return state.profile;
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    var client = window.supabaseClient;
    if (!client) {
      renderState();
      return;
    }

    initialize(client);
  });
})();