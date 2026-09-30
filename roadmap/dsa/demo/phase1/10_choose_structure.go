// 10_choose_structure.go — Choosing a data structure by its operations.
//
// Scenario: a service keeps a blocklist of N user IDs and must answer
// Q queries "is this ID blocked?". Three candidate representations:
//
//	unsorted slice  build O(n)        query O(n)       -> total O(n*q)
//	sorted slice    build O(n log n)  query O(log n)   -> total O((n+q) log n)
//	map (hash set)  build O(n)        query O(1) avg   -> total O(n+q)
//
// The question is never "which structure is best?" but "which operations
// dominate MY workload?". We measure all three on the same data.
//
// Run: go run 10_choose_structure.go
package main

import (
	"fmt"
	"math/rand"
	"sort"
	"time"
)

// Set is the operation our program needs. Hiding the representation behind
// an interface lets us swap implementations without touching callers.
type Set interface {
	Contains(id int) bool
}

// --- 1. unsorted slice: simplest, cheapest to build, slowest to query ---

type SliceSet []int

func (s SliceSet) Contains(id int) bool {
	for _, v := range s { // scan everything in the worst case
		if v == id {
			return true
		}
	}
	return false
}

// --- 2. sorted slice: compact memory, logarithmic queries ---

type SortedSet []int

func NewSortedSet(ids []int) SortedSet {
	s := append([]int(nil), ids...) // copy: never reorder the caller's data
	sort.Ints(s)
	return SortedSet(s)
}

func (s SortedSet) Contains(id int) bool {
	// sort.SearchInts returns the first index i with s[i] >= id.
	i := sort.SearchInts(s, id)
	return i < len(s) && s[i] == id
}

// --- 3. map as a set: fastest queries, highest memory per element ---

type MapSet map[int]struct{}

func NewMapSet(ids []int) MapSet {
	m := make(MapSet, len(ids))
	for _, id := range ids {
		m[id] = struct{}{}
	}
	return m
}

func (m MapSet) Contains(id int) bool {
	_, ok := m[id]
	return ok
}

// timeIt returns the average duration of one call to fn. Fast calls can be
// shorter than the system timer's resolution, so we repeat fn until at
// least 50ms have passed and divide by the number of runs.
func timeIt(fn func()) time.Duration {
	runs := 0
	start := time.Now()
	for time.Since(start) < 50*time.Millisecond {
		fn()
		runs++
	}
	return time.Since(start) / time.Duration(runs)
}

// run times the two phases separately — building the set, then answering
// every query — because different workloads weigh them differently.
func run(name string, build func() Set, queries []int) {
	buildTime := timeIt(func() { build() })

	set := build()
	hits := 0
	queryTime := timeIt(func() {
		hits = 0
		for _, q := range queries {
			if set.Contains(q) {
				hits++
			}
		}
	})
	fmt.Printf("%-14s build=%-12v query=%-12v hits=%d\n", name, buildTime, queryTime, hits)
}

func main() {
	rng := rand.New(rand.NewSource(42)) // fixed seed: repeatable results
	const universe = 10_000_000

	for _, tc := range []struct{ n, q int }{
		{1_000, 1_000},   // tiny: every choice is fast enough
		{50_000, 50_000}, // medium: the O(n*q) option falls behind
		{50_000, 10},     // few queries: build cost now dominates
	} {
		ids := make([]int, tc.n)
		for i := range ids {
			ids[i] = rng.Intn(universe)
		}
		queries := make([]int, tc.q)
		for i := range queries {
			queries[i] = rng.Intn(universe)
		}

		fmt.Printf("\nN=%d blocked IDs, Q=%d queries\n", tc.n, tc.q)
		run("unsorted", func() Set { return SliceSet(ids) }, queries)
		run("sorted+search", func() Set { return NewSortedSet(ids) }, queries)
		run("map", func() Set { return NewMapSet(ids) }, queries)
	}

	// Lessons:
	//  - With few queries, the unsorted slice can win: it costs nothing to build.
	//  - The sorted slice uses the least memory per ID and also supports range
	//    queries ("all IDs between 1000 and 2000"), which a map cannot answer.
	//  - The map wins for many point queries, at a higher memory cost.
}
