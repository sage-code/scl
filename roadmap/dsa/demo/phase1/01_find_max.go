// 01_find_max.go — Thinking in Algorithms: from specification to verified code.
//
// Problem: return the largest value in a list of integers.
//
// This demo is deliberately small. The point is not the answer (everybody
// can find a maximum) but the PROCESS an engineer follows:
//
//  1. Specify   — what goes in, what comes out, what is invalid?
//  2. Examples  — write expected results BEFORE writing code.
//  3. Invariant — state the fact that stays true on every loop iteration.
//  4. Implement — translate the reasoning into Go.
//  5. Verify    — run every example and compare with the expectation.
//
// Run: go run 01_find_max.go
package main

import (
	"errors"
	"fmt"
)

// ErrEmpty is returned when the input has no elements.
// Step 1 (Specify) forced us to answer: "what is the maximum of nothing?"
// There is no correct integer to return, so we report an error instead of
// inventing a value such as 0 (which would be wrong for [-5, -2]).
var ErrEmpty = errors.New("findMax: empty input")

// findMax returns the largest element of nums.
//
// Invariant (Step 3): at the start of iteration i, `best` holds the maximum
// of nums[0..i-1]. The invariant is true before the loop (best = nums[0],
// the maximum of a one-element prefix) and every iteration preserves it.
// When the loop ends, i == len(nums), so best is the maximum of everything.
//
// Cost: one comparison per element -> O(n) time, O(1) extra memory.
func findMax(nums []int) (int, error) {
	if len(nums) == 0 {
		return 0, ErrEmpty // edge case handled first, then the main path
	}
	best := nums[0] // start from a REAL element, never from a magic number
	for i := 1; i < len(nums); i++ {
		if nums[i] > best {
			best = nums[i] // invariant restored for prefix nums[0..i]
		}
	}
	return best, nil
}

// testCase bundles one example from Step 2: input plus expected output.
// Writing examples as data (a "table") is the idiomatic Go testing style.
type testCase struct {
	name    string
	input   []int
	want    int
	wantErr bool
}

func main() {
	// Step 2 — examples chosen to break naive solutions:
	cases := []testCase{
		{"typical", []int{3, 7, 2, 9, 4}, 9, false},
		{"max at start", []int{9, 1, 2}, 9, false},     // off-by-one at the left edge
		{"max at end", []int{1, 2, 9}, 9, false},       // off-by-one at the right edge
		{"all negative", []int{-5, -2, -8}, -2, false}, // breaks "best := 0"
		{"single", []int{42}, 42, false},               // smallest valid input
		{"duplicates", []int{4, 4, 4}, 4, false},       // ties must not confuse us
		{"empty", []int{}, 0, true},                    // invalid input -> error
	}

	// Step 5 — verify every example and report clearly.
	passed := 0
	for _, tc := range cases {
		got, err := findMax(tc.input)
		ok := (err != nil) == tc.wantErr && (tc.wantErr || got == tc.want)
		status := "PASS"
		if ok {
			passed++
		} else {
			status = "FAIL"
		}
		// fmt.Sprint renders the whole slice first, so %-14s pads it as one
		// string (%-14v would pad every element separately).
		fmt.Printf("%-4s %-13s input=%-14s got=%-3d err=%v\n",
			status, tc.name, fmt.Sprint(tc.input), got, err)
	}
	fmt.Printf("\n%d/%d cases passed\n", passed, len(cases))
}
