# 13_protocols.exs — What this shows: defprotocol/defimpl, deriving,
#   and dispatch on data type.
#   Run: elixir demo/core/13_protocols.exs

# A protocol is a function CONTRACT keyed by the data's type.
defprotocol Render do
  @doc "Return the value as displayable text."
  def to_text(value)
end

defmodule Invoice do
  defstruct number: "", total: 0
end

defmodule Ticket do
  defstruct row: 1, seat: 1
end

# Implementations live anywhere — even for types you don't own:
defimpl Render, for: Invoice do
  def to_text(%Invoice{number: n, total: t}), do: "Invoice #{n}: $#{t}"
end

defimpl Render, for: Ticket do
  def to_text(%Ticket{row: r, seat: s}), do: "Row #{r}, seat #{s}"
end

defimpl Render, for: Integer do
  def to_text(n), do: "number: #{n}"
end

IO.puts(Render.to_text(%Invoice{number: "A-1", total: 99}))
IO.puts(Render.to_text(%Ticket{row: 4, seat: 12}))
IO.puts(Render.to_text(7))

# Derive standard protocols instead of hand-writing them:
defmodule Point do
  # @derive Inspect is default; derive Access to use [] syntax:
  @derive {Access, only: [:x]}
  defstruct x: 0, y: 0
end

pt = %Point{x: 3, y: 4}
IO.inspect(pt[:x], label: "Access on struct")

# Dispatch is consolidated at compile time — one jump table per
# protocol, so calls are fast and extensible at once.
items = [%Invoice{number: "B-2", total: 5}, 42, %Ticket{row: 2, seat: 8}]
items |> Enum.map(&Render.to_text/1) |> Enum.each(&IO.puts/1)
