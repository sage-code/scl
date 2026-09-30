// 31_search_the_answer.go — Binary search on the answer.
//
// Many optimization problems ask for the SMALLEST value that works:
// the smallest ship capacity, the lowest eating speed, the minimum largest
// part. You cannot search an array — there is none — but you can search the
// range of possible answers if feasibility is MONOTONE:
//
//	if capacity c works, every capacity > c also works
//
// Then the answers look like  false false false true true ...  and binary
// search finds the first true. The cost is
//
//	O(log(range) * cost of one feasibility check)
//
// Recipe: (1) bound the answer [lo, hi], (2) write feasible(x) — usually a
// simple greedy pass, (3) binary search for the first feasible x.
//
// Run: go run 31_search_the_answer.go
package main

import (
	"fmt"
	"math"
	"math/rand"
	"slices"
)

// firstFeasible returns the smallest x in [lo, hi] with ok(x) true.
// It assumes ok(hi) is true and ok is monotone.
func firstFeasible(lo, hi int, ok func(int) bool) int {
	for lo < hi {
		mid := lo + (hi-lo)/2
		if ok(mid) {
			hi = mid // mid works; maybe something smaller works too
		} else {
			lo = mid + 1 // mid fails, so everything below fails too
		}
	}
	return lo
}

// isqrt returns floor(sqrt(n)): the largest r with r*r <= n, found as
// (first r with r*r > n) - 1. For n above about 3*10^9, r*r could
// overflow int64 during the search; a real library would use hi = 3037000500.
func isqrt(n int) int {
	return firstFeasible(0, n+1, func(r int) bool { return r*r > n }) - 1
}

// shipWithinDays: packages must ship in order; find the smallest ship
// capacity that ships them all within the given number of days.
func shipWithinDays(weights []int, days int) int {
	lo := slices.Max(weights) // the heaviest package must fit
	hi := 0
	for _, w := range weights {
		hi += w // one day for everything always works
	}
	return firstFeasible(lo, hi, func(capacity int) bool {
		return daysNeeded(weights, capacity) <= days
	})
}

// daysNeeded is the greedy feasibility check: load each day until the next
// package does not fit. O(n).
func daysNeeded(weights []int, capacity int) int {
	d, load := 1, 0
	for _, w := range weights {
		if load+w > capacity {
			d++ // start a new day
			load = 0
		}
		load += w
	}
	return d
}

// minEatingSpeed: piles of bananas, h hours; each hour you eat up to k
// bananas from one pile. Find the smallest k that finishes in time.
func minEatingSpeed(piles []int, h int) int {
	return firstFeasible(1, slices.Max(piles), func(k int) bool {
		hours := 0
		for _, p := range piles {
			hours += (p + k - 1) / k // ceil(p / k) without floats
		}
		return hours <= h
	})
}

// cubeRoot shows the floating-point version: there is no "next integer",
// so iterate a fixed number of times. 100 halvings shrink any range far
// below float64 precision.
func cubeRoot(x float64) float64 {
	lo, hi := 0.0, math.Max(1, x)
	for i := 0; i < 100; i++ {
		mid := (lo + hi) / 2
		if mid*mid*mid < x {
			lo = mid
		} else {
			hi = mid
		}
	}
	return (lo + hi) / 2
}

// bruteShip tries every capacity from the lower bound up: the oracle.
func bruteShip(weights []int, days int) int {
	for c := slices.Max(weights); ; c++ {
		if daysNeeded(weights, c) <= days {
			return c
		}
	}
}

func main() {
	for _, n := range []int{0, 1, 15, 16, 17, 1_000_000_007} {
		fmt.Printf("isqrt(%d) = %d\n", n, isqrt(n))
	}

	w := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	c := shipWithinDays(w, 5)
	fmt.Printf("\nship %v in 5 days: capacity %d (days needed: %d, with %d: %d)\n",
		w, c, daysNeeded(w, c), c-1, daysNeeded(w, c-1))

	piles := []int{3, 6, 7, 11}
	fmt.Printf("eat %v in 8 hours: speed %d\n", piles, minEatingSpeed(piles, 8))
	fmt.Printf("cube root of 10: %.12f (check: %.12f)\n", cubeRoot(10), math.Cbrt(10))

	// Verify the search against the brute-force oracle.
	rng := rand.New(rand.NewSource(3))
	fails := 0
	for trial := 0; trial < 1000; trial++ {
		n := rng.Intn(15) + 1
		ws := make([]int, n)
		for i := range ws {
			ws[i] = rng.Intn(20) + 1
		}
		d := rng.Intn(n) + 1
		if shipWithinDays(ws, d) != bruteShip(ws, d) {
			fails++
		}
	}
	for n := 0; n < 5000; n++ {
		r := isqrt(n)
		if r*r > n || (r+1)*(r+1) <= n {
			fails++
		}
	}
	fmt.Println("\nchecks against brute force, failures:", fails)

	// Why it matters: with a total weight of 10^9 the brute force would try
	// up to 10^9 capacities; binary search needs about 30 checks.
	big := make([]int, 100_000)
	for i := range big {
		big[i] = rng.Intn(10_000) + 1
	}
	checks := 0
	firstFeasible(slices.Max(big), 1_000_000_000, func(c int) bool { checks++; return daysNeeded(big, c) <= 50 })
	fmt.Println("feasibility checks for a range of 10^9:", checks)
}
