// 43_bellman_ford.go — Shortest paths with negative weights.
//
// Negative weights appear with refunds, energy gained going downhill, or
// logarithms of exchange rates. Dijkstra breaks on them (see 42); the
// Bellman-Ford algorithm does not:
//
//	repeat V-1 times: relax EVERY edge
//
// A shortest path without cycles has at most V-1 edges, and after round k
// every path of k edges is known — so V-1 rounds suffice. Cost O(V * E):
// slower than Dijkstra, but general.
//
// A NEGATIVE CYCLE (a loop whose weights sum below zero) makes "shortest"
// meaningless: going around again is always cheaper. Detection: if a V-th
// round still improves some distance, a negative cycle is reachable.
//
// Run: go run 43_bellman_ford.go
package main

import (
	"fmt"
	"math"
	"math/rand"
	"slices"
)

type Edge struct {
	from, to int
	w        float64
}

var inf = math.Inf(1)

// bellmanFord returns distances from src, the predecessor of each vertex,
// and a vertex on a negative cycle (-1 if none). rounds reports how many
// rounds ran before distances stopped changing (early exit).
func bellmanFord(n int, edges []Edge, src int) (dist []float64, prev []int, cycleAt, rounds int) {
	dist = make([]float64, n)
	prev = make([]int, n)
	for i := range dist {
		dist[i], prev[i] = inf, -1
	}
	dist[src] = 0
	cycleAt = -1
	for round := 1; round <= n; round++ {
		rounds = round
		changed := -1
		for _, e := range edges {
			if dist[e.from] != inf && dist[e.from]+e.w < dist[e.to]-1e-9 {
				dist[e.to] = dist[e.from] + e.w
				prev[e.to] = e.from
				changed = e.to
			}
		}
		if changed == -1 {
			return // nothing improved: all distances are final
		}
		if round == n {
			cycleAt = changed // still improving in round V: negative cycle
		}
	}
	return
}

// extractCycle walks predecessors from a vertex that was improved in round
// V. After V steps we are guaranteed to be ON the cycle; then follow prev
// until we return to the same vertex.
func extractCycle(prev []int, v int) []int {
	for range prev {
		v = prev[v]
	}
	cycle := []int{v}
	for u := prev[v]; u != v; u = prev[u] {
		cycle = append(cycle, u)
	}
	cycle = append(cycle, v)
	slices.Reverse(cycle)
	return cycle
}

func main() {
	// Delivery route where some legs earn money back (negative cost).
	edges := []Edge{
		{0, 1, 6}, {0, 2, 7}, {1, 3, 5}, {1, 4, -4}, {1, 2, 8},
		{2, 3, -3}, {2, 4, 9}, {3, 1, -2}, {4, 3, 7},
	}
	dist, prev, cyc, rounds := bellmanFord(5, edges, 0)
	fmt.Println("distances from 0:", dist, " negative cycle:", cyc != -1, " rounds:", rounds)
	fmt.Println("predecessors:   ", prev)

	// Currency arbitrage. Trading along a cycle multiplies rates; a profit
	// means product > 1, i.e. sum of -log(rate) < 0: a negative cycle.
	// These made-up rates hide one: USD -> EUR -> GBP -> USD pays
	// 0.92 * 0.86 * 1.27 = 1.0048.
	cur := []string{"USD", "EUR", "GBP", "JPY"}
	rates := [][]float64{ // rates[i][j]: units of j for one unit of i
		{1, 0.92, 0.78, 151.0},
		{1.08, 1, 0.86, 164.5},
		{1.27, 1.16, 1, 191.8},
		{0.0066, 0.0060, 0.0052, 1},
	}
	var fx []Edge
	for i := range rates {
		for j := range rates[i] {
			if i != j {
				fx = append(fx, Edge{i, j, -math.Log(rates[i][j])})
			}
		}
	}
	_, prev, cyc, _ = bellmanFord(len(cur), fx, 0)
	if cyc == -1 {
		fmt.Println("\nno arbitrage")
	} else {
		loop := extractCycle(prev, cyc)
		amount := 1.0
		fmt.Print("\narbitrage loop: ")
		for i, c := range loop {
			fmt.Print(cur[c], " ")
			if i+1 < len(loop) {
				amount *= rates[c][loop[i+1]]
			}
		}
		fmt.Printf("\n1 unit becomes %.4f after one loop\n", amount)
	}

	// Oracle check with negative weights but NO negative cycle. Trick: pick
	// a random "potential" p[v] and use w(u,v) = base + p[u] - p[v] with
	// base >= 0. Around any cycle the potentials cancel, so every cycle has
	// weight >= 0, while single edges can still be negative.
	rng := rand.New(rand.NewSource(13))
	fails := 0
	for trial := 0; trial < 300; trial++ {
		n := rng.Intn(15) + 1
		p := make([]int, n)
		for i := range p {
			p[i] = rng.Intn(21) - 10
		}
		var es []Edge
		for e := rng.Intn(4 * n); e > 0; e-- {
			u, v := rng.Intn(n), rng.Intn(n)
			es = append(es, Edge{u, v, float64(rng.Intn(10) + p[u] - p[v])})
		}
		// Floyd-Warshall oracle
		fw := make([][]float64, n)
		for i := range fw {
			fw[i] = make([]float64, n)
			for j := range fw[i] {
				fw[i][j] = inf
			}
			fw[i][i] = 0
		}
		for _, e := range es {
			fw[e.from][e.to] = math.Min(fw[e.from][e.to], e.w)
		}
		for k := range n {
			for i := range n {
				for j := range n {
					fw[i][j] = math.Min(fw[i][j], fw[i][k]+fw[k][j])
				}
			}
		}
		s := rng.Intn(n)
		d, _, c, _ := bellmanFord(n, es, s)
		if c != -1 || !slices.Equal(d, fw[s]) {
			fails++
		}
		if n > 1 { // now add a clearly negative cycle through s
			es = append(es, Edge{s, (s + 1) % n, -50}, Edge{(s + 1) % n, s, 0})
			if _, _, c, _ := bellmanFord(n, es, s); c == -1 {
				fails++
			}
		}
	}
	fmt.Println("\nrandom checks (vs Floyd-Warshall, cycle detection), failures:", fails)
}
