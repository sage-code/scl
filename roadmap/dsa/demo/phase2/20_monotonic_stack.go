// 20_monotonic_stack.go — Stacks and deques that stay sorted.
//
// A monotonic stack keeps its elements in increasing (or decreasing) order.
// Before pushing a new element, it pops every element that would break the
// order — and each pop is the moment an answer becomes known.
//
// Why it is O(n): every index is pushed once and popped at most once, so the
// total work over the whole input is at most 2n, even though a single step
// can pop many elements. (That is an amortized argument, like append.)
//
// Problems solved here, each O(n) instead of O(n^2):
//   - next greater element
//   - days until a warmer temperature
//   - largest rectangle in a histogram
//   - maximum of every sliding window (monotonic DEQUE)
//
// Run: go run 20_monotonic_stack.go
package main

import (
	"fmt"
	"slices"
)

// nextGreater returns, for each i, the first value to the right of nums[i]
// that is larger, or -1. The stack holds INDICES of elements still waiting
// for their answer; their values decrease from bottom to top.
func nextGreater(nums []int) []int {
	res := make([]int, len(nums))
	for i := range res {
		res[i] = -1 // default: no greater element exists
	}
	var stack []int
	for i, v := range nums {
		// v is the answer for every waiting element smaller than v
		for len(stack) > 0 && nums[stack[len(stack)-1]] < v {
			top := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			res[top] = v
		}
		stack = append(stack, i)
	}
	return res
}

// nextGreaterBrute: the O(n^2) oracle.
func nextGreaterBrute(nums []int) []int {
	res := make([]int, len(nums))
	for i := range nums {
		res[i] = -1
		for j := i + 1; j < len(nums); j++ {
			if nums[j] > nums[i] {
				res[i] = nums[j]
				break
			}
		}
	}
	return res
}

// daysUntilWarmer is the same pattern, but the answer is a DISTANCE.
func daysUntilWarmer(temps []int) []int {
	res := make([]int, len(temps)) // zero means "never warmer"
	var stack []int
	for i, t := range temps {
		for len(stack) > 0 && temps[stack[len(stack)-1]] < t {
			top := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			res[top] = i - top
		}
		stack = append(stack, i)
	}
	return res
}

// largestRectangle finds the largest rectangle that fits under a histogram.
// For each bar, the widest rectangle of that bar's height extends left and
// right until a SHORTER bar. An increasing stack finds both limits: when a
// bar is popped, the bar that pops it is its right limit, and the bar below
// it in the stack is its left limit.
func largestRectangle(h []int) int {
	best := 0
	var stack []int // indices with increasing heights
	for i := 0; i <= len(h); i++ {
		cur := 0 // a virtual bar of height 0 at the end flushes the stack
		if i < len(h) {
			cur = h[i]
		}
		for len(stack) > 0 && h[stack[len(stack)-1]] >= cur {
			height := h[stack[len(stack)-1]]
			stack = stack[:len(stack)-1]
			left := -1 // no shorter bar on the left: extend to the start
			if len(stack) > 0 {
				left = stack[len(stack)-1]
			}
			best = max(best, height*(i-left-1))
		}
		stack = append(stack, i)
	}
	return best
}

// largestRectangleBrute tries every range [i, j]: O(n^2).
func largestRectangleBrute(h []int) int {
	best := 0
	for i := range h {
		lowest := h[i]
		for j := i; j < len(h); j++ {
			lowest = min(lowest, h[j])
			best = max(best, lowest*(j-i+1))
		}
	}
	return best
}

// windowMax returns the maximum of every window of size k in O(n).
// The deque holds indices whose values DECREASE from front to back:
//   - the front is always the current window's maximum;
//   - an index leaves the front when it slides out of the window;
//   - a new value evicts smaller values from the back — they can never be a
//     maximum again, because the new value is larger AND stays longer.
func windowMax(nums []int, k int) []int {
	var out []int
	var dq []int // used as a deque: front = dq[0], back = dq[len-1]
	for i, v := range nums {
		if len(dq) > 0 && dq[0] <= i-k { // front index left the window
			dq = dq[1:]
		}
		for len(dq) > 0 && nums[dq[len(dq)-1]] <= v {
			dq = dq[:len(dq)-1]
		}
		dq = append(dq, i)
		if i >= k-1 { // the first full window ends at index k-1
			out = append(out, nums[dq[0]])
		}
	}
	return out
}

func main() {
	nums := []int{4, 5, 2, 25, 7, 8, 1}
	fmt.Println("nextGreater:", nextGreater(nums), "oracle agrees:", slices.Equal(nextGreater(nums), nextGreaterBrute(nums)))

	temps := []int{73, 74, 75, 71, 69, 72, 76, 73}
	fmt.Println("daysUntilWarmer:", daysUntilWarmer(temps))

	hist := []int{2, 1, 5, 6, 2, 3}
	fmt.Printf("largestRectangle: %d (brute %d)\n", largestRectangle(hist), largestRectangleBrute(hist))

	fmt.Println("windowMax k=3:", windowMax([]int{1, 3, -1, -3, 5, 3, 6, 7}, 3))

	// Randomized cross-check of every O(n) version against its oracle.
	seed := uint32(99)
	next := func() int {
		seed = seed*1664525 + 1013904223
		return int(seed>>24) % 10
	}
	bad := 0
	for trial := 0; trial < 3000; trial++ {
		a := make([]int, 1+trial%20)
		for i := range a {
			a[i] = next()
		}
		if !slices.Equal(nextGreater(a), nextGreaterBrute(a)) ||
			largestRectangle(a) != largestRectangleBrute(a) {
			bad++
		}
		k := 1 + trial%len(a)
		naive := []int{}
		for s := 0; s+k <= len(a); s++ {
			naive = append(naive, slices.Max(a[s:s+k]))
		}
		if !slices.Equal(windowMax(a, k), naive) {
			bad++
		}
	}
	fmt.Println("random cross-checks, failures:", bad)
}
