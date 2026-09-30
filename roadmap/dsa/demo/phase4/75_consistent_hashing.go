// 75_consistent_hashing.go — Spreading keys over servers without reshuffling.
//
// A cache or database is split over N servers. The obvious rule is
//
//	server = hash(key) % N
//
// It balances well, but adding one server changes N, and almost every key now
// maps somewhere else: a cache loses nearly everything at once.
//
// CONSISTENT HASHING fixes this. Hash the servers onto a circle (a ring of
// 2^64 positions) and hash each key onto the same circle. A key belongs to the
// first server found walking clockwise from the key's position. Adding a
// server only steals the arc just before it, roughly 1/(N+1) of the keys, and
// every other key stays where it was.
//
// One point per server gives very uneven arcs, so each server is placed at many
// pseudo-random points ("virtual nodes"). More virtual nodes: better balance,
// more memory.
//
// RENDEZVOUS (highest random weight) hashing reaches the same goal without a
// ring: give every (server, key) pair a score and pick the server with the
// highest one. It costs O(N) per lookup but has no state and is perfectly even.
//
// Run: go run 75_consistent_hashing.go
package main

import (
	"fmt"
	"hash/fnv"
	"math"
	"slices"
	"sort"
)

func hash64(s string) uint64 {
	f := fnv.New64a()
	f.Write([]byte(s))
	x := f.Sum64()
	x ^= x >> 30
	x *= 0xbf58476d1ce4e5b9
	x ^= x >> 27
	x *= 0x94d049bb133111eb
	x ^= x >> 31
	return x
}

// ------------------------------------------------------------------- ring

type point struct {
	hash   uint64
	server string
}

type Ring struct {
	vnodes int
	points []point // sorted by hash
}

func NewRing(vnodes int, servers ...string) *Ring {
	r := &Ring{vnodes: vnodes}
	for _, s := range servers {
		r.Add(s)
	}
	return r
}

func (r *Ring) Add(server string) {
	for i := 0; i < r.vnodes; i++ {
		r.points = append(r.points, point{hash64(fmt.Sprintf("%s#%d", server, i)), server})
	}
	sort.Slice(r.points, func(i, j int) bool { return r.points[i].hash < r.points[j].hash })
}

func (r *Ring) Remove(server string) {
	r.points = slices.DeleteFunc(r.points, func(p point) bool { return p.server == server })
}

// Get returns the first server at or after the key's position, wrapping around.
func (r *Ring) Get(key string) string {
	h := hash64(key)
	i := sort.Search(len(r.points), func(i int) bool { return r.points[i].hash >= h })
	if i == len(r.points) {
		i = 0
	}
	return r.points[i].server
}

// GetN returns n DISTINCT servers walking clockwise: replica placement.
func (r *Ring) GetN(key string, n int) []string {
	h := hash64(key)
	i := sort.Search(len(r.points), func(i int) bool { return r.points[i].hash >= h })
	var out []string
	for step := 0; step < len(r.points) && len(out) < n; step++ {
		s := r.points[(i+step)%len(r.points)].server
		if !slices.Contains(out, s) {
			out = append(out, s)
		}
	}
	return out
}

// slowGet is the definition, by brute force: the point with the smallest
// clockwise distance from the key.
func (r *Ring) slowGet(key string) string {
	h := hash64(key)
	best, bestDist := "", uint64(math.MaxUint64)
	for _, p := range r.points {
		if d := p.hash - h; d <= bestDist { // uint64 subtraction wraps: clockwise distance
			best, bestDist = p.server, d
		}
	}
	return best
}

// ------------------------------------------------------------- alternatives

func modGet(servers []string, key string) string {
	return servers[hash64(key)%uint64(len(servers))]
}

func rendezvousGet(servers []string, key string) string {
	best, bestScore := "", uint64(0)
	for _, s := range servers {
		if score := hash64(s + "|" + key); best == "" || score > bestScore {
			best, bestScore = s, score
		}
	}
	return best
}

// ------------------------------------------------------------------- demos

func names(n int) []string {
	out := make([]string, n)
	for i := range out {
		out[i] = fmt.Sprintf("node-%02d", i)
	}
	return out
}

