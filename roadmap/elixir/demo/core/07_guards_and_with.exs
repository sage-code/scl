# 07_guards_and_with.exs — What this shows: guards on clauses and
#   case, and `with` chains for happy-path pipelines.
#   Run: elixir demo/core/07_guards_and_with.exs

defmodule Score do
  # Guards refine a match. Only side-effect-free functions allowed.
  def grade(n) when n >= 90, do: :excellent
  def grade(n) when n >= 75, do: :good
  def grade(n) when is_integer(n) and n >= 0, do: :pass
  def grade(n) when is_integer(n), do: :invalid
  # Without the guard, this would also catch bad TYPES:
  def grade(_), do: {:error, :not_a_number}
end
IO.inspect(Enum.map([95, 80, 10, -3, "oops"], &Score.grade/1))

# Guards in `case` branches — note the catch-all MUST come last:
case {120, 80} do
  {s, d} when s > 130 or d > 90 -> :hypertensive
  {s, _d} when s > 115 -> :elevated
  _ -> :normal
end |> IO.inspect(label: "blood pressure")

# `with` chains matches; the first failure jumps to `else`.
defmodule Import do
  def run(raw) do
    with {:ok, n} <- parse_int(raw),
         :ok <- check_positive(n),
         # A plain = inside `with` still raises on failure — use <- for
         # values you want to handle in `else`.
         doubled = n * 2 do
      {:ok, doubled}
    else
      # Re-match whatever failed; keep error shapes consistent.
      :error -> {:error, :not_an_integer}
      {:error, reason} -> {:error, reason}
    end
  end

  # Integer.parse returns {int, ""} or :error — normalize it:
  defp parse_int(raw) when is_binary(raw) do
    case Integer.parse(raw) do
      {n, ""} -> {:ok, n}
      _ -> :error
    end
  end
  defp check_positive(n) when n > 0, do: :ok
  defp check_positive(_), do: {:error, :must_be_positive}
end

IO.inspect(Import.run("21"))     # {:ok, 42}
IO.inspect(Import.run("x"))      # {:error, :not_an_integer}
IO.inspect(Import.run("-5"))     # {:error, :must_be_positive}
