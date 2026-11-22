// 58_branch_and_bound.go — Optimization by backtracking, and pruning with bounds.
//
// Plain backtracking LISTS solutions. To find the BEST solution it would still
// visit every one of them. BRANCH AND BOUND adds one idea: at every state
// compute an optimistic BOUND, the best value this branch could possibly
// reach, and abandon the branch when even that cannot beat the best solution
// found so far.
//
//	the bound must be OPTIMISTIC   never lower than the real best of the branch,
//	                               otherwise a good branch is cut by mistake
//	a tighter bound prunes more    but costs more to compute at each state
//
// Two problems show the range from "prune by symmetry" to "prune by bound":
//
//	graph colouring   colour vertices with the fewest colours so that
//	                  neighbours differ. Symmetry breaking: colours are
//	                  interchangeable, so a vertex may reuse a colour or open
//	                  the NEXT new colour, never a colour that skips ahead.
//	0/1 knapsack      the bound is the FRACTIONAL knapsack from
//	                  47_when_greedy_fails.go: the best the remaining items
//	                  could give if they could be cut. Real answers can only
//	                  be worse, so it is a valid upper bound.
//
// Checks: colouring against brute force over all colourings; knapsack against
// the dynamic-programming table of 51_knapsack_family.go and against all
// subsets for very large capacities, where the DP table would be impossible.
//
// Run: go run 58_branch_and_bound.go
package main

import (
	"cmp"
	"fmt"
	"math"
	"math/rand"
	"slices"
)

// ---------------------------------------------------------------------------
// Graph colouring. adj[v] lists the neighbours of v.
// colorable tries to colour every vertex (visited in `order`) with at most m
// colours. It returns whether that is possible and how many states it tried.
// ---------------------------------------------------------------------------

func colorable(adj [][]int, m int, order []int, symmetry bool) (ok bool, nodes int) {
	color := make([]int, len(adj))
	for i := range color {
		color[i] = -1 // -1 = not coloured yet
	}
	var paint func(i, used int) bool // used = number of colours in use so far
	paint = func(i, used int) bool {
		nodes++
		if i == len(order) {
			return true
		}
		v := order[i]
		limit := m // colours 0..m-1 are allowed
		if symmetry {
			limit = min(m, used+1) // reuse a colour, or open just the next new one
		}
		for c := 0; c < limit; c++ {
			clash := false
			for _, u := range adj[v] {
				if color[u] == c {
					clash = true // a neighbour already has this colour: prune
					break
				}
			}
			if clash {
				continue
			}
			color[v] = c // choose
			if paint(i+1, max(used, c+1)) {
				return true
			}
			color[v] = -1 // un-choose
		}
		return false
	}
	return paint(0, 0), nodes
}

// chromatic finds the fewest colours that work by trying m = 1, 2, 3, ...
func chromatic(adj [][]int, order []int, symmetry bool) (m, nodes int) {
	for m = 1; ; m++ {
		ok, n := colorable(adj, m, order, symmetry)
		nodes += n
		if ok {
			return m, nodes
		}
	}
}

// byDegree visits high-degree vertices first: they have the most neighbours
// to clash with, so conflicts appear early and dead ends are cut sooner.
func byDegree(adj [][]int) []int {
	order := make([]int, len(adj))
	for i := range order {
		order[i] = i
	}
	slices.SortStableFunc(order, func(a, b int) int { return cmp.Compare(len(adj[b]), len(adj[a])) })
	return order
}

func natural(n int) []int {
	order := make([]int, n)
	for i := range order {
		order[i] = i
	}
	return order
}

// chromaticBrute tries every assignment of m colours to n vertices.
func chromaticBrute(adj [][]int) int {
	n := len(adj)
	for m := 1; m <= n; m++ {
		total := 1
		for i := 0; i < n; i++ {
			total *= m
		}
		for code := 0; code < total; code++ {
			color := make([]int, n)
			x := code
			for i := range color {
				color[i] = x % m
				x /= m
			}
			ok := true
			for v := range adj {
				for _, u := range adj[v] {
					if color[u] == color[v] {
						ok = false
					}
				}
			}
			if ok {
				return m
			}
		}
	}
	return n
}

