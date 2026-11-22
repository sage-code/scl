// 11_slice_operations.go — The dynamic array under every Go program.
//
// A slice is Go's dynamic array. This demo implements the basic operations
// by hand — insert, delete, filter — and shows what each one costs, then
// compares them with the generic helpers in the standard `slices` package.
//
//	operation              cost     why
//	read/write s[i]        O(1)     address = base + i*size
//	append at the end      O(1)*    amortized: capacity grows geometrically
//	insert at index i      O(n)     elements after i shift right
//	delete at index i      O(n)     elements after i shift left
//	delete, order ignored  O(1)     move the last element into the hole
//
// Run: go run 11_slice_operations.go
package main

import (
	"fmt"
	"slices"
)

// insertAt returns s with v inserted at index i (0 <= i <= len(s)).
// Every element from i onward moves one place right: O(n - i).
func insertAt(s []int, i, v int) []int {
	s = append(s, 0)     // grow by one (may reallocate)
	copy(s[i+1:], s[i:]) // shift the tail right; copy handles overlap correctly
	s[i] = v
	return s
}

// deleteAt removes the element at index i, keeping order: O(n - i).
func deleteAt(s []int, i int) []int {
	copy(s[i:], s[i+1:]) // shift the tail left over the removed element
	return s[:len(s)-1]  // the last slot is now a duplicate; drop it
}

// deleteUnordered removes index i in O(1) by moving the last element into
// its place. Use it when the order of elements does not matter (a set of
// active connections, a bag of tasks).
func deleteUnordered(s []int, i int) []int {
	last := len(s) - 1
	s[i] = s[last]
	return s[:last]
}

// filterInPlace keeps elements satisfying keep, reusing s's memory.
// Pattern: a write index w trails the read index; kept elements are copied
// down to w. One pass, O(n) time, O(1) extra space.
func filterInPlace(s []int, keep func(int) bool) []int {
	w := 0
	for _, v := range s { // read every element once
		if keep(v) {
			s[w] = v // w <= current read position, so nothing unread is overwritten
			w++
		}
	}
	return s[:w]
}

// reverse swaps elements from both ends toward the middle: O(n), O(1) space.
func reverse(s []int) {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		s[i], s[j] = s[j], s[i]
	}
}

// rotateLeft moves the first k elements to the end using three reversals:
// reverse the first k, reverse the rest, then reverse everything.
// Example k=3: [1 2 3|4 5 6 7] -> [3 2 1|7 6 5 4] -> [4 5 6 7 1 2 3].
// O(n) time, O(1) extra space, no temporary slice.
func rotateLeft(s []int, k int) {
	if len(s) == 0 {
		return
	}
	k %= len(s) // rotating by len(s) is a no-op; this also handles k > len
	reverse(s[:k])
	reverse(s[k:])
	reverse(s)
}

func main() {
	s := []int{10, 20, 30, 40, 50}
	fmt.Println("start          ", s)

	s = insertAt(s, 2, 25)
	fmt.Println("insertAt(2,25) ", s)

	s = deleteAt(s, 0)
	fmt.Println("deleteAt(0)    ", s)

	s = deleteUnordered(s, 1)
	fmt.Println("deleteUnord(1) ", s, "(order changed)")

	nums := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	evens := filterInPlace(nums, func(v int) bool { return v%2 == 0 })
	fmt.Println("filter evens   ", evens)
	// evens shares memory with nums: nums[0:5] was overwritten.
	fmt.Println("nums afterwards", nums, "<- same backing array")

	r := []int{1, 2, 3, 4, 5, 6, 7}
	rotateLeft(r, 3)
	fmt.Println("rotateLeft(3)  ", r)

	// The standard library versions (Go 1.21+) do the same work, with the
	// same costs. Prefer them in production code; knowing the cost is what
	// matters when you call them inside a loop.
	t := []int{10, 20, 30, 40, 50}
	t = slices.Insert(t, 2, 25)                                  // O(n)
	t = slices.Delete(t, 0, 1)                                   // O(n), removes t[0:1]
	i := slices.Index(t, 40)                                     // O(n) linear scan
	t = slices.DeleteFunc(t, func(v int) bool { return v > 40 }) // O(n) filter
	fmt.Println("slices package ", t, "index of 40 was", i)

	// Pre-allocating capacity avoids repeated reallocation when the final
	// size is known.
	squares := make([]int, 0, 5)
	for k := 1; k <= 5; k++ {
		squares = append(squares, k*k)
	}
	fmt.Println("pre-allocated  ", squares, "cap", cap(squares))
}
