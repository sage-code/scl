# 23_tasks.exs — What this shows: Task.async/await, supervised
#   tasks, and bounded pools with Task.async_stream.
#   Run: elixir demo/concurrency/23_tasks.exs

# --- Fire concurrent computations, await the results in order ---
square = fn n -> n * n end

results =
  [1, 2, 3, 4]
  |> Enum.map(&Task.async(fn -> square.(&1) end))   # starts immediately
  |> Enum.map(&Task.await(&1, 1_000))
IO.inspect(results, label: "awaited in order")

# --- Bounded concurrency: 10k jobs, max 5 in flight ---
jobs = 1..10_000

{micros, summary} =
  :timer.tc(fn ->
    jobs
    |> Task.async_stream(fn n -> n * 2 end,
      max_concurrency: 5,       # never more than 5 running
      timeout: 2_000,           # per-job timeout
      on_timeout: :kill_task,   # a slow job dies, the run continues
      order: false              # yield results as they complete
    )
    |> Enum.reduce(0, fn
      {:ok, _}, acc -> acc + 1
      {:exit, _}, acc -> acc + 1
    end)
  end)

IO.puts("#{summary} jobs through a pool of 5 in #{micros / 1000}ms")

# --- Supervised tasks: crashes do not take the caller down ---
{:ok, sup} = Task.Supervisor.start_link(name: DemoTaskSup)

task = Task.Supervisor.async(DemoTaskSup, fn -> raise "worker failed" end)

# Task.yield returns {:ok, _} | {:exit, reason} | nil (timeout):
outcome = Task.yield(task, 500) || Task.shutdown(task)
IO.inspect(outcome, label: "supervised task outcome")

# --- Timeout handling pattern for real callers ---
long = Task.async(fn -> Process.sleep(2_000); :done end)
case Task.yield(long, 200) || Task.shutdown(long, :brutal_kill) do
  {:ok, result} -> IO.inspect(result, label: "finished in time")
  nil -> IO.puts("timed out and killed — caller never blocked the pool")
end
