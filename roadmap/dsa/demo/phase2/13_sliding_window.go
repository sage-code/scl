// 13_sliding_window.go — Reusing work between overlapping ranges.
//
// Many problems ask about contiguous ranges ("subarrays", "substrings").
// Recomputing each range from scratch costs O(n*k) or O(n^2). A sliding
// window keeps a running summary of the current range and updates it in
// O(1) when the window moves: add the element entering on the right,
// remove the element leaving on the left.
//
//	fixed window     size k never changes          max sum of k consecutive
//	variable window  grow right, shrink left       longest/shortest range with a property
//
// Run: go run 13_sliding_window.go
package main

import "fmt"

// maxSumFixed returns the largest sum of k consecutive elements.
// The window sum is updated with one addition and one subtraction per step.
func maxSumFixed(nums []int, k int) int {
	if k <= 0 || k > len(nums) {
		return 0 // invalid window; a real API would return an error
	}
	sum := 0
	for i := 0; i < k; i++ { // build the first window
		sum += nums[i]
	}
	best := sum
	for right := k; right < len(nums); right++ {
		sum += nums[right] - nums[right-k] // enter right, leave left
		best = max(best, sum)
	}
	return best
}

// maxSumFixedBrute recomputes every window: O(n*k). Used as the oracle.
func maxSumFixedBrute(nums []int, k int) int {
	best := 0
	for start := 0; start+k <= len(nums); start++ {
		sum := 0
		for i := start; i < start+k; i++ {
			sum += nums[i]
		}
		if start == 0 || sum > best {
			best = sum
		}
	}
	return best
}

// longestUniqueSubstring returns the length of the longest substring with no
// repeated byte. Variable window: extend `right`; when the new byte already
// occurs inside the window, jump `left` just past its previous position.
//
// lastSeen[c] holds the most recent index of byte c (or -1). Each index
// enters and leaves the window at most once: O(n).
func longestUniqueSubstring(s string) (int, string) {
	var lastSeen [256]int // one slot per possible byte value
	for i := range lastSeen {
		lastSeen[i] = -1
	}
	best, bestStart, left := 0, 0, 0
	for right := 0; right < len(s); right++ {
		c := s[right]
		if lastSeen[c] >= left { // duplicate inside the current window
			left = lastSeen[c] + 1
		}
		lastSeen[c] = right
		if w := right - left + 1; w > best {
			best, bestStart = w, left
		}
	}
	return best, s[bestStart : bestStart+best]
}

// minLenAtLeast returns the length of the shortest contiguous range whose sum
// is >= target, or 0 if none exists. Values must be POSITIVE: that guarantees
// growing the window increases the sum and shrinking decreases it, which is
// what makes the greedy shrink correct. With negatives, use prefix sums.
func minLenAtLeast(nums []int, target int) int {
	best := len(nums) + 1 // "infinity": longer than any real window
	sum, left := 0, 0
	for right, v := range nums {
		sum += v
		for sum >= target { // window is valid: try to shrink it
			best = min(best, right-left+1)
			sum -= nums[left]
			left++
		}
	}
	if best == len(nums)+1 {
		return 0
	}
	return best
}

// maxSlidingWindowNaive returns the maximum of every window of size k.
// O(n*k); the O(n) version with a monotonic deque is in 20_monotonic_stack.go.
func maxSlidingWindowNaive(nums []int, k int) []int {
	var out []int
	for start := 0; start+k <= len(nums); start++ {
		m := nums[start]
		for _, v := range nums[start : start+k] {
			m = max(m, v)
		}
		out = append(out, m)
	}
	return out
}

func main() {
	nums := []int{2, 1, 5, 1, 3, 2, 9, -4, 7}
	for _, k := range []int{1, 3, 4} {
		fmt.Printf("maxSumFixed(k=%d) = %d (brute %d)\n",
			k, maxSumFixed(nums, k), maxSumFixedBrute(nums, k))
	}

	for _, s := range []string{"abcabcbb", "bbbbb", "pwwkew", "dvdf", ""} {
		n, sub := longestUniqueSubstring(s)
		fmt.Printf("longestUnique(%q) = %d %q\n", s, n, sub)
	}

	pos := []int{2, 3, 1, 2, 4, 3}
	fmt.Println("minLenAtLeast(7) =", minLenAtLeast(pos, 7)) // [4 3] -> 2
	fmt.Println("minLenAtLeast(100) =", minLenAtLeast(pos, 100))

	fmt.Println("window max k=3:", maxSlidingWindowNaive([]int{1, 3, -1, -3, 5, 3, 6, 7}, 3))
}
