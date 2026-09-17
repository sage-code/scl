# 06_pattern_matching.exs — What this shows: the match operator,
#   destructuring every core type, and the pin operator.
#   Run: elixir demo/core/06_pattern_matching.exs

# = matches. Literals on the left must equal the right.
:ok = :ok

# Destructuring — the pattern extracts AND binds in one step:
{name, age} = {"Ada", 36}
[first, second | rest] = [1, 2, 3, 4]
IO.inspect({name, age, first, second, rest})

# Nested patterns reach into any structure:
%{"user" => %{name: user_name, roles: [role | _]}} =
  %{"user" => %{"name" => "Grace", "roles" => [:admin, :user]}}
IO.inspect({user_name, role}, label: "nested match")

# Pin: ^ reuses an EXISTING binding instead of rebinding.
expected = 42
^expected = 21 * 2        # ok — matches the current value of expected

attempts = 0
# attempts = 3 would REBIND; ^attempts = 3 asserts instead:
case 3 do
  ^attempts -> IO.puts("unreachable: attempts is still 0")
  fresh -> IO.inspect(fresh, label: " rebound (no pin)")
end

# The underscore discards; underscore-prefixed names bind but mark intent:
{:ok, _content} = {:ok, "payload"}

# Matching function clauses — the workhorse of Elixir design:
defmodule Shape do
  def area({:circle, r}), do: 3.14159 * r * r
  def area({:rect, w, h}), do: w * h
  def area(unknown), do: {:error, {:unknown_shape, unknown}}
end
IO.inspect(Shape.area({:circle, 2}))
IO.inspect(Shape.area({:rect, 3, 4}))
IO.inspect(Shape.area("triangle?"))
