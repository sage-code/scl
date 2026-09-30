// 04_doubling_experiment.go — Measuring complexity empirically.
//
// Theory predicts growth; measurement confirms it. The doubling experiment
// runs an algorithm on n, 2n, 4n, ... and looks at the RATIO between
// consecutive run times:
//
//	ratio ~ 2  -> linear       O(n)
//	ratio ~ 4  -> quadratic    O(n^2)
//	ratio ~ 8  -> cubic        O(n^3)
//
// The absolute times depend on your CPU; the ratios do not. That is exactly
// why Big O ignores constants.
//
// Problem measured: "does this slice contain a duplicate value?"
//
// Run: go run 04_doubling_experiment.go
package main

import (
	"fmt"
	"time"
)

// hasDupPairs compares every pair: O(n^2) time, O(1) extra space.
func hasDupPairs(nums []int) bool {
	for i := 0; i < len(nums); i++ {
		for j := i + 1; j < len(nums); j++ {
			if nums[i] == nums[j] {
				return true
			}
		}
	}
	return false
}

// hasDupSet remembers seen values in a map used as a set: O(n) time, O(n) space.
// struct{} is Go's zero-byte value — the idiomatic "set" element.
func hasDupSet(nums []int) bool {
	seen := make(map[int]struct{}, len(nums))
	for _, v := range nums {
		if _, ok := seen[v]; ok {
			return true
		}
		seen[v] = struct{}{}
	}
	return false
}

// distinct returns 0, 1, 2, ..., n-1: no duplicates, so both functions
// must scan everything. Always measure the worst case you care about.
func distinct(n int) []int {
	s := make([]int, n)
	for i := range s {
		s[i] = i
	}
	return s
}

// measure returns the average time of one call fn(input).
// A single fast call can be shorter than the system timer's resolution and
// read as 0s, so we repeat the call until at least 100ms have passed and
// divide by the number of runs. Go's testing.B benchmarks work the same way.
func measure(fn func([]int) bool, input []int) time.Duration {
	runs := 0
	start := time.Now()
	for time.Since(start) < 100*time.Millisecond {
		fn(input)
		runs++
	}
	return time.Since(start) / time.Duration(runs)
}

// experiment prints the time for each n and the ratio to the previous n.
// It returns the time measured for the largest n, used for extrapolation.
func experiment(name string, fn func([]int) bool, sizes []int) time.Duration {
	fmt.Printf("\n%s\n%8s %14s %8s\n", name, "n", "time", "ratio")
	var prev time.Duration
	for _, n := range sizes {
		d := measure(fn, distinct(n))
		ratio := "-"
		if prev > 0 {
			ratio = fmt.Sprintf("%.2f", float64(d)/float64(prev))
		}
		fmt.Printf("%8d %14v %8s\n", n, d, ratio)
		prev = d
	}
	return prev
}

func main() {
	// Small inputs are dominated by constant overhead, so the first ratios
	// may be noisy. The trend stabilises as n grows.
	pairs := experiment("pairs  O(n^2) — expect ratio ~4", hasDupPairs,
		[]int{2_000, 4_000, 8_000, 16_000, 32_000})
	set := experiment("set    O(n)   — expect ratio ~2", hasDupSet,
		[]int{250_000, 500_000, 1_000_000, 2_000_000, 4_000_000})

	// Once the growth law is known, we can PREDICT without running:
	// going from 32,000 to 4,000,000 elements multiplies n by 125, so an
	// O(n^2) algorithm needs 125^2 = 15,625 times longer.
	const scale = 4_000_000.0 / 32_000.0
	predicted := time.Duration(float64(pairs) * scale * scale)
	fmt.Printf("\nPredicted pairs time at n=4,000,000: %v\n", predicted.Round(time.Second))
	fmt.Printf("Measured  set   time at n=4,000,000: %v\n", set.Round(time.Millisecond))
	fmt.Println("Choosing the right complexity class matters far more than")
	fmt.Println("micro-optimising either loop.")
}
