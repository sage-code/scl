// 51_knapsack_family.go — 0/1 knapsack, coin change, and subset sum.
//
// These three problems are the same DP in different clothes. The state is
// "what capacity (or amount, or sum) is left", and the question at each item
// is "take it or leave it". They solve exactly the cases where greedy failed
// in 47_when_greedy_fails.go.
//
//	0/1 knapsack   each item once, maximize value within a weight limit
//	unbounded      each item any number of times (coin change is this)
//	subset sum     can some items add up to exactly a target?
//
// Two details cause most bugs and both are shown:
//
//	LOOP DIRECTION   in the 1-D table, going DOWN through capacities uses each
//	                 item at most once; going UP allows repeats
//	LOOP ORDER       for counting coin combinations, coins go in the OUTER
//	                 loop; swapping the loops counts ordered sequences instead
//
// Every answer is checked against brute force on small random inputs.
//
// Run: go run 51_knapsack_family.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
)

type Item struct{ weight, value int }

// ---------------------------------------------------------------------------
// 0/1 knapsack.
// State: best[i][w] = the most value using only the first i items with
// capacity w. For item i (0-based) there are two choices:
//   leave it: best[i][w] = best[i-1][w]
//   take it:  best[i][w] = best[i-1][w-weight] + value   (if it fits)
// The answer is the larger of the two. Time and memory O(n * capacity).
// ---------------------------------------------------------------------------

// knapsack returns the best value and which items were taken.
func knapsack(items []Item, capacity int) (int, []int) {
	n := len(items)
	best := make([][]int, n+1)
	for i := range best {
		best[i] = make([]int, capacity+1)
	}
	for i := 1; i <= n; i++ {
		it := items[i-1]
		for w := 0; w <= capacity; w++ {
			best[i][w] = best[i-1][w] // leave it
			if it.weight <= w {
				best[i][w] = max(best[i][w], best[i-1][w-it.weight]+it.value) // or take it
			}
		}
	}
	// Walk back through the table. If the value changed between rows i-1 and
	// i, item i must have been taken; then continue with the smaller capacity.
	var taken []int
	w := capacity
	for i := n; i >= 1; i-- {
		if best[i][w] != best[i-1][w] {
			taken = append(taken, i-1)
			w -= items[i-1].weight
		}
	}
	slices.Reverse(taken)
	return best[n][capacity], taken
}

// knapsackRolling keeps ONE row. Row i only reads row i-1 at the same or a
// smaller capacity, so iterate capacity DOWNWARD: best[w-weight] has not been
// overwritten yet and still belongs to the previous item. Memory O(capacity).
func knapsackRolling(items []Item, capacity int) int {
	best := make([]int, capacity+1)
	for _, it := range items {
		for w := capacity; w >= it.weight; w-- { // downward: each item once
			best[w] = max(best[w], best[w-it.weight]+it.value)
		}
	}
	return best[capacity]
}

// knapsackUpward is the SAME loop with the direction flipped. Now
// best[w-weight] may already include this item, so an item can be taken many
// times. That is the unbounded knapsack: a different problem, and a classic
// bug when it happens by accident in the 0/1 version.
func knapsackUpward(items []Item, capacity int) int {
	best := make([]int, capacity+1)
	for _, it := range items {
		for w := it.weight; w <= capacity; w++ { // upward: repeats allowed
			best[w] = max(best[w], best[w-it.weight]+it.value)
		}
	}
	return best[capacity]
}

// knapsackBrute tries every subset.
func knapsackBrute(items []Item, capacity int) int {
	best := 0
	for mask := 0; mask < 1<<len(items); mask++ {
		w, v := 0, 0
		for i, it := range items {
			if mask>>i&1 == 1 {
				w += it.weight
				v += it.value
			}
		}
		if w <= capacity {
			best = max(best, v)
		}
	}
	return best
}

// knapsackRepeatBrute is the oracle for the unbounded version: plain
// recursion over "how many copies of the first item".
func knapsackRepeatBrute(items []Item, capacity int) int {
	if len(items) == 0 {
		return 0
	}
	it, rest := items[0], items[1:]
	best := 0
	for k := 0; k*it.weight <= capacity; k++ {
		best = max(best, k*it.value+knapsackRepeatBrute(rest, capacity-k*it.weight))
	}
	return best
}

