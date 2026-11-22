# 18_custom_macros.exs — What this shows: defmacro with hygiene,
#   generating functions at compile time, and the use hook.
#   Run: elixir demo/tooling/18_custom_macros.exs

defmodule Traced do
  # trace/1 is a MACRO, not a function: it sees the caller's CODE,
  # which is the only way to print the expression itself.
  @doc "trace/1 evaluates expr and prints expression + result."
  defmacro trace(expr) do
    quote do
      # unquote(expr) splices the caller's expression; running it here
      # executes it exactly once.
      result = unquote(expr)
      # Macro.to_string turns the SPLICED AST back into source text,
      # so the log line shows what the caller actually wrote:
      IO.puts("#{unquote(Macro.to_string(expr))} => #{inspect(result)}")
      result
    end
  end

  # __using__ runs at compile time when a module does `use Traced`.
  defmacro __using__(_opts) do
    quote do
      import Traced
      # Injected module attribute — visible as Worker.@traced:
      @traced true
    end
  end
end

defmodule Worker do
  use Traced              # brings trace/1 and @traced into scope

  def compute do
    trace(40 + 2)                       # prints "40 + 2 => 42", returns 42
  end

  def pipeline(data) do
    trace(data |> Enum.map(&(&1 * 2)) |> Enum.sum())
  end
end

IO.inspect(Worker.compute(), label: "returned")
Worker.pipeline(1..10)

# Macros generating FUNCTIONS — the pattern behind `use GenServer`:
defmodule Counted do
  defmacro __using__(ops) do
    # Loop at COMPILE time, emitting one function per operation.
    for op <- ops do
      quote do
        def unquote(:"count_#{op}")(n), do: unquote(op) |> to_string() <> ":#{n}"
      end
    end
  end
end

defmodule Api do
  use Counted, [:hits, :misses]
end

IO.inspect(Api.count_hits(10))
IO.inspect(Api.count_misses(3))
IO.inspect(Worker.@traced, label: "injected attribute")
