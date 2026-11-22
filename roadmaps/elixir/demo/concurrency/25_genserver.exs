# 25_genserver.exs — What this shows: a complete GenServer with the
#   client/server split, call/cast/info, timeouts, and naming.
#   Run: elixir demo/concurrency/25_genserver.exs

defmodule KV do
  # ── Client API (runs in the CALLER's process) ──────────────────
  def start_link(opts \\ []) do
    # Register under a name so callers never touch pids:
    GenServer.start_link(__MODULE__, %{}, name: Keyword.get(opts, :name, __MODULE__))
  end

  # call = synchronous with timeout; the workhorse.
  def put(key, value), do: GenServer.call(__MODULE__, {:put, key, value})
  def get(key), do: GenServer.call(__MODULE__, {:get, key}, 1_000)  # explicit timeout
  def size, do: GenServer.call(__MODULE__, :size)

  # cast = fire-and-forget: NO delivery guarantee, no back-pressure.
  def clear_async, do: GenServer.cast(__MODULE__, :clear)

  # ── Server callbacks (run in the SERVER's process) ─────────────
  @impl true
  def init(state) do
    # Timers are just messages to yourself:
    Process.send_after(self(), :report, 100)
    {:ok, state}
  end

  @impl true
  def handle_call({:put, k, v}, _from, state) do
    # {reply, new_state} — the reply is the call's return value.
    {:reply, :ok, Map.put(state, k, v)}
  end

  @impl true
  def handle_call({:get, k}, _from, state) do
    {:reply, Map.fetch(state, k), state}
  end

  @impl true
  def handle_call(:size, _from, state) do
    {:reply, map_size(state), state}
  end

  @impl true
  def handle_cast(:clear, _state), do: {:noreply, %{}}

  @impl true
  # handle_info catches EVERYTHING else: timers, monitors, raw sends.
  def handle_info(:report, state) do
    IO.inspect(state, label: "[periodic report]")
    {:noreply, state}
  end
end

# ── Drive the server ──────────────────────────────────────────────
{:ok, _pid} = KV.start_link()
:ok = KV.put(:lang, "elixir")
:ok = KV.put(:vm, "beam")

IO.inspect(KV.get(:lang), label: "get")
IO.inspect(KV.size(), label: "size")

KV.clear_async()
Process.sleep(50)                    # cast is async — give it time
IO.inspect(KV.size(), label: "size after clear")

# Prove the state-loss property: kill the server's process; a
# supervised version would restart with state = %{} (init/1 reruns).
# See 26_supervisor.exs for the full story.
