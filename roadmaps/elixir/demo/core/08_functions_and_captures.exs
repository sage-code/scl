# 08_functions_and_captures.exs — What this shows: defaults, the
#   & capture shorthand, and closures over bindings.
#   Run: elixir demo/core/08_functions_and_captures.exs

defmodule Text do
  # Default arguments via `\\` — head clause declares them:
  def wrap(text, width \\ 20, marker \\ "> ")
  def wrap(text, width, marker) when byte_size(text) <= width do
    "#{marker}#{text}"
  end
  def wrap(text, _width, marker) do
    # String.chunk every `width` chars (naive wrap for the demo):
    text
    |> String.split(" ")
    |> Enum.chunk_while("", fn word, acc ->
      if byte_size(acc) + byte_size(word) > 20,
        do: {:cont, acc, word}, else: {:cont, acc <> " " <> word}
    end, fn acc -> {:cont, acc, ""} end, fn acc -> acc end)
    |> Enum.join("\n#{marker}")
    |> then(&("#{marker}#{&1}"))
  end
end

IO.puts(Text.wrap("short"))
IO.puts(Text.wrap("a much longer text that must wrap across lines"))

# Anonymous functions: fn a, b -> a + b end, called with a dot:
add = fn a, b -> a + b end
IO.inspect(add.(2, 3), label: "fn")

# Capture shorthand builds functions from expressions:
double = &(&1 * 2)
IO.inspect(Enum.map([1, 2, 3], double), label: "capture")

# Capture a NAMED function with arity — often cleaner than wrapping:
IO.inspect(Enum.map([1, 2, 3], &Integer.to_string/1), label: "capture named")

# Closures: the fn remembers `prefix` from the defining scope.
prefix = "user-"
tag = &(prefix <> Integer.to_string(&1))
IO.inspect(tag.(7), label: "closure")

# Captures with multiple params (&1, &2) and pattern-matching heads:
classify = fn
  n when n > 0 -> :positive
  n when n < 0 -> :negative
  _ -> :zero
end
IO.inspect(Enum.map([-1, 0, 2], classify), label: "fn clauses")