func keys(n int) []string {
	out := make([]string, n)
	for i := range out {
		out[i] = fmt.Sprintf("user:%d", i)
	}
	return out
}

func moved(ks []string, before, after func(string) string) float64 {
	m := 0
	for _, k := range ks {
		if before(k) != after(k) {
			m++
		}
	}
	return float64(m) / float64(len(ks))
}

func demoMovement() {
	fmt.Println("== 1. Adding a server to 10: what fraction of 100000 keys move? ==")
	ks := keys(100000)
	old := names(10)
	grown := names(11)

	fmt.Printf("hash %% N                 %5.1f%%   (ideal minimum: %.1f%%)\n",
		100*moved(ks, func(k string) string { return modGet(old, k) }, func(k string) string { return modGet(grown, k) }),
		100.0/11)

	r1 := NewRing(200, old...)
	r2 := NewRing(200, grown...)
	fmt.Printf("ring, 200 virtual nodes  %5.1f%%\n", 100*moved(ks, r1.Get, r2.Get))

	fmt.Printf("rendezvous               %5.1f%%\n",
		100*moved(ks, func(k string) string { return rendezvousGet(old, k) }, func(k string) string { return rendezvousGet(grown, k) }))

	// every key that moved in the ring must have moved TO the new server
	wrong := 0
	for _, k := range ks {
		if a, b := r1.Get(k), r2.Get(k); a != b && b != "node-10" {
			wrong++
		}
	}
	fmt.Println("keys that moved between two OLD servers (ring):", wrong)
}

func demoRemoval() {
	fmt.Println("\n== 2. Removing a server from the ring ==")
	ks := keys(100000)
	r := NewRing(200, names(10)...)
	before := make(map[string]string, len(ks))
	for _, k := range ks {
		before[k] = r.Get(k)
	}
	r.Remove("node-03")
	moves, notOnDead, fromOthers := 0, 0, 0
	for _, k := range ks {
		now := r.Get(k)
		if now == "node-03" {
			notOnDead++
		}
		if now != before[k] {
			moves++
			if before[k] != "node-03" {
				fromOthers++
			}
		}
	}
	fmt.Printf("keys moved: %.1f%%   keys still mapped to the removed node: %d   moved but not from it: %d\n",
		100*float64(moves)/float64(len(ks)), notOnDead, fromOthers)
	fmt.Println("Only the dead server's keys move, and they spread over the survivors.")
}

func demoBalance() {
	fmt.Println("\n== 3. Balance against virtual nodes: 10 servers, 100000 keys ==")
	ks := keys(100000)
	fmt.Println("vnodes   busiest / average   least busy / average   ring points")
	for _, v := range []int{1, 10, 100, 1000} {
		r := NewRing(v, names(10)...)
		load := map[string]int{}
		for _, k := range ks {
			load[r.Get(k)]++
		}
		hi, lo := 0, len(ks)
		for _, s := range names(10) {
			hi, lo = max(hi, load[s]), min(lo, load[s])
		}
		avg := float64(len(ks)) / 10
		fmt.Printf("%6d   %17.2f   %20.2f   %11d\n", v, float64(hi)/avg, float64(lo)/avg, len(r.points))
	}
	fmt.Println("With one point per server the arcs are very uneven. Balance improves like 1/sqrt(vnodes).")
}

func demoCorrectness() {
	fmt.Println("\n== 4. Ring lookup against the brute-force definition ==")
	r := NewRing(50, names(8)...)
	bad := 0
	for _, k := range keys(50000) {
		if r.Get(k) != r.slowGet(k) {
			bad++
		}
	}
	fmt.Println("disagreements over 50000 keys:", bad)

	fmt.Println("\nReplica placement (3 distinct servers walking clockwise):")
	for _, k := range []string{"user:1", "user:2", "user:3"} {
		fmt.Printf("  %-7s -> %v\n", k, r.GetN(k, 3))
	}
}

func main() {
	demoMovement()
	demoRemoval()
	demoBalance()
	demoCorrectness()
}
