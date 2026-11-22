# 28_registry.exs — What this shows: Registry for dynamic names,
#   unique vs duplicate keys, and via-tuple dispatch.
#   Run: elixir demo/concurrency/28_registry.exs

defmodule Chat do
  use GenServer

  def start_link(room) do
    # Child spec pairs with Registry unique keys: one process per room.
    GenServer.start_link(__MODULE__, room, name: via(room))
  end

  # via-tuples are the standard Registry naming scheme:
  def via(room), do: {:via, Registry, {DemoRegistry, room}}

  @impl true
  def init(room), do: {:ok, %{room: room, log: []}}

  @impl true
  def handle_call({:say, text}, _from, state) do
    {:reply, :ok, %{state | log: [text | state.log]}}
  end

  @impl true
  def handle_call(:count, _from, state), do: {:reply, length(state.log), state}
end

# keys: :unique — a name maps to AT MOST one process (per-entity state).
{:ok, _} = Registry.start_link(keys: :unique, name: DemoRegistry)

{:ok, _} = Chat.start_link("general")
{:ok, _} = Chat.start_link("random")

# Send through the NAME — no pid bookkeeping anywhere:
GenServer.call(Chat.via("general"), {:say, "hi"})
GenServer.call(Chat.via("general"), {:say, "again"})
IO.inspect(GenServer.call(Chat.via("general"), :count), label: "general log")

# Lookups return [{pid, value}]; [] means nobody registered:
IO.inspect(Registry.lookup(DemoRegistry, "general"), label: "lookup general")
IO.inspect(Registry.lookup(DemoRegistry, "missing"), label: "lookup missing")

# keys: :duplicate — many processes per name: PubSub in ~10 lines.
{:ok, _} = Registry.start_link(keys: :duplicate, name: DemoPubSub)

# Two subscribers (here: the script process registering itself):
Registry.register(DemoPubSub, "prices", :ok)

# Dispatch to ALL processes registered under the key:
Registry.dispatch(DemoPubSub, "prices", fn entries ->
  for {pid, _} <- entries do
    send(pid, {:tick, 67_000})
  end
end)

receive do
  {:tick, price} -> IO.inspect(price, label: "pubsub received")
end

# This duplicate-key pattern IS what Phoenix.PubSub does, cluster-wide.