// ---------------------------------------------------------------------------
// Coin change. State: amount a.
//   fewest[a] = 1 + min over coins c <= a of fewest[a-c]
// ---------------------------------------------------------------------------

const unreachable = 1 << 30

func fewestCoins(coins []int, amount int) int {
	fewest := make([]int, amount+1)
	for a := 1; a <= amount; a++ {
		fewest[a] = unreachable
		for _, c := range coins {
			if c <= a && fewest[a-c] != unreachable {
				fewest[a] = min(fewest[a], fewest[a-c]+1)
			}
		}
	}
	if fewest[amount] == unreachable {
		return -1
	}
	return fewest[amount]
}

// combinations counts the DIFFERENT SETS of coins that add up to amount:
// {1,1,2} and {2,1,1} are the same set. Coins are the OUTER loop, so each
// coin is "decided" once before the next coin is considered, which fixes an
// order of coin values inside every combination.
func combinations(coins []int, amount int) int {
	ways := make([]int, amount+1)
	ways[0] = 1 // one way to make 0: take nothing
	for _, c := range coins {
		for a := c; a <= amount; a++ {
			ways[a] += ways[a-c]
		}
	}
	return ways[amount]
}

// sequences counts ORDERED sequences: {1,1,2}, {1,2,1} and {2,1,1} all
// count. Only the loops are swapped, and the meaning of the answer changes.
func sequences(coins []int, amount int) int {
	ways := make([]int, amount+1)
	ways[0] = 1
	for a := 1; a <= amount; a++ { // amount is the OUTER loop now
		for _, c := range coins {
			if c <= a {
				ways[a] += ways[a-c]
			}
		}
	}
	return ways[amount]
}

// ---------------------------------------------------------------------------
// Subset sum. State: reachable[s] = "some chosen items add up to exactly s".
// Same downward loop as the 0/1 knapsack, with booleans instead of values.
// ---------------------------------------------------------------------------

func subsetSum(nums []int, target int) bool {
	reachable := make([]bool, target+1)
	reachable[0] = true // the empty subset adds up to 0
	for _, x := range nums {
		for s := target; s >= x; s-- { // downward: each number once
			if reachable[s-x] {
				reachable[s] = true
			}
		}
	}
	return reachable[target]
}

// canSplitEvenly asks whether the numbers can be divided into two groups
// with equal sums, which is subset sum with target = total / 2.
func canSplitEvenly(nums []int) bool {
	total := 0
	for _, x := range nums {
		total += x
	}
	return total%2 == 0 && subsetSum(nums, total/2)
}

func subsetSumBrute(nums []int, target int) bool {
	for mask := 0; mask < 1<<len(nums); mask++ {
		sum := 0
		for i, x := range nums {
			if mask>>i&1 == 1 {
				sum += x
			}
		}
		if sum == target {
			return true
		}
	}
	return false
}

// ---- brute-force oracles for the coin counts (plain recursion) ----

func fewestBrute(coins []int, amount int) int {
	if amount == 0 {
		return 0
	}
	best := unreachable
	for _, c := range coins {
		if c <= amount {
			if r := fewestBrute(coins, amount-c); r != unreachable {
				best = min(best, r+1)
			}
		}
	}
	return best
}

// combosBrute picks coins in non-decreasing index order, so each SET is
// generated exactly once.
func combosBrute(coins []int, amount, from int) int {
	if amount == 0 {
		return 1
	}
	n := 0
	for i := from; i < len(coins); i++ {
		if coins[i] <= amount {
			n += combosBrute(coins, amount-coins[i], i)
		}
	}
	return n
}

func sequencesBrute(coins []int, amount int) int {
	if amount == 0 {
		return 1
	}
	n := 0
	for _, c := range coins {
		if c <= amount {
			n += sequencesBrute(coins, amount-c)
		}
	}
	return n
}

func randomItems(rng *rand.Rand, n int) []Item {
	items := make([]Item, n)
	for i := range items {
		items[i] = Item{1 + rng.Intn(12), 1 + rng.Intn(40)}
	}
	return items
}

