# 29_ets.exs — What this shows: ETS tables as shared concurrent
#   state, ownership, read/write concurrency, and matching queries.
#   Run: elixir demo/concurrency/29_ets.exs

# ETS = Erlang Term Storage: an in-memory KV table that lives OUTSIDE
# any process. Readers and writers from many processes, no bottlenecks.
table = :ets.new(:demo_cache, [
  :set,                 # unique keys (also: :bag, :duplicate_bag)
  :named_table,
  :public,              # any process may read/write (owner supervises)
  read_concurrency: true,
  write_concurrency: true
])

# Basic operations — all O(1) for :set:
:ets.insert(table, {:user_42, %{name: "Ada", visits: 3}})
:ets.insert(table, [{:user_7, %{name: "Grace", visits: 9}}, {:meta, :v1}])

IO.inspect(:ets.lookup(table, :user_42), label: "lookup")
IO.inspect(:ets.member(table, :user_7), label: "member?")

# Update a value functionally: read-modify-write must be atomic —
# use update_counter for integers (lock-free), or a wrapper fn.
:ets.update_counter(table, :user_42, {2, :visits, 1})
IO.inspect(:ets.lookup(table, :user_42), label: "counter bumped")

# select with a match specification (keep simple ones simple):
:ets.insert(table, {:user_100, %{name: "Linus", visits: 50}})
high_visitors =
  :ets.select(table, [
    {{:_, %{visits: :"$1", name: :"$2"}}, [{:>, :"$1", 5}], [:"$2"]}
  ])
IO.inspect(high_visitors, label: "select visits > 5")

# Lifecycle: an ETS table DIES with its owner — that is why real
# systems put the table under a dedicated "guardian" process that
# never crashes (see the supervised KV study project).

# Counts and delete:
IO.inspect(:ets.info(table, :size), label: "table size")
:ets.delete(table, :meta)
:ets.delete(table)

# Rule of thumb: GenServer for state with invariants; ETS for shared,
# hot, read-mostly (or counter-style) data.
