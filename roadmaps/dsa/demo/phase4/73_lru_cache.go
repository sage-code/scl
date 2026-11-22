// 73_lru_cache.go — Least-recently-used cache: a hash map plus a linked list.
//
// A cache keeps the answers that are expensive to compute or fetch, in a
// bounded amount of memory. When it is full, something must go. LRU throws out
// the entry that has not been touched for the longest time, betting that what
// was used recently will be used again soon.
//
// Two structures cooperate so that EVERY operation is O(1):
//
//	map[K]*node    finds an entry by key
//	doubly linked  keeps the entries in recency order: the head is the most
//	list           recently used, the tail is the next victim
//
// A hit unlinks the node and relinks it at the head (pointer surgery, no
// search). An insert into a full cache unlinks the tail node and deletes its
// key from the map. Neither structure alone would do it: a map has no order,
// and a list cannot find a key without walking it.
//
// This demo builds the cache, proves it against a slow oracle on random
// operations, adds a time-to-live using an injected clock, and shows the
// weakness of LRU: one long scan of cold data flushes the useful entries.
//
// Run: go run 73_lru_cache.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
)

// ---------------------------------------------------------------- the cache

type node[K comparable, V any] struct {
	key        K
	val        V
	expires    int64 // 0 means "never"
	prev, next *node[K, V]
}

type LRU[K comparable, V any] struct {
	cap     int
	items   map[K]*node[K, V]
	head    node[K, V] // sentinel: head.next is the most recently used
	tail    node[K, V] // sentinel: tail.prev is the least recently used
	now     func() int64
	OnEvict func(K, V)
	Hits    int
	Misses  int
}

func NewLRU[K comparable, V any](capacity int, now func() int64) *LRU[K, V] {
	c := &LRU[K, V]{cap: capacity, items: make(map[K]*node[K, V], capacity), now: now}
	c.head.next = &c.tail
	c.tail.prev = &c.head
	return c
}

func (c *LRU[K, V]) unlink(n *node[K, V]) {
	n.prev.next = n.next
	n.next.prev = n.prev
}

func (c *LRU[K, V]) pushFront(n *node[K, V]) {
	n.prev = &c.head
	n.next = c.head.next
	c.head.next.prev = n
	c.head.next = n
}

func (c *LRU[K, V]) remove(n *node[K, V]) {
	c.unlink(n)
	delete(c.items, n.key)
}

// Get returns the value and marks the entry as most recently used.
// An expired entry is removed on the spot (lazy expiry).
func (c *LRU[K, V]) Get(k K) (V, bool) {
	n, ok := c.items[k]
	if ok && n.expires != 0 && c.now() >= n.expires {
		c.remove(n)
		ok = false
	}
	if !ok {
		c.Misses++
		var zero V
		return zero, false
	}
	c.Hits++
	c.unlink(n)
	c.pushFront(n)
	return n.val, true
}

// Put inserts or updates a key with no expiry.
func (c *LRU[K, V]) Put(k K, v V) { c.PutTTL(k, v, 0) }

// PutTTL inserts a key that expires ttl clock units from now (0 = never).
func (c *LRU[K, V]) PutTTL(k K, v V, ttl int64) {
	var exp int64
	if ttl > 0 {
		exp = c.now() + ttl
	}
	if n, ok := c.items[k]; ok {
		n.val, n.expires = v, exp
		c.unlink(n)
		c.pushFront(n)
		return
	}
	if len(c.items) >= c.cap {
		victim := c.tail.prev
		c.remove(victim)
		if c.OnEvict != nil {
			c.OnEvict(victim.key, victim.val)
		}
	}
	n := &node[K, V]{key: k, val: v, expires: exp}
	c.items[k] = n
	c.pushFront(n)
}

func (c *LRU[K, V]) Delete(k K) {
	if n, ok := c.items[k]; ok {
		c.remove(n)
	}
}

func (c *LRU[K, V]) Len() int { return len(c.items) }

// Keys lists the keys from most to least recently used.
func (c *LRU[K, V]) Keys() []K {
	var out []K
	for n := c.head.next; n != &c.tail; n = n.next {
		out = append(out, n.key)
	}
	return out
}

func (c *LRU[K, V]) HitRatio() float64 {
	if c.Hits+c.Misses == 0 {
		return 0
	}
	return float64(c.Hits) / float64(c.Hits+c.Misses)
}

// ------------------------------------------------------------------ oracle

// slowLRU keeps a slice ordered by recency (front = most recent) and searches
// it linearly: obviously correct, O(n) per operation.
type slowLRU struct {
	cap  int
	keys []int
	vals map[int]int
}

func newSlow(capacity int) *slowLRU { return &slowLRU{cap: capacity, vals: map[int]int{}} }

func (s *slowLRU) touch(k int) {
	if i := slices.Index(s.keys, k); i >= 0 {
		s.keys = slices.Delete(s.keys, i, i+1)
	}
	s.keys = slices.Insert(s.keys, 0, k)
}

func (s *slowLRU) Get(k int) (int, bool) {
	v, ok := s.vals[k]
	if ok {
		s.touch(k)
	}
	return v, ok
}

