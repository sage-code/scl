(function () {
  var cfg = window.SUPABASE_CONFIG || window.__SUPABASE_CONFIG__ || {};

  function isPlaceholder(value) {
    return !value || String(value).indexOf("your-") !== -1;
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.warn("Supabase client library is not loaded.");
    return;
  }

  if (isPlaceholder(cfg.url) || isPlaceholder(cfg.anonKey)) {
    console.warn("Supabase config is missing. Set window.__SUPABASE_CONFIG__ or update assets/js/supabase-config.js.");
    return;
  }

  window.supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
    db: { schema: cfg.schema || "public" },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
})();
