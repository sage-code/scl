// 22_open_addressing.go — A hash set with linear probing.
//
// Open addressing stores entries directly in one flat array — no chains.
// On a collision it PROBES the next slot (i+1, i+2, ... wrapping around)
// until it finds the key or an empty slot. Advantages: no per-entry
// allocation and excellent cache locality, since probes read neighbouring
// memory. Go's own map (Swiss tables, Go 1.24+) and many high-performance
// tables are built on open addressing.
//
// The subtle part is DELETION. Emptying a slot would break the probe chain
// of keys stored after it ("I hit an empty slot, so the key must be absent").
// Instead, a deleted slot becomes a TOMBSTONE: lookups skip over it,
// inserts may reuse it. Resizing clears tombstones.
//
// Load factor must stay well below 1 (here <= 0.5 including tombstones):
// probe sequences grow sharply as the table fills.
//
// Run: go run 22_open_addressing.go
package main

import (
	"fmt"
	"hash/fnv"
)

type slotState uint8

const (
	empty     slotState = iota // never used: ends a probe sequence
	full                       // holds a live key
	tombstone                  // deleted: probing must continue past it
)

type slot struct {
	state slotState
	key   string
}

type HashSet struct {
	slots      []slot
	live, dead int // live keys and tombstones
	probes     int // total probe steps, to measure clustering
}

func NewHashSet() *HashSet { return &HashSet{slots: make([]slot, 8)} }

func hashOf(s string) uint64 {
	h := fnv.New64a() // standard-library FNV-1a
	h.Write([]byte(s))
	return h.Sum64()
}

// find returns the index holding key, or the index where key should be
// inserted (the first tombstone seen, else the terminating empty slot).
func (s *HashSet) find(key string) (idx int, found bool) {
	mask := len(s.slots) - 1 // capacity is a power of two
	i := int(hashOf(key)) & mask
	firstFree := -1
	for {
		s.probes++
		sl := &s.slots[i]
		switch sl.state {
		case empty:
			if firstFree >= 0 {
				return firstFree, false // reuse a tombstone we passed
			}
			return i, false
		case tombstone:
			if firstFree < 0 {
				firstFree = i
			}
		case full:
			if sl.key == key {
				return i, true
			}
		}
		i = (i + 1) & mask // linear probe, wrapping around the array
	}
}

func (s *HashSet) Add(key string) bool {
	if float64(s.live+s.dead+1) > 0.5*float64(len(s.slots)) {
		s.rehash()
	}
	i, found := s.find(key)
	if found {
		return false
	}
	if s.slots[i].state == tombstone {
		s.dead-- // reusing a tombstone
	}
	s.slots[i] = slot{full, key}
	s.live++
	return true
}

func (s *HashSet) Contains(key string) bool {
	_, found := s.find(key)
	return found
}

func (s *HashSet) Remove(key string) bool {
	i, found := s.find(key)
	if !found {
		return false
	}
	s.slots[i] = slot{state: tombstone} // NOT empty: keeps probe chains intact
	s.live--
	s.dead++
	return true
}

// rehash rebuilds the table, dropping tombstones. The capacity doubles only
// when live keys (not tombstones) demand it.
func (s *HashSet) rehash() {
	old := s.slots
	size := len(old)
	if float64(s.live+1) > 0.25*float64(size) {
		size *= 2
	}
	s.slots = make([]slot, size)
	s.live, s.dead = 0, 0
	for _, sl := range old {
		if sl.state == full {
			i, _ := s.find(sl.key)
			s.slots[i] = slot{full, sl.key}
			s.live++
		}
	}
}

// denseDeleteCheck fills a 64-slot table to just under the 0.5 limit, so
// probe chains are long enough to overlap, deletes every third key, and
// counts surviving keys that can no longer be found. With tombstones the
// answer must be 0; replace the tombstone with `empty` in Remove to see
// keys vanish whose probe chains passed through a deleted slot.
func denseDeleteCheck() (lost int) {
	s := &HashSet{slots: make([]slot, 64)}
	var keys []string
	for i := 0; len(keys) < 31; i++ { // 31/64 < 0.5: no rehash happens
		k := fmt.Sprint("x", i)
		if s.Add(k) {
			keys = append(keys, k)
		}
	}
	for i, k := range keys {
		if i%3 == 0 {
			s.Remove(k)
		}
	}
	for i, k := range keys {
		if i%3 != 0 && !s.Contains(k) {
			lost++
		}
	}
	return lost
}

func main() {
	s := NewHashSet()
	for _, k := range []string{"apple", "banana", "cherry", "date", "elder"} {
		s.Add(k)
	}
	fmt.Println("contains banana:", s.Contains("banana"))
	s.Remove("banana")
	fmt.Println("after remove, contains banana:", s.Contains("banana"))
	// Every other key must still be reachable, even if its probe chain
	// passed through banana's slot — that is what the tombstone guarantees.
	all := true
	for _, k := range []string{"apple", "cherry", "date", "elder"} {
		all = all && s.Contains(k)
	}
	fmt.Println("other keys still found:", all)
	fmt.Printf("live=%d tombstones=%d capacity=%d\n", s.live, s.dead, len(s.slots))
	fmt.Println("dense table, surviving keys lost after deletes:", denseDeleteCheck())

	// Churn: insert and delete many keys; tombstones are cleared on rehash.
	big := NewHashSet()
	for i := 0; i < 50_000; i++ {
		big.Add(fmt.Sprint("k", i))
		if i%2 == 1 {
			big.Remove(fmt.Sprint("k", i-1)) // delete every even key
		}
	}
	errors := 0
	for i := 0; i < 50_000; i++ {
		want := i%2 == 1 // odd keys survive; every even key was removed
		if big.Contains(fmt.Sprint("k", i)) != want {
			errors++
		}
	}
	big.probes = 0
	for i := 0; i < 50_000; i++ {
		big.Contains(fmt.Sprint("k", i))
	}
	fmt.Printf("\nafter churn: live=%d tombstones=%d capacity=%d membership errors=%d\n",
		big.live, big.dead, len(big.slots), errors)
	fmt.Printf("average probes per lookup: %.2f\n", float64(big.probes)/50_000)
}
