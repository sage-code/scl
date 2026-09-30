// 34_quicksort.go — Quicksort, partitioning and quickselect.
//
// Quicksort does the hard work BEFORE recursing:
//
//  1. pick a PIVOT
//  2. PARTITION: move smaller elements left of it, larger ones right
//  3. the pivot is now in its final position; sort both sides recursively
//
// With a good pivot each partition halves the problem: O(n log n) on
// average, in place, with excellent cache behaviour — usually the fastest
// comparison sort in practice. With a bad pivot (always the smallest
// element) one side is empty and it degrades to O(n^2). Random pivots make
// that astronomically unlikely for every input. Quicksort is NOT stable.
//
// Run: go run 34_quicksort.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
)

var comparisons int // global counter so the demo can compare strategies

// lomuto partitions a[lo:hi] around the pivot a[hi-1] and returns its final
// index p. Afterwards: a[lo:p] < pivot <= a[p+1:hi].
//
//	[ < pivot | >= pivot | unexamined | pivot ]
//	 lo        i          j            hi-1
func lomuto(a []int, lo, hi int) int {
	pivot := a[hi-1]
	i := lo // a[lo:i] holds the elements smaller than the pivot
	for j := lo; j < hi-1; j++ {
		comparisons++
		if a[j] < pivot {
			a[i], a[j] = a[j], a[i]
			i++
		}
	}
	a[i], a[hi-1] = a[hi-1], a[i] // put the pivot between the two regions
	return i
}

// quickSortLast always uses the last element as pivot: fine on random
// data, O(n^2) on data that is already sorted.
func quickSortLast(a []int, lo, hi int) {
	if hi-lo < 2 {
		return
	}
	p := lomuto(a, lo, hi)
	quickSortLast(a, lo, p)
	quickSortLast(a, p+1, hi)
}

// quickSortRandom swaps a random element into the pivot position first,
// and recurses into the SMALLER side while looping on the larger one, which
// bounds the stack depth to O(log n) even in unlucky cases.
func quickSortRandom(a []int, lo, hi int, rng *rand.Rand) {
	for hi-lo > 1 {
		r := lo + rng.Intn(hi-lo)
		a[r], a[hi-1] = a[hi-1], a[r]
		p := lomuto(a, lo, hi)
		if p-lo < hi-p {
			quickSortRandom(a, lo, p, rng)
			lo = p + 1
		} else {
			quickSortRandom(a, p+1, hi, rng)
			hi = p
		}
	}
}

// quickSort3Way (Dijkstra's Dutch flag) splits into < pivot, == pivot and
// > pivot. Equal keys are finished in one pass, so inputs with many
// duplicates become fast instead of quadratic.
func quickSort3Way(a []int, lo, hi int, rng *rand.Rand) {
	if hi-lo < 2 {
		return
	}
	pivot := a[lo+rng.Intn(hi-lo)]
	lt, i, gt := lo, lo, hi // a[lo:lt] < p, a[lt:i] == p, a[gt:hi] > p
	for i < gt {
		comparisons++
		switch {
		case a[i] < pivot:
			a[lt], a[i] = a[i], a[lt]
			lt++
			i++
		case a[i] > pivot:
			gt--
			a[gt], a[i] = a[i], a[gt] // do not advance i: new a[i] is unexamined
		default:
			i++
		}
	}
	quickSort3Way(a, lo, lt, rng)
	quickSort3Way(a, gt, hi, rng)
}

// quickSelect returns the k-th smallest element (k from 0) in O(n) average
// time: partition once, then recurse into the ONE side that contains k.
// It reorders a. Use it for medians and percentiles without full sorting.
func quickSelect(a []int, k int, rng *rand.Rand) int {
	lo, hi := 0, len(a)
	for {
		r := lo + rng.Intn(hi-lo)
		a[r], a[hi-1] = a[hi-1], a[r]
		p := lomuto(a, lo, hi)
		switch {
		case k < p:
			hi = p
		case k > p:
			lo = p + 1
		default:
			return a[p]
		}
	}
}

func count(f func()) int {
	comparisons = 0
	f()
	return comparisons
}

func main() {
	rng := rand.New(rand.NewSource(4))

	demo := []int{7, 2, 9, 4, 3, 8, 5}
	p := lomuto(demo, 0, len(demo))
	fmt.Printf("partition around 5: %v, pivot at index %d\n", demo, p)

	fails := 0
	for trial := 0; trial < 1000; trial++ {
		a := make([]int, rng.Intn(60))
		for i := range a {
			a[i] = rng.Intn(15)
		}
		want := slices.Clone(a)
		slices.Sort(want)
		b, c, d := slices.Clone(a), slices.Clone(a), slices.Clone(a)
		quickSortLast(b, 0, len(b))
		quickSortRandom(c, 0, len(c), rng)
		quickSort3Way(d, 0, len(d), rng)
		if !slices.Equal(b, want) || !slices.Equal(c, want) || !slices.Equal(d, want) {
			fails++
		}
		if len(a) > 0 {
			k := rng.Intn(len(a))
			if quickSelect(slices.Clone(a), k, rng) != want[k] {
				fails++
			}
		}
	}
	fmt.Println("random checks (3 quicksorts + quickselect), failures:", fails)

	// Comparisons on inputs that expose each weakness. n*log2(n) ≈ 48,000.
	// Lomuto sends keys EQUAL to the pivot to one side, so many duplicates
	// hurt even with a random pivot; the 3-way partition fixes that.
	const n = 4000
	sorted := make([]int, n)
	dups := make([]int, n)
	for i := range sorted {
		sorted[i] = i
		dups[i] = rng.Intn(3) // only three distinct values
	}
	random := rng.Perm(n)
	fmt.Printf("\nn=%d comparisons   %10s %10s %10s\n", n, "random", "sorted", "3 values")
	row := func(name string, f func([]int)) {
		fmt.Printf("%-24s", name)
		for _, in := range [][]int{random, sorted, dups} {
			fmt.Printf(" %10d", count(func() { f(slices.Clone(in)) }))
		}
		fmt.Println()
	}
	row("last-element pivot", func(a []int) { quickSortLast(a, 0, len(a)) })
	row("random pivot", func(a []int) { quickSortRandom(a, 0, len(a), rng) })
	row("random pivot, 3-way", func(a []int) { quickSort3Way(a, 0, len(a), rng) })

	data := rng.Perm(1_000_001)
	fmt.Println("\nmedian of 0..1,000,000 via quickselect:", quickSelect(data, 500_000, rng))
}
