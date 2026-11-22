// 44_astar.go — A* search: Dijkstra with a sense of direction.
//
// Dijkstra expands vertices in order of g = distance from the start, so it
// grows a circle around the start in EVERY direction. When we know where
// the goal is, A* orders the queue by
//
//	f(v) = g(v) + h(v)     h = a guess of the remaining distance
//
// and expands the vertices that look closest to a SHORTEST route first.
// If h never OVERESTIMATES the true remaining distance (it is ADMISSIBLE),
// A* still returns an optimal path. h = 0 turns A* back into Dijkstra; a
// perfect h walks straight along the path.
//
// On a 4-connected grid with step cost 1, the Manhattan distance
// |dr| + |dc| is admissible: no route can be shorter than it.
//
// Run: go run 44_astar.go
package main

import (
	"container/heap"
	"fmt"
	"math/rand"
)

type pos struct{ r, c int }

type entry struct {
	p    pos
	f, g int
}
type pq []entry

func (q pq) Len() int { return len(q) }
func (q pq) Less(i, j int) bool {
	if q[i].f != q[j].f {
		return q[i].f < q[j].f
	}
	return q[i].g > q[j].g // tie-break: prefer the entry deeper along its path
}
func (q pq) Swap(i, j int) { q[i], q[j] = q[j], q[i] }
func (q *pq) Push(x any)   { *q = append(*q, x.(entry)) }
func (q *pq) Pop() any {
	old := *q
	x := old[len(old)-1]
	*q = old[:len(old)-1]
	return x
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// search runs A* with heuristic h (pass a zero function for Dijkstra).
// It returns the path length (-1 if none), the parents, and the set of
// expanded cells so the two searches can be compared.
func search(grid [][]byte, start, goal pos, h func(pos) int) (int, map[pos]pos, map[pos]bool) {
	g := map[pos]int{start: 0}
	parent := map[pos]pos{}
	closed := map[pos]bool{} // expanded: the best g is final
	q := &pq{{start, h(start), 0}}
	for q.Len() > 0 {
		cur := heap.Pop(q).(entry)
		if closed[cur.p] {
			continue // stale entry (lazy deletion, as in 42_dijkstra.go)
		}
		closed[cur.p] = true
		if cur.p == goal {
			return cur.g, parent, closed
		}
		for _, d := range []pos{{-1, 0}, {1, 0}, {0, -1}, {0, 1}} {
			n := pos{cur.p.r + d.r, cur.p.c + d.c}
			if n.r < 0 || n.r >= len(grid) || n.c < 0 || n.c >= len(grid[0]) || grid[n.r][n.c] == '#' {
				continue
			}
			ng := cur.g + 1
			if old, seen := g[n]; !seen || ng < old {
				g[n] = ng
				parent[n] = cur.p
				heap.Push(q, entry{n, ng + h(n), ng})
			}
		}
	}
	return -1, parent, closed
}

// bfsLength is an independent oracle: with unit step costs, plain BFS
// (38_bfs.go) already finds the shortest path length.
func bfsLength(grid [][]byte, start, goal pos) int {
	dist := map[pos]int{start: 0}
	queue := []pos{start}
	for head := 0; head < len(queue); head++ {
		u := queue[head]
		if u == goal {
			return dist[u]
		}
		for _, d := range []pos{{-1, 0}, {1, 0}, {0, -1}, {0, 1}} {
			n := pos{u.r + d.r, u.c + d.c}
			if n.r < 0 || n.r >= len(grid) || n.c < 0 || n.c >= len(grid[0]) || grid[n.r][n.c] == '#' {
				continue
			}
			if _, seen := dist[n]; !seen {
				dist[n] = dist[u] + 1
				queue = append(queue, n)
			}
		}
	}
	return -1
}

// draw marks expanded cells with '.', the path with 'o'.
func draw(grid [][]byte, start, goal pos, parent map[pos]pos, closed map[pos]bool) {
	out := make([][]byte, len(grid))
	for r := range grid {
		out[r] = make([]byte, len(grid[r]))
		for c := range grid[r] {
			out[r][c] = ' '
			if grid[r][c] == '#' {
				out[r][c] = '#'
			} else if closed[pos{r, c}] {
				out[r][c] = '.'
			}
		}
	}
	for p := parent[goal]; p != start; p = parent[p] {
		out[p.r][p.c] = 'o'
	}
	out[start.r][start.c], out[goal.r][goal.c] = 'S', 'G'
	for _, row := range out {
		fmt.Println("  |" + string(row) + "|")
	}
}

func main() {
	rows := []string{
		"                                        ",
		"          #########                     ",
		"                  #                     ",
		"    S             #              G      ",
		"                  #                     ",
		"          #########                     ",
		"                                        ",
	}
	grid := make([][]byte, len(rows))
	for i := range rows {
		grid[i] = []byte(rows[i])
	}
	start, goal := pos{3, 4}, pos{3, 34}
	manhattan := func(p pos) int { return abs(p.r-goal.r) + abs(p.c-goal.c) }
	zero := func(pos) int { return 0 }

	dl, dp, dc := search(grid, start, goal, zero)
	fmt.Printf("Dijkstra: path length %d, expanded %d cells\n", dl, len(dc))
	draw(grid, start, goal, dp, dc)
	al, ap, ac := search(grid, start, goal, manhattan)
	fmt.Printf("\nA* (Manhattan): path length %d, expanded %d cells\n", al, len(ac))
	draw(grid, start, goal, ap, ac)

	// Inadmissible heuristic: 3x Manhattan overestimates and may return a
	// longer path in exchange for even fewer expansions ("weighted A*").
	wl, _, wc := search(grid, start, goal, func(p pos) int { return 3 * manhattan(p) })
	fmt.Printf("\nweighted A* (3 x Manhattan): path length %d, expanded %d cells\n", wl, len(wc))

	// Random mazes: A* with an admissible heuristic must always match
	// Dijkstra's and BFS's path length. Count the expansions of both.
	rng := rand.New(rand.NewSource(14))
	fails, cellsD, cellsA := 0, 0, 0
	for trial := 0; trial < 300; trial++ {
		R, C := rng.Intn(20)+2, rng.Intn(30)+2
		m := make([][]byte, R)
		for r := range m {
			m[r] = make([]byte, C)
			for c := range m[r] {
				m[r][c] = ' '
				if rng.Intn(100) < 28 {
					m[r][c] = '#'
				}
			}
		}
		s, t := pos{rng.Intn(R), rng.Intn(C)}, pos{rng.Intn(R), rng.Intn(C)}
		m[s.r][s.c], m[t.r][t.c] = ' ', ' '
		h := func(p pos) int { return abs(p.r-t.r) + abs(p.c-t.c) }
		l1, _, c1 := search(m, s, t, func(pos) int { return 0 })
		l2, _, c2 := search(m, s, t, h)
		if l1 != l2 || l2 != bfsLength(m, s, t) {
			fails++
		}
		cellsD += len(c1)
		cellsA += len(c2)
	}
	fmt.Println("\nrandom mazes, path length mismatches:", fails)
	fmt.Printf("cells expanded in total: Dijkstra %d, A* %d\n", cellsD, cellsA)
}
