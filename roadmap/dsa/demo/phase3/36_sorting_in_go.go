// 36_sorting_in_go.go — Sorting real data with the standard library.
//
// In production you rarely write a sort; you write the ORDERING. Go gives:
//
//	slices.Sort(s)                 ordered types (ints, floats, strings)
//	slices.SortFunc(s, cmp)        any type, cmp returns <0, 0, >0
//	slices.SortStableFunc(s, cmp)  same, equal elements keep their order
//	slices.IsSorted / BinarySearchFunc
//
// slices.Sort uses pdqsort (pattern-defeating quicksort): quicksort with
// insertion sort for small ranges, heapsort as a fallback that guarantees
// O(n log n), and detection of already-sorted runs. It is not stable.
//
// A comparison function must define a consistent total order, or the
// result is unspecified. The most common bug is a comparator that is not
// transitive — for example, one that returns a - b and overflows.
//
// Run: go run 36_sorting_in_go.go
package main

import (
	"cmp"
	"fmt"
	"math"
	"slices"
	"strings"
)

type Employee struct {
	Name   string
	Dept   string
	Salary int
	Age    int
}

func main() {
	staff := []Employee{
		{"Maya", "eng", 120, 34}, {"Liam", "ops", 90, 45}, {"Ava", "eng", 120, 29},
		{"Noah", "ops", 85, 38}, {"Zoe", "eng", 150, 41}, {"Eli", "hr", 70, 25},
	}

	// Multi-key ordering: department ascending, then salary descending,
	// then name. cmp.Or returns the first non-zero comparison.
	byDeptSalary := func(a, b Employee) int {
		return cmp.Or(
			cmp.Compare(a.Dept, b.Dept),
			cmp.Compare(b.Salary, a.Salary), // b before a: descending
			cmp.Compare(a.Name, b.Name),
		)
	}
	slices.SortFunc(staff, byDeptSalary)
	fmt.Println("dept asc, salary desc, name asc:")
	for _, e := range staff {
		fmt.Printf("  %-4s %-5s %d\n", e.Dept, e.Name, e.Salary)
	}

	// Stable sorting lets you sort by the secondary key FIRST and the
	// primary key second: equal primaries keep the secondary order.
	stable := slices.Clone(staff)
	slices.SortFunc(stable, func(a, b Employee) int { return cmp.Compare(a.Age, b.Age) })
	slices.SortStableFunc(stable, func(a, b Employee) int { return cmp.Compare(a.Dept, b.Dept) })
	fmt.Println("\nstable: by dept, ties still ordered by age:")
	for _, e := range stable {
		fmt.Printf("  %-4s %-5s age %d\n", e.Dept, e.Name, e.Age)
	}

	// Searching a slice sorted with a custom order uses the SAME comparator.
	byName := slices.Clone(staff)
	slices.SortFunc(byName, func(a, b Employee) int { return strings.Compare(a.Name, b.Name) })
	i, found := slices.BinarySearchFunc(byName, "Noah", func(e Employee, name string) int {
		return strings.Compare(e.Name, name)
	})
	fmt.Println("\nbinary search by name 'Noah':", i, found, byName[i].Dept)

	// Case-insensitive ordering: compare transformed keys, not raw strings.
	words := []string{"banana", "Apple", "cherry", "apple", "Banana"}
	slices.SortStableFunc(words, func(a, b string) int {
		return strings.Compare(strings.ToLower(a), strings.ToLower(b))
	})
	fmt.Println("case-insensitive, stable:", words)

	// Pitfall: "return a - b" overflows for large values and breaks the
	// ordering. cmp.Compare never overflows.
	nums := []int{math.MaxInt, -2, math.MinInt + 1, 0, 5}
	bad := slices.Clone(nums)
	slices.SortFunc(bad, func(a, b int) int { return a - b })
	good := slices.Clone(nums)
	slices.SortFunc(good, cmp.Compare[int])
	fmt.Println("\na - b comparator, sorted?  ", slices.IsSorted(bad), bad)
	fmt.Println("cmp.Compare comparator, sorted?", slices.IsSorted(good), good)

	// Sorting indices instead of data: when records are large or must stay
	// in place, sort a permutation and read the data through it.
	scores := []float64{72.5, 91, 64, 88, 91}
	order := []int{0, 1, 2, 3, 4}
	slices.SortStableFunc(order, func(a, b int) int { return cmp.Compare(scores[b], scores[a]) })
	fmt.Print("\nranking by score (indices): ", order, " -> ")
	for rank, idx := range order {
		fmt.Printf("#%d=%.1f ", rank+1, scores[idx])
	}
	fmt.Println("\nscores unchanged:", scores)
}
