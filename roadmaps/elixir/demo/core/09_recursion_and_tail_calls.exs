# 09_recursion_and_tail_calls.exs — What this shows: body recursion
#   vs tail recursion with an accumulator, and why it matters.
#   Run: elixir demo/core/09_recursion_and_tail_calls.exs

defmodule Rec do
  # BODY recursion: the + runs AFTER the recursive call returns,
  # so every stack frame stays alive until the last one. Fine for
  # small lists; exhausting for millions.
  def sum_body([]), do: 0
  def sum_body([h | t]), do: h + sum_body(t)

  # TAIL recursion: the accumulator carries the partial result and the
  # recursive call is the LAST action. The BEAM reuses the stack frame
  # — constant memory, any length.
  def sum_tail(list), do: do_sum(list, 0)
  defp do_sum([], acc), do: acc
  defp do_sum([h | t], acc), do: do_sum(t, acc + h)

  # Building a list? Prepend and reverse at the end — never append:
  def squares(n), do: do_squares(n, [])
  defp do_squares(0, acc), do: Enum.reverse(acc)
  defp do_squares(n, acc), do: do_squares(n - 1, [n * n | acc])

  # Tree-walking recursion (directories, JSON) is naturally body style:
  def depth(%{children: []}), do: 1
  def depth(%{children: kids}) do
    1 + Enum.map(kids, &depth/1) |> Enum.max()
  end
end

IO.inspect(Rec.sum_body([1, 2, 3, 4]))
IO.inspect(Rec.sum_tail(Enum.to_list(1..10)))
IO.inspect(Rec.squares(5))

deep = %{children: [%{children: [%{children: []}]}, %{children: []}]}
IO.inspect(Rec.depth(deep), label: "tree depth")

# Proof of constant memory: a million-element tail sum succeeds.
# (A body-recursive version would blow the stack around ~1M frames.)
big = Enum.to_list(1..1_000_000)
IO.inspect(Rec.sum_tail(big), label: "1M tail sum")
