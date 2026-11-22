// 40_topological_sort.go — Ordering tasks with dependencies.
//
// A TOPOLOGICAL ORDER of a directed graph lists every vertex before all the
// vertices it points to: build a package before the packages that import
// it, take a course before the courses that require it. It exists if and
// only if the graph has no cycle (it is a DAG, directed acyclic graph).
//
// Two classic O(V + E) algorithms:
//
//	Kahn (BFS-like)  repeatedly emit a vertex with no remaining incoming
//	                 edges; if some vertices are never emitted -> cycle
//	DFS postorder    a vertex finishes after everything it points to;
//	                 reversed finishing order is a topological order
//
// A DAG also allows dynamic programming in topological order, e.g. the
// CRITICAL PATH: the earliest time each task can finish.
//
// Run: go run 40_topological_sort.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
)

// kahn returns a topological order, or ok=false if the graph has a cycle.
func kahn(adj [][]int) (order []int, ok bool) {
	indeg := make([]int, len(adj))
	for _, vs := range adj {
		for _, v := range vs {
			indeg[v]++
		}
	}
	var ready []int // vertices whose prerequisites are all done
	for v, d := range indeg {
		if d == 0 {
			ready = append(ready, v)
		}
	}
	for len(ready) > 0 {
		u := ready[0]
		ready = ready[1:]
		order = append(order, u)
		for _, v := range adj[u] {
			indeg[v]-- // u is done: one fewer prerequisite for v
			if indeg[v] == 0 {
				ready = append(ready, v)
			}
		}
	}
	// Vertices on a cycle never reach in-degree 0 and are never emitted.
	return order, len(order) == len(adj)
}

// dfsTopo emits vertices in reverse postorder. It reports a cycle when it
// meets a vertex that is still on the current path (see 39_dfs.go).
func dfsTopo(adj [][]int) (order []int, ok bool) {
	const white, gray, black = 0, 1, 2
	color := make([]int, len(adj))
	ok = true
	var visit func(u int)
	visit = func(u int) {
		color[u] = gray
		for _, v := range adj[u] {
			switch color[v] {
			case gray:
				ok = false // back edge: cycle
			case white:
				visit(v)
			}
		}
		color[u] = black
		order = append(order, u) // u finishes after all its successors
	}
	for u := range adj {
		if color[u] == white {
			visit(u)
		}
	}
	slices.Reverse(order)
	return order, ok
}

// isTopological checks the definition directly: for every edge u->v,
// u appears before v. This is the oracle for the random tests.
func isTopological(adj [][]int, order []int) bool {
	if len(order) != len(adj) {
		return false
	}
	pos := make([]int, len(adj))
	for i, v := range order {
		pos[v] = i
	}
	for u, vs := range adj {
		for _, v := range vs {
			if pos[u] >= pos[v] {
				return false
			}
		}
	}
	return true
}

// criticalPath computes the earliest finish time of every task, given
// durations and dependencies, by relaxing edges in topological order:
// a task can start only when its slowest prerequisite has finished.
func criticalPath(adj [][]int, dur []int) (finish []int, total int) {
	order, ok := kahn(adj)
	if !ok {
		panic("dependencies contain a cycle")
	}
	start := make([]int, len(adj))
	finish = make([]int, len(adj))
	for _, u := range order { // all prerequisites of u are already final
		finish[u] = start[u] + dur[u]
		total = max(total, finish[u])
		for _, v := range adj[u] {
			start[v] = max(start[v], finish[u])
		}
	}
	return finish, total
}

func main() {
	// Build steps; an edge a -> b means "a must happen before b".
	steps := []string{"fetch", "configure", "compile", "test", "package", "docs", "release"}
	adj := [][]int{
		{1, 5}, // fetch -> configure, docs
		{2},    // configure -> compile
		{3, 4}, // compile -> test, package
		{6},    // test -> release
		{6},    // package -> release
		{6},    // docs -> release
		{},     // release
	}
	names := func(order []int) []string {
		out := make([]string, len(order))
		for i, v := range order {
			out[i] = steps[v]
		}
		return out
	}
	o1, _ := kahn(adj)
	o2, _ := dfsTopo(adj)
	fmt.Println("Kahn:", names(o1))
	fmt.Println("DFS: ", names(o2))
	fmt.Println("both valid:", isTopological(adj, o1) && isTopological(adj, o2))

	dur := []int{2, 1, 6, 4, 2, 3, 1} // minutes per step
	finish, total := criticalPath(adj, dur)
	fmt.Println("\nearliest finish per step:")
	for v, f := range finish {
		fmt.Printf("  %-9s %2d min\n", steps[v], f)
	}
	fmt.Println("whole build:", total, "min (fetch, configure, compile, test, release)")

	adj[6] = append(adj[6], 1) // release -> configure closes a cycle
	_, ok1 := kahn(adj)
	_, ok2 := dfsTopo(adj)
	fmt.Println("\nwith a cycle, ordering possible? Kahn:", ok1, " DFS:", ok2)

	// Random DAGs: shuffle vertex ids, add only edges from earlier to later
	// in a hidden order, so the graph is acyclic by construction.
	rng := rand.New(rand.NewSource(10))
	fails := 0
	for trial := 0; trial < 500; trial++ {
		n := rng.Intn(30) + 1
		hidden := rng.Perm(n)
		g := make([][]int, n)
		for e := rng.Intn(3 * n); e > 0; e-- {
			i, j := rng.Intn(n), rng.Intn(n)
			if i < j {
				g[hidden[i]] = append(g[hidden[i]], hidden[j])
			}
		}
		a, okA := kahn(g)
		b, okB := dfsTopo(g)
		if !okA || !okB || !isTopological(g, a) || !isTopological(g, b) {
			fails++
		}
		if n > 1 { // edges both ways between two vertices: a 2-cycle
			g[hidden[0]] = append(g[hidden[0]], hidden[1])
			g[hidden[1]] = append(g[hidden[1]], hidden[0])
			if _, ok := kahn(g); ok {
				fails++
			}
			if _, ok := dfsTopo(g); ok {
				fails++
			}
		}
	}
	fmt.Println("\nrandom DAG checks, failures:", fails)
}
