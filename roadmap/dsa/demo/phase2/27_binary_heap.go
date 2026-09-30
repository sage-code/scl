// 27_binary_heap.go — A binary heap from scratch, stored in a slice.
//
// A min-heap is a complete binary tree where every parent is <= its children,
// so the minimum is always at the root. "Complete" means every level is full
// except possibly the last, filled left to right — which lets us store the
// tree in a slice with NO pointers:
//
//	index i:  parent (i-1)/2   left child 2i+1   right child 2i+2
//
//	        1            slice: [1 3 2 7 4 5]
//	      /   \                  0 1 2 3 4 5
//	     3     2
//	    / \   /
//	   7   4 5
//
//	Push     append at the end, then SIFT UP (swap with parent while smaller)  O(log n)
//	Pop      take the root, move the last element to the root, SIFT DOWN      O(log n)
//	Peek     read index 0                                                     O(1)
//	Heapify  sift down every internal node, bottom-up                         O(n)
//
// Run: go run 27_binary_heap.go
package main

import (
	"cmp"
	"fmt"
	"math/rand"
	"slices"
)

// Heap is a generic binary heap ordered by less.
// less(a, b) == a < b gives a min-heap; a > b gives a max-heap.
type Heap[T any] struct {
	data []T
	less func(a, b T) bool
}

func NewHeap[T any](less func(a, b T) bool) *Heap[T] {
	return &Heap[T]{less: less}
}

func (h *Heap[T]) Len() int { return len(h.data) }

func (h *Heap[T]) Peek() (T, bool) {
	var zero T
	if len(h.data) == 0 {
		return zero, false
	}
	return h.data[0], true
}

// siftUp moves the element at i toward the root until its parent is not larger.
func (h *Heap[T]) siftUp(i int) {
	for i > 0 {
		parent := (i - 1) / 2
		if !h.less(h.data[i], h.data[parent]) {
			return // heap property holds
		}
		h.data[i], h.data[parent] = h.data[parent], h.data[i]
		i = parent
	}
}

// siftDown moves the element at i toward the leaves, always swapping with the
// SMALLER child — swapping with the larger one would break the property.
func (h *Heap[T]) siftDown(i int) {
	n := len(h.data)
	for {
		smallest := i
		l, r := 2*i+1, 2*i+2
		if l < n && h.less(h.data[l], h.data[smallest]) {
			smallest = l
		}
		if r < n && h.less(h.data[r], h.data[smallest]) {
			smallest = r
		}
		if smallest == i {
			return
		}
		h.data[i], h.data[smallest] = h.data[smallest], h.data[i]
		i = smallest
	}
}

func (h *Heap[T]) Push(v T) {
	h.data = append(h.data, v)
	h.siftUp(len(h.data) - 1)
}

func (h *Heap[T]) Pop() (T, bool) {
	var zero T
	n := len(h.data)
	if n == 0 {
		return zero, false
	}
	top := h.data[0]
	h.data[0] = h.data[n-1] // the last leaf fills the hole at the root...
	h.data[n-1] = zero
	h.data = h.data[:n-1]
	if len(h.data) > 0 {
		h.siftDown(0) // ...and sinks to its correct level
	}
	return top, true
}

// Heapify builds a heap from existing data in O(n) — faster than n Pushes
// (O(n log n)). Leaves are already heaps; fixing nodes from the last parent
// back to the root works because most nodes are near the bottom and sink
// only a few levels.
func Heapify[T any](data []T, less func(a, b T) bool) *Heap[T] {
	h := &Heap[T]{data: data, less: less}
	for i := len(data)/2 - 1; i >= 0; i-- {
		h.siftDown(i)
	}
	return h
}

// valid checks the heap property for every parent/child pair.
func (h *Heap[T]) valid() bool {
	for i := 1; i < len(h.data); i++ {
		if h.less(h.data[i], h.data[(i-1)/2]) {
			return false
		}
	}
	return true
}

// heapSort sorts ascending in place with a MAX-heap: repeatedly swap the
// maximum (root) to the end of the unsorted region and shrink the heap.
// O(n log n) worst case, O(1) extra space, but not stable.
func heapSort[T cmp.Ordered](a []T) {
	greater := func(x, y T) bool { return x > y }
	h := Heapify(a, greater) // h.data shares a's memory
	for end := len(a) - 1; end > 0; end-- {
		a[0], a[end] = a[end], a[0] // current max goes to its final place
		h.data = a[:end]            // exclude the sorted tail from the heap
		h.siftDown(0)
	}
}

func main() {
	h := NewHeap(func(a, b int) bool { return a < b })
	for _, v := range []int{5, 3, 8, 1, 9, 2, 7} {
		h.Push(v)
	}
	fmt.Println("heap slice:", h.data, "valid:", h.valid())
	top, _ := h.Peek()
	fmt.Println("peek (min):", top)
	var out []int
	for h.Len() > 0 {
		v, _ := h.Pop()
		out = append(out, v)
	}
	fmt.Println("pop order: ", out)

	// Max-heap of strings by length: the comparison function decides everything.
	words := NewHeap(func(a, b string) bool { return len(a) > len(b) })
	for _, w := range []string{"go", "heap", "priority", "a", "queue"} {
		words.Push(w)
	}
	longest, _ := words.Pop()
	fmt.Println("longest word:", longest)

	data := []int{9, 4, 7, 1, 8, 2, 6, 3, 5}
	hp := Heapify(slices.Clone(data), func(a, b int) bool { return a < b })
	fmt.Println("\nheapify", data, "->", hp.data, "valid:", hp.valid())

	rng := rand.New(rand.NewSource(3))
	bad := 0
	for trial := 0; trial < 500; trial++ {
		a := rng.Perm(1 + trial%50)
		want := slices.Clone(a)
		slices.Sort(want)
		heapSort(a)
		if !slices.Equal(a, want) {
			bad++
		}
	}
	sample := []int{38, 27, 43, 3, 9, 82, 10}
	heapSort(sample)
	fmt.Println("heapSort:", sample, " random trials failed:", bad)
}
