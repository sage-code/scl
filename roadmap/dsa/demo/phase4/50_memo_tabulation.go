// 50_memo_tabulation.go — From plain recursion to dynamic programming.
//
// DYNAMIC PROGRAMMING (DP) solves a problem by combining answers to smaller
// versions of the same problem, and remembers each answer so it is computed
// only once. It applies when the problem has two properties:
//
//	overlapping subproblems  the same small question is asked many times
//	optimal substructure     the best answer is built from best answers to
//	                         smaller questions
//
// There are two ways to write it:
//
//	top-down (memoization)  keep the recursion, add a cache
//	bottom-up (tabulation)  fill a table from the smallest question upward
//
// Designing a DP always starts with the STATE: the few numbers that fully
// describe one subproblem. Then the RECURRENCE: how a state's answer follows
// from smaller states. This file walks through four problems:
//
//  1. Fibonacci: the same recursion four ways, with call counts
//  2. counting paths in a grid with walls (state = a cell)
//  3. cheapest path in a cost grid, with the route rebuilt from the table
//  4. house robber: a state that needs only the last two answers
//
// Each DP answer is checked against plain recursion or brute force.
//
// Run: go run 50_memo_tabulation.go
package main

import (
	"fmt"
	"math/rand"
	"strings"
	"time"
)

// ---------------------------------------------------------------------------
// 1. Fibonacci four ways. State: n. Recurrence: fib(n) = fib(n-1) + fib(n-2).
// ---------------------------------------------------------------------------

var calls int // counts how often each version is entered

// fibNaive recomputes the same values again and again: fib(n-2) is computed
// once directly and once more inside fib(n-1). The call count grows like the
// answer itself, so it is exponential.
func fibNaive(n int) int {
	calls++
	if n < 2 {
		return n
	}
	return fibNaive(n-1) + fibNaive(n-2)
}

// fibMemo is the same recursion plus a cache. Each n is computed once and
// every later request is a map lookup, so the cost is O(n).
func fibMemo(n int, memo map[int]int) int {
	calls++
	if n < 2 {
		return n
	}
	if v, ok := memo[n]; ok {
		return v // already solved: no recursion
	}
	v := fibMemo(n-1, memo) + fibMemo(n-2, memo)
	memo[n] = v
	return v
}

// fibTable goes bottom-up: f[i] only needs the two entries before it, so a
// plain loop in increasing order visits every state after its dependencies.
func fibTable(n int) int {
	if n < 2 {
		return n
	}
	f := make([]int, n+1)
	f[1] = 1
	for i := 2; i <= n; i++ {
		f[i] = f[i-1] + f[i-2]
	}
	return f[n]
}

// fibRolling notices that only the last two entries are ever read, so the
// table shrinks to two variables: O(n) time, O(1) memory.
func fibRolling(n int) int {
	a, b := 0, 1 // fib(0), fib(1)
	for i := 0; i < n; i++ {
		a, b = b, a+b
	}
	return a
}

// ---------------------------------------------------------------------------
// 2. Paths in a grid. Move only right or down from the top-left cell to the
//    bottom-right cell. '#' is a wall.
// ---------------------------------------------------------------------------

// pathsFrom counts paths from (r, c) to the goal. State: the cell (r, c).
// Top-down: ask "how many ways from here?".
func pathsFrom(g []string, r, c int, memo map[[2]int]int) int {
	calls++
	if r >= len(g) || c >= len(g[0]) || g[r][c] == '#' {
		return 0 // off the grid or into a wall: no path
	}
	if r == len(g)-1 && c == len(g[0])-1 {
		return 1 // reached the goal: exactly one (empty) path continues
	}
	key := [2]int{r, c}
	if memo != nil {
		if v, ok := memo[key]; ok {
			return v
		}
	}
	v := pathsFrom(g, r+1, c, memo) + pathsFrom(g, r, c+1, memo)
	if memo != nil {
		memo[key] = v
	}
	return v
}

