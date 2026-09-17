# 31_ecto_changeset.exs — What this shows: the Ecto changeset
#   pipeline with NO database — validation as data transformation.
#   First run needs network: Mix.install fetches from Hex.
#   Run: elixir demo/ecosystem/31_ecto_changeset.exs
Mix.install([{:ecto, "~> 3.12"}])

defmodule Account do
  # embedded_schema = struct + changeset machinery, no table.
  use Ecto.Schema
  import Ecto.Changeset

  embedded_schema do
    field :email, :string
    field :age, :integer, default: 0
    field :role, Ecto.Enum, values: [:user, :admin], default: :user
  end

  def changeset(account \\ %__MODULE__{}, attrs) do
    account
    |> cast(attrs, [:email, :age, :role])       # whitelist: nothing else lands
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^@]+@[^@]+$/)
    |> validate_length(:email, max: 160)
    |> validate_inclusion(:age, 13..120)
    |> validate_number(:age, greater_than_or_equal_to: 0)
  end
end

# Valid input -> a valid changeset:
good = Account.changeset(%{"email" => "ada@x.io", "age" => "36", "role" => "admin"})
IO.inspect(good.valid?, label: "good input valid?")
IO.inspect(Account.changeset().apply_changes(), label: "applied to struct")

# Invalid input -> errors ACCUMULATE (not fail-fast):
bad = Account.changeset(%{"email" => "nope", "age" => "-2", "extra" => "dropped"})
IO.inspect(bad.valid?, label: "bad input valid?")
IO.inspect(Ecto.Changeset.traverse_errors(bad, fn {msg, opts} ->
  Regex.replace(~r/%\{(#{Enum.join(Keyword.keys(opts), "|")})\}/, msg, fn _, key ->
    opts |> Keyword.fetch!(String.to_existing_atom(key)) |> to_string()
  end)
end), label: "errors by field")

# This exact pipeline, against a real table, is what Repo.insert
# consumes — the changeset gates the database (lesson 22).
