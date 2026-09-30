// 45_minimum_spanning_tree.go — Kruskal and Prim.
//
// A SPANNING TREE of a connected, undirected graph connects all V vertices
// with exactly V-1 edges and no cycle. The MINIMUM spanning tree (MST) has
// the smallest total weight: the cheapest way to cable every building,
// pipe every house, or link every cluster.
//
// Both classic algorithms are GREEDY, justified by the CUT PROPERTY:
// for any split of the vertices into two groups, the lightest edge crossing
// the split belongs to some MST.
//
//	Kruskal  sort all edges; add each edge unless it closes a cycle
//	         (union-find, 41). O(E log E). Natural for edge lists.
//	Prim     grow one tree from a start vertex; always add the lightest
//	         edge leaving the tree (heap). O(E log V). Natural for
//	         adjacency lists and dense graphs.
//
// Run: go run 45_minimum_spanning_tree.go
package main

import (
	"cmp"
	"container/heap"
	"fmt"
	"math/rand"
	"slices"
)

type Edge struct{ u, v, w int }

// ---- union-find (compact version of 41_union_find.go) ----
type DSU struct{ parent, size []int }

func NewDSU(n int) *DSU {
	d := &DSU{make([]int, n), make([]int, n)}
	for i := range d.parent {
		d.parent[i], d.size[i] = i, 1
	}
	return d
}
func (d *DSU) Find(x int) int {
	for d.parent[x] != x {
		d.parent[x] = d.parent[d.parent[x]] // path halving: a one-pass compression
		x = d.parent[x]
	}
	return x
}
func (d *DSU) Union(a, b int) bool {
	a, b = d.Find(a), d.Find(b)
	if a == b {
		return false
	}
	if d.size[a] < d.size[b] {
		a, b = b, a
	}
	d.parent[b] = a
	d.size[a] += d.size[b]
	return true
}

// kruskal returns the MST edges and total weight. ok is false if the graph
// is disconnected (then the result is a minimum spanning FOREST).
func kruskal(n int, edges []Edge) (tree []Edge, total int, ok bool) {
	sorted := slices.Clone(edges)
	slices.SortFunc(sorted, func(a, b Edge) int { return cmp.Compare(a.w, b.w) })
	d := NewDSU(n)
	for _, e := range sorted {
		if d.Union(e.u, e.v) { // endpoints in different trees: no cycle
			tree = append(tree, e)
			total += e.w
			if len(tree) == n-1 {
				break // a spanning tree is complete
			}
		}
	}
	return tree, total, len(tree) == n-1
}

// ---- Prim with a lazy heap of candidate edges ----
type edgeHeap []Edge

func (h edgeHeap) Len() int           { return len(h) }
func (h edgeHeap) Less(i, j int) bool { return h[i].w < h[j].w }
func (h edgeHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *edgeHeap) Push(x any)        { *h = append(*h, x.(Edge)) }
func (h *edgeHeap) Pop() any {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

func prim(n int, edges []Edge) (tree []Edge, total int, ok bool) {
	adj := make([][]Edge, n)
	for _, e := range edges {
		adj[e.u] = append(adj[e.u], e)
		adj[e.v] = append(adj[e.v], Edge{e.v, e.u, e.w}) // reversed copy
	}
	inTree := make([]bool, n)
	h := &edgeHeap{}
	add := func(u int) { // put u in the tree; its edges become candidates
		inTree[u] = true
		for _, e := range adj[u] {
			if !inTree[e.v] {
				heap.Push(h, e)
			}
		}
	}
	add(0)
	for h.Len() > 0 && len(tree) < n-1 {
		e := heap.Pop(h).(Edge)
		if inTree[e.v] {
			continue // both ends already in the tree: this edge would close a cycle
		}
		tree = append(tree, e)
		total += e.w
		add(e.v)
	}
	return tree, total, len(tree) == n-1
}

// bruteMST tries every subset of V-1 edges: exponential, fine for tiny
// graphs, and obviously correct — the oracle.
func bruteMST(n int, edges []Edge) (best int, ok bool) {
	best = -1
	var try func(start int, chosen []Edge)
	try = func(start int, chosen []Edge) {
		if len(chosen) == n-1 {
			d, w := NewDSU(n), 0
			for _, e := range chosen {
				if !d.Union(e.u, e.v) {
					return // cycle: V-1 edges with a cycle cannot span
				}
				w += e.w
			}
			if best == -1 || w < best {
				best = w
			}
			return
		}
		for i := start; i < len(edges); i++ {
			try(i+1, append(chosen, edges[i]))
		}
	}
	try(0, nil)
	return best, best != -1
}

func main() {
	towns := []string{"A", "B", "C", "D", "E", "F"}
	cables := []Edge{
		{0, 1, 7}, {0, 3, 5}, {1, 2, 8}, {1, 3, 9}, {1, 4, 7},
		{2, 4, 5}, {3, 4, 15}, {3, 5, 6}, {4, 5, 8},
	}
	show := func(name string, tree []Edge, total int) {
		fmt.Printf("%-8s total %d:", name, total)
		for _, e := range tree {
			fmt.Printf(" %s-%s(%d)", towns[e.u], towns[e.v], e.w)
		}
		fmt.Println()
	}
	kt, kw, _ := kruskal(len(towns), cables)
	pt, pw, _ := prim(len(towns), cables)
	show("Kruskal", kt, kw)
	show("Prim", pt, pw)
	fmt.Println("(same weight; the order of edges differs, and with equal weights")
	fmt.Println(" the trees themselves may differ — an MST is not always unique)")

	rng := rand.New(rand.NewSource(15))
	fails := 0
	for trial := 0; trial < 400; trial++ {
		n := rng.Intn(6) + 1
		var es []Edge
		for e := rng.Intn(9); e > 0; e-- {
			u, v := rng.Intn(n), rng.Intn(n)
			if u != v {
				es = append(es, Edge{u, v, rng.Intn(10) + 1})
			}
		}
		_, kw, kok := kruskal(n, es)
		_, pw, pok := prim(n, es)
		bw, bok := bruteMST(n, es)
		if kok != bok || pok != bok || (bok && (kw != bw || pw != bw)) {
			fails++
		}
	}
	fmt.Println("\nrandom graphs vs brute force (weight and connectivity), failures:", fails)

	// Larger: 2,000 random points, complete graph with squared distances.
	const n = 2000
	x, y := make([]int, n), make([]int, n)
	for i := range x {
		x[i], y[i] = rng.Intn(10_000), rng.Intn(10_000)
	}
	var all []Edge
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			dx, dy := x[i]-x[j], y[i]-y[j]
			all = append(all, Edge{i, j, dx*dx + dy*dy})
		}
	}
	_, kw, _ = kruskal(n, all)
	_, pw, _ = prim(n, all)
	fmt.Printf("complete graph V=%d E=%d: Kruskal %d, Prim %d, equal: %v\n", n, len(all), kw, pw, kw == pw)
}
