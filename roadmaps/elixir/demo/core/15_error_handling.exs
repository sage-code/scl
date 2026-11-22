# 15_error_handling.exs — What this shows: raise/rescue/after,
#   custom exceptions, and the tagged-tuple convention.
#   Run: elixir demo/core/15_error_handling.exs

# Custom exceptions are structs: structured data, not a string.
defmodule TransferError do
  defexception [:code, :detail]

  @impl true
  def message(%__MODULE__{code: code, detail: detail}) do
    "transfer failed (#{code}): #{detail}"
  end
end

defmodule Account do
  def withdraw(balance, amount) when amount > balance do
    # EXPECTED, handleable failure -> tagged tuple (not a raise):
    {:error, :insufficient_funds}
  end

  def withdraw(balance, amount) when amount <= 0 do
    # BUG/invariant violation -> raise. The caller should not have
    # to handle this; the process should die loudly.
    raise TransferError, code: :bad_amount, detail: "amount=#{amount}"
  end

  def withdraw(balance, amount), do: {:ok, balance - amount}
end

IO.inspect(Account.withdraw(100, 30))         # {:ok, 70}
IO.inspect(Account.withdraw(100, 300))        # {:error, :insufficient_funds}

# try/rescue converts exceptions into values — use at boundaries
# where you can actually recover:
result =
  try do
    Account.withdraw(100, -5)
  rescue
    e in TransferError -> {:error, {:transfer, e.code, e.detail}}
    e in ArgumentError -> {:error, {:arg, e.message}}
  after
    IO.puts("(after block always runs — like finally)")
  end
IO.inspect(result, label: "rescued")

# `after` alone, for cleanup without swallowing the exception:
defmodule WithFile do
  def read_checked(path) do
    handle = File.open!(path)
    try do
      IO.read(handle, :eof)
    after
      File.close(handle)     # runs even if the body raises
    end
  end
end

tmp = Path.join(System.tmp_dir!(), "err_demo.txt")
File.write!(tmp, "payload")
WithFile.read_checked(tmp) |> IO.inspect(label: "file content")
File.rm(tmp)

# Rethrow or normalize errors, then let the process die — a
# supervisor handles the rest (see the supervision demos).
