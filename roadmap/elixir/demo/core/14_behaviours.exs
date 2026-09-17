# 14_behaviours.exs — What this shows: @callback contracts, @impl,
#   and passing modules as dependencies (dependency injection).
#   Run: elixir demo/core/14_behaviours.exs

# A behaviour is a contract for MODULES (protocols are for DATA).
defmodule Notifier do
  @doc "Deliver a message; return :ok or {:error, reason}."
  @callback deliver(String.t(), String.t()) :: :ok | {:error, term()}
  @doc "Human-readable name of this notifier."
  @callback name() :: atom()
end

defmodule ConsoleNotifier do
  @behaviour Notifier

  @impl Notifier        # the compiler warns if the callback is wrong
  def name, do: :console

  @impl Notifier
  def deliver(to, text) do
    IO.puts("[console] to=#{to}: #{text}")
    :ok
  end
end

defmodule DropNotifier do
  @behaviour Notifier

  @impl Notifier
  def name, do: :drop

  @impl Notifier
  def deliver(_to, _text), do: {:error, :mailbox_full}
end

# The caller depends on the CONTRACT, not on a concrete module —
# this is dependency injection without a framework:
defmodule Broadcaster do
  def broadcast(module, recipients, text) do
    results = Enum.map(recipients, &module.deliver(&1, text))
    {module.name(), results}
  end
end

IO.inspect(Broadcaster.broadcast(ConsoleNotifier, ["a@x.io", "b@x.io"], "hi"))
IO.inspect(Broadcaster.broadcast(DropNotifier, ["a@x.io"], "hi"))

# Enumerate the callbacks of a behaviour at runtime (introspection):
IO.inspect(Notifier.behaviour_info(:callbacks), label: "callbacks")

# You already know behaviours: GenServer, Supervisor, and Task are
# behaviours with __using__ macros — see the concurrency demos.
