// 21_hash_table_chaining.go — A hash map from scratch (separate chaining).
//
// A hash table turns a key into an array index in three steps:
//
//	key --hash function--> 64-bit number --mod bucket count--> bucket index
//
// Different keys can land in the same bucket (a COLLISION). With separate
// chaining, each bucket holds a small list of entries; lookup hashes to the
// bucket and scans only that list.
//
// Cost depends on the LOAD FACTOR = entries / buckets. Keeping it below a
// threshold (here 0.75) by doubling the bucket array keeps chains short, so
// Get/Put/Delete are O(1) on average. Resizing touches every entry — O(n) —
// but happens after n inserts, so it is O(1) amortized (like append).
//
// Run: go run 21_hash_table_chaining.go
package main

import (
	"fmt"
	"strings"
)

// fnv1a is the 64-bit FNV-1a hash: simple, fast, and well distributed for
// short keys. (hash/fnv in the standard library implements the same thing.)
// It is NOT safe against attackers choosing colliding keys; Go's built-in
// map uses a randomly seeded hash for that reason.
func fnv1a(s string) uint64 {
	const (
		offset = 14695981039346656037
		prime  = 1099511628211
	)
	h := uint64(offset)
	for i := 0; i < len(s); i++ {
		h ^= uint64(s[i]) // mix in one byte...
		h *= prime        // ...then spread it across all 64 bits
	}
	return h
}

type entry[V any] struct {
	key string
	val V
}

// HashMap maps string keys to values of any type V.
type HashMap[V any] struct {
	buckets [][]entry[V] // each bucket is a slice used as the chain
	count   int
	resizes int
}

const maxLoad = 0.75

func NewHashMap[V any]() *HashMap[V] {
	return &HashMap[V]{buckets: make([][]entry[V], 8)}
}

// bucketFor maps a key to a bucket index. The bucket count is a power of
// two, so `h & (n-1)` equals `h % n` but avoids a division.
func (m *HashMap[V]) bucketFor(key string) int {
	return int(fnv1a(key) & uint64(len(m.buckets)-1))
}

// Put inserts or updates key.
func (m *HashMap[V]) Put(key string, val V) {
	b := m.bucketFor(key)
	for i := range m.buckets[b] {
		if m.buckets[b][i].key == key { // existing key: update in place
			m.buckets[b][i].val = val
			return
		}
	}
	m.buckets[b] = append(m.buckets[b], entry[V]{key, val})
	m.count++
	if float64(m.count)/float64(len(m.buckets)) > maxLoad {
		m.resize()
	}
}

// Get returns the value and whether the key was present ("comma ok").
func (m *HashMap[V]) Get(key string) (V, bool) {
	for _, e := range m.buckets[m.bucketFor(key)] {
		if e.key == key {
			return e.val, true
		}
	}
	var zero V
	return zero, false
}

// Delete removes key if present. Order inside a chain does not matter, so
// we use the O(1) "swap with last" removal.
func (m *HashMap[V]) Delete(key string) bool {
	b := m.bucketFor(key)
	chain := m.buckets[b]
	for i := range chain {
		if chain[i].key == key {
			chain[i] = chain[len(chain)-1]
			m.buckets[b] = chain[:len(chain)-1]
			m.count--
			return true
		}
	}
	return false
}

// resize doubles the bucket array and REHASHES every entry: an entry's
// bucket depends on the bucket count, so entries cannot simply be copied.
func (m *HashMap[V]) resize() {
	old := m.buckets
	m.buckets = make([][]entry[V], len(old)*2)
	for _, chain := range old {
		for _, e := range chain {
			b := m.bucketFor(e.key)
			m.buckets[b] = append(m.buckets[b], e)
		}
	}
	m.resizes++
}

// Stats reports the numbers that decide performance.
func (m *HashMap[V]) Stats() string {
	longest, empty := 0, 0
	for _, c := range m.buckets {
		longest = max(longest, len(c))
		if len(c) == 0 {
			empty++
		}
	}
	return fmt.Sprintf("entries=%d buckets=%d load=%.2f longest chain=%d empty buckets=%d resizes=%d",
		m.count, len(m.buckets), float64(m.count)/float64(len(m.buckets)), longest, empty, m.resizes)
}

// badHash shows what a poor hash function does: it only looks at the length,
// so keys of equal length all collide and one chain holds everything.
func chainLengthsWith(hash func(string) uint64, keys []string, buckets int) (longest int) {
	counts := make([]int, buckets)
	for _, k := range keys {
		counts[hash(k)%uint64(buckets)]++
	}
	for _, c := range counts {
		longest = max(longest, c)
	}
	return longest
}

func main() {
	m := NewHashMap[int]()
	words := strings.Fields(`the quick brown fox jumps over the lazy dog the fox
		runs and the dog sleeps while the quick fox jumps again`)
	for _, w := range words {
		n, _ := m.Get(w)
		m.Put(w, n+1) // word frequency count
	}
	for _, w := range []string{"the", "fox", "cat"} {
		n, ok := m.Get(w)
		fmt.Printf("Get(%q) = %d, %v\n", w, n, ok)
	}
	m.Delete("the")
	_, ok := m.Get("the")
	fmt.Println("after Delete(the), present:", ok)
	fmt.Println(m.Stats())

	// Scale up: 100,000 keys, chains stay short thanks to resizing.
	big := NewHashMap[int]()
	keys := make([]string, 100_000)
	for i := range keys {
		keys[i] = fmt.Sprintf("user-%06d", i)
		big.Put(keys[i], i)
	}
	missing := 0
	for i, k := range keys {
		if v, ok := big.Get(k); !ok || v != i {
			missing++
		}
	}
	fmt.Println("\n100k keys, lookup errors:", missing)
	fmt.Println(big.Stats())

	// Same keys, bad hash: every key has length 11, so all collide.
	badHash := func(s string) uint64 { return uint64(len(s)) }
	fmt.Println("\nlongest chain, FNV-1a :", chainLengthsWith(fnv1a, keys, 1<<17))
	fmt.Println("longest chain, badHash:", chainLengthsWith(badHash, keys, 1<<17), "<- lookups degrade to O(n)")
}
