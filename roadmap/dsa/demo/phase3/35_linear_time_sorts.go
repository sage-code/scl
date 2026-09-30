// 35_linear_time_sorts.go — Counting sort and radix sort.
//
// Any sort that only COMPARES elements needs Ω(n log n) comparisons in the
// worst case: there are n! possible orders and each comparison answers one
// yes/no question, so it takes log2(n!) ≈ n log2 n answers to tell them apart.
//
// Counting and radix sort escape that bound by not comparing: they use the
// key's VALUE as an array index. The price is a restriction on the keys —
// small integers, or keys that split into small digits.
//
//	counting sort  O(n + k)       keys in [0, k)
//	radix sort     O(d * (n + b)) d digits of base b (here 4 bytes, b = 256)
//
// Run: go run 35_linear_time_sorts.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"time"
)

// Student is sorted by grade; the name shows that the sort is stable.
type Student struct {
	name  string
	grade int // 0..10
}

// countingSort sorts by grade in O(n + k). Three passes:
//  1. count how many records have each key
//  2. prefix sums: start[k] = index where the first record with key k goes
//  3. place each record at start[key] and advance it
//
// Pass 3 walks the input in order, so equal keys keep their order: STABLE.
// Radix sort depends on that stability.
func countingSort(in []Student, k int) []Student {
	count := make([]int, k)
	for _, s := range in {
		count[s.grade]++
	}
	start := make([]int, k)
	for g := 1; g < k; g++ {
		start[g] = start[g-1] + count[g-1]
	}
	out := make([]Student, len(in))
	for _, s := range in {
		out[start[s.grade]] = s
		start[s.grade]++
	}
	return out
}

// radixSort sorts uint32 values with four stable counting-sort passes, one
// per byte, from the LEAST significant byte to the most significant. After
// pass d the values are sorted by their lowest d bytes; stability keeps the
// work of earlier passes when later bytes are equal.
func radixSort(a []uint32) {
	buf := make([]uint32, len(a))
	for shift := 0; shift < 32; shift += 8 {
		var count [257]int
		for _, v := range a {
			count[(v>>shift)&0xFF+1]++ // count[b+1]: prefix sums give starts
		}
		for b := 1; b < 257; b++ {
			count[b] += count[b-1]
		}
		for _, v := range a {
			d := (v >> shift) & 0xFF
			buf[count[d]] = v
			count[d]++
		}
		a, buf = buf, a // the output of this pass is the input of the next
	}
	// Four passes: the data is back in the caller's slice.
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
	class := []Student{{"Ana", 9}, {"Bo", 7}, {"Cy", 9}, {"Di", 4}, {"Ed", 7}, {"Flo", 10}}
	fmt.Println("by grade (stable):", countingSort(class, 11))

	// Trace radix sort on a few numbers, one byte per pass (in hex).
	small := []uint32{0x0302, 0x0101, 0x0203, 0x0102, 0x0301}
	fmt.Printf("\nradix input:  %04x\n", small)
	radixSort(small)
	fmt.Printf("radix sorted: %04x\n", small)

	rng := rand.New(rand.NewSource(5))
	fails := 0
	for trial := 0; trial < 500; trial++ {
		n := rng.Intn(200)
		a := make([]uint32, n)
		st := make([]Student, n)
		for i := range a {
			a[i] = rng.Uint32() >> uint(rng.Intn(32)) // mix of small and large
			st[i] = Student{fmt.Sprint(i), rng.Intn(11)}
		}
		want := slices.Clone(a)
		slices.Sort(want)
		radixSort(a)
		if !slices.Equal(a, want) {
			fails++
		}
		// SortStableFunc is the oracle for a stable sort by grade.
		wantSt := slices.Clone(st)
		slices.SortStableFunc(wantSt, func(x, y Student) int { return x.grade - y.grade })
		if !slices.Equal(countingSort(st, 11), wantSt) {
			fails++
		}
	}
	fmt.Println("\nrandom checks (radix, stable counting), failures:", fails)

	fmt.Printf("\n%10s %12s %12s\n", "n", "radix", "slices.Sort")
	for _, n := range []int{100_000, 1_000_000} {
		src := make([]uint32, n)
		for i := range src {
			src[i] = rng.Uint32()
		}
		work := make([]uint32, n)
		rt := timeIt(func() { copy(work, src); radixSort(work) })
		st := timeIt(func() { copy(work, src); slices.Sort(work) })
		fmt.Printf("%10d %12v %12v\n", n, rt.Round(time.Microsecond), st.Round(time.Microsecond))
	}
	fmt.Println("\nRadix wins on large arrays of fixed-width integers; it needs an")
	fmt.Println("O(n) buffer and does not apply to arbitrary comparison orders.")
}
