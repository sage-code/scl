// 05_recursion_trace.go — Watching the call stack grow and shrink.
//
// A recursive function solves a problem by calling itself on a SMALLER
// version of the same problem. Every call gets its own stack frame holding
// its parameters and local variables. This demo prints each call and return,
// indented by depth, so you can see the frames being pushed and popped.
//
// Run: go run 05_recursion_trace.go
package main

import (
	"fmt"
	"strings"
)

// indent turns a depth into visible spacing: depth 2 -> "    ".
func indent(depth int) string {
	return strings.Repeat("  ", depth)
}

// factorial computes n! = n * (n-1) * ... * 1, tracing every frame.
//
// The two questions of every recursive design:
//  1. Base case   — which input is small enough to answer directly?  n <= 1
//  2. Reduction   — how does a smaller answer build this answer?     n * (n-1)!
//
// A missing or unreachable base case means infinite recursion; in Go that
// ends with "goroutine stack exceeds limit" (a fatal stack overflow).
func factorial(n, depth int) int {
	fmt.Printf("%scall factorial(%d)\n", indent(depth), n)
	if n <= 1 {
		fmt.Printf("%sbase case -> 1\n", indent(depth))
		return 1
	}
	sub := factorial(n-1, depth+1) // this frame WAITS here until the call returns
	result := n * sub
	fmt.Printf("%sreturn %d * %d = %d\n", indent(depth), n, sub, result)
	return result
}

// sumSlice adds the elements of a slice recursively.
// Reduction: sum(s) = s[0] + sum(s[1:]). The slice s[1:] shares memory with
// s (no copy), so each call costs O(1) plus the recursive call: O(n) total.
func sumSlice(s []int, depth int) int {
	fmt.Printf("%ssumSlice(%v)\n", indent(depth), s)
	if len(s) == 0 {
		return 0 // base case: the empty sum is 0
	}
	return s[0] + sumSlice(s[1:], depth+1)
}

// countdownCalls counts how deep recursion goes for input n.
// Depth equals n here, so memory use is O(n): one frame per level.
// Go grows goroutine stacks dynamically, so depth 100,000 is fine, but
// depth in the hundreds of millions would exhaust the 1 GB default limit.
func countdownCalls(n int) int {
	if n == 0 {
		return 0
	}
	return 1 + countdownCalls(n-1)
}

func main() {
	fmt.Println("== factorial(4): frames push on the way down, pop on the way up ==")
	fmt.Println("result:", factorial(4, 0))

	fmt.Println("\n== sumSlice: the problem shrinks by one element per call ==")
	fmt.Println("result:", sumSlice([]int{5, 3, 8}, 0))

	fmt.Println("\n== recursion depth costs memory ==")
	fmt.Println("frames used for n=100000:", countdownCalls(100_000))
}
