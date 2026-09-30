// 38_bfs.go — Breadth-first search: shortest paths in unweighted graphs.
//
// BFS explores a graph in WAVES: first the start, then all vertices one
// edge away, then two edges away, and so on. A FIFO queue produces that
// order: vertices found first are expanded first.
//
// Because each wave is finished before the next begins, the first time BFS
// reaches a vertex it has found a path with the FEWEST edges. Recording
// the parent of each vertex lets us rebuild that path afterwards.
//
// Every vertex is enqueued once and every edge examined once (twice if
// undirected): O(V + E) time, O(V) memory.
//
// Run: go run 38_bfs.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"strings"
)

// bfs returns dist[v] (edges from start, -1 if unreachable) and parent[v]
// (the vertex we came from, -1 for the start and unreachable vertices).
func bfs(adj [][]int, start int) (dist, parent []int) {
	n := len(adj)
	dist = make([]int, n)
	parent = make([]int, n)
	for i := range dist {
		dist[i], parent[i] = -1, -1 // -1 doubles as "not visited yet"
	}
	dist[start] = 0
	queue := []int{start}
	for head := 0; head < len(queue); head++ { // index instead of popping: O(1)
		u := queue[head]
		for _, v := range adj[u] {
			if dist[v] == -1 { // mark when ENQUEUED, not when dequeued,
				dist[v] = dist[u] + 1 // or a vertex can enter the queue twice
				parent[v] = u
				queue = append(queue, v)
			}
		}
	}
	return dist, parent
}

// pathTo walks the parent links back from the target and reverses them.
func pathTo(parent []int, target int) []int {
	var path []int
	for v := target; v != -1; v = parent[v] {
		path = append(path, v)
	}
	slices.Reverse(path)
	return path
}

type cell struct{ r, c int }

// solveMaze runs BFS on an implicit grid graph from S to E and draws the
// shortest path with '*'. Walls are '#'.
func solveMaze(maze []string) (steps int, drawn []string) {
	var start, end cell
	for r, row := range maze {
		if c := strings.IndexByte(row, 'S'); c >= 0 {
			start = cell{r, c}
		}
		if c := strings.IndexByte(row, 'E'); c >= 0 {
			end = cell{r, c}
		}
	}
	parent := map[cell]cell{start: start} // doubles as the visited set
	queue := []cell{start}
	for head := 0; head < len(queue); head++ {
		u := queue[head]
		if u == end {
			break // the first time we reach E is the shortest path
		}
		for _, d := range []cell{{-1, 0}, {1, 0}, {0, -1}, {0, 1}} {
			v := cell{u.r + d.r, u.c + d.c}
			if v.r < 0 || v.r >= len(maze) || v.c < 0 || v.c >= len(maze[0]) || maze[v.r][v.c] == '#' {
				continue
			}
			if _, seen := parent[v]; !seen {
				parent[v] = u
				queue = append(queue, v)
			}
		}
	}
	if _, ok := parent[end]; !ok {
		return -1, maze
	}
	grid := make([][]byte, len(maze))
	for i := range maze {
		grid[i] = []byte(maze[i])
	}
	for v := parent[end]; v != start; v = parent[v] {
		grid[v.r][v.c] = '*'
		steps++
	}
	for _, row := range grid {
		drawn = append(drawn, string(row))
	}
	return steps + 1, drawn
}

// multiSourceBFS starts with ALL sources in the queue at distance 0. The
// result is the distance from each vertex to its NEAREST source — e.g.
// every house to the closest hospital — in one O(V + E) pass.
func multiSourceBFS(adj [][]int, sources []int) []int {
	dist := make([]int, len(adj))
	for i := range dist {
		dist[i] = -1
	}
	queue := slices.Clone(sources)
	for _, s := range sources {
		dist[s] = 0
	}
	for head := 0; head < len(queue); head++ {
		u := queue[head]
		for _, v := range adj[u] {
			if dist[v] == -1 {
				dist[v] = dist[u] + 1
				queue = append(queue, v)
			}
		}
	}
	return dist
}

// relaxOracle computes the same distances the slow, obvious way: keep
// improving dist[v] = dist[u] + 1 until nothing changes. O(V * E).
func relaxOracle(adj [][]int, start int) []int {
	n := len(adj)
	dist := make([]int, n)
	for i := range dist {
		dist[i] = n + 1 // "infinity": no simple path is that long
	}
	dist[start] = 0
	for changed := true; changed; {
		changed = false
		for u := range adj {
			for _, v := range adj[u] {
				if dist[u]+1 < dist[v] {
					dist[v] = dist[u] + 1
					changed = true
				}
			}
		}
	}
	for i := range dist {
		if dist[i] == n+1 {
			dist[i] = -1
		}
	}
	return dist
}

func main() {
	//   0 - 1 - 3 - 5
	//   |   |   |
	//   2 - 4   6        7 (isolated)
	adj := [][]int{{1, 2}, {0, 3, 4}, {0, 4}, {1, 5, 6}, {1, 2}, {3}, {3}, {}}
	dist, parent := bfs(adj, 0)
	fmt.Println("distance from 0:", dist)
	fmt.Println("shortest path 0 -> 6:", pathTo(parent, 6))
	fmt.Println("nearest of {5, 2} per vertex:", multiSourceBFS(adj, []int{5, 2}))

	maze := []string{
		"S.#.......",
		".##.####.#",
		"....#....#",
		"#.#.#.#...",
		"..#...#E#.",
	}
	steps, drawn := solveMaze(maze)
	fmt.Printf("\nmaze solved in %d steps:\n", steps)
	for _, row := range drawn {
		fmt.Println("  " + row)
	}

	// Random graphs: BFS must match the relaxation oracle exactly, and
	// every reconstructed path must be a real path of the right length.
	rng := rand.New(rand.NewSource(8))
	fails := 0
	for trial := 0; trial < 500; trial++ {
		n := rng.Intn(25) + 1
		g := make([][]int, n)
		for e := rng.Intn(2 * n); e > 0; e-- {
			u, v := rng.Intn(n), rng.Intn(n)
			g[u] = append(g[u], v) // directed edges
		}
		s := rng.Intn(n)
		d, par := bfs(g, s)
		if !slices.Equal(d, relaxOracle(g, s)) {
			fails++
		}
		for v := range n {
			if d[v] < 0 {
				continue
			}
			p := pathTo(par, v)
			if p[0] != s || len(p)-1 != d[v] {
				fails++
			}
			for i := 0; i+1 < len(p); i++ {
				if !slices.Contains(g[p[i]], p[i+1]) {
					fails++
				}
			}
		}
	}
	fmt.Println("\nrandom graphs vs oracle, failures:", fails)
}
