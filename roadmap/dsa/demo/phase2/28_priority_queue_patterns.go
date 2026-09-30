// 28_priority_queue_patterns.go — container/heap in real problems.
//
// Go's container/heap package implements the heap algorithms over any type
// that satisfies heap.Interface (Len, Less, Swap, Push, Pop). You provide the
// storage and ordering; heap.Push / heap.Pop / heap.Fix maintain the heap.
//
// Four patterns cover most priority-queue problems:
//
//	scheduler      pop the most urgent task; change a task's priority (heap.Fix)
//	top-k          keep a MIN-heap of size k: its root is the k-th largest
//	k-way merge    heap holds the current head of each sorted input
//	running median two heaps split the data into a lower and an upper half
//
// Run: go run 28_priority_queue_patterns.go
package main

import (
	"container/heap"
	"fmt"
	"slices"
	"strings"
)

// ---------------------------------------------------------------- scheduler

type Task struct {
	Name     string
	Priority int // larger = more urgent
	index    int // position in the heap slice, maintained by Swap
}

// TaskQueue is a max-heap of *Task. Storing the index inside each task lets
// us find it in O(1) and call heap.Fix after changing its priority.
type TaskQueue []*Task

func (q TaskQueue) Len() int { return len(q) }
func (q TaskQueue) Less(i, j int) bool {
	if q[i].Priority != q[j].Priority {
		return q[i].Priority > q[j].Priority // > makes it a MAX-heap
	}
	return q[i].Name < q[j].Name // deterministic tie-break
}
func (q TaskQueue) Swap(i, j int) {
	q[i], q[j] = q[j], q[i]
	q[i].index, q[j].index = i, j // keep the back-references correct
}

// Push and Pop are called BY container/heap; users call heap.Push/heap.Pop.
// Pop removes the LAST element — heap.Pop has already swapped the root there.
func (q *TaskQueue) Push(x any) {
	t := x.(*Task)
	t.index = len(*q)
	*q = append(*q, t)
}
func (q *TaskQueue) Pop() any {
	old := *q
	n := len(old)
	t := old[n-1]
	old[n-1] = nil // avoid holding a reference in the unused slot
	t.index = -1   // marks "no longer in the queue"
	*q = old[:n-1]
	return t
}

// ---------------------------------------------------------------- int heaps

// IntHeap is a min-heap; MaxIntHeap embeds it and flips Less.
type IntHeap []int

func (h IntHeap) Len() int           { return len(h) }
func (h IntHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h IntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *IntHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *IntHeap) Pop() any {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

type MaxIntHeap struct{ IntHeap }

func (h MaxIntHeap) Less(i, j int) bool { return h.IntHeap[i] > h.IntHeap[j] }

// topK returns the k largest values in O(n log k) time and O(k) memory —
// useful for streams too large to sort. The min-heap holds the best k seen
// so far; anything smaller than its root cannot be in the top k.
func topK(nums []int, k int) []int {
	h := &IntHeap{}
	for _, v := range nums {
		if h.Len() < k {
			heap.Push(h, v)
		} else if v > (*h)[0] {
			(*h)[0] = v    // replace the smallest of the current top k...
			heap.Fix(h, 0) // ...and restore the heap: O(log k)
		}
	}
	out := slices.Clone(*h)
	slices.Sort(out)
	slices.Reverse(out)
	return out
}

// ---------------------------------------------------------------- k-way merge

// cursor points at the next unread element of one sorted input.
type cursor struct{ list, pos, val int }
type cursorHeap []cursor

func (h cursorHeap) Len() int           { return len(h) }
func (h cursorHeap) Less(i, j int) bool { return h[i].val < h[j].val }
func (h cursorHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *cursorHeap) Push(x any)        { *h = append(*h, x.(cursor)) }
func (h *cursorHeap) Pop() any {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

// mergeK merges k sorted slices with N total elements in O(N log k):
// the heap never holds more than one element per input.
func mergeK(lists [][]int) []int {
	h := &cursorHeap{}
	for i, l := range lists {
		if len(l) > 0 {
			heap.Push(h, cursor{i, 0, l[0]})
		}
	}
	var out []int
	for h.Len() > 0 {
		c := heap.Pop(h).(cursor)
		out = append(out, c.val)
		if next := c.pos + 1; next < len(lists[c.list]) {
			heap.Push(h, cursor{c.list, next, lists[c.list][next]})
		}
	}
	return out
}

// ---------------------------------------------------------------- running median

// MedianFinder keeps the lower half in a max-heap and the upper half in a
// min-heap, sizes differing by at most one. The median is at the heap tops:
// Add is O(log n), Median is O(1).
type MedianFinder struct {
	low  MaxIntHeap // lower half; its top is the largest of the small values
	high IntHeap    // upper half; its top is the smallest of the large values
}

func (m *MedianFinder) Add(v int) {
	if m.low.Len() == 0 || v <= m.low.IntHeap[0] {
		heap.Push(&m.low, v)
	} else {
		heap.Push(&m.high, v)
	}
	// rebalance so that len(low) == len(high) or len(low) == len(high)+1
	if m.low.Len() > m.high.Len()+1 {
		heap.Push(&m.high, heap.Pop(&m.low))
	} else if m.high.Len() > m.low.Len() {
		heap.Push(&m.low, heap.Pop(&m.high))
	}
}

func (m *MedianFinder) Median() float64 {
	if m.low.Len() > m.high.Len() {
		return float64(m.low.IntHeap[0])
	}
	return float64(m.low.IntHeap[0]+m.high[0]) / 2
}

func main() {
	fmt.Println("== scheduler ==")
	q := &TaskQueue{}
	tasks := map[string]*Task{}
	for _, t := range []struct {
		name string
		p    int
	}{{"write report", 2}, {"fix outage", 9}, {"reply email", 1}, {"review PR", 5}} {
		task := &Task{Name: t.name, Priority: t.p}
		tasks[t.name] = task
		heap.Push(q, task)
	}
	tasks["reply email"].Priority = 7 // the email turned urgent
	heap.Fix(q, tasks["reply email"].index)
	var order []string
	for q.Len() > 0 {
		t := heap.Pop(q).(*Task)
		order = append(order, fmt.Sprintf("%s(%d)", t.Name, t.Priority))
	}
	fmt.Println(strings.Join(order, " > "))

	fmt.Println("\n== top-k ==")
	fmt.Println("top 3 of stream:", topK([]int{15, 3, 99, 42, 7, 64, 23, 88, 1}, 3))

	fmt.Println("\n== k-way merge ==")
	fmt.Println(mergeK([][]int{{1, 4, 9}, {2, 3, 10, 11}, {}, {0, 5}}))

	fmt.Println("\n== running median ==")
	var m MedianFinder
	for _, v := range []int{5, 15, 1, 3, 8, 7, 9, 10} {
		m.Add(v)
		fmt.Printf("add %-2d median %.1f\n", v, m.Median())
	}
}
