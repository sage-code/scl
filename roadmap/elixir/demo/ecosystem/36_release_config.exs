# 36_release_config.exs — STUDY DEMO (the file shows the release
#   config layering; the printed part runs anywhere).
#   What this shows: compile-time vs runtime config, and reading
#   app env safely at boot.
#   Run the executable part: elixir demo/ecosystem/36_release_config.exs
#
#   ── config/config.exs (COMPILE-TIME: baked into the release) ─────
#   import Config
#   config :my_app, :defaults, pool_size: 10, scheme: :http
#
#   ── config/runtime.exs (RUNTIME: evaluated at release boot) ──────
#   import Config
#   config :my_app, :defaults,
#     pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
#     secret: System.fetch_env!("APP_SECRET")   # crash fast if missing
#
#   ── Reading it in code ───────────────────────────────────────────
#   Application.get_env(:my_app, :defaults)[:pool_size]

defmodule ConfigReader do
  # The runtime pattern, demonstrated without a mix project:
  def read_int_env(name, default) do
    case System.get_env(name) do
      nil -> default
      "" -> default
      raw ->
        # Fail fast on garbage config — a release that boots with
        # wrong settings is worse than one that refuses to boot.
        case Integer.parse(raw) do
          {n, ""} -> n
          _ -> raise "invalid integer for #{name}: #{inspect(raw)}"
        end
    end
  end
end

pool = ConfigReader.read_int_env("POOL_SIZE", 10)
IO.inspect(pool, label: "pool size (set POOL_SIZE to change)")

# Compile-time trap, demonstrated:
compile_time_value = :http          # imagine config.exs set this
IO.puts("#{compile_time_value} was baked in at COMPILE time —")
IO.puts("runtime.exs cannot change it if a macro/module attribute read it then.")

# The rule:
#   * values used in macros/module attributes  -> config.exs
#   * secrets, env-dependent values            -> runtime.exs
#   * anything else                            -> default in code
