# 30_telemetry.exs — What this shows: :telemetry events and handlers
#   — the observability idiom every Elixir library uses.
#   Run: elixir demo/concurrency/30_telemetry.exs

# 1) Attach a handler BEFORE executing events (attach is global).
:telemetry.attach(
  "demo-handler",                        # unique handler id
  [:demo, :job, :stop],                  # event name — a list, with :start/:stop convention
  fn event, measurements, metadata, _config ->
    # Runs SYNCHRONOUSLY in the emitting process — keep it fast.
    duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)
    IO.puts("[#{Enum.join(event, ":")}] job=#{metadata.job} took=#{duration_ms}ms")
  end,
  nil                                    # handler config, passed through
)

# 2) Instrument your own code with the standard start/stop shape:
defmodule Job do
  def run(name, fun) do
    start = System.monotonic_time()

    result = fun.()                      # the actual work

    # measurements (numbers) and metadata (context) are separate:
    :telemetry.execute([:demo, :job, :stop], %{duration: System.monotonic_time() - start},
                       %{job: name})
    result
  end
end

Job.run("fast", fn -> Enum.sum(1..1_000) end)
Job.run("slow", fn -> Process.sleep(50); :done end)

# 3) Measure the distribution, not just the mean — durations as a
#    list would go to metrics in real code:
durations =
  for _ <- 1..20 do
    {t, _} = :timer.tc(fn -> Process.sleep(Enum.random(0..20)) end)
    t / 1000
  end

sorted = Enum.sort(durations)
p50 = Enum.at(sorted, div(length(sorted), 2))
p99 = Enum.at(sorted, length(sorted) - 1)
IO.puts("p50=#{p50}ms p99=#{p99}ms  <- latency percentiles matter, not averages")

# In production: Phoenix/Ecto/Oban already emit standard events.
# Attach handlers -> telemetry_metrics -> Prometheus or LiveDashboard.
# Never instrument by hand what a library already emits.
