# 19_exunit_and_doctests.exs — What this shows: a complete ExUnit
#   suite inside ONE script — tests, doctests, and context setup.
#   Run: elixir demo/tooling/19_exunit_and_doctests.exs

ExUnit.start()   # normally in test_helper.exs; scripts must boot it

defmodule Temperature do
  @moduledoc """
  Conversions. The doctest examples below are EXECUTED as tests.
  """

  @doc """
  Converts Celsius to Fahrenheit.

  ## Examples

      iex> Temperature.c_to_f(100)
      212.0

      iex> Temperature.c_to_f(0)
      32.0

  """
  def c_to_f(c), do: c * 1.8 + 32

  @doc """
  Classifies a temperature reading.

  ## Examples

      iex> Temperature.classify(37.0)
      :normal

      iex> Temperature.classify(40)
      :fever

  """
  def classify(t) when t >= 38.0, do: :fever
  def classify(t) when t < 35.0, do: :hypothermia
  def classify(_t), do: :normal
end

defmodule TemperatureTest do
  # async: true — safe because tests share no mutable state.
  use ExUnit.Case, async: true
  doctest Temperature          # runs every example above

  # setup runs before each test; values land in the context map.
  setup do
    {:ok, samples: [36.5, 37.0, 38.4]}
  end

  test "classification boundaries", %{samples: samples} do
    assert Enum.map(samples, &Temperature.classify/1) == [:normal, :normal, :fever]
  end

  test "freezing point converts exactly" do
    assert Temperature.c_to_f(-40) == -40.0   # the famous crossover
  end

  test "non-numeric input raises" do
    assert_raise(FunctionClauseError, fn -> Temperature.c_to_f("hot") end)
  end
end

# ExUnit.run/0 executes the suite and returns the results — in a mix
# project you never call it; `mix test` does.
ExUnit.run()
