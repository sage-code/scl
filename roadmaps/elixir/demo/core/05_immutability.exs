# 05_immutability.exs — What this shows: rebinding vs mutation,
#   the update syntax, and structural sharing in practice.
#   Run: elixir demo/core/05_immutability.exs

original = %{a: 1, b: 2}

# "Update" returns a NEW map; the old one is untouched.
updated = Map.put(original, :c, 3)
IO.inspect(original, label: "original (unchanged)")
IO.inspect(updated, label: "updated (new map)")

# Rebinding: the NAME points to a different value. The old value
# still exists for anyone holding it.
counter = 0
counter = counter + 1     # rebinding, not mutation
IO.inspect(counter, label: "counter")

# The struct update syntax | requires the key to EXIST — a typo
# becomes a KeyError at runtime instead of silent data loss.
account = %{balance: 100}
account = %{account | balance: account.balance - 30}
IO.inspect(account, label: "after withdrawal")

# Map.update applies a function to an existing key; Map.put_new
# handles first insertion. Together they cover most counters.
word_counts = %{}
word_counts = Map.update(word_counts, "elixir", 1, &(&1 + 1))
word_counts = Map.update(word_counts, "elixir", 1, &(&1 + 1))
IO.inspect(word_counts, label: "counts")

# Structural sharing: "copying" is cheap because only the changed
# path is new. Demonstrate with a large map and timing.
big = Map.new(1..200_000, &{&1, &1 * 2})
{micros, _} = :timer.tc(fn -> Map.put(big, 200_001, :new) end)
IO.puts("copying a 200k map took #{micros}µs — that is structural sharing")
