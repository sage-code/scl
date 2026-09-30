// 14_prefix_sums.go — Precompute once, answer range questions in O(1).
//
// A prefix sum array stores running totals:
//
//	prefix[0] = 0
//	prefix[i] = nums[0] + ... + nums[i-1]
//
// Then the sum of nums[l..r) (half-open) is prefix[r] - prefix[l]: two reads,
// no loop. Building costs O(n) once; each query is O(1) afterwards.
// The extra leading 0 removes the special case for ranges starting at 0.
//
// Run: go run 14_prefix_sums.go
package main

import "fmt"

// PrefixSum answers range-sum queries on a fixed slice.
type PrefixSum struct {
	prefix []int
}

func NewPrefixSum(nums []int) PrefixSum {
	p := make([]int, len(nums)+1) // one longer than nums
	for i, v := range nums {
		p[i+1] = p[i] + v
	}
	return PrefixSum{p}
}

// Sum returns nums[l] + ... + nums[r-1] for 0 <= l <= r <= len(nums).
func (ps PrefixSum) Sum(l, r int) int {
	return ps.prefix[r] - ps.prefix[l]
}

// countSubarraysWithSum counts contiguous ranges summing exactly to k.
// Works with NEGATIVE numbers too (unlike the sliding window).
//
// Idea: a range (l, r] sums to k exactly when prefix[r] - prefix[l] == k,
// i.e. when an earlier prefix equals prefix[r] - k. A map counts how many
// earlier prefixes had each value, so each step is an O(1) lookup: O(n) total.
func countSubarraysWithSum(nums []int, k int) int {
	seen := map[int]int{0: 1} // the empty prefix (sum 0) occurs once
	count, running := 0, 0
	for _, v := range nums {
		running += v
		count += seen[running-k] // ranges ending here with sum k
		seen[running]++
	}
	return count
}

// countBrute is the O(n^2) oracle: try every range.
func countBrute(nums []int, k int) int {
	count := 0
	for l := range nums {
		sum := 0
		for r := l; r < len(nums); r++ {
			sum += nums[r]
			if sum == k {
				count++
			}
		}
	}
	return count
}

// Grid2D answers sums over rectangles of a matrix in O(1) per query.
// p[i][j] = sum of the rectangle rows [0,i) x cols [0,j).
type Grid2D struct {
	p [][]int
}

func NewGrid2D(m [][]int) Grid2D {
	rows, cols := len(m), len(m[0])
	p := make([][]int, rows+1)
	for i := range p {
		p[i] = make([]int, cols+1)
	}
	for i := 1; i <= rows; i++ {
		for j := 1; j <= cols; j++ {
			// inclusion–exclusion: the top-left block is counted twice
			p[i][j] = m[i-1][j-1] + p[i-1][j] + p[i][j-1] - p[i-1][j-1]
		}
	}
	return Grid2D{p}
}

// Sum of rows [r1, r2) and columns [c1, c2).
func (g Grid2D) Sum(r1, c1, r2, c2 int) int {
	p := g.p
	return p[r2][c2] - p[r1][c2] - p[r2][c1] + p[r1][c1]
}

// applyRangeAdds uses a DIFFERENCE array — the inverse of a prefix sum —
// to apply many "add v to every element of [l, r)" updates in O(1) each,
// then materializes the result with one prefix pass. O(n + updates).
func applyRangeAdds(n int, updates [][3]int) []int {
	diff := make([]int, n+1)
	for _, u := range updates {
		l, r, v := u[0], u[1], u[2]
		diff[l] += v // the increase starts at l...
		diff[r] -= v // ...and stops at r
	}
	out := make([]int, n)
	running := 0
	for i := 0; i < n; i++ {
		running += diff[i]
		out[i] = running
	}
	return out
}

func main() {
	nums := []int{3, -1, 4, 1, -5, 9, 2, -6}
	ps := NewPrefixSum(nums)
	fmt.Println("prefix:", ps.prefix)
	fmt.Println("Sum(0,3) =", ps.Sum(0, 3), " (3 - 1 + 4)")
	fmt.Println("Sum(2,6) =", ps.Sum(2, 6), " (4 + 1 - 5 + 9)")
	fmt.Println("Sum(5,5) =", ps.Sum(5, 5), " (empty range)")

	for _, k := range []int{3, 4, 0} {
		fmt.Printf("subarrays summing to %d: %d (brute %d)\n",
			k, countSubarraysWithSum(nums, k), countBrute(nums, k))
	}

	grid := [][]int{
		{1, 2, 3, 4},
		{5, 6, 7, 8},
		{9, 10, 11, 12},
	}
	g := NewGrid2D(grid)
	fmt.Println("\nrectangle rows[1,3) cols[1,3) =", g.Sum(1, 1, 3, 3), " (6+7+10+11)")
	fmt.Println("whole grid =", g.Sum(0, 0, 3, 4))

	// Three booking updates on 8 seats: [l, r) gets +v.
	fmt.Println("\nrange adds:", applyRangeAdds(8, [][3]int{{0, 3, 1}, {2, 6, 2}, {5, 8, 10}}))
}
