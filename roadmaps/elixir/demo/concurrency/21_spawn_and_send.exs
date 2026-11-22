# 21_spawn_and_send.exs — What this shows: raw processes — spawn,
#   send, receive with timeout, and the mailbox model.
#   Run: elixir demo/concurrency/21_spawn_and_send.exs

# A process is a function that loops, waiting for messages.
defmodule Counter do
  def loop(count) do
    receive do
      {:increment, caller} ->
        # Reply directly into the caller's mailbox:
        send(caller, {:ok, count + 1})
        loop(count + 1)              # tail call keeps the process alive

      {:get, caller} ->
        send(caller, {:count, count})
        loop(count)

      :stop ->
        IO.puts("counter stopping at #{count}")
        :ok                          # returning ends the process
    end
  end
end

pid = spawn(Counter, :loop, [0])
IO.inspect(Process.alive?(pid), label: "spawned and alive")

# send/2 puts a message in the mailbox; receive takes it out.
send(pid, {:increment, self()})
send(pid, {:increment, self()})

receive do
  {:ok, n} -> IO.inspect(n, label: "first reply")
end

send(pid, {:get, self()})
receive do
  {:count, n} -> IO.inspect(n, label: "current count")
after
  # `after` gives receive a deadline — never trust infinite waits:
  1_000 -> IO.puts("timeout!")
end

# Messages arrive in ANY order — match by shape, not position:
send(self(), :later)
send(self(), :earlier)
receive do :later -> IO.puts("got :later") end
receive do :earlier -> IO.puts("got :earlier") end

send(pid, :stop)
Process.sleep(50)                    # give it a moment to print
IO.inspect(Process.alive?(pid), label: "after :stop")
