// 03_growth_rates.go — Counting operations to SEE complexity classes.
//
// Big O describes how the amount of work grows with the input size n.
// Instead of timing (which depends on the machine), this demo counts the
// basic steps each classic loop shape performs and prints them side by side.
//
// Run: go run 03_growth_rates.go
package main

import "fmt"

// constant: O(1). The work does not depend on n at all.
// Example in real code: reading nums[i], a map lookup (average case).
func constant(n int) int {
	return 1
}

// logarithmic: O(log n). The problem size is HALVED each step, so the
// number of steps is how many times n can be divided by 2 before reaching 1.
// Example: binary search, walking down a balanced tree.
func logarithmic(n int) int {
	steps := 0
	for size := n; size > 1; size /= 2 {
		steps++
	}
	return steps
}

// linear: O(n). One unit of work per element.
// Example: find the maximum, sum a slice, linear search.
func linear(n int) int {
	steps := 0
	for i := 0; i < n; i++ {
		steps++
	}
	return steps
}

// linearithmic: O(n log n). A linear pass repeated log n times.
// Example: merge sort — log n levels of splitting, n work per level.
func linearithmic(n int) int {
	steps := 0
	for size := n; size > 1; size /= 2 { // log n levels...
		for i := 0; i < n; i++ { // ...each touching all n elements
			steps++
		}
	}
	return steps
}

// quadratic: O(n^2). A loop inside a loop over the same input.
// Example: compare every pair (brute-force Two Sum, bubble sort).
func quadratic(n int) int {
	steps := 0
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			steps++
		}
	}
	return steps
}

// exponential: O(2^n). Each call spawns two more calls on a smaller input.
// Example: naive recursive Fibonacci, trying every subset.
// We count calls recursively, so keep n small — that IS the lesson.
func exponential(n int) int {
	if n == 0 {
		return 1
	}
	return 1 + exponential(n-1) + exponential(n-1)
}

func main() {
	sizes := []int{1, 2, 4, 8, 16, 32, 64, 1024}

	fmt.Printf("%6s %6s %8s %8s %10s %10s %14s\n",
		"n", "O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)", "O(2^n)")
	for _, n := range sizes {
		exp := "too many" // 2^1024 calls would never finish
		if n <= 20 {
			exp = fmt.Sprint(exponential(n))
		}
		fmt.Printf("%6d %6d %8d %8d %10d %10d %14s\n",
			n, constant(n), logarithmic(n), linear(n),
			linearithmic(n), quadratic(n), exp)
	}

	// The doubling rule of thumb: what happens when the input doubles?
	fmt.Println("\nWhen n doubles, the work becomes:")
	fmt.Println("  O(1)       -> the same")
	fmt.Println("  O(log n)   -> one step more")
	fmt.Println("  O(n)       -> 2x")
	fmt.Println("  O(n log n) -> a bit more than 2x")
	fmt.Println("  O(n^2)     -> 4x")
	fmt.Println("  O(2^n)     -> squared (2^(2n) = (2^n)^2)")
}
