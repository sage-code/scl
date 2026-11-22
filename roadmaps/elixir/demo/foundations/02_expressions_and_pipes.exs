# 02_expressions_and_pipes.exs — What this shows: expressions vs
#   statements, and the pipe operator threading first arguments.
#   Run: elixir demo/foundations/02_expressions_and_pipes.exs

# An `if` IS a value — bind it directly, no temp variable:
label = if 7 > 5, do: "bigger", else: "smaller"
IO.puts(label)

# case produces values too; the whole expression is bound:
size =
  case {3, 3} do
    {w, w} -> :square          # same variable twice = must be equal
    {w, h} when w > h -> :wide
    _ -> :tall                 # _ matches anything
  end
IO.inspect(size, label: "size")

# Data pipelines read top-to-bottom with |>.
# Rule: each function takes the piped value as its FIRST argument.
"  The Quick, brown FOX;  the fox!  "
|> String.trim()
|> String.downcase()
|> String.replace(";", " ")
|> String.split()
|> Enum.frequencies()
|> IO.inspect(label: "word counts")

# Debugging inside pipelines: IO.inspect passes the value through,
# so you can peek at ANY step without changing the result.
1..5
|> Enum.map(&(&1 * &1))
|> IO.inspect(label: "after squares")   # peek
|> Enum.sum()
|> IO.inspect(label: "sum")
