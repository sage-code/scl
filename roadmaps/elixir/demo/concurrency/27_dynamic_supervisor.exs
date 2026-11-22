# 27_dynamic_supervisor.exs — What this shows: starting supervised
#   children at RUNTIME — one process per entity — and stopping them.
#   Run: elixir demo/concurrency/27_dynamic_supervisor.exs

defmodule Session do
  use GenServer

  def start_link(user_id) do
    GenServer.start_link(__MODULE__, user_id)
  end

  @impl true
  def init(user_id) do
    IO.puts("  session started for user #{user_id}")
    {:ok, %{user: user_id, messages: []}}
  end

  @impl true
  def handle_call({:say, text}, _from, state) do
    {:reply, :ok, %{state | messages: [text | state.messages]}}
  end

  @impl true
  def handle_call(:count, _from, state), do: {:reply, length(state.messages), state}

  @impl true
  def terminate(_reason, state) do
    IO.puts("  session for user #{state.user} ended (#{length(state.messages)} msgs)")
    :ok
  end
end

{:ok, sup} = DynamicSupervisor.start_link(name: DemoSessions)

# Start sessions on demand — each is now SUPERVISED:
{:ok, s1} = DynamicSupervisor.start_child(sup, {Session, 42})
{:ok, s2} = DynamicSupervisor.start_child(sup, {Session, 7})

GenServer.call(s1, {:say, "hello"})
GenServer.call(s1, {:say, "world"})
IO.inspect(DynamicSupervisor.count_children(sup), label: "live sessions")

# Crash one — a crash-looping session would restart per its policy;
# a CLEAN session exit would not (restart: :transient if specified).
Process.exit(s2, :kill)
Process.sleep(100)
IO.inspect(DynamicSupervisor.count_children(sup), label: "after killing one")

# Graceful shutdown of a session:
DynamicSupervisor.terminate_child(sup, s1)
Process.sleep(50)
IO.inspect(DynamicSupervisor.count_children(sup), label: "after terminate")

# Pair with a Registry for name-based lookup: register each session
# under its user_id (see 28_registry.exs).
