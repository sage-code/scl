// 09_builtin_structures.go — The data structures Go gives you for free.
//
// Before building structures yourself, know what the language and standard
// library already provide, and what each operation costs:
//
//	array [N]T        fixed size, value type (copied on assignment)
//	slice []T         dynamic array: pointer + len + cap over a backing array
//	map   map[K]V     hash table, O(1) average lookup, NO iteration order
//	struct            groups fields; the building block of every node type
//	container/list    doubly linked list
//	container/heap    heap operations over any type you define
//	container/ring    circular list
//
// Run: go run 09_builtin_structures.go
package main

import (
	"container/heap"
	"container/list"
	"container/ring"
	"fmt"
	"sort"
)

// ---------- arrays vs slices ----------

func arraysAndSlices() {
	fmt.Println("== arrays are values ==")
	a := [3]int{1, 2, 3}
	b := a // copies all 3 elements
	b[0] = 99
	fmt.Println("a:", a, "b:", b) // a is unchanged

	fmt.Println("\n== slices share a backing array ==")
	s := []int{1, 2, 3, 4, 5}
	t := s[1:3] // view of elements 1..2, NOT a copy
	t[0] = 99
	fmt.Println("s:", s, "t:", t, "len(t):", len(t), "cap(t):", cap(t))
	// cap(t) is 4: from index 1 to the end of s's backing array.

	fmt.Println("\n== append grows capacity geometrically ==")
	// When len == cap, append allocates a larger array and copies. Because
	// capacity grows by a factor (about 2x for small slices, less for large
	// ones), the copying cost averages out to O(1) per append: "amortized O(1)".
	var g []int
	lastCap := -1
	for i := 0; i < 2000; i++ {
		g = append(g, i)
		if cap(g) != lastCap {
			fmt.Printf("len=%-5d cap=%d\n", len(g), cap(g))
			lastCap = cap(g)
		}
	}
	// Exact capacities depend on the Go version and element size; the
	// geometric pattern is what matters.

	fmt.Println("\n== copy to break sharing ==")
	orig := []int{1, 2, 3}
	clone := make([]int, len(orig))
	copy(clone, orig) // independent backing array
	clone[0] = -1
	fmt.Println("orig:", orig, "clone:", clone)
}

// ---------- maps ----------

func maps() {
	fmt.Println("\n== map: counting word frequency ==")
	words := []string{"go", "is", "fun", "go", "go", "is"}
	freq := make(map[string]int)
	for _, w := range words {
		freq[w]++ // a missing key reads as the zero value 0
	}

	// Map iteration order is deliberately randomised by Go. When output must
	// be deterministic, sort the keys first.
	keys := make([]string, 0, len(freq))
	for k := range freq {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		fmt.Printf("%-4s %d\n", k, freq[k])
	}

	// The "comma ok" idiom distinguishes "missing" from "present with zero".
	if _, ok := freq["rust"]; !ok {
		fmt.Println(`"rust" not present`)
	}
}

// ---------- container/list ----------

func linkedList() {
	fmt.Println("\n== container/list: O(1) insert/remove at a known element ==")
	l := list.New()
	l.PushBack("b")
	front := l.PushFront("a")
	l.PushBack("d")
	l.InsertAfter("a2", front) // insertion next to an element we hold: O(1)
	for e := l.Front(); e != nil; e = e.Next() {
		fmt.Print(e.Value, " ")
	}
	fmt.Println()
}

// ---------- container/heap ----------

// IntHeap implements heap.Interface (sort.Interface + Push + Pop).
// container/heap supplies the algorithms; we supply the storage.
type IntHeap []int

func (h IntHeap) Len() int           { return len(h) }
func (h IntHeap) Less(i, j int) bool { return h[i] < h[j] } // < means min-heap
func (h IntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *IntHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *IntHeap) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

func priorityQueue() {
	fmt.Println("\n== container/heap: always pop the smallest, O(log n) each ==")
	h := &IntHeap{5, 2, 8}
	heap.Init(h) // O(n) heapify
	heap.Push(h, 1)
	for h.Len() > 0 {
		fmt.Print(heap.Pop(h), " ")
	}
	fmt.Println()
}

// ---------- container/ring ----------

func circular() {
	fmt.Println("\n== container/ring: round-robin over a fixed set ==")
	r := ring.New(3)
	for _, name := range []string{"worker-1", "worker-2", "worker-3"} {
		r.Value = name
		r = r.Next()
	}
	for job := 1; job <= 5; job++ {
		fmt.Printf("job %d -> %v\n", job, r.Value)
		r = r.Next() // wraps around automatically
	}
}

func main() {
	arraysAndSlices()
	maps()
	linkedList()
	priorityQueue()
	circular()
}