// pathsTable counts paths from the start to each cell. Bottom-up, and the
// state means something DIFFERENT ("ways to arrive here"): both directions
// are valid, and they must agree. A cell is reached from above or from the
// left, so ways[r][c] = ways[r-1][c] + ways[r][c-1], and a wall has 0 ways.
func pathsTable(g []string) int {
	rows, cols := len(g), len(g[0])
	ways := make([][]int, rows)
	for r := range ways {
		ways[r] = make([]int, cols)
	}
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			switch {
			case g[r][c] == '#':
				ways[r][c] = 0
			case r == 0 && c == 0:
				ways[r][c] = 1
			default:
				if r > 0 {
					ways[r][c] += ways[r-1][c]
				}
				if c > 0 {
					ways[r][c] += ways[r][c-1]
				}
			}
		}
	}
	return ways[rows-1][cols-1]
}

func randomGrid(rng *rand.Rand, rows, cols int) []string {
	g := make([]string, rows)
	for r := range g {
		row := make([]byte, cols)
		for c := range row {
			row[c] = '.'
			if rng.Intn(5) == 0 {
				row[c] = '#'
			}
		}
		g[r] = string(row)
	}
	b := []byte(g[0])
	b[0] = '.' // keep the start open
	g[0] = string(b)
	return g
}

// ---------------------------------------------------------------------------
// 3. Cheapest path in a cost grid (right/down moves). State: the cell.
//    best[r][c] = cost[r][c] + min(best[r-1][c], best[r][c-1]).
// ---------------------------------------------------------------------------

// cheapestPath fills the table, then REBUILDS the route by walking back from
// the goal: at each cell step to whichever neighbour has the smaller total.
// The table answers "how much"; walking it answers "which choices".
func cheapestPath(cost [][]int) (total int, route [][2]int) {
	rows, cols := len(cost), len(cost[0])
	best := make([][]int, rows)
	for r := range best {
		best[r] = make([]int, cols)
	}
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			switch {
			case r == 0 && c == 0:
				best[r][c] = cost[r][c]
			case r == 0:
				best[r][c] = cost[r][c] + best[r][c-1]
			case c == 0:
				best[r][c] = cost[r][c] + best[r-1][c]
			default:
				best[r][c] = cost[r][c] + min(best[r-1][c], best[r][c-1])
			}
		}
	}
	r, c := rows-1, cols-1
	for {
		route = append(route, [2]int{r, c})
		if r == 0 && c == 0 {
			break
		}
		if r == 0 || (c > 0 && best[r][c-1] <= best[r-1][c]) {
			c--
		} else {
			r--
		}
	}
	for i, j := 0, len(route)-1; i < j; i, j = i+1, j-1 {
		route[i], route[j] = route[j], route[i]
	}
	return best[rows-1][cols-1], route
}

// cheapestNaive tries every path: exponential, the oracle.
func cheapestNaive(cost [][]int, r, c int) int {
	if r == len(cost)-1 && c == len(cost[0])-1 {
		return cost[r][c]
	}
	best := 1 << 60
	if r+1 < len(cost) {
		best = min(best, cheapestNaive(cost, r+1, c))
	}
	if c+1 < len(cost[0]) {
		best = min(best, cheapestNaive(cost, r, c+1))
	}
	return cost[r][c] + best
}

// ---------------------------------------------------------------------------
// 4. House robber: choose houses to rob, never two neighbours, maximize the
//    loot. State: i = "the best loot using only the first i houses".
//    take[i] = max(take[i-1], take[i-2] + loot[i-1]): skip house i-1, or rob
//    it and fall back to the best from two houses ago.
// ---------------------------------------------------------------------------

func robber(loot []int) int {
	prev2, prev1 := 0, 0 // best for i-2 and i-1 houses
	for _, v := range loot {
		prev2, prev1 = prev1, max(prev1, prev2+v)
	}
	return prev1
}

