// 47_when_greedy_fails.go — Coin change and knapsack: where greedy breaks.
//
// A greedy rule can be right for one input family and wrong for another
// that looks almost the same. This file tests two famous cases against an
// exact oracle:
//
//	coin change   "largest coin first" is optimal for US coins but not for
//	              {1, 3, 4}: 6 = 4+1+1 (greedy) but 3+3 is better
//	knapsack      "best value per kilo first" is optimal when items can be
//	              cut (fractional) but not when each is taken whole (0/1)
//
// The oracles are exhaustive or use a table of answers for every smaller
// amount. That table is DYNAMIC PROGRAMMING, the subject of the next lesson.
//
// The lesson: never trust a greedy rule because it works on the examples you
// tried. Prove it (exchange argument) or test it against brute force.
//
// Run: go run 47_when_greedy_fails.go
package main

import (
	"cmp"
	"fmt"
	"math/rand"
	"slices"
)

// ---------------------------------------------------------------------------
// Coin change: pay an amount with the fewest coins (unlimited coins of each
// value). -1 means "cannot be paid".
// ---------------------------------------------------------------------------

// greedyCoins takes as many of the largest coin as fit, then the next, ...
// coins must be sorted in descending order.
func greedyCoins(coins []int, amount int) int {
	n := 0
	for _, c := range coins {
		n += amount / c
		amount %= c
	}
	if amount != 0 {
		return -1 // stuck: greedy used coins that left an unpayable rest
	}
	return n
}

// fewestCoins is the exact answer. best[a] = fewest coins that pay a,
// built from best[a-c] for every coin c (preview of dynamic programming).
func fewestCoins(coins []int, amount int) []int {
	const inf = 1 << 30
	best := make([]int, amount+1)
	for a := 1; a <= amount; a++ {
		best[a] = inf
		for _, c := range coins {
			if c <= a && best[a-c]+1 < best[a] {
				best[a] = best[a-c] + 1 // pay a-c optimally, then add one coin c
			}
		}
	}
	for a := range best {
		if best[a] == inf {
			best[a] = -1
		}
	}
	return best
}

// firstCounterexample returns the smallest amount where greedy is not
// optimal, or 0 if there is none up to limit. (A known theorem says that if
// a counterexample exists, one exists below the sum of the two largest
// coins, so a small limit is enough.)
func firstCounterexample(coins []int, limit int) (amount, greedy, best int) {
	table := fewestCoins(coins, limit)
	for a := 1; a <= limit; a++ {
		if g := greedyCoins(coins, a); g != table[a] {
			return a, g, table[a]
		}
	}
	return 0, 0, 0
}

// ---------------------------------------------------------------------------
// Knapsack: items with a weight and a value, a bag with a weight capacity.
// ---------------------------------------------------------------------------

type Item struct {
	name          string
	weight, value int
}

// byDensity sorts by value per unit of weight, highest first. Comparing
// a.value/a.weight with b.value/b.weight is done by cross-multiplying, which
// avoids floating point: a.v/a.w > b.v/b.w  <=>  a.v*b.w > b.v*a.w.
func byDensity(items []Item) []Item {
	s := slices.Clone(items)
	slices.SortStableFunc(s, func(a, b Item) int {
		return cmp.Compare(b.value*a.weight, a.value*b.weight)
	})
	return s
}

// fractionalKnapsack may take part of an item. Greedy by density is optimal:
// any kilo of a lower-density item could be swapped for a kilo of a higher
// one without losing value (exchange argument).
func fractionalKnapsack(items []Item, capacity int) float64 {
	total := 0.0
	left := capacity
	for _, it := range byDensity(items) {
		if left == 0 {
			break
		}
		take := min(it.weight, left)
		total += float64(it.value) * float64(take) / float64(it.weight)
		left -= take
	}
	return total
}

// greedyWhole takes whole items in the given order while they fit.
func greedyWhole(order []Item, capacity int) int {
	total := 0
	for _, it := range order {
		if it.weight <= capacity {
			capacity -= it.weight
			total += it.value
		}
	}
	return total
}

// bruteKnapsack tries all 2^n subsets of whole items: the exact 0/1 answer.
func bruteKnapsack(items []Item, capacity int) int {
	best := 0
	for mask := 0; mask < 1<<len(items); mask++ {
		w, v := 0, 0
		for i, it := range items {
			if mask>>i&1 == 1 {
				w += it.weight
				v += it.value
			}
		}
		if w <= capacity && v > best {
			best = v
		}
	}
	return best
}

