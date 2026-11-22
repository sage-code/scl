# 26_supervisor.exs — What this shows: a one_for_one supervision
#   tree, child specs, restart intensity, and observing restarts.
#   Run: elixir demo/concurrency/26_supervisor.exs

defmodule FlakyWorker do
  use GenServer

  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)

  @impl true
  def init(opts) do
    # Keep the caller supplied so the demo can kill a specific child.
    {:ok, %{name: Keyword.fetch!(opts, :name), failures: Keyword.get(opts, :fail, false)}}
  end

  @impl true
  def handle_call(:crash, _from, state) do
    raise "worker #{state.name} crashing on purpose"
    {:noreply, state}
  end

  @impl true
  def handle_call(:who, _from, state), do: {:reply, state.name, state}
end

defmodule Demo.Sup do
  use Supervisor

  def start_link(_), do: Supervisor.start_link(__MODULE__, nil, name: __MODULE__)

  @impl true
  def init(_) do
    children = [
      # A Task.Supervisor is just a supervised pool — very common child.
      {Task.Supervisor, name: Demo.TaskSup},
      # Each child spec carries restart semantics:
      {FlakyWorker, name: :alpha},
      %{id: :beta, start: {FlakyWorker, :start_link, [[name: :beta]]},
        restart: :permanent}
    ]

    # max_restarts/max_seconds: a crash LOOP takes the supervisor down
    # (escalating to ITS parent) instead of spinning forever.
    Supervisor.init(children, strategy: :one_for_one, max_restarts: 3, max_seconds: 5)
  end
end

{:ok, _} = Supervisor.start_link(Demo.Sup, [])

# Identify a child and ask it who it is:
[{_, alpha, _, _} | _] = Supervisor.which_children(Demo.Sup)
IO.inspect(GenServer.call(alpha, :who), label: "child identity")

# Crash it — the supervisor restarts ONLY this child (one_for_one):
GenServer.call(alpha, :crash)
Process.sleep(100)

[{_, alpha_new, _, _} | _] = Supervisor.which_children(Demo.Sup)
IO.puts("restarted child is a NEW pid: #{alpha != alpha_new}")
IO.inspect(GenServer.call(alpha_new, :who), label: "back up with fresh state")

# The restarted state is INIT's — anything in memory is GONE.
# Persist what matters (see the study projects).
IO.inspect(Supervisor.count_children(Demo.Sup), label: "children after crash")
