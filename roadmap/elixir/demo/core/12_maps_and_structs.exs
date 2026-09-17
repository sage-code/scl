# 12_maps_and_structs.exs — What this shows: map access patterns,
#   Access behaviour, and structs with defaults and enforced keys.
#   Run: elixir demo/core/12_maps_and_structs.exs

m = %{"name" => "Ada", role: :admin, visits: 12}

# Three access styles — atom keys also support .field (raises on miss
# for structs; for maps raises KeyError):
IO.inspect(m.role, label: "dot access")
IO.inspect(m["name"], label: "bracket (string key)")
IO.inspect(Map.get(m, :missing, :default), label: "get with default")

# Access.get via [] returns nil for missing keys — handy in pipelines:
IO.inspect(m[:nope], label: "[] returns nil")

# Nested updates — put_in/update_in navigate paths functionally:
user = %{profile: %{email: "a@x.io", tags: [:early]}}
user = put_in(user.profile.email, "ada@lovelace.io")
user = update_in(user.profile.tags, &[:admin | &1])
IO.inspect(user, label: "nested update")

# Structs: named shape + defaults + enforced keys.
defmodule Product do
  @enforce_keys [:sku]           # compile-time requirement
  defstruct sku: nil, name: "unnamed", price: 0, tags: []

  def total_price(%Product{price: p}, qty), do: p * qty
end

p = %Product{sku: "A-1", name: "Keyboard", price: 49}
IO.inspect(p, label: "struct")
IO.inspect(Product.total_price(p, 3), label: "total")

# Structs pattern-match on TYPE — %Product{} matches only Products:
check = fn
  %Product{price: price} when price > 40 -> :expensive
  %Product{} -> :cheap
  _ -> :not_a_product
end
IO.inspect([p, %{sku: "fake"}, %Product{sku: "A-2", price: 9}] |> Enum.map(check))