func main() {
	// --- Coin systems ---
	systems := []struct {
		name  string
		coins []int // descending
	}{
		{"US cents", []int{25, 10, 5, 1}},
		{"euro cents", []int{50, 20, 10, 5, 2, 1}},
		{"{4, 3, 1}", []int{4, 3, 1}},
		{"old UK {30,24,12,6,3,1}", []int{30, 24, 12, 6, 3, 1}},
		{"{5, 3} (no 1)", []int{5, 3}},
	}
	fmt.Println("coin system               first bad amount  greedy  optimal")
	for _, s := range systems {
		a, g, b := firstCounterexample(s.coins, 1000)
		if a == 0 {
			fmt.Printf("%-25s %16s\n", s.name, "none up to 1000")
			continue
		}
		fmt.Printf("%-25s %16d %7d %8d\n", s.name, a, g, b)
	}
	// Greedy returns -1 for 6 with {5, 3}: after one 5 the rest (1) cannot be
	// paid, although 3+3 works. Greedy can fail to find ANY answer.

	// --- Knapsack: one small example ---
	// The camera has the best value per kilo, but after taking it the tent
	// and the stove no longer fit, and together they are worth more.
	items := []Item{{"tent", 5, 20}, {"stove", 5, 20}, {"camera", 6, 30}, {"books", 2, 5}}
	capacity := 10
	fmt.Println("\nitems:", items, "capacity", capacity)
	fmt.Println("by density:", byDensity(items))
	fmt.Printf("fractional (greedy by density): %.2f  <- optimal when items can be cut\n",
		fractionalKnapsack(items, capacity))
	fmt.Println("0/1 greedy by density:         ", greedyWhole(byDensity(items), capacity))
	fmt.Println("0/1 exact (all subsets):       ", bruteKnapsack(items, capacity))

	// --- Knapsack: three greedy rules against brute force ---
	rng := rand.New(rand.NewSource(47))
	byValue := func(items []Item) []Item {
		s := slices.Clone(items)
		slices.SortStableFunc(s, func(a, b Item) int { return cmp.Compare(b.value, a.value) })
		return s
	}
	byLightest := func(items []Item) []Item {
		s := slices.Clone(items)
		slices.SortStableFunc(s, func(a, b Item) int { return cmp.Compare(a.weight, b.weight) })
		return s
	}
	const trials = 3000
	wrong := map[string]int{}
	worstRatio := 1.0 // worst (greedy / optimal) for the combined rule below
	fracBelow := 0    // the fractional answer must never be below the 0/1 one
	for t := 0; t < trials; t++ {
		n := 2 + rng.Intn(11)
		items := make([]Item, n)
		sumW := 0
		for i := range items {
			items[i] = Item{fmt.Sprint(i), 1 + rng.Intn(20), 1 + rng.Intn(50)}
			sumW += items[i].weight
		}
		capacity := 1 + rng.Intn(sumW)
		opt := bruteKnapsack(items, capacity)
		density := greedyWhole(byDensity(items), capacity)
		if density != opt {
			wrong["density"]++
		}
		if greedyWhole(byValue(items), capacity) != opt {
			wrong["value"]++
		}
		if greedyWhole(byLightest(items), capacity) != opt {
			wrong["lightest"]++
		}
		// The fix that makes greedy "good enough": take the better of the
		// density greedy and the single most valuable item that fits. This
		// is never below half of the optimum (a 1/2-approximation).
		single := 0
		for _, it := range items {
			if it.weight <= capacity {
				single = max(single, it.value)
			}
		}
		combined := max(density, single)
		if opt > 0 {
			worstRatio = min(worstRatio, float64(combined)/float64(opt))
		}
		if fractionalKnapsack(items, capacity) < float64(opt)-1e-9 {
			fracBelow++
		}
	}
	fmt.Printf("\n0/1 knapsack, %d random instances, greedy answer not optimal:\n", trials)
	fmt.Printf("  most valuable first:  %4d\n", wrong["value"])
	fmt.Printf("  lightest first:       %4d\n", wrong["lightest"])
	fmt.Printf("  best value/kg first:  %4d\n", wrong["density"])
	fmt.Printf("best of (density, best single item): worst ratio to optimum %.3f (guaranteed >= 0.5)\n", worstRatio)
	fmt.Println("fractional answer below the 0/1 optimum (must be 0):", fracBelow)
}
