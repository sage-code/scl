# 20_property_tests.exs — What this shows: property-based testing
#   with StreamData — checking invariants over generated inputs.
#   Run with deps: elixir --eval will not do; use a script runner:
#   Mix.install([{:stream_data, "~> 1.1"}]) then run this file:
#   elixir demo/tooling/20_property_tests.exs
Mix.install([{:stream_data, "~> 1.1"}])

ExUnit.start()

# The module under test (defined before the test module references it):
defmodule Temperature do
  def classify(t) when t >= 38.0, do: :fever
  def classify(t) when t < 35.0, do: :hypothermia
  def classify(_t), do: :normal
end

defmodule Codec do
  # A tiny "frame" codec: term -> binary -> term must roundtrip.
  def encode(term), do: :erlang.term_to_binary(term)
  def decode(bin), do: :erlang.binary_to_term(bin)
end

defmodule CodecPropertyTest do
  use ExUnit.Case, async: true
  use ExUnitProperties

  # A PROPERTY holds for ALL generated inputs — StreamData tries
  # hundreds, then shrinks any failure to a minimal case.
  property "encode/decode roundtrips any map" do
    check all map <- map_of(atom(:alphanumeric), integer()) do
      assert map |> Codec.encode() |> Codec.decode() == map
    end
  end

  property "encoded binaries are always non-empty and binary" do
    check all term <- term() do
      encoded = Codec.encode(term)
      assert is_binary(encoded)
      assert byte_size(encoded) > 0
    end
  end

  # Custom generators compose — describe your domain's data:
  property "temperatures always classify inside known states" do
    check all t <- float(min: -50.0, max: 60.0) do
      assert Temperature.classify(t) in [:hypothermia, :normal, :fever]
    end
  end
end

ExUnit.run()
