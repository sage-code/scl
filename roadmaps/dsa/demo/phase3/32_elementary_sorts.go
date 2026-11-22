// 32_elementary_sorts.go — Bubble, selection and insertion sort.
//
// These O(n^2) sorts are too slow for large inputs, but they teach the
// vocabulary used for every sorting algorithm:
//
//	comparisons  how many times two elements are compared
//	moves        how many times elements are written
//	in place     O(1) extra memory
//	stable       equal keys keep their original relative order
//	adaptive     faster when the input is already nearly sorted
//
// Insertion sort is the one that survives in practice: it is stable,
// adaptive (O(n) on sorted input) and very fast on small slices, so
// production sorts (including Go's pdqsort) switch to it below ~12 elements.
//
// Run: go run 32_elementary_sorts.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
)

// Counter records the work an algorithm does.
type Counter struct{ cmp, moves int }

// bubbleSort repeatedly swaps adjacent out-of-order pairs. After pass k the
// k largest elements are in their final places at the end. If a pass makes
// no swap the slice is sorted and we stop early (adaptive).
func bubbleSort(a []int, c *Counter) {
	for end := len(a) - 1; end > 0; end-- {
		swapped := false
		for i := 0; i < end; i++ {
			c.cmp++
			if a[i] > a[i+1] { // strict >: equal neighbours never swap (stable)
				a[i], a[i+1] = a[i+1], a[i]
				c.moves += 2
				swapped = true
			}
		}
		if !swapped {
			return
		}
	}
}

// selectionSort finds the minimum of the unsorted part and swaps it to the
// front. Always n(n-1)/2 comparisons, but at most n-1 swaps — useful only
// when writes are very expensive. The long-distance swap makes it UNSTABLE.
func selectionSort(a []int, c *Counter) {
	for i := 0; i < len(a)-1; i++ {
		minIdx := i
		for j := i + 1; j < len(a); j++ {
			c.cmp++
			if a[j] < a[minIdx] {
				minIdx = j
			}
		}
		if minIdx != i {
			a[i], a[minIdx] = a[minIdx], a[i]
			c.moves += 2
		}
	}
}

// insertionSort grows a sorted prefix a[:i]. Each new element is shifted
// left past larger elements, like sorting a hand of cards.
// Invariant: a[:i] is sorted at the start of every outer iteration.
func insertionSort(a []int, c *Counter) {
	for i := 1; i < len(a); i++ {
		x := a[i] // the card being inserted
		j := i - 1
		for j >= 0 {
			c.cmp++
			if a[j] <= x { // <= stops at equal keys: stable
				break
			}
			a[j+1] = a[j] // shift the larger element one step right
			c.moves++
			j--
		}
		a[j+1] = x
		c.moves++
	}
}

// Card has a rank to sort by and a label that reveals the original order.
type Card struct {
	rank  int
	label string
}

// Generic versions for the stability test, sorting only by rank.
func insertionSortCards(a []Card) {
	for i := 1; i < len(a); i++ {
		x, j := a[i], i-1
		for j >= 0 && a[j].rank > x.rank {
			a[j+1] = a[j]
			j--
		}
		a[j+1] = x
	}
}

func selectionSortCards(a []Card) {
	for i := 0; i < len(a)-1; i++ {
		m := i
		for j := i + 1; j < len(a); j++ {
			if a[j].rank < a[m].rank {
				m = j
			}
		}
		a[i], a[m] = a[m], a[i]
	}
}

func main() {
	sorts := []struct {
		name string
		fn   func([]int, *Counter)
	}{{"bubble", bubbleSort}, {"selection", selectionSort}, {"insertion", insertionSort}}

	// Correctness against slices.Sort on random inputs.
	rng := rand.New(rand.NewSource(1))
	fails := 0
	for trial := 0; trial < 500; trial++ {
		a := make([]int, rng.Intn(40))
		for i := range a {
			a[i] = rng.Intn(20)
		}
		want := slices.Clone(a)
		slices.Sort(want)
		for _, s := range sorts {
			b := slices.Clone(a)
			s.fn(b, &Counter{})
			if !slices.Equal(b, want) {
				fails++
			}
		}
	}
	fmt.Println("random checks, failures:", fails)

	// Work on three input shapes. Watch the adaptive sorts on sorted input.
	const n = 2000
	inputs := map[string][]int{"random": rng.Perm(n), "sorted": make([]int, n), "reversed": make([]int, n)}
	for i := 0; i < n; i++ {
		inputs["sorted"][i] = i
		inputs["reversed"][i] = n - i
	}
	fmt.Printf("\nn=%d   %-10s %12s %12s\n", n, "input", "comparisons", "moves")
	for _, s := range sorts {
		for _, shape := range []string{"random", "sorted", "reversed"} {
			var c Counter
			s.fn(slices.Clone(inputs[shape]), &c)
			fmt.Printf("%-9s %-10s %12d %12d\n", s.name, shape, c.cmp, c.moves)
		}
	}

	// Stability: two 5s and two 3s, labelled in input order.
	cards := []Card{{5, "5a"}, {3, "3a"}, {5, "5b"}, {3, "3b"}, {1, "1a"}}
	ins, sel := slices.Clone(cards), slices.Clone(cards)
	insertionSortCards(ins)
	selectionSortCards(sel)
	fmt.Println("\ninput:          ", cards)
	fmt.Println("insertion sort: ", ins, "stable:", keptOrder(ins))
	fmt.Println("selection sort: ", sel, "stable:", keptOrder(sel))
}

// keptOrder reports whether cards of equal rank kept their input order:
// labels were given as "a", "b", ... in input order, so they must ascend.
func keptOrder(sorted []Card) bool {
	for i := 1; i < len(sorted); i++ {
		if sorted[i].rank == sorted[i-1].rank && sorted[i].label < sorted[i-1].label {
			return false
		}
	}
	return true
}
