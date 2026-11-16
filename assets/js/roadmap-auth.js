(function () {
  // Roadmap account forms (login, register, reset, profile, unregister) on top
  // of window.sclApi. Server errors arrive as { error: { message } }.
  var MIN_PASSWORD = 8;

  function setStatus(el, message, level) {
    if (!el) {
      return;
    }

    var classes = "alert mt-3";
    if (level === "success") {
      classes += " alert-success";
    } else if (level === "warning") {
      classes += " alert-warning";
    } else {
      classes += " alert-danger";
    }

    el.className = classes;
    el.textContent = message;
    el.hidden = false;
  }

  function getValue(form, name) {
    if (!form || !form.elements[name]) {
      return "";
    }

    return form.elements[name].value.trim();
  }

  function getRaw(form, name) {
    return form && form.elements[name] ? form.elements[name].value : "";
  }

  function clearFields(form, names) {
    names.forEach(function (name) {
      if (form.elements[name]) {
        form.elements[name].value = "";
      }
    });
  }

  function getRoadmapIndexUrl() {
    var path = window.location.pathname || "/";
    return path.startsWith("/public/") ? "/public/roadmap/" : "/roadmap/";
  }

  function getPostLoginRedirectUrl() {
    var next = String(new URLSearchParams(window.location.search || "").get("next") || "").trim();
    if (!next.startsWith("/")) {
      return getRoadmapIndexUrl();
    }

    var isRoadmapPath = next.indexOf("/roadmap/") === 0 || next.indexOf("/public/roadmap/") === 0;
    return isRoadmapPath ? next : getRoadmapIndexUrl();
  }

  function passwordProblem(password, confirmPassword) {
    if (!password || !confirmPassword) {
      return "Enter and confirm the password.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    if (password.length < MIN_PASSWORD) {
      return "Password must be at least " + MIN_PASSWORD + " characters.";
    }
    return "";
  }

  function state() {
    return window.roadmapState || null;
  }

  function currentUser() {
    var s = state();
    return s && typeof s.getUser === "function" ? s.getUser() : null;
  }

  function isRegistered() {
    var s = state();
    return !!(s && typeof s.isRegistered === "function" && s.isRegistered());
  }

  function applyUser(user) {
    var s = state();
    if (s && typeof s.applyUser === "function") {
      s.applyUser(user);
    }
  }

  function withBusy(form, fn) {
    var button = form.querySelector('button[type="submit"]');
    return async function (event) {
      event.preventDefault();
      if (button) {
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
      }
      try {
        await fn();
      } finally {
        if (button) {
          button.disabled = false;
          button.setAttribute("aria-busy", "false");
        }
      }
    };
  }

  function wirePasswordToggle(button) {
    if (!button || button.dataset.roadmapToggleWired === "true") {
      return;
    }

    var targetId = button.getAttribute("data-password-target");
    var target = targetId ? document.getElementById(targetId) : null;
    if (!target) {
      return;
    }

    button.dataset.roadmapToggleWired = "true";
    button.addEventListener("click", function () {
      var isHidden = target.type === "password";
      target.type = isHidden ? "text" : "password";
      button.setAttribute("aria-pressed", isHidden ? "true" : "false");
      button.innerHTML = isHidden
        ? '<i class="bi bi-eye-slash" aria-hidden="true"></i>'
        : '<i class="bi bi-eye" aria-hidden="true"></i>';
    });
  }

  function wirePasswordVisibility() {
    document.querySelectorAll("[data-password-target]").forEach(wirePasswordToggle);
  }

  function handleLogin(form, api) {
    var status = document.getElementById("auth-status");
    var verified = new URLSearchParams(window.location.search || "").get("verified");
    if (verified === "1") {
      setStatus(status, "Email confirmed. You can sign in now.", "success");
    } else if (verified === "0") {
      setStatus(status, "That confirmation link is invalid or expired. Sign in to get a new one.", "warning");
    }

    form.addEventListener("submit", withBusy(form, async function () {
      var email = getValue(form, "email");
      var password = getRaw(form, "password");

      if (!email || !password) {
        setStatus(status, "Email and password are required.", "warning");
        return;
      }

      var result = await api.auth.login(email, password);
      if (result.error) {
        setStatus(status, result.error.message, result.error.status === 403 ? "warning" : "error");
        return;
      }

      applyUser(result.data.user);
      setStatus(status, "Login successful. Your roadmap session is active.", "success");
      window.setTimeout(function () {
        window.location.href = getPostLoginRedirectUrl();
      }, 600);
    }));
  }

  // Live "is this username free?" hint, debounced so typing does not flood the API.
  function wireHandleCheck(form, api) {
    var input = form.elements.handle;
    var hint = document.getElementById("register-handle-hint");
    if (!input || !hint || !api.auth.checkHandle) {
      return;
    }

    var defaultText = hint.textContent;
    var timer = null;
    var sequence = 0;

    function show(text, ok) {
      hint.textContent = text;
      hint.className = "form-text" + (ok === true ? " text-success" : ok === false ? " text-warning" : "");
      input.setCustomValidity(ok === false ? text : "");
    }

    input.addEventListener("input", function () {
      window.clearTimeout(timer);
      var value = input.value.trim();
      if (value.length < 3) {
        show(defaultText, null);
        return;
      }

      timer = window.setTimeout(async function () {
        var mine = ++sequence;
        var result = await api.auth.checkHandle(value);
        if (mine !== sequence || result.error) {
          return;
        }
        if (result.data.error) {
          show(result.data.error, false);
        } else {
          show(result.data.available ? "Username is available." : "Username already exists. Choose another.", !!result.data.available);
        }
      }, 400);
    });
  }

  function showRegisterDone(form, api, email, emailSent) {
    var done = document.getElementById("register-done");
    var status = document.getElementById("auth-status");
    if (!done) {
      return false;
    }

    form.hidden = true;
    var note = document.getElementById("register-note");
    if (note) {
      note.hidden = true;
    }
    var target = document.getElementById("register-done-email");
    if (target) {
      target.textContent = email;
    }
    done.hidden = false;

    if (emailSent) {
      status.hidden = true;
    } else {
      setStatus(status, "Your account is created, but the confirmation email could not be sent. Use Resend Link to try again.", "warning");
    }

    var resend = document.getElementById("register-resend");
    if (resend && resend.dataset.wired !== "true") {
      resend.dataset.wired = "true";
      resend.addEventListener("click", async function () {
        resend.disabled = true;
        var result = await api.auth.resendConfirmation();
        if (result.error) {
          setStatus(status, result.error.message, "error");
        } else if (result.data.already_verified) {
          setStatus(status, "Your email is already confirmed.", "success");
        } else {
          setStatus(status, result.data.email_sent
            ? "A new confirmation link is on its way."
            : "The email could not be sent. Try again in a few minutes.",
            result.data.email_sent ? "success" : "warning");
        }
        // Brief cool-down so repeated clicks do not burn the hourly quota.
        window.setTimeout(function () { resend.disabled = false; }, 30000);
      });
    }

    var heading = done.querySelector("h2");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
    return true;
  }

  function handleRegister(form, api) {
    var status = document.getElementById("auth-status");
    wireHandleCheck(form, api);

    // Registered but unconfirmed visitors land on the "check your inbox" panel.
    function syncSignedIn() {
      var user = currentUser();
      if (user && isRegistered() && !form.hidden) {
        if (!user.email_verified) {
          showRegisterDone(form, api, user.email || "", true);
        } else {
          setStatus(status, "You are already signed in as " + (user.handle || user.email) + ". Log out before creating another account.", "warning");
        }
      }
    }
    window.addEventListener("roadmap-auth-changed", syncSignedIn);
    syncSignedIn();

    form.addEventListener("submit", withBusy(form, async function () {
      if (isRegistered()) {
        setStatus(status, "You are already signed in. Log out before creating another account.", "warning");
        return;
      }

      var userName = getValue(form, "handle");
      var email = getValue(form, "email");
      var password = getRaw(form, "password");

      if (!userName || !email || !password) {
        setStatus(status, "Username, email, and password are required.", "warning");
        return;
      }

      var problem = passwordProblem(password, getRaw(form, "confirm_password"));
      var emailName = email.split("@")[0].toLowerCase();
      var lowered = password.toLowerCase();
      if (!problem && ((userName.length >= 3 && lowered.indexOf(userName.toLowerCase()) !== -1)
        || (emailName.length >= 3 && lowered.indexOf(emailName) !== -1))) {
        problem = "Password must not contain your username or email.";
      }
      if (problem) {
        setStatus(status, problem, "warning");
        return;
      }

      var result = await api.auth.register(userName, email, password, getRaw(form, "website"));
      if (result.error) {
        setStatus(status, result.error.message, result.error.status === 429 ? "warning" : "error");
        return;
      }

      clearFields(form, ["password", "confirm_password"]);
      if (!showRegisterDone(form, api, email, result.data.email_sent)) {
        setStatus(status, "Account created and your progress is kept. Check your email to confirm the address.", "success");
      }
      applyUser(result.data.user);
    }));
  }

  function handleResetRequest(form, api) {
    var status = document.getElementById("auth-status");
    form.addEventListener("submit", withBusy(form, async function () {
      var email = getValue(form, "email");
      if (!email) {
        setStatus(status, "Enter the email address for your roadmap account.", "warning");
        return;
      }

      var result = await api.auth.forgot(email);
      if (result.error) {
        setStatus(status, result.error.message, "error");
        return;
      }

      setStatus(status, "If an account exists for that email, a reset link is on its way. Check your inbox.", "success");
    }));
  }

  function handleResetPassword(form, api, token) {
    var status = document.getElementById("auth-status");
    form.addEventListener("submit", withBusy(form, async function () {
      var password = getRaw(form, "password");
      var problem = passwordProblem(password, getRaw(form, "confirm_password"));
      if (problem) {
        setStatus(status, problem, "warning");
        return;
      }

      var result = await api.auth.reset(token, password);
      if (result.error) {
        setStatus(status, result.error.message, "error");
        return;
      }

      clearFields(form, ["password", "confirm_password"]);
      setStatus(status, "Password updated. You can sign in with the new password now.", "success");
      window.setTimeout(function () {
        window.location.href = "/roadmap/login.html";
      }, 1200);
    }));
  }

  function configureResetPage(api) {
    var requestSection = document.getElementById("reset-request-panel");
    var recoverySection = document.getElementById("reset-password-panel");
    var requestForm = document.getElementById("roadmap-reset-request-form");
    var recoveryForm = document.getElementById("roadmap-reset-form");

    if (!requestSection && !recoverySection && !requestForm && !recoveryForm) {
      return;
    }

    var token = new URLSearchParams(window.location.search || "").get("token") || "";
    if (requestSection) {
      requestSection.hidden = !!token;
    }
    if (recoverySection) {
      recoverySection.hidden = !token;
    }

    if (requestForm) {
      handleResetRequest(requestForm, api);
    }
    if (recoveryForm && token) {
      handleResetPassword(recoveryForm, api, token);
    }
  }

  function handleProfile(form, api) {
    var status = document.getElementById("auth-status");
    var updateButton = document.getElementById("profile-update-btn");
    var closeButton = document.getElementById("profile-close-btn");

    function initialHandle() {
      var user = currentUser();
      return user && user.handle ? user.handle : "";
    }

    function refreshActionButtons() {
      var currentHandle = getValue(form, "handle");
      var password = getRaw(form, "password");
      var confirmPassword = getRaw(form, "confirm_password");
      var handleChanged = !!currentHandle && currentHandle !== initialHandle();
      var passwordReady = !passwordProblem(password, confirmPassword);
      var enabled = isRegistered() && (handleChanged || passwordReady);

      if (updateButton) {
        updateButton.disabled = !enabled;
        updateButton.classList.toggle("disabled", !enabled);
        if (enabled) {
          updateButton.removeAttribute("aria-disabled");
        } else {
          updateButton.setAttribute("aria-disabled", "true");
        }
      }
    }

    ["handle", "password", "confirm_password"].forEach(function (name) {
      if (form.elements[name]) {
        form.elements[name].addEventListener("input", refreshActionButtons);
      }
    });

    window.addEventListener("roadmap-auth-changed", function () {
      if (!isRegistered()) {
        setStatus(status, "Sign in first to edit profile settings.", "warning");
      }
      refreshActionButtons();
    });

    if (updateButton) {
      updateButton.addEventListener("click", async function () {
        if (!isRegistered()) {
          setStatus(status, "Sign in first to edit profile settings.", "warning");
          return;
        }

        var handle = getValue(form, "handle");
        var password = getRaw(form, "password");
        var confirmPassword = getRaw(form, "confirm_password");
        var changes = {};

        if (!handle) {
          setStatus(status, "Username is required.", "warning");
          return;
        }
        if (handle !== initialHandle()) {
          changes.handle = handle;
        }
        if (password || confirmPassword) {
          var problem = passwordProblem(password, confirmPassword);
          if (problem) {
            setStatus(status, problem, "warning");
            return;
          }
          changes.password = password;
        }
        if (!changes.handle && !changes.password) {
          setStatus(status, "No changes to save.", "warning");
          return;
        }

        updateButton.disabled = true;
        var result = await api.auth.updateProfile(changes);
        if (result.error) {
          setStatus(status, result.error.message, "error");
          refreshActionButtons();
          return;
        }

        applyUser(result.data.user);
        setStatus(status, changes.password
          ? "Profile updated. Other devices were signed out because the password changed."
          : "Profile updated successfully.", "success");
        refreshActionButtons();
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", function () {
        window.location.href = getRoadmapIndexUrl();
      });
    }

    refreshActionButtons();
  }

  function handleUnregister(form, api) {
    var status = document.getElementById("auth-status");
    form.addEventListener("submit", withBusy(form, async function () {
      if (!isRegistered()) {
        setStatus(status, "Sign in first to remove your roadmap account.", "warning");
        return;
      }

      var password = getRaw(form, "password");
      if (!password) {
        setStatus(status, "Enter your password to confirm account removal.", "warning");
        return;
      }

      var result = await api.auth.deleteAccount(password);
      if (result.error) {
        setStatus(status, result.error.message, "error");
        return;
      }

      clearFields(form, ["password"]);
      setStatus(status, "Your roadmap account has been removed.", "success");
      window.setTimeout(function () {
        window.location.href = "/roadmap/";
      }, 1500);
    }));
  }

  function wireEmailLockHelp() {
    var trigger = document.getElementById("profile-email-help");
    var note = document.getElementById("profile-email-lock-note");
    if (!trigger || !note) {
      return;
    }

    function hideNote() {
      note.hidden = true;
    }

    trigger.addEventListener("click", function () {
      note.hidden = !note.hidden;
    });

    ["profile-email-note-sage", "profile-email-note-close"].forEach(function (id) {
      var button = document.getElementById(id);
      if (button) {
        button.addEventListener("click", hideNote);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var api = window.sclApi;
    var status = document.getElementById("auth-status");

    wirePasswordVisibility();
    wireEmailLockHelp();

    if (!api) {
      setStatus(status, "The roadmap API client did not load. Reload the page.", "warning");
      return;
    }

    var forms = {
      login: document.getElementById("roadmap-login-form"),
      profile: document.getElementById("roadmap-profile-form"),
      register: document.getElementById("roadmap-register-form"),
      unregister: document.getElementById("roadmap-unregister-form")
    };

    if (forms.login) {
      handleLogin(forms.login, api);
    }
    if (forms.profile) {
      handleProfile(forms.profile, api);
    }
    if (forms.register) {
      handleRegister(forms.register, api);
    }
    if (forms.unregister) {
      handleUnregister(forms.unregister, api);
    }

    configureResetPage(api);
  });
})();