func (s *slowLRU) Put(k, v int) {
	if _, ok := s.vals[k]; !ok && len(s.vals) >= s.cap {
		last := s.keys[len(s.keys)-1]
		s.keys = s.keys[:len(s.keys)-1]
		delete(s.vals, last)
	}
	s.vals[k] = v
	s.touch(k)
}

// ------------------------------------------------------------------- demos

func demoBasics() {
	fmt.Println("== 1. Basic behavior (capacity 3) ==")
	c := NewLRU[string, int](3, func() int64 { return 0 })
	c.OnEvict = func(k string, v int) { fmt.Printf("   evicted %s=%d\n", k, v) }
	c.Put("a", 1)
	c.Put("b", 2)
	c.Put("c", 3)
	fmt.Println("after a,b,c        order (recent first):", c.Keys())
	c.Get("a")
	fmt.Println("after Get(a)       order (recent first):", c.Keys())
	c.Put("d", 4)
	fmt.Println("after Put(d)       order (recent first):", c.Keys(), " <- b was the least recent")
	_, ok := c.Get("b")
	fmt.Println("Get(b) found:", ok)
}

func demoOracle() {
	fmt.Println("\n== 2. Against the O(n) oracle: 200000 random operations, capacity 50 ==")
	rng := rand.New(rand.NewSource(7))
	fast := NewLRU[int, int](50, func() int64 { return 0 })
	slow := newSlow(50)
	bad := 0
	for i := 0; i < 200000; i++ {
		k := rng.Intn(120)
		if rng.Intn(3) == 0 {
			fast.Put(k, i)
			slow.Put(k, i)
		} else {
			v1, ok1 := fast.Get(k)
			v2, ok2 := slow.Get(k)
			if ok1 != ok2 || v1 != v2 {
				bad++
			}
		}
		if i%1000 == 0 && !slices.Equal(fast.Keys(), slow.keys) {
			bad++
		}
	}
	fmt.Println("disagreements (values, hits, or order):", bad)
	fmt.Println("final size:", fast.Len(), "hits:", fast.Hits, "misses:", fast.Misses)
}

func demoTTL() {
	fmt.Println("\n== 3. Time to live with an injected clock ==")
	var clock int64
	c := NewLRU[string, string](10, func() int64 { return clock })
	c.PutTTL("session", "alice", 30)
	c.PutTTL("token", "xyz", 10)
	for _, t := range []int64{0, 9, 10, 29, 30} {
		clock = t
		_, s := c.Get("session")
		_, k := c.Get("token")
		fmt.Printf("t=%2d  session alive=%-5v token alive=%-5v size=%d\n", t, s, k, c.Len())
	}
	fmt.Println("The clock is a function parameter, so the test needs no sleeping and never flakes.")
}

// zipfKeys draws n keys with a skewed popularity: a few keys are hot.
func zipfKeys(rng *rand.Rand, n, universe int) []int {
	z := rand.NewZipf(rng, 1.2, 1, uint64(universe-1))
	out := make([]int, n)
	for i := range out {
		out[i] = int(z.Uint64())
	}
	return out
}

func replay(c *LRU[int, int], keys []int) {
	for _, k := range keys {
		if _, ok := c.Get(k); !ok {
			c.Put(k, k)
		}
	}
}

func demoRatio() {
	fmt.Println("\n== 4. Hit ratio on skewed traffic (10000 distinct keys, 100000 requests) ==")
	rng := rand.New(rand.NewSource(3))
	keys := zipfKeys(rng, 100000, 10000)
	fmt.Println("capacity   hit ratio")
	for _, capacity := range []int{10, 100, 1000, 5000} {
		c := NewLRU[int, int](capacity, func() int64 { return 0 })
		replay(c, keys)
		fmt.Printf("%8d   %.3f\n", capacity, c.HitRatio())
	}
	fmt.Println("A cache of 1% of the keys already serves most requests: popularity is skewed.")
}

func demoScan() {
	fmt.Println("\n== 5. The weakness: one scan pollutes the cache ==")
	rng := rand.New(rand.NewSource(5))
	hot := zipfKeys(rng, 20000, 500)
	c := NewLRU[int, int](200, func() int64 { return 0 })
	replay(c, hot)
	fmt.Printf("warm cache          hit ratio so far: %.3f\n", c.HitRatio())

	c.Hits, c.Misses = 0, 0
	scan := make([]int, 500)
	for i := range scan {
		scan[i] = 100000 + i // 500 cold keys, each read once (a report, a backup)
	}
	replay(c, scan)
	fmt.Printf("after scan of 500 cold keys, hot keys still cached: ")
	still := 0
	for k := 0; k < 20; k++ {
		if _, ok := c.items[k]; ok {
			still++
		}
	}
	fmt.Printf("%d of the 20 hottest\n", still)

	c.Hits, c.Misses = 0, 0
	replay(c, hot[:2000])
	fmt.Printf("next 2000 hot requests hit ratio: %.3f (recovering)\n", c.HitRatio())
	fmt.Println("Fixes: 2Q / segmented LRU, LFU, or TinyLFU admission; or bypass the cache for scans.")
}

func main() {
	demoBasics()
	demoOracle()
	demoTTL()
	demoRatio()
	demoScan()
}
