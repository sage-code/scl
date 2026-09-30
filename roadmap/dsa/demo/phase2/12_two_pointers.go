// 12_two_pointers.go — Two indices that move instead of two nested loops.
//
// The two-pointer technique keeps two indices into a slice and moves one of
// them each step, based on a rule that proves the skipped positions cannot
// hold the answer. Each index moves at most n times, so the whole scan is
// O(n) — replacing an O(n^2) pair search.
//
// Three shapes appear again and again:
//
//	opposite ends  lo -> ... <- hi   pair sums on sorted data, palindromes
//	same direction slow, fast        in-place compaction, dedupe
//	two inputs     i on a, j on b    merging sorted sequences
//
// Run: go run 12_two_pointers.go
package main

import (
	"fmt"
	"slices"
)

// isPalindrome compares characters from both ends inward.
// Shape: opposite ends. Stops at the middle: n/2 comparisons, O(n).
func isPalindrome(s string) bool {
	for lo, hi := 0, len(s)-1; lo < hi; lo, hi = lo+1, hi-1 {
		if s[lo] != s[hi] {
			return false
		}
	}
	return true
}

// pairWithSum finds two values in a SORTED slice that add to target.
// Rule: if the sum is too small, the smallest value (at lo) cannot be part
// of any answer with a smaller partner, so discard it; symmetric for hi.
func pairWithSum(sorted []int, target int) (int, int, bool) {
	lo, hi := 0, len(sorted)-1
	for lo < hi {
		switch sum := sorted[lo] + sorted[hi]; {
		case sum == target:
			return sorted[lo], sorted[hi], true
		case sum < target:
			lo++
		default:
			hi--
		}
	}
	return 0, 0, false
}

// dedupeSorted removes repeated values from a sorted slice in place.
// Shape: same direction. `slow` marks the end of the unique prefix;
// `fast` explores. Invariant: s[0..slow] holds the distinct values seen so far.
func dedupeSorted(s []int) []int {
	if len(s) == 0 {
		return s
	}
	slow := 0
	for fast := 1; fast < len(s); fast++ {
		if s[fast] != s[slow] { // a new value: extend the unique prefix
			slow++
			s[slow] = s[fast]
		}
	}
	return s[:slow+1]
}

// mergeSorted merges two sorted slices into a new sorted slice.
// Shape: two inputs. Always take the smaller head; O(len(a) + len(b)).
// Taking from `a` on ties (<=) keeps the merge STABLE: equal elements keep
// their original relative order — important for merge sort (Phase 3).
func mergeSorted(a, b []int) []int {
	out := make([]int, 0, len(a)+len(b))
	i, j := 0, 0
	for i < len(a) && j < len(b) {
		if a[i] <= b[j] {
			out = append(out, a[i])
			i++
		} else {
			out = append(out, b[j])
			j++
		}
	}
	// one input is exhausted; the rest of the other is already sorted
	out = append(out, a[i:]...)
	return append(out, b[j:]...)
}

// maxWater: lines of height h[i] stand at positions i. Pick two lines that,
// with the x-axis, hold the most water: area = min(h[lo], h[hi]) * (hi - lo).
// Rule: moving the TALLER line inward can only shrink the width without
// raising the limiting height, so always move the SHORTER line.
func maxWater(h []int) int {
	best := 0
	lo, hi := 0, len(h)-1
	for lo < hi {
		area := min(h[lo], h[hi]) * (hi - lo) // min is built in since Go 1.21
		best = max(best, area)
		if h[lo] < h[hi] {
			lo++
		} else {
			hi--
		}
	}
	return best
}

// maxWaterBrute checks every pair: the O(n^2) oracle for maxWater.
func maxWaterBrute(h []int) int {
	best := 0
	for i := range h {
		for j := i + 1; j < len(h); j++ {
			best = max(best, min(h[i], h[j])*(j-i))
		}
	}
	return best
}

// dutchFlag sorts a slice of 0s, 1s and 2s in one pass (Dijkstra's
// "Dutch national flag" problem). Three pointers split the slice into:
//
//	[0, lo) = 0s   [lo, mid) = 1s   [mid, hi] = unknown   (hi, end) = 2s
func dutchFlag(s []int) {
	lo, mid, hi := 0, 0, len(s)-1
	for mid <= hi {
		switch s[mid] {
		case 0:
			s[lo], s[mid] = s[mid], s[lo]
			lo++
			mid++
		case 1:
			mid++
		case 2:
			s[mid], s[hi] = s[hi], s[mid]
			hi-- // do NOT advance mid: the swapped-in value is still unknown
		}
	}
}

func main() {
	for _, w := range []string{"racecar", "level", "golang", "a", ""} {
		fmt.Printf("isPalindrome(%q) = %v\n", w, isPalindrome(w))
	}

	sorted := []int{1, 3, 4, 6, 8, 11}
	a, b, ok := pairWithSum(sorted, 10)
	fmt.Println("\npairWithSum(10):", a, b, ok)

	fmt.Println("dedupeSorted:", dedupeSorted([]int{1, 1, 2, 3, 3, 3, 4, 5, 5}))
	fmt.Println("mergeSorted: ", mergeSorted([]int{1, 4, 7, 9}, []int{2, 3, 8}))

	flag := []int{2, 0, 1, 2, 1, 0, 0, 2, 1}
	dutchFlag(flag)
	fmt.Println("dutchFlag:   ", flag, "sorted:", slices.IsSorted(flag))

	// Verify maxWater against the brute-force oracle on many small inputs.
	heights := []int{1, 8, 6, 2, 5, 4, 8, 3, 7}
	fmt.Println("\nmaxWater:", maxWater(heights), "brute:", maxWaterBrute(heights))
	mismatches := 0
	seed := uint32(7)
	for trial := 0; trial < 2000; trial++ {
		h := make([]int, 2+trial%15)
		for i := range h {
			seed = seed*1664525 + 1013904223 // tiny deterministic generator
			h[i] = int(seed>>24) % 20
		}
		if maxWater(h) != maxWaterBrute(h) {
			mismatches++
		}
	}
	fmt.Println("random trials vs oracle, mismatches:", mismatches)
}
