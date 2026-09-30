// 02_two_sum_three_ways.go — How an engineer improves a solution step by step.
//
// Problem (Two Sum): given a slice of integers and a target, return the
// indices of two DIFFERENT elements whose values add up to target.
// Return ok=false when no such pair exists.
//
// We solve the same problem three times. Each version comes from asking one
// question about the previous one: "what work am I repeating?"
//
//	v1 brute force   O(n^2) time  O(1) space  — check every pair
//	v2 sort + scan   O(n log n)   O(n) space  — order lets us discard work
//	v3 hash map      O(n) time    O(n) space  — remember what we have seen
//
// Run: go run 02_two_sum_three_ways.go
package main

import (
	"fmt"
	"math/rand"
	"sort"
	"time"
)

// twoSumBrute tries every pair (i, j) with i < j.
// Thinking: the simplest correct solution is the baseline. Always write it
// first — it becomes the reference ("oracle") used to test faster versions.
func twoSumBrute(nums []int, target int) (int, int, bool) {
	for i := 0; i < len(nums); i++ {
		for j := i + 1; j < len(nums); j++ { // j starts at i+1: distinct elements, no repeats
			if nums[i]+nums[j] == target {
				return i, j, true
			}
		}
	}
	return 0, 0, false
}

// twoSumSorted sorts (value, index) pairs, then walks two pointers inward.
// Thinking: in a sorted list, if left+right is too small, NO pair using the
// current left can work (every other right is smaller), so left moves up.
// If the sum is too large, the symmetric argument moves right down.
// Each step discards one candidate forever -> the scan is O(n).
func twoSumSorted(nums []int, target int) (int, int, bool) {
	type pair struct{ val, idx int }
	ps := make([]pair, len(nums))
	for i, v := range nums {
		ps[i] = pair{v, i} // keep original index: sorting would lose it
	}
	sort.Slice(ps, func(a, b int) bool { return ps[a].val < ps[b].val })

	lo, hi := 0, len(ps)-1
	for lo < hi {
		sum := ps[lo].val + ps[hi].val
		switch {
		case sum == target:
			i, j := ps[lo].idx, ps[hi].idx
			if i > j {
				i, j = j, i // report indices in ascending order
			}
			return i, j, true
		case sum < target:
			lo++ // need a bigger sum
		default:
			hi-- // need a smaller sum
		}
	}
	return 0, 0, false
}

// twoSumMap does one pass, remembering each value's index in a map.
// Thinking: for element x we need to know "have I already seen target-x?".
// A map answers that question in O(1) average time, trading memory for speed.
func twoSumMap(nums []int, target int) (int, int, bool) {
	seen := make(map[int]int, len(nums)) // value -> index; pre-sized to avoid rehashing
	for j, x := range nums {
		if i, ok := seen[target-x]; ok {
			return i, j, true // i < j because i was stored earlier
		}
		seen[x] = j // store AFTER the lookup so x never pairs with itself
	}
	return 0, 0, false
}

// solver lets us treat the three functions uniformly.
type solver struct {
	name string
	fn   func([]int, int) (int, int, bool)
}

// valid checks an answer independently of how it was produced.
// Different correct algorithms may return different pairs, so we verify the
// property (distinct indices, correct sum) instead of comparing indices.
func valid(nums []int, target, i, j int, ok bool) bool {
	if !ok {
		return true // "not found" is checked against the oracle separately
	}
	return i != j && nums[i]+nums[j] == target
}

// timeIt returns the average duration of one call to fn.
// System timers have limited resolution (on some platforms a very fast call
// reads as 0s), so we repeat fn until at least 50ms have passed and divide.
// Go's own testing.B benchmarks use the same idea.
func timeIt(fn func()) time.Duration {
	runs := 0
	start := time.Now()
	for time.Since(start) < 50*time.Millisecond {
		fn()
		runs++
	}
	return time.Since(start) / time.Duration(runs)
}

func main() {
	solvers := []solver{
		{"brute O(n^2)", twoSumBrute},
		{"sorted O(n log n)", twoSumSorted},
		{"map O(n)", twoSumMap},
	}

	// Part 1 — correctness on small, hand-picked examples.
	examples := []struct {
		nums   []int
		target int
	}{
		{[]int{2, 7, 11, 15}, 9},  // classic
		{[]int{3, 3}, 6},          // equal values, different indices
		{[]int{3, 2, 4}, 6},       // must not use 3 twice
		{[]int{-1, -2, -3, 5}, 3}, // negatives
		{[]int{1, 2, 3}, 100},     // no answer
	}
	fmt.Println("== correctness ==")
	for _, ex := range examples {
		_, _, oracleOK := twoSumBrute(ex.nums, ex.target)
		for _, s := range solvers {
			i, j, ok := s.fn(ex.nums, ex.target)
			good := valid(ex.nums, ex.target, i, j, ok) && ok == oracleOK
			fmt.Printf("%-18s nums=%-15s target=%-4d -> (%d,%d,%v) valid=%v\n",
				s.name, fmt.Sprint(ex.nums), ex.target, i, j, ok, good)
		}
	}

	// Part 2 — speed on a worst case: no pair exists, so every algorithm
	// must examine all of its candidates before giving up.
	fmt.Println("\n== timing (no answer exists -> worst case) ==")
	rng := rand.New(rand.NewSource(1)) // fixed seed: repeatable runs
	for _, n := range []int{1_000, 5_000, 20_000} {
		nums := make([]int, n)
		for i := range nums {
			nums[i] = rng.Intn(1_000_000) * 2 // all even numbers...
		}
		target := 1 // ...so no pair can sum to an odd target
		for _, s := range solvers {
			d := timeIt(func() { s.fn(nums, target) })
			fmt.Printf("n=%-6d %-18s %v\n", n, s.name, d)
		}
	}
	// Observe: multiplying n by 4 multiplies brute-force time by ~16,
	// while the map version grows roughly 4x. That ratio is Big O in action.
}
