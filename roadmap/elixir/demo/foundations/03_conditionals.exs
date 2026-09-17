# 03_conditionals.exs — What this shows: if/unless, cond, case, and
#   why pattern matching usually replaces all three.
#   Run: elixir demo/foundations/03_conditionals.exs

defmodule Traffic do
  # 1) if/unless — for simple, boolean conditions.
  def allow?(age) when is_integer(age) do
    if age >= 18, do: :granted, else: :denied
  end

  # 2) cond — the else-if ladder; first truthy condition wins.
  def fare(km) do
    cond do
      km == 0 -> {:error, :zero_distance}
      km < 5 -> :base
      km < 20 -> :standard
      true -> :long_haul        # `true` is the default branch
    end
  end

  # 3) case — match on SHAPES, not just values. Preferred in real code.
  def describe({:ok, value}), do: "success: #{value}"
  def describe({:error, :timeout}), do: "took too long"
  def describe({:error, reason}), do: "failed: #{reason}"
end

# Demonstrating each — note the matching is on tuple SHAPE:
IO.inspect(Traffic.allow?(16))
IO.inspect(Traffic.fare(0))
IO.inspect(Traffic.fare(99))
IO.puts(Traffic.describe({:ok, 42}))
IO.puts(Traffic.describe({:error, :timeout}))
IO.puts(Traffic.describe({:error, "disk full"}))

# unless exists but reads negatively — prefer `if not` or restructure:
readable = :ok
unless readable == :error, do: IO.puts("all good (unless form)")
