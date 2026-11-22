# 11_comprehensions.exs — What this shows: `for` with multiple
#   generators, filters, and the into: option.
#   Run: elixir demo/core/11_comprehensions.exs

# A comprehension is a pipeline in expression form:
#   pattern <- enumerable, filter, filter, do: body
squares = for n <- 1..5, rem(n, 2) == 1, do: n * n
IO.inspect(squares, label: "odd squares")

# Multiple generators iterate like nested loops (Cartesian product):
pairs = for x <- [1, 2], y <- [:a, :b], do: {x, y}
IO.inspect(pairs, label: "cartesian")

# Pattern in the generator FILTERS non-matching elements silently:
results = [{:ok, 1}, {:error, :x}, {:ok, 5}, {:error, :y}]
oks = for {:ok, v} <- results, do: v
IO.inspect(oks, label: "only :ok values")

# into: changes the destination — build maps or sets directly:
index = for {k, i} <- Enum.with_index([:a, :b, :c]), into: %{}, do: {k, i}
IO.inspect(index, label: "map built with into:")

# Comprehensions compose beautifully with file streams:
tmp = Path.join(System.tmp_dir!(), "comprehension_demo.txt")
File.write!(tmp, "apple\nbanana\navocado\ncherry\n")
a_fruits =
  for line <- File.stream!(tmp),
      line = String.trim_trailing(line),
      String.starts_with?(line, "a"),
      do: line
IO.inspect(a_fruits, label: "a-fruits")
File.rm(tmp)

# When is `for` better than Enum? When the logic involves several
# generators/filters — compare the comprehension above with the
# equivalent Enum.filter |> Enum.map chain and judge for yourself.
