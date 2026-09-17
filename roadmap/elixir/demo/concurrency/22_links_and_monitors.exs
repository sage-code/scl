# 22_links_and_monitors.exs — What this shows: crash propagation
#   with links, monitors with :DOWN, and trapping exits.
#   Run: elixir demo/concurrency/22_links_and_monitors.exs

# --- Monitors: observe a death without dying yourself ---
child = spawn(fn ->
  receive do
    :crash -> raise "boom"
  end
end)

ref = Process.monitor(child)
send(child, :crash)

receive do
  {:DOWN, ^ref, :process, ^child, reason} ->
    # ^ref pins the binding: we require THIS monitor's message.
    IO.puts("monitored child died: #{inspect(reason)}")
end
IO.puts("our process is still alive: #{Process.alive?(self()) |> to_string()}")

# --- Links: a crash on one side kills the other (default) ---
# (Uncomment to see the whole script die — that is the point.)
# spawn_link(fn -> raise "takes the caller down too" end)
# Process.sleep(100)

# --- Trap exits: turn death signals into messages ---
defmodule Guardian do
  def loop do
    process_flag(:trap_exit, true)   # exit signals become {:EXIT, from, reason} messages
    receive do
      {:EXIT, from, reason} ->
        IO.puts("guardian saw #{inspect(from)} exit: #{inspect(reason)}")
        loop()
      :stop -> :ok
    end
  end
end

guardian = spawn(Guardian, :loop, [])
trapped = spawn_link(fn ->
  Process.sleep(50)
  exit(:normal_shutdown)             # even a :normal exit becomes a message
end)
Process.sleep(200)
send(guardian, :stop)

# Summary: links build SUPERVISION (restart trees); monitors build
# request/response and reconnection logic. Next demos wrap both.
