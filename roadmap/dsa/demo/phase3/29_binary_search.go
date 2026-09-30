// 29_binary_search.go — Linear search versus binary search.
//
// Linear search checks every element: O(n), works on any slice.
// Binary search needs SORTED data and halves the search range on every
// comparison: O(log n). One million elements need at most 20 comparisons.
//
// The whole algorithm rests on one INVARIANT, true before every iteration:
//
//	if target is in the slice, its index is inside [lo, hi)
//
// Each step shrinks [lo, hi) while keeping the invariant; when the range is
// empty the target cannot be present. Writing the invariant down first is
// how you get the boundaries (< vs <=, mid vs mid+1) right.
//
// Run: go run 29_binary_search.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"time"
)

// linearSearch returns the index of target or -1. comparisons counts the
// work so it can be compared with binary search.
func linearSearch(a []int, target int) (idx, comparisons int) {
	for i, v := range a {
		comparisons++
		if v == target {
			return i, comparisons
		}
	}
	return -1, comparisons
}

// binarySearch uses the half-open range [lo, hi).
func binarySearch(a []int, target int) (idx, comparisons int) {
	lo, hi := 0, len(a) // invariant: target, if present, is in a[lo:hi]
	for lo < hi {       // the range is not empty
		mid := lo + (hi-lo)/2 // same as (lo+hi)/2 but cannot overflow
		comparisons++
		switch {
		case a[mid] < target:
			lo = mid + 1 // a[lo..mid] are all too small: discard them
		case a[mid] > target:
			hi = mid // a[mid..hi) are all too large: discard them
		default:
			return mid, comparisons
		}
	}
	return -1, comparisons
}

// binarySearchRec is the same algorithm written recursively. Each call
// works on a smaller range; the recursion depth is O(log n).
func binarySearchRec(a []int, target, lo, hi int) int {
	if lo >= hi {
		return -1 // empty range: not found
	}
	mid := lo + (hi-lo)/2
	switch {
	case a[mid] < target:
		return binarySearchRec(a, target, mid+1, hi)
	case a[mid] > target:
		return binarySearchRec(a, target, lo, mid)
	default:
		return mid
	}
}

// trace prints every step so you can follow the range shrinking.
func trace(a []int, target int) {
	fmt.Printf("searching %d in %v\n", target, a)
	lo, hi := 0, len(a)
	for lo < hi {
		mid := lo + (hi-lo)/2
		fmt.Printf("  lo=%d hi=%d mid=%d a[mid]=%d", lo, hi, mid, a[mid])
		switch {
		case a[mid] < target:
			fmt.Println("  too small -> lo = mid+1")
			lo = mid + 1
		case a[mid] > target:
			fmt.Println("  too large -> hi = mid")
			hi = mid
		default:
			fmt.Println("  found")
			return
		}
	}
	fmt.Printf("  lo=%d hi=%d empty range -> not found\n", lo, hi)
}

// timeIt repeats f until at least 50ms have passed and returns the average.
// Single runs are too short for the Windows timer.
func timeIt(f func()) time.Duration {
	runs, start := 0, time.Now()
	for time.Since(start) < 50*time.Millisecond {
		f()
		runs++
	}
	return time.Since(start) / time.Duration(runs)
}

func main() {
	a := []int{2, 5, 8, 12, 16, 23, 38, 56, 72, 91}
	trace(a, 72)
	trace(a, 40)

	// Verify all three versions against each other and against the standard
	// library on random sorted slices, including absent targets.
	rng := rand.New(rand.NewSource(1))
	mismatches := 0
	for trial := 0; trial < 2000; trial++ {
		n := rng.Intn(30)
		s := make([]int, n)
		for i := range s {
			s[i] = rng.Intn(50) * 2 // even numbers only: odd targets are absent
		}
		slices.Sort(s)
		s = slices.Compact(s) // distinct keys, so the index is unique
		target := rng.Intn(100)
		i1, _ := linearSearch(s, target)
		i2, _ := binarySearch(s, target)
		i3 := binarySearchRec(s, target, 0, len(s))
		i4, ok := slices.BinarySearch(s, target)
		if !ok {
			i4 = -1
		}
		if i1 != i2 || i2 != i3 || i3 != i4 {
			mismatches++
		}
	}
	fmt.Println("\nrandom cross-checks, mismatches:", mismatches)

	// Comparisons and time for the worst case (absent target).
	fmt.Printf("\n%10s %12s %12s %12s %12s\n", "n", "linear cmp", "binary cmp", "linear", "binary")
	for _, n := range []int{1_000, 100_000, 1_000_000} {
		big := make([]int, n)
		for i := range big {
			big[i] = 2 * i
		}
		_, lc := linearSearch(big, -1)
		_, bc := binarySearch(big, 2*n) // larger than every element
		lt := timeIt(func() { linearSearch(big, -1) })
		bt := timeIt(func() { binarySearch(big, 2*n) })
		fmt.Printf("%10d %12d %12d %12v %12v\n", n, lc, bc, lt, bt)
	}
	fmt.Println("\nBinary search pays off only if the data is already sorted.")
	fmt.Println("Sorting costs O(n log n): worth it when you search many times.")
}
