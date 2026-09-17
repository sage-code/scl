# 10_enum_and_stream.exs — What this shows: eager Enum pipelines vs
#   lazy Stream pipelines on the same data, and when each wins.
#   Run: elixir demo/core/10_enum_and_stream.exs

orders = [
  %{id: 1, user: "ada", total: 120, status: :paid},
  %{id: 2, user: "grace", total: 80, status: :pending},
  %{id: 3, user: "ada", total: 200, status: :paid},
  %{id: 4, user: "linus", total: 60, status: :refunded}
]

# EAGER: each Enum.* pass materializes a full intermediate list.
paid_total =
  orders
  |> Enum.filter(&(&1.status == :paid))
  |> Enum.map(& &1.total)
  |> Enum.sum()
IO.inspect(paid_total, label: "eager total")

# LAZY: Stream builds the pipeline description first; elements flow
# through all steps one at a time. Constant memory, early exit.
first_paid_large =
  orders
  |> Stream.filter(&(&1.status == :paid))
  |> Stream.filter(&(&1.total > 100))    # would stop early even on a huge file
  |> Enum.take(1)
IO.inspect(first_paid_large, label: "lazy first match")

# Infinite generators only work lazily:
Stream.iterate(1, &(&1 * 2))
|> Stream.map(&"2^#{:math.log2(&1) |> round()} = #{&1}")
|> Stream.take(5)
|> Enum.to_list()
|> IO.inspect(label: "powers of two")

# reduce: the universal fold — grouping without map/update boilerplate:
orders
|> Enum.reduce(%{}, fn
  %{status: :paid, user: u, total: t}, acc ->
    Map.update(acc, u, t, &(&1 + t))
  _other, acc -> acc
end)
|> IO.inspect(label: "totals by user (paid only)")

# Chunking and grouping — everyday data prep:
1..10 |> Enum.chunk_every(3) |> IO.inspect(label: "chunk_every")
Enum.group_by(orders, & &1.status, & &1.id) |> IO.inspect(label: "group_by")
