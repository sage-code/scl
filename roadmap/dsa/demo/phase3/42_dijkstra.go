// 42_dijkstra.go — Dijkstra's shortest paths with a priority queue.
//
// BFS finds the fewest EDGES. With weights (kilometres, milliseconds,
// cost) we need the smallest total WEIGHT. Dijkstra generalizes BFS: the
// FIFO queue becomes a priority queue ordered by distance so far.
//
//	repeat: take the unfinished vertex u with the smallest distance
//	        it is now FINAL — any other route would pass through a vertex
//	        that is already at least as far, and weights are >= 0
//	        RELAX each edge u->v: dist[v] = min(dist[v], dist[u] + w)
//
// With a binary heap: O((V + E) log V). Requirement: NO NEGATIVE WEIGHTS —
// a negative edge could make a "final" distance shorter later. Use
// Bellman-Ford (43) for those.
//
// Run: go run 42_dijkstra.go
package main

import (
	"container/heap"
	"fmt"
	"math"
	"math/rand"
	"slices"
)

type Edge struct{ to, w int }

// item is a heap entry: a vertex with the distance it had when pushed.
type item struct{ v, dist int }
type minHeap []item

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i].dist < h[j].dist }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(item)) }
func (h *minHeap) Pop() any {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

const inf = math.MaxInt

// dijkstra uses LAZY DELETION: instead of decreasing a key inside the heap
// (which needs the item's index, see heap.Fix in demo 28), it pushes a new
// entry and skips outdated ones when they surface. The first pop of a
// vertex is its final distance; later pops of the same vertex are stale.
// Simpler, and just as fast in practice; the heap holds at most E entries.
func dijkstra(adj [][]Edge, src int) (dist, prev []int, pops int) {
	n := len(adj)
	dist = make([]int, n)
	prev = make([]int, n)
	for i := range dist {
		dist[i], prev[i] = inf, -1
	}
	done := make([]bool, n) // done[v]: dist[v] is final
	dist[src] = 0
	h := &minHeap{{src, 0}}
	for h.Len() > 0 {
		cur := heap.Pop(h).(item)
		pops++
		if done[cur.v] {
			continue // stale entry: v is already final
		}
		done[cur.v] = true
		for _, e := range adj[cur.v] {
			if nd := cur.dist + e.w; nd < dist[e.to] {
				dist[e.to] = nd
				prev[e.to] = cur.v
				heap.Push(h, item{e.to, nd})
			}
		}
	}
	return dist, prev, pops
}

func path(prev []int, t int) []int {
	var p []int
	for v := t; v != -1; v = prev[v] {
		p = append(p, v)
	}
	slices.Reverse(p)
	return p
}

// floydWarshall computes all-pairs shortest paths in O(V^3) with three
// nested loops: allow vertex k as an intermediate stop, for k = 0..V-1.
// Too slow for big graphs, but short and obviously correct: our oracle.
func floydWarshall(adj [][]Edge) [][]int {
	n := len(adj)
	d := make([][]int, n)
	for i := range d {
		d[i] = make([]int, n)
		for j := range d[i] {
			d[i][j] = inf
		}
		d[i][i] = 0
		for _, e := range adj[i] {
			d[i][e.to] = min(d[i][e.to], e.w)
		}
	}
	for k := range n {
		for i := range n {
			for j := range n {
				if d[i][k] != inf && d[k][j] != inf && d[i][k]+d[k][j] < d[i][j] {
					d[i][j] = d[i][k] + d[k][j]
				}
			}
		}
	}
	return d
}

func main() {
	names := []string{"Home", "Cafe", "Park", "Mall", "Work", "Gym"}
	adj := make([][]Edge, len(names))
	road := func(a, b, w int) { // two-way roads, minutes
		adj[a] = append(adj[a], Edge{b, w})
		adj[b] = append(adj[b], Edge{a, w})
	}
	road(0, 1, 4)
	road(0, 2, 2)
	road(2, 1, 1)
	road(1, 3, 5)
	road(2, 3, 8)
	road(3, 4, 3)
	road(2, 5, 10)
	road(5, 4, 2)
	dist, prev, _ := dijkstra(adj, 0)
	for v, d := range dist {
		route := ""
		for i, u := range path(prev, v) {
			if i > 0 {
				route += " -> "
			}
			route += names[u]
		}
		fmt.Printf("%-5s %2d min  %s\n", names[v], d, route)
	}
	fmt.Println("(Home -> Cafe goes through Park: 2 + 1 beats the direct 4)")

	rng := rand.New(rand.NewSource(12))
	fails := 0
	for trial := 0; trial < 300; trial++ {
		n := rng.Intn(20) + 1
		g := make([][]Edge, n)
		for e := rng.Intn(4 * n); e > 0; e-- {
			g[rng.Intn(n)] = append(g[rng.Intn(n)], Edge{rng.Intn(n), rng.Intn(20)})
		}
		all := floydWarshall(g)
		for s := range n {
			d, pr, _ := dijkstra(g, s)
			if !slices.Equal(d, all[s]) {
				fails++
			}
			for t := range n { // the path's edge weights must add up to d[t]
				if d[t] == inf {
					continue
				}
				p, sum := path(pr, t), 0
				for i := 0; i+1 < len(p); i++ {
					best := inf
					for _, e := range g[p[i]] {
						if e.to == p[i+1] {
							best = min(best, e.w)
						}
					}
					sum += best
				}
				if p[0] != s || sum != d[t] {
					fails++
				}
			}
		}
	}
	fmt.Println("\nrandom graphs vs Floyd-Warshall, failures:", fails)

	// Negative edge: Dijkstra finalizes B (and D after it) too early.
	//   A->B 2, A->C 5, C->B -4, B->D 1   true shortest A->D = 5 - 4 + 1 = 2
	neg := [][]Edge{{{1, 2}, {2, 5}}, {{3, 1}}, {{1, -4}}, {}}
	d, _, _ := dijkstra(neg, 0)
	fmt.Println("with a negative edge, Dijkstra says A->D =", d[3], "but the true distance is", floydWarshall(neg)[0][3])

	// A larger sparse graph: 200,000 vertices, 1,000,000 edges.
	n := 200_000
	big := make([][]Edge, n)
	for i := 0; i < 1_000_000; i++ {
		u, v := rng.Intn(n), rng.Intn(n)
		big[u] = append(big[u], Edge{v, rng.Intn(100) + 1})
	}
	_, _, pops := dijkstra(big, 0)
	fmt.Printf("\nsparse graph V=%d E=1,000,000: %d heap pops (<= E + 1)\n", n, pops)
}
