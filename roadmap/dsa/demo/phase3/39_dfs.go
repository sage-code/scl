// 39_dfs.go — Depth-first search and what it reveals about a graph.
//
// DFS follows one path as DEEP as possible, then backtracks to the most
// recent vertex with unexplored edges. Recursion (the call stack) or an
// explicit stack gives that last-in-first-out order. O(V + E).
//
// DFS does not find shortest paths, but its visiting structure answers
// questions about the SHAPE of a graph:
//
//	connected components   one DFS per unvisited vertex
//	cycles                 an edge back to a vertex still on the stack
//	bipartite (2-colour)   no edge joins two vertices of the same colour
//	flood fill / islands   DFS on an implicit grid graph
//
// Run: go run 39_dfs.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
)

// dfsOrder returns the vertices in the order recursive DFS visits them.
func dfsOrder(adj [][]int, start int) []int {
	visited := make([]bool, len(adj))
	var order []int
	var visit func(u int)
	visit = func(u int) {
		visited[u] = true
		order = append(order, u)
		for _, v := range adj[u] {
			if !visited[v] {
				visit(v) // go deeper before trying u's next neighbour
			}
		}
	}
	visit(start)
	return order
}

// dfsIterative uses an explicit stack, which avoids deep recursion on
// graphs with millions of vertices. Neighbours are pushed in reverse so
// they pop in the same order as the recursive version.
func dfsIterative(adj [][]int, start int) []int {
	visited := make([]bool, len(adj))
	var order []int
	stack := []int{start}
	for len(stack) > 0 {
		u := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if visited[u] {
			continue // a vertex can be pushed several times; visit it once
		}
		visited[u] = true
		order = append(order, u)
		for i := len(adj[u]) - 1; i >= 0; i-- {
			if v := adj[u][i]; !visited[v] {
				stack = append(stack, v)
			}
		}
	}
	return order
}

// components labels each vertex of an undirected graph with a component id.
func components(adj [][]int) (comp []int, count int) {
	comp = make([]int, len(adj))
	for i := range comp {
		comp[i] = -1
	}
	var visit func(u int)
	visit = func(u int) {
		comp[u] = count
		for _, v := range adj[u] {
			if comp[v] == -1 {
				visit(v)
			}
		}
	}
	for u := range adj {
		if comp[u] == -1 { // not reached by any earlier DFS: a new component
			visit(u)
			count++
		}
	}
	return comp, count
}

// hasCycleDirected uses three colours:
//
//	white  not visited yet
//	gray   on the current DFS path (the recursion stack)
//	black  finished: everything reachable from it is explored
//
// An edge to a GRAY vertex points back up the current path: a cycle.
// An edge to a black vertex is harmless (it was fully explored already).
func hasCycleDirected(adj [][]int) bool {
	const white, gray, black = 0, 1, 2
	color := make([]int, len(adj))
	var visit func(u int) bool
	visit = func(u int) bool {
		color[u] = gray
		for _, v := range adj[u] {
			if color[v] == gray || (color[v] == white && visit(v)) {
				return true
			}
		}
		color[u] = black
		return false
	}
	for u := range adj {
		if color[u] == white && visit(u) {
			return true
		}
	}
	return false
}

// isBipartite tries to 2-colour an undirected graph: every neighbour gets
// the opposite colour. A conflict means an odd cycle, so no 2-colouring.
func isBipartite(adj [][]int) bool {
	side := make([]int, len(adj)) // 0 unknown, 1 or -1
	var visit func(u, c int) bool
	visit = func(u, c int) bool {
		side[u] = c
		for _, v := range adj[u] {
			if side[v] == c || (side[v] == 0 && !visit(v, -c)) {
				return false
			}
		}
		return true
	}
	for u := range adj {
		if side[u] == 0 && !visit(u, 1) {
			return false
		}
	}
	return true
}

