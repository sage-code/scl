// 06_fast_power.go — Divide and conquer: halve the problem, not shrink it by one.
//
// Problem: compute x^n for an integer n >= 0.
//
// Two recursive ideas, same answer, very different cost:
//
//	slow:  x^n = x * x^(n-1)            -> n calls         O(n)
//	fast:  x^n = (x^(n/2))^2 [* x]      -> log2(n) calls   O(log n)
//
// The fast version is the pattern behind binary search, merge sort, and
// modular exponentiation in cryptography: if you can cut the input in HALF
// each step, the number of steps collapses from n to log n.
//
// Run: go run 06_fast_power.go
package main

import "fmt"

// calls counts function invocations so we can compare the two versions.
// A package-level counter is fine for a demo; production code would return
// the count or use a benchmark instead of shared mutable state.
var calls int

// powSlow reduces n by ONE per call.
func powSlow(x float64, n int) float64 {
	calls++
	if n == 0 {
		return 1 // base case: anything to the power 0 is 1
	}
	return x * powSlow(x, n-1)
}

// powFast reduces n by HALF per call.
//
// Key insight: compute half := x^(n/2) ONCE and square it. Writing
// powFast(x, n/2) * powFast(x, n/2) would make TWO calls per level and
// bring the cost right back to O(n) — a classic mistake.
func powFast(x float64, n int) float64 {
	calls++
	if n == 0 {
		return 1
	}
	half := powFast(x, n/2) // integer division floors: 7/2 == 3
	if n%2 == 0 {
		return half * half // even: x^8 = x^4 * x^4
	}
	return half * half * x // odd:  x^7 = x^3 * x^3 * x
}

// powModFast is the same algorithm with integers modulo m, the form used in
// cryptography (RSA, Diffie-Hellman). Reducing modulo m at every step keeps
// numbers small so they never overflow int64 (as long as m*m fits).
func powModFast(base, exp, m int64) int64 {
	if exp == 0 {
		return 1 % m // 1 % 1 == 0 handles the degenerate modulus m = 1
	}
	half := powModFast(base, exp/2, m)
	result := half * half % m
	if exp%2 == 1 {
		result = result * (base % m) % m
	}
	return result
}

func main() {
	for _, n := range []int{10, 100, 1000} {
		calls = 0
		slow := powSlow(1.001, n)
		slowCalls := calls

		calls = 0
		fast := powFast(1.001, n)
		fastCalls := calls

		fmt.Printf("n=%-5d slow=%.6f (%4d calls)   fast=%.6f (%2d calls)\n",
			n, slow, slowCalls, fast, fastCalls)
	}

	// 3^200 has 96 digits, far beyond int64 — but modulo 1,000,000,007 it is
	// computed exactly in about 8 recursive calls.
	fmt.Println("\n3^200 mod 1_000_000_007 =", powModFast(3, 200, 1_000_000_007))
}
