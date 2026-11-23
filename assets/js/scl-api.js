// Browser client for the Sage-Code roadmap API (/api/*, Vercel + Turso).
// Every call resolves to { data, error } and never throws, so callers can stay simple.
(function () {
  async function request(method, path, body) {
    var options = {
      method: method,
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    };

    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    try {
      var response = await fetch(path, options);
      var payload = {};
      try {
        payload = await response.json();
      } catch (_error) {
        payload = {};
      }

      if (!response.ok) {
        return { data: null, error: { status: response.status, message: extractErrorMessage(payload, response.status) } };
      }

      return { data: payload, error: null };
    } catch (error) {
      return { data: null, error: { status: 0, message: "Network error. Check your connection and try again." } };
    }
  }

  function extractErrorMessage(payload, status) {
    if (payload && typeof payload.error === "string" && payload.error) {
      return payload.error;
    }
    if (payload && payload.error && typeof payload.error.message === "string" && payload.error.message) {
      return payload.error.message;
    }
    if (payload && typeof payload.message === "string" && payload.message) {
      return payload.message;
    }
    return "Request failed (" + status + ")";
  }

  function query(params) {
    var parts = [];
    Object.keys(params).forEach(function (key) {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
      }
    });
    return parts.length ? "?" + parts.join("&") : "";
  }

  function post(path, body) {
    return request("POST", path, body || {});
  }

  window.sclApi = {
    auth: {
      session: function () { return request("GET", "/api/auth/session/"); },
      anonymous: function () { return post("/api/auth/anonymous/"); },
      checkHandle: function (handle) { return request("GET", "/api/auth/check/" + query({ handle: handle })); },
      register: function (handle, email, password, website) {
        return post("/api/auth/register/", { handle: handle, email: email, password: password, website: website || "" });
      },
      resendConfirmation: function () { return post("/api/auth/resend/"); },
      login: function (email, password) { return post("/api/auth/login/", { email: email, password: password }); },
      logout: function () { return post("/api/auth/logout/"); },
      forgot: function (email) { return post("/api/auth/forgot/", { email: email }); },
      reset: function (token, password) { return post("/api/auth/reset/", { token: token, password: password }); },
      updateProfile: function (changes) { return post("/api/auth/profile/", changes); },
      deleteAccount: function (password) { return post("/api/auth/delete/", { password: password }); }
    },
    progress: {
      list: function (roadmap, prefix) { return request("GET", "/api/progress/" + query({ roadmap: roadmap, prefix: prefix })); },
      upsert: function (roadmap, rows, replacePrefix) { return post("/api/progress/", { roadmap: roadmap, rows: rows, replace_prefix: replacePrefix }); },
      remove: function (roadmap, options) {
        var opts = options || {};
        return post("/api/progress/", { action: "delete", roadmap: roadmap, keys: opts.keys, prefix: opts.prefix });
      }
    },
    favorites: {
      list: function (roadmap) { return request("GET", "/api/favorites/" + query({ roadmap: roadmap })); },
      upsert: function (roadmap, rows) { return post("/api/favorites/", { roadmap: roadmap, rows: rows }); },
      remove: function (roadmap, keys) { return post("/api/favorites/", { action: "delete", roadmap: roadmap, keys: keys }); }
    },
    profile: {
      uploadAvatar: async function (file) {
        try {
          var response = await fetch("/api/profile/avatar/", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
              "Content-Type": file.type || "application/octet-stream"
            },
            body: file
          });
          var payload = await response.json().catch(function () { return {}; });
          if (!response.ok) {
            return { data: null, error: { status: response.status, message: extractErrorMessage(payload, response.status) } };
          }
          return { data: payload, error: null };
        } catch (_error) {
          return { data: null, error: { status: 0, message: "Network error. Check your connection and try again." } };
        }
      },
      removeAvatar: function () { return request("DELETE", "/api/profile/avatar/"); }
    },
    roadmap: {
      learners: function () { return request("GET", "/api/roadmap/learners/"); },
      leaderboard: function () { return request("GET", "/api/roadmap/leaderboard/"); }
    },
    projects: {
      list: function () { return request("GET", "/api/projects/"); },
      save: function (project) { return post("/api/projects/", project); },
      remove: function (id) { return post("/api/projects/", { action: "delete", id: id }); },
      join: function (projectId) { return post("/api/projects/", { action: "join", project_id: projectId }); },
      approveContributor: function (requestId, approved) {
        return post("/api/projects/", { action: "approve", request_id: requestId, approved: Boolean(approved) });
      },
      leaveProject: function (requestId) { return post("/api/projects/", { action: "leave", request_id: requestId }); },
      cancelProject: function (projectId) { return post("/api/projects/", { action: "cancel", project_id: projectId }); }
    },
    community: {
      profile: function () { return request("GET", "/api/community/profile/"); },
      saveProfile: function (profile) { return post("/api/community/profile/", profile); },
      removeAvatar: function () { return request("DELETE", "/api/community/avatar/"); },
      directory: function () { return request("GET", "/api/community/directory/"); },
      member: function (userId) { return request("GET", "/api/community/member/" + query({ user_id: userId })); },
      addTestimonial: function (userId, content) { return post("/api/community/testimonial/", { user_id: userId, content: content }); },
      updateTestimonial: function (id, content) { return request("PATCH", "/api/community/testimonial/", { id: id, content: content }); },
      deleteTestimonial: function (id) { return request("DELETE", "/api/community/testimonial/" + query({ id: id })); },
      uploadAvatar: async function (file) {
        try {
          var response = await fetch("/api/community/avatar/", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
              "Content-Type": file.type || "application/octet-stream"
            },
            body: file
          });
          var payload = await response.json().catch(function () { return {}; });
          if (!response.ok) {
            return { data: null, error: { status: response.status, message: extractErrorMessage(payload, response.status) } };
          }
          return { data: payload, error: null };
        } catch (_error) {
          return { data: null, error: { status: 0, message: "Network error. Check your connection and try again." } };
        }
      },
      trackLabel: function (track) {
        var labels = {
          ada: "Ada", assembly: "Assembly", bash: "Bash", c: "C", cpp: "C++",
          cse: "CSE", csharp: "C#", css: "CSS", dart: "Dart", dba: "DBA",
          dsa: "DSA", dsl: "DSL", elixir: "Elixir", flutter: "Flutter",
          fortran: "Fortran", go: "Go", hpc: "HPC", html: "HTML", java: "Java",
          javascript: "JavaScript", julia: "Julia", kotlin: "Kotlin", nim: "Nim",
          node: "Node.js", odin: "Odin", osd: "OSD", pgp: "PGP", php: "PHP",
          plsql: "PL/SQL", python: "Python", react: "React", ruby: "Ruby",
          rust: "Rust", scala: "Scala", sml: "SML", svelte: "Svelte",
          swift: "Swift", tek: "TechOps", tscript: "TypeScript", vue: "Vue",
          wasm: "WebAssembly", zig: "Zig"
        };
        return labels[track] || track;
      }
    }
  };
})();
