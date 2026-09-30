// 54_bitmask_state_dp.go — DP when the state is a SET, or a small "mode".
//
// So far a state was one or two numbers (an index, a capacity). Two more
// state designs appear constantly:
//
//	BITMASK STATE  the state is a SUBSET of n items, stored as an integer whose
//	               bit i means "item i is used". There are 2^n subsets, so this
//	               works up to n of about 20, but it beats n! permutations by a
//	               huge factor.
//	               (travelling salesman, assignment, scheduling with limits)
//
//	STATE MACHINE  the state is the day/index PLUS a small mode such as
//	               "holding a share" or "in cooldown". Draw the modes as
//	               boxes and the allowed moves as arrows; the recurrence
//	               follows the arrows.
//	               (stock trading, text parsing, game turns)
//
// Bit tricks used below (mask is an int):
//
//	mask>>i&1 == 1    is item i in the set?
//	mask | 1<<i       add item i
//	bits.OnesCount    how many items are in the set
//
// Each DP is checked against a brute force that tries every permutation or
// every sequence of actions.
//
// Run: go run 54_bitmask_state_dp.go
package main

import (
	"fmt"
	"math/bits"
	"math/rand"
	"time"
)

const inf = 1 << 40

// ---------------------------------------------------------------------------
// Travelling salesman (Held-Karp). Visit every city once, return to city 0,
// with the smallest total distance.
// State: best[mask][last] = the cheapest way to start at 0, visit exactly the
// cities in mask, and stand at city `last` (which is in mask).
// Move: from (mask, last) go to a city k not in mask.
// n! orders collapse into 2^n * n states with n moves each: O(2^n * n^2).
// ---------------------------------------------------------------------------

func tsp(d [][]int) (int, []int) {
	n := len(d)
	full := 1<<n - 1
	best := make([][]int, 1<<n)
	from := make([][]int, 1<<n)
	for m := range best {
		best[m] = make([]int, n)
		from[m] = make([]int, n)
		for j := range best[m] {
			best[m][j] = inf
		}
	}
	best[1][0] = 0 // only city 0 visited, standing at 0
	for mask := 1; mask <= full; mask++ {
		for last := 0; last < n; last++ {
			if best[mask][last] == inf {
				continue
			}
			for next := 0; next < n; next++ {
				if mask>>next&1 == 1 {
					continue // already visited
				}
				m2 := mask | 1<<next
				if c := best[mask][last] + d[last][next]; c < best[m2][next] {
					best[m2][next], from[m2][next] = c, last
				}
			}
		}
	}
	total, end := inf, 0
	for last := 1; last < n; last++ {
		if c := best[full][last] + d[last][0]; c < total {
			total, end = c, last
		}
	}
	if n == 1 {
		return 0, []int{0}
	}
	// Walk back through `from` to list the tour.
	tour := []int{0}
	mask, cur := full, end
	var rev []int
	for cur != 0 {
		rev = append(rev, cur)
		mask, cur = mask&^(1<<cur), from[mask][cur]
	}
	for i := len(rev) - 1; i >= 0; i-- {
		tour = append(tour, rev[i])
	}
	return total, tour
}

// tspBrute tries every order of the other cities: (n-1)! tours.
func tspBrute(d [][]int) int {
	n := len(d)
	if n == 1 {
		return 0
	}
	order := make([]int, n-1)
	for i := range order {
		order[i] = i + 1
	}
	best := inf
	var permute func(k int)
	permute = func(k int) {
		if k == len(order) {
			cost, prev := 0, 0
			for _, c := range order {
				cost += d[prev][c]
				prev = c
			}
			best = min(best, cost+d[prev][0])
			return
		}
		for i := k; i < len(order); i++ {
			order[k], order[i] = order[i], order[k]
			permute(k + 1)
			order[k], order[i] = order[i], order[k]
		}
	}
	permute(0)
	return best
}

func tourCost(d [][]int, tour []int) int {
	cost := 0
	for i := range tour {
		cost += d[tour[i]][tour[(i+1)%len(tour)]]
	}
	return cost
}

func randomDistances(rng *rand.Rand, n int) [][]int {
	d := make([][]int, n)
	for i := range d {
		d[i] = make([]int, n)
	}
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			d[i][j] = 1 + rng.Intn(50)
			d[j][i] = d[i][j]
		}
	}
	return d
}

// ---------------------------------------------------------------------------
// Assignment: give each of n workers exactly one of n jobs, cost[w][j], and
// minimize the total. State: mask = the set of jobs already taken. The number
// of workers already placed is bits.OnesCount(mask), so the NEXT worker is
// that index, and no separate "worker" number is needed in the state.
// ---------------------------------------------------------------------------

func assign(cost [][]int) int {
	n := len(cost)
	best := make([]int, 1<<n)
	for m := 1; m < len(best); m++ {
		best[m] = inf
	}
	for mask := 0; mask < 1<<n-1; mask++ {
		w := bits.OnesCount(uint(mask)) // the next worker to place
		for job := 0; job < n; job++ {
			if mask>>job&1 == 0 {
				m2 := mask | 1<<job
				best[m2] = min(best[m2], best[mask]+cost[w][job])
			}
		}
	}
	return best[1<<n-1]
}

func assignBrute(cost [][]int) int {
	n := len(cost)
	perm := make([]int, n)
	for i := range perm {
		perm[i] = i
	}
	best := inf
	var permute func(k int)
	permute = func(k int) {
		if k == n {
			sum := 0
			for w, j := range perm {
				sum += cost[w][j]
			}
			best = min(best, sum)
			return
		}
		for i := k; i < n; i++ {
			perm[k], perm[i] = perm[i], perm[k]
			permute(k + 1)
			perm[k], perm[i] = perm[i], perm[k]
		}
	}
	permute(0)
	return best
}