func graphFrom(n int, edges [][2]int) [][]int {
	adj := make([][]int, n)
	for _, e := range edges {
		adj[e[0]] = append(adj[e[0]], e[1])
		adj[e[1]] = append(adj[e[1]], e[0])
	}
	return adj
}

func randomGraph(rng *rand.Rand, n int, p float64) [][]int {
	var edges [][2]int
	for u := 0; u < n; u++ {
		for v := u + 1; v < n; v++ {
			if rng.Float64() < p {
				edges = append(edges, [2]int{u, v})
			}
		}
	}
	return graphFrom(n, edges)
}

// ---------------------------------------------------------------------------
// 0/1 knapsack by branch and bound. Items are tried in order of value per
// unit of weight, best first, and "take it" is explored before "leave it", so
// a good solution is found early and the bound has something to beat.
//
//	plain    no pruning: 2^(n+1) - 1 states
//	fitOnly  do not take an item that no longer fits
//	bounded  also prune when the fractional bound cannot beat the best so far
// ---------------------------------------------------------------------------

type Item struct{ w, v int }

const (
	plain = iota
	fitOnly
	bounded
)

func knapsackBB(items []Item, capacity, mode int) (best, nodes int) {
	sorted := slices.Clone(items)
	slices.SortStableFunc(sorted, func(a, b Item) int { return cmp.Compare(b.v*a.w, a.v*b.w) }) // density, high first
	n := len(sorted)

	// bound: the value so far plus the best the remaining items could add if
	// they could be CUT (the fractional knapsack). Real answers cannot exceed it.
	bound := func(i, room, value int) float64 {
		total := float64(value)
		for ; i < n && room > 0; i++ {
			if sorted[i].w <= room {
				room -= sorted[i].w
				total += float64(sorted[i].v)
			} else {
				total += float64(sorted[i].v) * float64(room) / float64(sorted[i].w)
				break
			}
		}
		return total
	}

	var dfs func(i, weight, value int)
	dfs = func(i, weight, value int) {
		nodes++
		if mode == bounded && math.Floor(bound(i, capacity-weight, value)+1e-9) <= float64(best) {
			return // even the optimistic estimate cannot beat what we have
		}
		if i == n {
			if weight <= capacity {
				best = max(best, value)
			}
			return
		}
		if mode == plain || weight+sorted[i].w <= capacity {
			dfs(i+1, weight+sorted[i].w, value+sorted[i].v) // take item i
		}
		dfs(i+1, weight, value) // leave item i
	}
	dfs(0, 0, 0)
	return best, nodes
}

// knapsackDP is the rolling table of 51_knapsack_family.go: O(n * capacity).
func knapsackDP(items []Item, capacity int) int {
	best := make([]int, capacity+1)
	for _, it := range items {
		for w := capacity; w >= it.w; w-- {
			best[w] = max(best[w], best[w-it.w]+it.v)
		}
	}
	return best[capacity]
}

// knapsackSubsets tries every subset: the oracle when capacity is far too
// large for the DP table.
func knapsackSubsets(items []Item, capacity int) int {
	best := 0
	for mask := 0; mask < 1<<len(items); mask++ {
		w, v := 0, 0
		for i, it := range items {
			if mask>>i&1 == 1 {
				w += it.w
				v += it.v
			}
		}
		if w <= capacity {
			best = max(best, v)
		}
	}
	return best
}

func randomItems(rng *rand.Rand, n, maxW, maxV int) []Item {
	items := make([]Item, n)
	for i := range items {
		items[i] = Item{1 + rng.Intn(maxW), 1 + rng.Intn(maxV)}
	}
	return items
}