// countIslands flood-fills each unvisited land cell '#', sinking it to '.'
// so it is never counted twice.
func countIslands(rows []string) (islands, largest int) {
	g := make([][]byte, len(rows))
	for i := range rows {
		g[i] = []byte(rows[i])
	}
	var sink func(r, c int) int
	sink = func(r, c int) int {
		if r < 0 || r >= len(g) || c < 0 || c >= len(g[0]) || g[r][c] != '#' {
			return 0
		}
		g[r][c] = '.' // mark visited by changing the cell itself
		return 1 + sink(r-1, c) + sink(r+1, c) + sink(r, c-1) + sink(r, c+1)
	}
	for r := range g {
		for c := range g[r] {
			if g[r][c] == '#' {
				islands++
				largest = max(largest, sink(r, c))
			}
		}
	}
	return islands, largest
}

// undirected builds symmetric adjacency lists from an edge list.
func undirected(n int, edges [][2]int) [][]int {
	adj := make([][]int, n)
	for _, e := range edges {
		adj[e[0]] = append(adj[e[0]], e[1])
		adj[e[1]] = append(adj[e[1]], e[0])
	}
	return adj
}

func main() {
	g := undirected(8, [][2]int{{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 4}, {5, 6}})
	fmt.Println("recursive DFS from 0:", dfsOrder(g, 0))
	fmt.Println("iterative DFS from 0:", dfsIterative(g, 0))
	comp, n := components(g)
	fmt.Println("components:", n, "labels:", comp)

	dag := [][]int{{1, 2}, {3}, {3}, {}} // 0->1->3, 0->2->3: no cycle
	cyc := [][]int{{1}, {2}, {0, 3}, {}} // 0->1->2->0: cycle
	fmt.Println("\ndirected cycle? dag:", hasCycleDirected(dag), " cyc:", hasCycleDirected(cyc))

	square := undirected(4, [][2]int{{0, 1}, {1, 2}, {2, 3}, {3, 0}}) // even cycle
	triangle := undirected(3, [][2]int{{0, 1}, {1, 2}, {2, 0}})       // odd cycle
	fmt.Println("bipartite? square:", isBipartite(square), " triangle:", isBipartite(triangle))

	islands, largest := countIslands([]string{
		"##..#",
		"#...#",
		"..#..",
		"....#",
		"##.##",
	})
	fmt.Println("islands:", islands, " largest:", largest)

	// Checks on random graphs:
	//  - recursive and iterative DFS visit the same order
	//  - two vertices share a component label iff one is reachable from the
	//    other (reachability oracle: the iterative DFS's visited set)
	//  - DAGs built with edges only from lower to higher ids have no cycle;
	//    adding one edge from high to low that closes a path creates one
	rng := rand.New(rand.NewSource(9))
	fails := 0
	for trial := 0; trial < 300; trial++ {
		nv := rng.Intn(20) + 2
		var edges [][2]int
		for e := rng.Intn(nv * 2); e > 0; e-- {
			edges = append(edges, [2]int{rng.Intn(nv), rng.Intn(nv)})
		}
		ug := undirected(nv, edges)
		if !slices.Equal(dfsOrder(ug, 0), dfsIterative(ug, 0)) {
			fails++
		}
		lab, _ := components(ug)
		for u := range nv {
			reach := dfsIterative(ug, u)
			for v := range nv {
				if (lab[u] == lab[v]) != slices.Contains(reach, v) {
					fails++
				}
			}
		}
		d := make([][]int, nv)
		for i := 0; i+1 < nv; i++ {
			d[i] = append(d[i], i+1) // a path 0->1->...->n-1
			if j := rng.Intn(nv); j > i {
				d[i] = append(d[i], j) // forward edges keep it acyclic
			}
		}
		if hasCycleDirected(d) {
			fails++
		}
		d[nv-1] = append(d[nv-1], rng.Intn(nv)) // any back edge closes a cycle
		if !hasCycleDirected(d) {
			fails++
		}
	}
	fmt.Println("\nrandom checks, failures:", fails)
}
