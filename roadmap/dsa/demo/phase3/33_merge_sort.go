// 33_merge_sort.go — Merge sort: divide and conquer.
//
//  1. DIVIDE   split the slice into two halves
//  2. CONQUER  sort each half recursively
//  3. COMBINE  merge the two sorted halves in one linear pass
//
// The recursion tree has log2(n) levels and every level merges n elements
// in total, so merge sort is O(n log n) in the best, average AND worst case.
// It is stable (merge takes from the left half on ties) but needs O(n)
// extra memory for the merge buffer. It is the natural choice for linked
// lists and for external sorting of data that does not fit in memory.
//
// Run: go run 33_merge_sort.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"strings"
	"time"
)

// merge combines sorted a[lo:mid] and a[mid:hi] using buf as scratch space.
func merge(a, buf []int, lo, mid, hi int) {
	copy(buf[lo:hi], a[lo:hi])
	i, j := lo, mid // next unread element of each half
	for k := lo; k < hi; k++ {
		switch {
		case i == mid: // left half used up
			a[k] = buf[j]
			j++
		case j == hi: // right half used up
			a[k] = buf[i]
			i++
		case buf[j] < buf[i]: // strictly smaller: ties go left -> stable
			a[k] = buf[j]
			j++
		default:
			a[k] = buf[i]
			i++
		}
	}
}

// mergeSort is the top-down version. One buffer is allocated once and
// shared by every call, instead of allocating inside each merge.
func mergeSort(a []int) {
	buf := make([]int, len(a))
	var sort func(lo, hi int)
	sort = func(lo, hi int) {
		if hi-lo < 2 {
			return // 0 or 1 elements: already sorted (base case)
		}
		mid := lo + (hi-lo)/2
		sort(lo, mid)
		sort(mid, hi)
		if a[mid-1] <= a[mid] {
			return // halves already in order: skip the merge (O(n) on sorted input)
		}
		merge(a, buf, lo, mid, hi)
	}
	sort(0, len(a))
}

// mergeSortBottomUp avoids recursion: merge runs of width 1, 2, 4, 8, ...
func mergeSortBottomUp(a []int) {
	n := len(a)
	buf := make([]int, n)
	for width := 1; width < n; width *= 2 {
		for lo := 0; lo < n-width; lo += 2 * width {
			merge(a, buf, lo, lo+width, min(lo+2*width, n))
		}
	}
}

// traceSort prints the recursion so you can see divide and combine.
func traceSort(a []int, depth int) []int {
	pad := strings.Repeat("  ", depth)
	if len(a) < 2 {
		fmt.Printf("%s%v base case\n", pad, a)
		return a
	}
	mid := len(a) / 2
	fmt.Printf("%ssplit %v -> %v %v\n", pad, a, a[:mid], a[mid:])
	l := traceSort(slices.Clone(a[:mid]), depth+1)
	r := traceSort(slices.Clone(a[mid:]), depth+1)
	out := make([]int, 0, len(a))
	i, j := 0, 0
	for i < len(l) && j < len(r) {
		if r[j] < l[i] {
			out = append(out, r[j])
			j++
		} else {
			out = append(out, l[i])
			i++
		}
	}
	out = append(append(out, l[i:]...), r[j:]...)
	fmt.Printf("%smerge %v + %v -> %v\n", pad, l, r, out)
	return out
}

// countInversions counts pairs i < j with a[i] > a[j] — a measure of how
// unsorted the data is (0 = sorted, n(n-1)/2 = reversed). Merge sort counts
// them for free: when an element is taken from the right half, it jumps
// over every element still waiting in the left half.
func countInversions(a []int) int {
	if len(a) < 2 {
		return 0
	}
	mid := len(a) / 2
	l, r := slices.Clone(a[:mid]), slices.Clone(a[mid:])
	inv := countInversions(l) + countInversions(r)
	i, j := 0, 0
	for k := range a {
		if j == len(r) || (i < len(l) && l[i] <= r[j]) {
			a[k] = l[i]
			i++
		} else {
			a[k] = r[j]
			j++
			inv += len(l) - i // r[j] is smaller than all remaining l[i:]
		}
	}
	return inv
}

func timeIt(f func()) time.Duration {
	runs, start := 0, time.Now()
	for time.Since(start) < 100*time.Millisecond {
		f()
		runs++
	}
	return time.Since(start) / time.Duration(runs)
}

func main() {
	traceSort([]int{38, 27, 43, 3, 9, 82, 10}, 0)

	rng := rand.New(rand.NewSource(2))
	fails := 0
	for trial := 0; trial < 1000; trial++ {
		a := make([]int, rng.Intn(60))
		for i := range a {
			a[i] = rng.Intn(30)
		}
		want := slices.Clone(a)
		slices.Sort(want)
		b, c := slices.Clone(a), slices.Clone(a)
		mergeSort(b)
		mergeSortBottomUp(c)
		brute := 0 // O(n^2) oracle for inversions
		for i := range a {
			for j := i + 1; j < len(a); j++ {
				if a[i] > a[j] {
					brute++
				}
			}
		}
		if !slices.Equal(b, want) || !slices.Equal(c, want) || countInversions(slices.Clone(a)) != brute {
			fails++
		}
	}
	fmt.Println("\nrandom checks (top-down, bottom-up, inversions), failures:", fails)
	fmt.Println("inversions in [2 4 1 3 5]:", countInversions([]int{2, 4, 1, 3, 5}))

	// Doubling n roughly doubles the time (slightly more): n log n growth.
	fmt.Printf("\n%9s %12s %12s\n", "n", "merge sort", "slices.Sort")
	for _, n := range []int{100_000, 200_000, 400_000} {
		src := rng.Perm(n)
		work := make([]int, n)
		ms := timeIt(func() { copy(work, src); mergeSort(work) })
		ss := timeIt(func() { copy(work, src); slices.Sort(work) })
		fmt.Printf("%9d %12v %12v\n", n, ms.Round(time.Microsecond), ss.Round(time.Microsecond))
	}
}