func main() {
	rng := rand.New(rand.NewSource(58))

	// --- Colouring: known graphs ---
	cycle := func(n int) [][]int {
		var e [][2]int
		for i := 0; i < n; i++ {
			e = append(e, [2]int{i, (i + 1) % n})
		}
		return graphFrom(n, e)
	}
	var k5, petersen, grotzsch [][2]int
	for u := 0; u < 5; u++ {
		for v := u + 1; v < 5; v++ {
			k5 = append(k5, [2]int{u, v})
		}
		petersen = append(petersen, [2]int{u, (u + 1) % 5}, [2]int{u, u + 5}, [2]int{u + 5, (u+2)%5 + 5})
		// Grötzsch: outer 5-cycle, each u_i joined to the two outer neighbours
		// of v_i, and a hub joined to every u_i. Triangle-free, yet needs 4 colours.
		grotzsch = append(grotzsch, [2]int{u, (u + 1) % 5}, [2]int{u + 5, (u + 1) % 5}, [2]int{u + 5, (u + 4) % 5}, [2]int{u + 5, 10})
	}
	known := []struct {
		name string
		adj  [][]int
		want int
	}{
		{"K5 (complete)", graphFrom(5, k5), 5},
		{"cycle C5", cycle(5), 3},
		{"cycle C6", cycle(6), 2},
		{"Petersen", graphFrom(10, petersen), 3},
		{"Grötzsch", graphFrom(11, grotzsch), 4},
	}
	fmt.Println("graph            colours   states: plain   +symmetry   +symmetry, by degree")
	fails := 0
	for _, k := range known {
		m1, n1 := chromatic(k.adj, natural(len(k.adj)), false)
		m2, n2 := chromatic(k.adj, natural(len(k.adj)), true)
		m3, n3 := chromatic(k.adj, byDegree(k.adj), true)
		if m1 != k.want || m2 != k.want || m3 != k.want {
			fails++
		}
		fmt.Printf("%-16s %5d %15d %11d %12d\n", k.name, m2, n1, n2, n3)
	}
	for t := 0; t < 300; t++ {
		adj := randomGraph(rng, 1+rng.Intn(7), 0.2+0.6*rng.Float64())
		want := chromaticBrute(adj)
		m1, _ := chromatic(adj, natural(len(adj)), false)
		m2, _ := chromatic(adj, natural(len(adj)), true)
		m3, _ := chromatic(adj, byDegree(adj), true)
		if m1 != want || m2 != want || m3 != want {
			fails++
		}
	}
	fmt.Println("colouring vs known values and brute force over all colourings, failures:", fails)
	var a, b, c int
	for t := 0; t < 20; t++ {
		adj := randomGraph(rng, 14, 0.5)
		_, n1 := chromatic(adj, natural(14), false)
		_, n2 := chromatic(adj, natural(14), true)
		_, n3 := chromatic(adj, byDegree(adj), true)
		a, b, c = a+n1, b+n2, c+n3
	}
	fmt.Printf("20 random graphs on 14 vertices, total states: plain %d, symmetry %d, symmetry + degree order %d\n", a, b, c)

	// --- Knapsack (modes: 0 plain, 1 fit only, 2 bounded) ---
	fmt.Println()
	items := []Item{{5, 20}, {5, 20}, {6, 30}, {2, 5}}
	for _, mode := range []int{plain, fitOnly, bounded} {
		best, nodes := knapsackBB(items, 10, mode)
		fmt.Printf("knapsack, capacity 10, mode %d: best %d in %d states\n", mode, best, nodes)
	}
	fails = 0
	var total [3]int
	for t := 0; t < 300; t++ {
		its := randomItems(rng, rng.Intn(15), 12, 40)
		capacity := rng.Intn(60)
		want := knapsackDP(its, capacity)
		for mode := plain; mode <= bounded; mode++ {
			got, nodes := knapsackBB(its, capacity, mode)
			total[mode] += nodes
			if got != want {
				fails++
			}
		}
	}
	fmt.Println("knapsack (all three modes) vs the DP table on 300 random instances, failures:", fails)
	fmt.Printf("states over those instances: plain %d, fit only %d, bounded %d\n", total[0], total[1], total[2])

	// --- Huge capacity: the DP table would not fit in memory ---
	fails = 0
	for t := 0; t < 3; t++ {
		its := randomItems(rng, 22, 100_000_000, 1000)
		capacity := 22 * 50_000_000 / 2
		got, _ := knapsackBB(its, capacity, bounded)
		if got != knapsackSubsets(its, capacity) {
			fails++
		}
	}
	fmt.Println("\nweights up to 10^8, 22 items: bounded search vs all subsets, failures:", fails)
	big := randomItems(rng, 45, 100_000_000, 1000)
	capacity := 45 * 50_000_000 / 2
	best, nodes := knapsackBB(big, capacity, bounded)
	fmt.Printf("45 items, capacity %d: best %d in %d states; a DP table would need %d cells, plain search 2^46 states\n",
		capacity, best, nodes, 45*capacity)
}