// robberBrute tries every subset of houses.
func robberBrute(loot []int) int {
	best := 0
	for mask := 0; mask < 1<<len(loot); mask++ {
		if mask&(mask>>1) != 0 {
			continue // two adjacent bits set: two neighbouring houses
		}
		sum := 0
		for i, v := range loot {
			if mask>>i&1 == 1 {
				sum += v
			}
		}
		best = max(best, sum)
	}
	return best
}

func main() {
	// --- 1. Fibonacci: count the work of each version ---
	fmt.Println("fib(n)   naive calls    memo calls   memo table   answer")
	for _, n := range []int{10, 20, 30, 35} {
		calls = 0
		want := fibNaive(n)
		naive := calls
		calls = 0
		memo := map[int]int{}
		got := fibMemo(n, memo)
		fmt.Printf("%5d %12d %13d %12d   %d\n", n, naive, calls, len(memo), want)
		if got != want || fibTable(n) != want || fibRolling(n) != want {
			fmt.Println("  MISMATCH at", n)
		}
	}
	start := time.Now()
	calls = 0
	fibNaive(40)
	naiveTime := time.Since(start)
	fmt.Printf("fib(40): naive %d calls in %v; the rolling loop does 40 additions\n",
		calls, naiveTime.Round(time.Millisecond))

	// --- 2. Grid paths ---
	open := make([]string, 12) // a 12x12 grid with no walls
	for i := range open {
		open[i] = strings.Repeat(".", 12)
	}
	calls = 0
	slow := pathsFrom(open, 0, 0, nil)
	slowCalls := calls
	calls = 0
	fast := pathsFrom(open, 0, 0, map[[2]int]int{})
	fmt.Printf("\n12x12 open grid: %d paths. Plain recursion %d calls, memoized %d calls (%d cells)\n",
		slow, slowCalls, calls, 12*12)
	rng := rand.New(rand.NewSource(50))
	fails := 0
	if fast != slow || pathsTable(open) != slow {
		fails++
	}
	for t := 0; t < 2000; t++ {
		g := randomGrid(rng, 1+rng.Intn(8), 1+rng.Intn(8))
		want := pathsFrom(g, 0, 0, nil)
		if pathsFrom(g, 0, 0, map[[2]int]int{}) != want || pathsTable(g) != want {
			fails++
		}
	}
	fmt.Println("grid paths (memo and table vs plain recursion), failures:", fails)

	// --- 3. Cheapest path ---
	cost := [][]int{
		{1, 3, 1, 8},
		{1, 5, 1, 2},
		{4, 2, 1, 9},
		{7, 6, 1, 1},
	}
	total, route := cheapestPath(cost)
	fmt.Println("\ncheapest path cost:", total, " route (row,col):", route)
	fails = 0
	for t := 0; t < 2000; t++ {
		rows, cols := 1+rng.Intn(7), 1+rng.Intn(7)
		grid := make([][]int, rows)
		for r := range grid {
			grid[r] = make([]int, cols)
			for c := range grid[r] {
				grid[r][c] = rng.Intn(20)
			}
		}
		got, rt := cheapestPath(grid)
		sum := 0
		for _, p := range rt { // the rebuilt route must really cost what the table says
			sum += grid[p[0]][p[1]]
		}
		if got != cheapestNaive(grid, 0, 0) || sum != got {
			fails++
		}
	}
	fmt.Println("cheapest path vs all paths (cost and route), failures:", fails)

	// --- 4. House robber ---
	loot := []int{2, 7, 9, 3, 1}
	fmt.Println("\nloot", loot, "-> best", robber(loot), "(rob 2, 9 and 1)")
	fails = 0
	for t := 0; t < 3000; t++ {
		h := make([]int, rng.Intn(14))
		for i := range h {
			h[i] = rng.Intn(30)
		}
		if robber(h) != robberBrute(h) {
			fails++
		}
	}
	fmt.Println("house robber vs all subsets, failures:", fails)
}