// ---------------------------------------------------------------------------
// Stock trading as a state machine. One share at a time; profit is the sum
// of sale prices minus the sum of purchase prices.
//
// Modes on a given day (draw them as three boxes):
//
//	hold  ---sell--->  sold  ---(next day)--->  rest
//	rest  ---buy---->  hold                     (rest = free to buy)
//	hold  ---wait--->  hold          rest --wait--> rest
//
// With a ONE-DAY COOLDOWN after selling, you cannot buy the day after a sale.
// Each new day, every mode's best profit comes from the modes that can reach it.
// ---------------------------------------------------------------------------

func stockCooldown(prices []int) int {
	hold, sold, rest := -inf, 0, 0 // before day 0: no share, free to buy
	if len(prices) == 0 {
		return 0
	}
	for _, p := range prices {
		newHold := max(hold, rest-p) // keep holding, or buy today from "rest"
		newSold := hold + p          // sell today what we were holding
		newRest := max(rest, sold)   // idle; a sale yesterday ends its cooldown
		hold, sold, rest = newHold, newSold, newRest
	}
	return max(sold, rest) // never end while holding: that share is unsold
}

// stockAtMostK allows at most k buy-sell pairs and no cooldown. The mode is
// extended with a counter: buy[t] = best profit after the t-th purchase (and
// holding), sell[t] = best profit after the t-th sale.
func stockAtMostK(prices []int, k int) int {
	buy := make([]int, k+1)
	sell := make([]int, k+1)
	for t := range buy {
		buy[t] = -inf
	}
	for _, p := range prices {
		for t := 1; t <= k; t++ {
			buy[t] = max(buy[t], sell[t-1]-p) // the t-th purchase follows t-1 sales
			sell[t] = max(sell[t], buy[t]+p)
		}
	}
	return sell[k]
}

// stockBrute tries every assignment of {nothing, buy, sell} to every day,
// keeps the valid ones, and returns the best profit. It uses no DP idea.
func stockBrute(prices []int, k int, cooldown bool) int {
	n := len(prices)
	best := 0
	actions := make([]int, n) // 0 nothing, 1 buy, 2 sell
	var try func(day int)
	try = func(day int) {
		if day == n {
			holding, buys, profit, lastSale := false, 0, 0, -10
			for d, a := range actions {
				switch a {
				case 1:
					if holding || (cooldown && d == lastSale+1) || buys == k {
						return
					}
					holding = true
					buys++
					profit -= prices[d]
				case 2:
					if !holding {
						return
					}
					holding = false
					lastSale = d
					profit += prices[d]
				}
			}
			if !holding {
				best = max(best, profit)
			}
			return
		}
		for a := 0; a < 3; a++ {
			actions[day] = a
			try(day + 1)
		}
	}
	try(0)
	return best
}

func main() {
	rng := rand.New(rand.NewSource(54))

	// --- Travelling salesman ---
	city := [][]int{
		{0, 10, 15, 20},
		{10, 0, 35, 25},
		{15, 35, 0, 30},
		{20, 25, 30, 0},
	}
	total, tour := tsp(city)
	fmt.Println("4 cities: shortest tour", tour, "-> back to 0, length", total)
	fails := 0
	for t := 0; t < 300; t++ {
		d := randomDistances(rng, 1+rng.Intn(8))
		got, tour := tsp(d)
		if got != tspBrute(d) || tourCost(d, tour) != got {
			fails++
		}
	}
	fmt.Println("Held-Karp (length, and the tour costs that much) vs all permutations, failures:", fails)
	for _, n := range []int{10, 14, 16} {
		d := randomDistances(rng, n)
		start := time.Now()
		got, _ := tsp(d)
		fact := 1.0
		for i := 2; i < n; i++ {
			fact *= float64(i)
		}
		fmt.Printf("  n=%2d: length %4d in %6v  (DP states %d; permutations would be %.3g tours)\n",
			n, got, time.Since(start).Round(time.Millisecond), (1<<n)*n, fact)
	}

	// --- Assignment ---
	work := [][]int{{9, 2, 7, 8}, {6, 4, 3, 7}, {5, 8, 1, 8}, {7, 6, 9, 4}}
	fmt.Println("\nassignment of 4 workers to 4 jobs: minimum total", assign(work))
	fails = 0
	for t := 0; t < 500; t++ {
		n := 1 + rng.Intn(7)
		c := make([][]int, n)
		for i := range c {
			c[i] = make([]int, n)
			for j := range c[i] {
				c[i][j] = rng.Intn(30)
			}
		}
		if assign(c) != assignBrute(c) {
			fails++
		}
	}
	fmt.Println("assignment DP vs all permutations, failures:", fails)

	// --- Stock state machine ---
	prices := []int{1, 2, 3, 0, 2}
	fmt.Println("\nprices", prices, "-> with cooldown", stockCooldown(prices), "(buy 1, sell 3, cooldown, buy 0, sell 2)")
	prices = []int{3, 2, 6, 5, 0, 3}
	fmt.Println("prices", prices, "-> at most 2 transactions", stockAtMostK(prices, 2), "(buy 2 sell 6, buy 0 sell 3)")
	fails = 0
	for t := 0; t < 1500; t++ {
		p := make([]int, rng.Intn(9))
		for i := range p {
			p[i] = rng.Intn(10)
		}
		k := 1 + rng.Intn(3)
		if stockCooldown(p) != stockBrute(p, len(p), true) || stockAtMostK(p, k) != stockBrute(p, k, false) {
			fails++
		}
	}
	fmt.Println("stock state machines vs every sequence of actions, failures:", fails)
}
