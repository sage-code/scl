// 37_graph_representations.go — Three ways to store a graph.
//
// A graph is a set of VERTICES (nodes) connected by EDGES. Edges may be
// directed (one-way streets, dependencies) or undirected (friendships,
// roads), and may carry a WEIGHT (distance, cost, capacity).
//
//	representation     memory   "is u-v an edge?"  "neighbours of u"
//	edge list          O(E)     O(E)               O(E)
//	adjacency matrix   O(V^2)   O(1)               O(V)
//	adjacency list     O(V+E)   O(deg u)           O(deg u)
//
// Most real graphs are SPARSE (E much smaller than V^2): a road network or
// a social graph has a few edges per vertex. The adjacency list is the
// default; the matrix wins only for dense graphs or constant-time edge tests.
//
// Run: go run 37_graph_representations.go
package main

import (
	"fmt"
	"slices"
	"strings"
)

// Edge is one connection; the edge list is simply []Edge. It is the format
// graphs usually arrive in (files, databases) and what Kruskal's MST needs.
type Edge struct {
	From, To, Weight int
}

// Matrix: m[u][v] is the weight, 0 = no edge.
type Matrix [][]int

func NewMatrix(n int, edges []Edge, directed bool) Matrix {
	m := make(Matrix, n)
	for i := range m {
		m[i] = make([]int, n)
	}
	for _, e := range edges {
		m[e.From][e.To] = e.Weight
		if !directed {
			m[e.To][e.From] = e.Weight
		}
	}
	return m
}

// Graph is an adjacency list: adj[u] holds the edges leaving u.
// Vertices are 0..n-1; map real names to indices once, at the boundary.
type Graph struct {
	adj      [][]Edge
	directed bool
}

func NewGraph(n int, directed bool) *Graph {
	return &Graph{adj: make([][]Edge, n), directed: directed}
}

func (g *Graph) AddEdge(u, v, w int) {
	g.adj[u] = append(g.adj[u], Edge{u, v, w})
	if !g.directed {
		g.adj[v] = append(g.adj[v], Edge{v, u, w}) // store both directions
	}
}

func (g *Graph) HasEdge(u, v int) bool {
	return slices.ContainsFunc(g.adj[u], func(e Edge) bool { return e.To == v })
}

// InDegrees counts incoming edges per vertex — needed by topological sort.
func (g *Graph) InDegrees() []int {
	in := make([]int, len(g.adj))
	for _, edges := range g.adj {
		for _, e := range edges {
			in[e.To]++
		}
	}
	return in
}

// Reverse returns the transpose graph (every edge flipped). Useful for
// "who depends on me?" questions and strongly connected components.
func (g *Graph) Reverse() *Graph {
	r := NewGraph(len(g.adj), true)
	for _, edges := range g.adj {
		for _, e := range edges {
			r.AddEdge(e.To, e.From, e.Weight)
		}
	}
	return r
}

// Grid graphs are implicit: the neighbours of cell (r, c) are computed on
// the fly and never stored. Mazes, images and game maps work this way.
var dirs = [4][2]int{{-1, 0}, {1, 0}, {0, -1}, {0, 1}}

func gridNeighbours(grid []string, r, c int) [][2]int {
	var out [][2]int
	for _, d := range dirs {
		nr, nc := r+d[0], c+d[1]
		if nr >= 0 && nr < len(grid) && nc >= 0 && nc < len(grid[0]) && grid[nr][nc] != '#' {
			out = append(out, [2]int{nr, nc})
		}
	}
	return out
}

func main() {
	names := []string{"A", "B", "C", "D", "E"}
	id := map[string]int{}
	for i, n := range names {
		id[n] = i
	}
	edges := []Edge{{0, 1, 4}, {0, 2, 1}, {2, 1, 2}, {1, 3, 5}, {2, 3, 8}, {3, 4, 3}}

	fmt.Println("edge list:")
	for _, e := range edges {
		fmt.Printf("  %s -%d- %s\n", names[e.From], e.Weight, names[e.To])
	}

	m := NewMatrix(len(names), edges, false)
	fmt.Println("\nadjacency matrix (undirected, weights):")
	fmt.Println("   " + strings.Join(names, "  "))
	for i, row := range m {
		fmt.Print(names[i])
		for _, w := range row {
			fmt.Printf("%3d", w)
		}
		fmt.Println()
	}

	g := NewGraph(len(names), false)
	for _, e := range edges {
		g.AddEdge(e.From, e.To, e.Weight)
	}
	fmt.Println("\nadjacency list (undirected):")
	for u, es := range g.adj {
		fmt.Printf("  %s:", names[u])
		for _, e := range es {
			fmt.Printf(" %s(%d)", names[e.To], e.Weight)
		}
		fmt.Println()
	}
	fmt.Println("B-D edge?", g.HasEdge(id["B"], id["D"]), " A-E edge?", g.HasEdge(id["A"], id["E"]))

	// Consistency check: every representation must agree on every pair.
	disagree := 0
	for u := range names {
		for v := range names {
			if (m[u][v] != 0) != g.HasEdge(u, v) {
				disagree++
			}
		}
	}
	fmt.Println("matrix vs list disagreements:", disagree)

	d := NewGraph(len(names), true)
	for _, e := range edges {
		d.AddEdge(e.From, e.To, e.Weight)
	}
	fmt.Println("\ndirected in-degrees:", d.InDegrees())
	fmt.Println("reversed graph, edges into D come from:", len(d.Reverse().adj[id["D"]]), "vertices")

	// Memory for a sparse graph: 1,000,000 vertices with ~4 edges each.
	V, E := 1_000_000, 4_000_000
	fmt.Printf("\nsparse graph V=%d E=%d\n", V, E)
	fmt.Printf("  matrix of bools: %d GB\n", V*V/1_000_000_000)
	fmt.Printf("  adjacency list:  ~%d MB (24-byte Edge, stored twice)\n", 2*E*24/1_000_000)

	grid := []string{
		"..#.",
		"....",
		"#.#.",
	}
	fmt.Println("\ngrid neighbours of (1,1):", gridNeighbours(grid, 1, 1))
}
