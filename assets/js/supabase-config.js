// Browser Supabase configuration for this static site.
//
// Preferred setup:
// - Keep this file in the repo with non-secret defaults or placeholders.
// - Override it at deploy time by generating `window.SUPABASE_CONFIG` from
//   Vercel environment variables if you want to avoid editing the file manually.
//
// Supported sources, in priority order:
// 1. window.__SUPABASE_CONFIG__ (injected at runtime)
// 2. existing window.SUPABASE_CONFIG
// 3. the defaults below
(function () {
  var defaults = {
    url: "https://your-project-ref.supabase.co",
    anonKey: "your-anon-key",
    schema: "public"
  };

  var runtimeConfig = window.__SUPABASE_CONFIG__ || window.SUPABASE_CONFIG || {};

  window.SUPABASE_CONFIG = {
    url: runtimeConfig.url || defaults.url,
    anonKey: runtimeConfig.anonKey || defaults.anonKey,
    schema: runtimeConfig.schema || defaults.schema
  };
})();
