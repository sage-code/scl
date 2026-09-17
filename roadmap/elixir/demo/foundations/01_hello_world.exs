# 01_hello_world.exs — What this shows: modules, string interpolation,
#   module attributes as constants, and @doc/@moduledoc that `h` reads.
#   Run: elixir demo/foundations/01_hello_world.exs

defmodule Hello do
  # @moduledoc shows up in `h Hello` — documentation is compiled in.
  @moduledoc "The smallest useful Elixir module."

  # Module attributes are constants evaluated at compile time.
  @greeting "Hello"

  @doc """
  Builds a greeting.

  ## Examples

      iex> Hello.world("Ada")
      "Hello, Ada!"

  """
  def world(name \\ "world") do
    # The #{} interpolation syntax splices any expression into a string.
    "#{@greeting}, #{String.capitalize(name)}!"
  end
end

IO.puts(Hello.world())
IO.puts(Hello.world("elixir"))

# Everything returns a value — even IO.puts (it returns :ok):
result = IO.puts("side effect returns a value")
IO.inspect(result, label: "IO.puts returned")