func main() {
	// --- The greedy counterexample from demo 47, solved exactly ---
	items := []Item{{5, 20}, {5, 20}, {6, 30}, {2, 5}} // tent, stove, camera, books
	value, taken := knapsack(items, 10)
	fmt.Println("0/1 knapsack, capacity 10: best value", value, "taking items", taken,
		"(greedy by value per kilo got 35)")

	// --- Random checks ---
	rng := rand.New(rand.NewSource(51))
	fails := 0
	for t := 0; t < 3000; t++ {
		items := randomItems(rng, rng.Intn(12))
		capacity := rng.Intn(40)
		want := knapsackBrute(items, capacity)
		got, taken := knapsack(items, capacity)
		w, v := 0, 0
		for _, i := range taken { // the reported items must fit and add up
			w += items[i].weight
			v += items[i].value
		}
		if got != want || knapsackRolling(items, capacity) != want || w > capacity || v != got {
			fails++
		}
	}
	fmt.Println("0/1 knapsack (2-D table, 1-D table, items taken) vs all subsets, failures:", fails)

	// Direction of the inner loop decides between two different problems.
	one := []Item{{3, 10}}
	fmt.Printf("\none item (weight 3, value 10), capacity 9: downward loop %d, upward loop %d\n",
		knapsackRolling(one, 9), knapsackUpward(one, 9))
	fails = 0
	for t := 0; t < 1500; t++ {
		items := randomItems(rng, 1+rng.Intn(5))
		capacity := rng.Intn(30)
		if knapsackUpward(items, capacity) != knapsackRepeatBrute(items, capacity) {
			fails++
		}
	}
	fmt.Println("upward loop vs unbounded brute force, failures:", fails)

	// --- Coin change ---
	fmt.Println("\ncoins {4,3,1}, amount 6: fewest coins", fewestCoins([]int{4, 3, 1}, 6), "(greedy used 3)")
	fmt.Println("coins {5,3},   amount 6: fewest coins", fewestCoins([]int{5, 3}, 6), "(greedy found no answer)")
	fmt.Println("coins {5,3},   amount 7: fewest coins", fewestCoins([]int{5, 3}, 7), "(impossible)")
	c := []int{1, 2, 3}
	fmt.Println("coins {1,2,3}, amount 4: combinations", combinations(c, 4), " ordered sequences", sequences(c, 4))
	fails = 0
	for t := 0; t < 1500; t++ {
		coins := make([]int, 1+rng.Intn(4))
		for i := range coins {
			coins[i] = 1 + rng.Intn(8)
		}
		amount := rng.Intn(15)
		want := fewestBrute(coins, amount)
		got := fewestCoins(coins, amount)
		if (want == unreachable) != (got == -1) || (got != -1 && got != want) {
			fails++
		}
		uniq := slices.Compact(slices.Sorted(slices.Values(coins))) // duplicate coins would double-count sets
		if combinations(uniq, amount) != combosBrute(uniq, amount, 0) || sequences(uniq, amount) != sequencesBrute(uniq, amount) {
			fails++
		}
	}
	fmt.Println("coin change (fewest, combinations, sequences) vs brute force, failures:", fails)

	// --- Subset sum and equal split ---
	fmt.Println("\nsubset sum {3,34,4,12,5,2} target 9:", subsetSum([]int{3, 34, 4, 12, 5, 2}, 9), "(4+5)")
	fmt.Println("split {1,5,11,5} into equal halves:", canSplitEvenly([]int{1, 5, 11, 5}), "(11 vs 1+5+5)")
	fails = 0
	for t := 0; t < 3000; t++ {
		nums := make([]int, rng.Intn(12))
		for i := range nums {
			nums[i] = 1 + rng.Intn(15)
		}
		target := rng.Intn(60)
		if subsetSum(nums, target) != subsetSumBrute(nums, target) {
			fails++
		}
	}
	fmt.Println("subset sum vs all subsets, failures:", fails)

	// --- Size of the table: pseudo-polynomial time ---
	big := randomItems(rng, 200)
	fmt.Printf("\n200 items, capacity 10000: %d cells in the table, best value %d\n",
		201*10001, knapsackRolling(big, 10000))
	fmt.Println("The running time grows with the NUMBER capacity, not with its digits:")
	fmt.Println("doubling the capacity doubles the work, so this is pseudo-polynomial.")
}
