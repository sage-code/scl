// 30_search_bounds.go — Binary search variants: bounds, ranges, rotations.
//
// Plain binary search answers "is x present?". Most real questions are
// about POSITIONS in sorted data:
//
//	lowerBound(x)  first index with a[i] >= x   (where x would be inserted)
//	upperBound(x)  first index with a[i] >  x
//	count(x)       upperBound(x) - lowerBound(x)
//
// All of them are the same algorithm: find the FIRST index where a
// monotone predicate becomes true. The slice looks like
//
//	false false false true true true
//	                  ^ answer
//
// and binary search finds that boundary in O(log n). Learn this one
// template and you never need to remember off-by-one special cases.
//
// Run: go run 30_search_bounds.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"sort"
)

// firstTrue returns the smallest i in [0, n) with pred(i) true, or n if
// there is none. pred must be monotone: once true, true for every larger i.
func firstTrue(n int, pred func(int) bool) int {
	lo, hi := 0, n // invariant: pred is false before lo, true from hi on
	for lo < hi {
		mid := lo + (hi-lo)/2
		if pred(mid) {
			hi = mid // mid could be the answer: keep it in range
		} else {
			lo = mid + 1 // mid is false: the answer is to its right
		}
	}
	return lo // lo == hi: the boundary
}

func lowerBound(a []int, x int) int {
	return firstTrue(len(a), func(i int) bool { return a[i] >= x })
}

func upperBound(a []int, x int) int {
	return firstTrue(len(a), func(i int) bool { return a[i] > x })
}

// countInRange counts elements with lo <= v <= hi in O(log n).
func countInRange(a []int, lo, hi int) int {
	return upperBound(a, hi) - lowerBound(a, lo)
}

// insertSorted keeps a sorted by inserting at the lower bound.
func insertSorted(a []int, x int) []int {
	return slices.Insert(a, lowerBound(a, x), x)
}

// findRotated searches a sorted slice that was rotated, like
// [15 18 22 3 7 9]. At every step one half [lo..mid] or [mid..hi] is
// sorted; check whether the target lies in that half and discard the other.
func findRotated(a []int, target int) int {
	lo, hi := 0, len(a)-1 // closed range [lo, hi] here
	for lo <= hi {
		mid := lo + (hi-lo)/2
		if a[mid] == target {
			return mid
		}
		if a[lo] <= a[mid] { // left half is sorted
			if a[lo] <= target && target < a[mid] {
				hi = mid - 1
			} else {
				lo = mid + 1
			}
		} else { // right half is sorted
			if a[mid] < target && target <= a[hi] {
				lo = mid + 1
			} else {
				hi = mid - 1
			}
		}
	}
	return -1
}

// findPeak returns an index i with a[i] > both neighbours (a[-1] and a[n]
// count as -infinity). The data is NOT sorted, yet binary search works:
// if a[mid] < a[mid+1] a peak must exist to the right, because the values
// rise and must eventually fall or end. The predicate "a[i] > a[i+1]" is
// not monotone, so firstTrue may not return the FIRST true; it still
// returns an index where the predicate switches from false to true (or the
// last index), and every such switch point is a peak.
func findPeak(a []int) int {
	return firstTrue(len(a)-1, func(i int) bool { return a[i] > a[i+1] })
}

func main() {
	a := []int{1, 3, 3, 3, 5, 8, 8, 13}
	fmt.Println("a =", a)
	for _, x := range []int{0, 3, 4, 8, 20} {
		lb, ub := lowerBound(a, x), upperBound(a, x)
		fmt.Printf("x=%-2d lowerBound=%d upperBound=%d count=%d\n", x, lb, ub, ub-lb)
	}
	fmt.Println("values in [3, 8]:", countInRange(a, 3, 8))
	a = insertSorted(a, 6)
	fmt.Println("after insertSorted(6):", a)

	// The standard library offers the same tools:
	// sort.Search is exactly firstTrue; slices.BinarySearch is lowerBound
	// plus a "found" flag.
	i := sort.Search(len(a), func(i int) bool { return a[i] >= 8 })
	j, found := slices.BinarySearch(a, 8)
	fmt.Println("sort.Search(>=8):", i, " slices.BinarySearch(8):", j, found)

	r := []int{15, 18, 22, 3, 7, 9}
	fmt.Println("\nrotated", r, "find 7 ->", findRotated(r, 7), " find 16 ->", findRotated(r, 16))
	p := []int{1, 4, 9, 7, 3, 5, 2}
	pk := findPeak(p)
	fmt.Printf("peak in %v -> index %d (value %d)\n", p, pk, p[pk])

	// Randomized checks against simple linear definitions (the oracle).
	rng := rand.New(rand.NewSource(7))
	fails := 0
	for trial := 0; trial < 3000; trial++ {
		n := rng.Intn(20) + 1
		s := make([]int, n)
		for k := range s {
			s[k] = rng.Intn(10)
		}
		slices.Sort(s)
		x := rng.Intn(12) - 1
		wantLB, wantUB := n, n
		for k := n - 1; k >= 0; k-- {
			if s[k] >= x {
				wantLB = k
			}
			if s[k] > x {
				wantUB = k
			}
		}
		if lowerBound(s, x) != wantLB || upperBound(s, x) != wantUB {
			fails++
		}
		// rotated search on distinct keys
		d := slices.Compact(slices.Clone(s))
		k := rng.Intn(len(d))
		rot := append(slices.Clone(d[k:]), d[:k]...)
		for idx, v := range rot {
			if findRotated(rot, v) != idx {
				fails++
			}
		}
		if findRotated(rot, 100) != -1 {
			fails++
		}
		// peak: any array without equal neighbours
		pa := rng.Perm(n)
		q := findPeak(pa)
		if (q > 0 && pa[q-1] > pa[q]) || (q < n-1 && pa[q+1] > pa[q]) {
			fails++
		}
	}
	fmt.Println("\nrandom checks (bounds, rotated, peak), failures:", fails)
}
