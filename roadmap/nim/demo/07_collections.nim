# 07_collections.nim — arrays, sequences, sets and tables.
#
# Run it with:  nim c -r 07_collections.nim
#
# Pick a container by its shape, not by habit:
#   array[T, N]  — fixed length known at compile time, stored inline, no heap
#   seq[T]       — growable, heap allocated, the workhorse container
#   set[T]       — bitset over ordinals, O(1) membership
#   Table[K, V]  — hash map for non-ordinal or sparse keys
#   HashSet[T]   — hash-based set for keys that are not ordinals

import std/[tables, sets, sequtils, algorithm]

# An array knows its length in the type. The compiler can therefore stack
# allocate it and check every index — when the index type is a `range`.
let fixed: array[5, int] = [2, 4, 6, 8, 10]
var grid: array[3, array[3, int]]      # two-dimensional, zero initialized
for r in 0 .. 2:
  for c in 0 .. 2:
    grid[r][c] = r * 3 + c

var fixedTotal = 0
for value in fixed:
  fixedTotal += value

echo "fixed len=", fixed.len, " sum=", fixedTotal, " grid[2][1]=", grid[2][1]

# Sequences grow on demand. `@[...]` builds one from a list; `newSeq` reserves
# capacity up front, which is the one performance knob that matters in a loop.
var numbers = @[5, 3, 9]
numbers.add(7)                 # append
numbers.insert(0, 1)           # insert at index — O(n), shifts the tail
numbers.delete(1)              # delete by index
echo "seq ", numbers, " len=", numbers.len, " first=", numbers[0]

var buffer = newSeq[string]()  # empty, typed
for i in 1 .. 3:
  buffer.add("row-" & $i)
echo "buffer ", buffer

# `seq` has slicing, concatenation and mutation in place.
let head = numbers[0 .. 1]     # inclusive slice
numbers[^1] = 100              # `^1` counts from the end
echo "head=", head, " last=", numbers[^1], " concat=", head & @[0, 0]

# Sorting works on any container whose elements are comparable.
var toSort = @[9, 2, 7, 4, 1]
toSort.sort()                  # ascending, in place
echo "sorted=", toSort
toSort.sort(proc(a, b: int): int = cmp(b, a))   # descending via comparator
echo "reverse-sorted=", toSort

# Sets are bitsets: fast, small, and limited to ordinal element types.
var seen: set[char] = {}
for ch in "programming":
  seen.incl(ch)
echo "distinct letters=", seen.len, " contains 'g'? ", 'g' in seen

# Hash containers handle string keys and sparse integer keys.
var counts = initTable[string, int]()
for word in ["nim", "code", "nim", "lab", "nim"]:
  counts[word] = counts.getOrDefault(word) + 1
echo "nim count = ", counts["nim"], " code count = ", counts.getOrDefault("code")

# `mgetOrPut` is the safe update idiom: it returns a mutable reference to the
# value, inserting the default when the key is absent.
var index: Table[string, seq[int]]
for i, word in ["a", "b", "a"].pairs:
  index.mgetOrPut(word, @[]).add(i)
echo "index a = ", index["a"], " keys = ", index.len

# Iteration order of a Table is unspecified; sort the keys when output must
# be stable. `toSeq(... .keys)` reuses the sequence machinery.
var keys = toSeq(counts.keys)
keys.sort()
for k in keys:
  echo "  ", k, " -> ", counts[k]

# HashSet drops duplicates without ordering; membership is O(1).
var uniq = initHashSet[int]()
for v in [3, 1, 3, 2, 1]: uniq.incl(v)
echo "unique=", uniq.len, " has 2? ", 2 in uniq
