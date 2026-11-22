# 24_agents.exs — What this shows: Agent as a minimal state holder
#   with atomic get/update semantics.
#   Run: elixir demo/concurrency/24_agents.exs

# An Agent wraps a GenServer whose state is ONE value. The functions
# run INSIDE the agent process, so they serialize automatically.
{:ok, counter} = Agent.start_link(fn -> 0 end)

# get runs the fn in the agent, returns its result:
IO.inspect(Agent.get(counter, & &1), label: "initial")

# update changes the state:
Agent.update(counter, &(&1 + 1))
Agent.update(counter, &(&1 + 1))
IO.inspect(Agent.get(counter, & &1), label: "after two updates")

# get_and_update returns {to_return, new_state} — atomic:
IO.inspect(Agent.get_and_update(counter, fn n -> {n, n * 10} end),
           label: "read before doubling")
IO.inspect(Agent.get(counter, & &1), label: "after doubling")

# A more realistic agent: a rate-limit window.
{:ok, limiter} =
  Agent.start_link(fn -> %{count: 0, reset_at: now_plus(60_000)} end)

allowed? =
  fn limiter ->
    Agent.get_and_update(limiter, fn state ->
      if now() >= state.reset_at do
        # Window expired: reset the counter.
        {true, %{count: 1, reset_at: now_plus(60_000)}}
      else
        {state.count < 100, %{state | count: state.count + 1}}
      end
    end)
  end

IO.inspect(Enum.map(1..3, fn _ -> allowed?.(limiter) end), label: "three checks")

defp now_plus(ms), do: now() + ms
defp now, do: System.system_time(:millisecond)

# When to graduate to GenServer: multiple operations, timers, or
# invariants. The agent holds A value; a GenServer owns A protocol.
