(function () {
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

  function getResetRedirectUrl() {
    return window.location.origin + "/roadmap/reset-password.html";
  }

  function getRoadmapIndexUrl() {
    var path = window.location.pathname || "/";
    if (path.startsWith("/public/")) {
      return "/public/roadmap/";
    }
    return "/roadmap/";
  }

  function hasValidPasswordLength(password) {
    return String(password || "").length > 4;
  }

  async function getExistingHandler(client, handle, currentUserId) {
    if (!handle) {
      return null;
    }

    var query = client
      .from("user_profiles")
      .select("id")
      .eq("handle", handle)
      .maybeSingle();

    var result = await query;
    if (result.error) {
      return null;
    }

    if (result.data && result.data.id && result.data.id !== currentUserId) {
      return result.data;
    }

    return null;
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
    var buttons = document.querySelectorAll("[data-password-target]");
    buttons.forEach(wirePasswordToggle);
  }

  function formatProfile(profile) {
    if (!profile) {
      return "No profile found.";
    }

    return [
      "Display Name: " + (profile.display_name || "(not set)"),
      "Handle: " + (profile.handle || "(not set)"),
      "Email: " + (profile.email || "(not set)"),
      "Created: " + (profile.created_at || "(unknown)")
    ].join("\n");
  }

  async function handleLogin(form, client) {
    var status = document.getElementById("auth-status");
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var email = getValue(form, "email");
      var password = form.elements.password ? form.elements.password.value : "";

      if (!email || !password) {
        setStatus(status, "Email and password are required.", "warning");
        return;
      }

      var result = await client.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (result.error) {
        setStatus(status, result.error.message, "error");
        return;
      }

      setStatus(status, "Login successful. Your roadmap session is active.", "success");

      try {
        if (window.roadmapState && typeof window.roadmapState.refresh === "function") {
          await window.roadmapState.refresh();
        }
      } catch (_error) {
        // Keep redirect behavior resilient even if profile hydration fails.
      }

      window.setTimeout(function () {
        window.location.href = getRoadmapIndexUrl();
      }, 600);
    });
  }

  async function handleRegister(form, client) {
    var status = document.getElementById("auth-status");
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var authState = await client.auth.getUser();
      if (authState && authState.data && authState.data.user) {
        setStatus(status, "You are already signed in. Log out before creating another account.", "warning");
        return;
      }

      var userHandler = getValue(form, "handle");
      var email = getValue(form, "email");
      var password = form.elements.password ? form.elements.password.value : "";
      var confirmPassword = form.elements.confirm_password ? form.elements.confirm_password.value : "";

      if (!userHandler || !email || !password) {
        setStatus(status, "User handler, email, and password are required.", "warning");
        return;
      }

      if (password !== confirmPassword) {
        setStatus(status, "Passwords do not match.", "warning");
        return;
      }

      if (!hasValidPasswordLength(password)) {
        setStatus(status, "Password must be longer than 4 characters.", "warning");
        return;
      }

      var existingHandler = await getExistingHandler(client, userHandler, null);
      if (existingHandler) {
        setStatus(status, "User handler already exist choose another.", "warning");
        return;
      }

      var result = await client.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            handle: userHandler,
            display_name: userHandler
          }
        }
      });

      if (result.error) {
        setStatus(status, result.error.message, "error");
        return;
      }

      setStatus(status, "Registration submitted. Check your email to confirm account activation.", "success");

      if (window.roadmapState && typeof window.roadmapState.refresh === "function") {
        await window.roadmapState.refresh();
      }
    });
  }

  async function handleResetRequest(form, client) {
    var status = document.getElementById("auth-status");
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var email = getValue(form, "email");
      if (!email) {
        setStatus(status, "Enter the email address for your roadmap account.", "warning");
        return;
      }

      var result = await client.auth.resetPasswordForEmail(email, {
        redirectTo: getResetRedirectUrl()
      });

      if (result.error) {
        setStatus(status, result.error.message, "error");
        return;
      }

      setStatus(status, "Password reset email sent. Check your inbox and open the recovery link.", "success");
    });
  }

  async function handleResetPassword(form, client) {
    var status = document.getElementById("auth-status");
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var password = form.elements.password ? form.elements.password.value : "";
      var confirmPassword = form.elements.confirm_password ? form.elements.confirm_password.value : "";

      if (!password || !confirmPassword) {
        setStatus(status, "Enter and confirm the new password.", "warning");
        return;
      }

      if (password !== confirmPassword) {
        setStatus(status, "Passwords do not match.", "warning");
        return;
      }

      var result = await client.auth.updateUser({ password: password });
      if (result.error) {
        setStatus(status, result.error.message, "error");
        return;
      }

      if (window.roadmapState && typeof window.roadmapState.refresh === "function") {
        await window.roadmapState.refresh();
      }

      setStatus(status, "Password updated. You can sign in with the new password now.", "success");

      if (form.elements.password) {
        form.elements.password.value = "";
      }

      if (form.elements.confirm_password) {
        form.elements.confirm_password.value = "";
      }

      window.setTimeout(function () {
        window.location.href = "/roadmap/login.html";
      }, 1200);
    });
  }

  async function handleProfile(form, client) {
    var status = document.getElementById("auth-status");
    var output = document.getElementById("profile-output");
    var currentUser = document.getElementById("roadmap-current-user");
    var updateButton = document.getElementById("profile-update-btn");
    var closeButton = document.getElementById("profile-close-btn");
    var initialHandle = "";

    function setButtonEnabled(button, enabled) {
      if (!button) {
        return;
      }

      button.disabled = !enabled;
      if (enabled) {
        button.classList.remove("disabled");
        button.removeAttribute("aria-disabled");
      } else {
        button.classList.add("disabled");
        button.setAttribute("aria-disabled", "true");
      }
    }

    function refreshActionButtons() {
      var currentHandle = getValue(form, "handle").toLowerCase();
      var password = form.elements.password ? form.elements.password.value : "";
      var confirmPassword = form.elements.confirm_password ? form.elements.confirm_password.value : "";
      var handlerChanged = !!currentHandle && currentHandle !== initialHandle;
      var passwordMatched = !!password && !!confirmPassword && password === confirmPassword && hasValidPasswordLength(password);

      setButtonEnabled(updateButton, handlerChanged || passwordMatched);
    }

    async function loadCurrentProfile() {
      var authState = await client.auth.getUser();
      if (authState.error || !authState.data || !authState.data.user) {
        setStatus(status, "Sign in first to edit profile settings.", "warning");
        return null;
      }

      var user = authState.data.user;
      var profileResult = await client
        .from("user_profiles")
        .select("id, handle, display_name, email, created_at")
        .eq("id", user.id)
        .maybeSingle();

      var profile = profileResult && profileResult.data ? profileResult.data : null;
      var resolvedHandle = (profile && profile.handle) ||
        (user.user_metadata && user.user_metadata.handle) ||
        (user.email ? user.email.split("@")[0] : "");

      initialHandle = String(resolvedHandle || "").toLowerCase();

      if (form.elements.handle) {
        form.elements.handle.value = resolvedHandle || "";
      }

      if (form.elements.email) {
        form.elements.email.value = user.email || "";
      }

      if (currentUser) {
        currentUser.textContent = formatProfile(profile || {
          handle: resolvedHandle || "(not set)",
          display_name: resolvedHandle || "(not set)",
          email: user.email || "(not set)",
          created_at: user.created_at || "(unknown)"
        });
      }

      if (output) {
        output.textContent = formatProfile(profile || {
          handle: resolvedHandle || "(not set)",
          display_name: resolvedHandle || "(not set)",
          email: user.email || "(not set)",
          created_at: user.created_at || "(unknown)"
        });
      }

      refreshActionButtons();
      return user;
    }

    if (form.elements.handle) {
      form.elements.handle.addEventListener("input", refreshActionButtons);
    }

    if (form.elements.password) {
      form.elements.password.addEventListener("input", refreshActionButtons);
    }

    if (form.elements.confirm_password) {
      form.elements.confirm_password.addEventListener("input", refreshActionButtons);
    }

    if (updateButton) {
      updateButton.addEventListener("click", async function () {
        var authState = await client.auth.getUser();
        if (authState.error || !authState.data || !authState.data.user) {
          setStatus(status, "Sign in first to edit profile settings.", "warning");
          return;
        }

        var user = authState.data.user;
        var handle = getValue(form, "handle").toLowerCase();
        var password = form.elements.password ? form.elements.password.value : "";
        var confirmPassword = form.elements.confirm_password ? form.elements.confirm_password.value : "";

        if (!handle) {
          setStatus(status, "Profile handle is required.", "warning");
          return;
        }

        var passwordProvided = !!password || !!confirmPassword;
        var handlerChanged = handle !== initialHandle;

        if (!handlerChanged && !passwordProvided) {
          setStatus(status, "No changes to save.", "warning");
          return;
        }

        if (passwordProvided) {
          if (!password || !confirmPassword) {
            setStatus(status, "Enter and confirm the new password.", "warning");
            return;
          }

          if (password !== confirmPassword) {
            setStatus(status, "Passwords do not match.", "warning");
            return;
          }

          if (!hasValidPasswordLength(password)) {
            setStatus(status, "Password must be longer than 4 characters.", "warning");
            return;
          }
        }

        if (handlerChanged) {
          var existingHandler = await getExistingHandler(client, handle, user.id);
          if (existingHandler) {
            setStatus(status, "User handler already exist choose another.", "warning");
            return;
          }
        }

        var saveResult = await client.from("user_profiles").upsert(
          {
            id: user.id,
            email: user.email || "",
            handle: handle,
            display_name: handle
          },
          {
            onConflict: "id"
          }
        );

        if (saveResult.error) {
          setStatus(status, saveResult.error.message, "error");
          return;
        }

        initialHandle = handle;

        if (passwordProvided) {
          var passwordResult = await client.auth.updateUser({ password: password });
          if (passwordResult.error) {
            setStatus(status, passwordResult.error.message, "error");
            return;
          }

          if (form.elements.password) {
            form.elements.password.value = "";
          }

          if (form.elements.confirm_password) {
            form.elements.confirm_password.value = "";
          }
        }

        setStatus(status, "Profile updated successfully.", "success");
        await loadCurrentProfile();

        if (window.roadmapState && typeof window.roadmapState.refresh === "function") {
          await window.roadmapState.refresh();
        }
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", function () {
        window.location.href = getRoadmapIndexUrl();
      });
    }

    loadCurrentProfile();

    if (window.roadmapState && typeof window.roadmapState.refresh === "function") {
      window.roadmapState.refresh();
    }
  }

  function wireEmailLockHelp() {
    var trigger = document.getElementById("profile-email-help");
    var note = document.getElementById("profile-email-lock-note");
    var sageButton = document.getElementById("profile-email-note-sage");
    var closeButton = document.getElementById("profile-email-note-close");

    if (!trigger || !note) {
      return;
    }

    function showNote() {
      note.hidden = false;
    }

    function hideNote() {
      note.hidden = true;
    }

    trigger.addEventListener("click", function () {
      if (note.hidden) {
        showNote();
      } else {
        hideNote();
      }
    });

    if (sageButton) {
      sageButton.addEventListener("click", function () {
        hideNote();
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", function () {
        hideNote();
      });
    }
  }

  function configureResetPage(client) {
    var requestSection = document.getElementById("reset-request-panel");
    var recoverySection = document.getElementById("reset-password-panel");
    var requestForm = document.getElementById("roadmap-reset-request-form");
    var recoveryForm = document.getElementById("roadmap-reset-form");

    if (!requestSection && !recoverySection && !requestForm && !recoveryForm) {
      return;
    }

    if (requestForm) {
      handleResetRequest(requestForm, client);
    }

    if (recoveryForm) {
      handleResetPassword(recoveryForm, client);
    }

    if (window.roadmapState && typeof window.roadmapState.refresh === "function") {
      window.roadmapState.refresh().then(function () {
        var hasUser = !!(window.roadmapState.getUser && window.roadmapState.getUser());

        if (requestSection) {
          requestSection.hidden = hasUser;
        }

        if (recoverySection) {
          recoverySection.hidden = !hasUser;
        }

        if (!hasUser && recoverySection) {
          recoverySection.hidden = true;
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var client = window.supabaseClient;
    var status = document.getElementById("auth-status");

    if (!client) {
      setStatus(status, "Supabase is not configured. Update assets/js/supabase-config.js.", "warning");
      return;
    }

    var loginForm = document.getElementById("roadmap-login-form");
    var profileForm = document.getElementById("roadmap-profile-form");
    var registerForm = document.getElementById("roadmap-register-form");

    if (loginForm) {
      handleLogin(loginForm, client);
    }

    if (profileForm) {
      handleProfile(profileForm, client);
    }

    if (registerForm) {
      handleRegister(registerForm, client);
    }

    configureResetPage(client);
    wireEmailLockHelp();

    wirePasswordVisibility();
  });
})();
