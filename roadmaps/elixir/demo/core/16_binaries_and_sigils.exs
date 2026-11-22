# 16_binaries_and_sigils.exs — What this shows: bitstring syntax,
#   binary pattern matching for protocol parsing, and IO data.
#   Run: elixir demo/core/16_binaries_and_sigils.exs

# Bitstring building — sizes and types are explicit:
IO.inspect(<<1, 2, 3>>, label: "three bytes")
IO.inspect(<<1024::16>>, label: "16 bits")            # => <<4, 0>>
IO.inspect(<<3.14::float>>, label: "float bits")
IO.inspect(<<"é"::utf8>>, label: "utf8 segment")

# Bitstring PARSING: the pattern IS the grammar.
# Frame format: [1-byte type][2-byte big-endian length][payload]
defmodule Packet do
  def decode(<<type::8, length::16, payload::bytes-size(length), rest::binary>>) do
    # One clause matches a whole frame AND binds the remainder.
    [{type, payload} | decode(rest)]
  end

  def decode(<<>>), do: []                            # clean end
  def decode(truncated), do: [{:error, byte_size(truncated)}]
end

data = <<1, "hello", 3, "abc", 2, "hi">>  # interleaved literals are bytes
IO.inspect(Packet.decode(data), label: "decoded frames")

# String vs byte sizes — the classic unicode trap:
s = "café"
IO.inspect({byte_size(s), String.length(s)}, label: "bytes vs characters")

# Sigils: literals for common structures.
IO.inspect(~w(red green blue), label: "~w word list")
IO.inspect(~w(1 2 3)a, label: "word ATOMS")
IO.inspect(~D[2026-09-17], label: "Date sigil")
IO.inspect(~r/\d+/ |> Regex.replace("abc123xyz", "#"), label: "regex sigil")

# IO data: assemble output without intermediate string copies.
iodata = ["status=", "ok", "\n", ["rows=", "42", "\n"]]
IO.inspect(IO.iodata_length(iodata), label: "io data length (no copy yet)")
IO.puts(IO.iodata_to_binary(iodata))
