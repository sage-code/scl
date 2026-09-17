# 35_oban_worker.exs — STUDY DEMO (needs PostgreSQL + a repo to run).
#   What this shows: Oban job definition, queues, retries, unique
#   jobs, and scheduled work — production background processing.
#   In a real project: add {:oban, "~> 2.18"} and {:ecto_sql, "~> 3.12"},
#   configure the repo, run `mix ecto.migrate`, then boot the app.
#
#   ── config/config.exs ──────────────────────────────────────────
#   config :my_app, Oban,
#     engine: Oban.Engines.Basic,
#     queues: [default: 10, mailers: 5],
#     repo: MyApp.Repo
#
#   ── application.ex (mount in the supervision tree) ─────────────
#   children = [MyApp.Repo, {Oban, Application.fetch_env!(:my_app, Oban)}]

defmodule MyApp.Jobs.EmailWorker do
  use Oban.Worker,
    queue: :mailers,
    max_attempts: 5,             # 5 tries with growing backoff
    unique: [period: 60]         # dedupe same-args jobs for 60s

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"email" => to, "text" => text}} = job) do
    case deliver(to, text) do
      :ok ->
        :ok
      # Returning {:error, _} schedules a RETRY with backoff —
      # transient failures (SMTP hiccup) recover automatically.
      {:error, reason} ->
        if job.attempt >= job.max_attempts do
          # Out of tries: alert instead of retrying forever.
          Logger.error("email to #{to} permanently failed: #{reason}")
          :ok                      # handled; do not retry again
        else
          {:error, reason}
        end
    end
  end

  defp deliver(to, text) do
    # A real integration would call SMTP or an email API here and
    # return :ok or {:error, reason} — Swoosh/Bamboo wrap that call.
    _ = {to, text}
    :ok
  end
end

# ── Enqueuing (from controllers, contexts, other jobs) ─────────────
# %{"email" => "ada@x.io", "text" => "welcome!"}
# |> MyApp.Jobs.EmailWorker.new()
# |> Oban.insert()

# ── What to study in the real thing ────────────────────────────────
# 1. Jobs are ROWS in Postgres: insert + polling + FOR UPDATE SKIP
#    LOCKED = durable queue with no Redis dependency.
# 2. Cancellation, priorities, and per-queue concurrency are all
#    just columns — read oban's schema in its migrations.
# 3. Oban.Pro (paid) adds workflows/flows on the same foundations.

IO.puts("This demo is written to be read — see the header for setup steps.")
