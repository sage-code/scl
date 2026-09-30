// 55_backtracking_template.go — The choose / explore / un-choose template.
//
// BACKTRACKING builds a solution one decision at a time. When a decision
// leads nowhere (or the solution is complete) it UNDOES the last decision and
// tries the next one. It is depth-first search over the tree of all partial
// solutions, and it is the tool for problems that ask you to LIST or FIND
// solutions rather than only count them (dynamic programming counts; see 51).
//
// Every backtracking function has the same shape:
//
//	func explore(state) {
//	    if state is a complete solution { record a COPY of it; return }
//	    for each choice available now {
//	        if the choice is not allowed { continue }   // PRUNE early
//	        choose it                                   // change the state
//	        explore(the new state)
//	        un-choose it                                // restore the state
//	    }
//	}
//
// Three rules cause nearly all bugs, and each is shown here:
//
//  1. un-choose must restore the state EXACTLY as it was before choose
//  2. a recorded solution must be a COPY: the path slice keeps changing
//  3. duplicates in the input need an explicit skip rule
//
// Problems: subsets, permutations, inputs with duplicates, combination sum
// (with and without pruning), and balanced parentheses. Every result is
// checked against an independent count or a brute-force enumeration.
//
// Run: go run 55_backtracking_template.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"sort"
	"strings"
)

// ---------------------------------------------------------------------------
// 1. Subsets. At each element there are two choices: leave it out or put it
//    in. A leaf is reached after deciding every element, so there are 2^n.
// ---------------------------------------------------------------------------

func subsets(nums []int) [][]int {
	var result [][]int
	var path []int
	var explore func(i int)
	explore = func(i int) {
		if i == len(nums) {
			result = append(result, slices.Clone(path)) // a COPY: path changes later
			return
		}
		explore(i + 1) // choice 1: leave nums[i] out
		path = append(path, nums[i])
		explore(i + 1)            // choice 2: put nums[i] in
		path = path[:len(path)-1] // un-choose: remove it again
	}
	explore(0)
	return result
}

// subsetsAliased shows bug 2: appending `path` itself stores a slice header
// that shares memory with path, so later changes rewrite the stored answers.
func subsetsAliased(nums []int) [][]int {
	var result [][]int
	path := make([]int, 0, len(nums)) // spare capacity makes the aliasing visible
	var explore func(i int)
	explore = func(i int) {
		if i == len(nums) {
			result = append(result, path) // BUG: not a copy
			return
		}
		explore(i + 1)
		path = append(path, nums[i])
		explore(i + 1)
		path = path[:len(path)-1]
	}
	explore(0)
	return result
}

// ---------------------------------------------------------------------------
// 2. Permutations. At each position choose any element that is not used yet.
//    used[i] is the "state" that must be restored when we un-choose.
// ---------------------------------------------------------------------------

func permutations(nums []int) [][]int {
	var result [][]int
	var path []int
	used := make([]bool, len(nums))
	var explore func()
	explore = func() {
		if len(path) == len(nums) {
			result = append(result, slices.Clone(path))
			return
		}
		for i := range nums {
			if used[i] {
				continue // already in the path: prune
			}
			used[i] = true // choose
			path = append(path, nums[i])
			explore()
			path = path[:len(path)-1] // un-choose: BOTH changes must be undone
			used[i] = false
		}
	}
	explore()
	return result
}

// ---------------------------------------------------------------------------
// 3. Duplicates. For nums = {1, 2, 2} the plain algorithms list {2 (first)}
//    and {2 (second)} as different subsets. Sort first, then at each level
//    skip a value equal to the one just tried at the SAME level: choosing the
//    same value in the same position again only repeats a branch.
// ---------------------------------------------------------------------------

func subsetsUnique(nums []int) [][]int {
	nums = slices.Clone(nums)
	slices.Sort(nums)
	var result [][]int
	var path []int
	var explore func(start int)
	explore = func(start int) {
		result = append(result, slices.Clone(path)) // every path is a subset
		for i := start; i < len(nums); i++ {
			if i > start && nums[i] == nums[i-1] {
				continue // same value already tried at this level
			}
			path = append(path, nums[i])
			explore(i + 1)
			path = path[:len(path)-1]
		}
	}
	explore(0)
	return result
}

func permutationsUnique(nums []int) [][]int {
	nums = slices.Clone(nums)
	slices.Sort(nums)
	var result [][]int
	var path []int
	used := make([]bool, len(nums))
	var explore func()
	explore = func() {
		if len(path) == len(nums) {
			result = append(result, slices.Clone(path))
			return
		}
		for i := range nums {
			if used[i] {
				continue
			}
			// Equal neighbours must be used in order: use nums[i] only if the
			// equal value just before it is already in the path.
			if i > 0 && nums[i] == nums[i-1] && !used[i-1] {
				continue
			}
			used[i] = true
			path = append(path, nums[i])
			explore()
			path = path[:len(path)-1]
			used[i] = false
		}
	}
	explore()
	return result
}

// key turns a list into a string so results can be compared as sets.
func key(a []int) string { return fmt.Sprint(a) }

func distinctSorted(lists [][]int) []string {
	seen := map[string]bool{}
	for _, l := range lists {
		seen[key(l)] = true
	}
	out := make([]string, 0, len(seen))
	for k := range seen {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

// ---------------------------------------------------------------------------
// 4. Combination sum. Find every way to reach `target` by adding numbers from
//    `candidates`, each usable any number of times. Combinations, not
//    sequences: {2,3} and {3,2} are the same, so the next choice may never go
//    back to an earlier candidate (the loop starts at index `from`).
//
//    PRUNING: with the candidates sorted, once one candidate is larger than
//    what is still needed, every later candidate is too, so stop the loop.
//    The set of solutions is identical; only the number of visited states
//    shrinks.
// ---------------------------------------------------------------------------

func combinationSum(candidates []int, target int, prune bool) (result [][]int, nodes int) {
	cands := slices.Clone(candidates)
	slices.Sort(cands)
	var path []int
	var explore func(from, remaining int)
	explore = func(from, remaining int) {
		nodes++
		if remaining == 0 {
			result = append(result, slices.Clone(path))
			return
		}
		if remaining < 0 {
			return // only reachable when we did not prune
		}
		for i := from; i < len(cands); i++ {
			if prune && cands[i] > remaining {
				break // sorted: every later candidate is even larger
			}
			path = append(path, cands[i])
			explore(i, remaining-cands[i]) // i, not i+1: a number may repeat
			path = path[:len(path)-1]
		}
	}
	explore(0, target)
	return result, nodes
}

// countCombinations is the DP from 51_knapsack_family.go. It COUNTS the
// combinations, so it must agree with the number of lists backtracking finds.
func countCombinations(cands []int, target int) int {
	ways := make([]int, target+1)
	ways[0] = 1
	for _, c := range cands {
		for a := c; a <= target; a++ {
			ways[a] += ways[a-c]
		}
	}
	return ways[target]
}

// ---------------------------------------------------------------------------
// 5. Balanced parentheses. Build a string of n '(' and n ')' left to right.
//    Two rules PRUNE the tree so that only valid strings are ever built:
//      add '(' only while fewer than n have been used
//      add ')' only while it closes something (close < open)
//    The number of results is the Catalan number C(2n, n) / (n + 1).
// ---------------------------------------------------------------------------

func parentheses(n int) []string {
	var result []string
	path := make([]byte, 0, 2*n)
	var explore func(open, close int)
	explore = func(open, close int) {
		if len(path) == 2*n {
			result = append(result, string(path)) // string() copies the bytes
			return
		}
		if open < n {
			path = append(path, '(')
			explore(open+1, close)
			path = path[:len(path)-1]
		}
		if close < open {
			path = append(path, ')')
			explore(open, close+1)
			path = path[:len(path)-1]
		}
	}
	explore(0, 0)
	return result
}

func balanced(s string) bool {
	depth := 0
	for _, c := range s {
		if c == '(' {
			depth++
		} else {
			depth--
		}
		if depth < 0 {
			return false
		}
	}
	return depth == 0
}

// balancedBrute filters ALL 2^(2n) strings of brackets.
func balancedBrute(n int) int {
	count := 0
	for mask := 0; mask < 1<<(2*n); mask++ {
		var sb strings.Builder
		for i := 0; i < 2*n; i++ {
			if mask>>i&1 == 1 {
				sb.WriteByte('(')
			} else {
				sb.WriteByte(')')
			}
		}
		if balanced(sb.String()) {
			count++
		}
	}
	return count
}

func main() {
	// --- Subsets and the aliasing bug ---
	fmt.Println("subsets of {1,2,3}:", subsets([]int{1, 2, 3}))
	fmt.Println("same code without the copy:", subsetsAliased([]int{1, 2, 3}), " <- stored slices share one array")

	// --- Permutations ---
	fmt.Println("\npermutations of {1,2,3}:", permutations([]int{1, 2, 3}))

	rng := rand.New(rand.NewSource(55))
	fails := 0
	for t := 0; t < 300; t++ {
		nums := make([]int, rng.Intn(9))
		for i := range nums {
			nums[i] = rng.Intn(50) + i*100 // distinct values
		}
		// oracle: enumerate subsets by bitmask
		var want [][]int
		for mask := 0; mask < 1<<len(nums); mask++ {
			var s []int
			for i, x := range nums {
				if mask>>i&1 == 1 {
					s = append(s, x)
				}
			}
			want = append(want, s)
		}
		got := subsets(nums)
		if len(got) != 1<<len(nums) || !slices.Equal(distinctSorted(got), distinctSorted(want)) {
			fails++
		}
	}
	fmt.Println("subsets vs bitmask enumeration, failures:", fails)

	fact := []int{1, 1, 2, 6, 24, 120, 720, 5040}
	fails = 0
	for n := 0; n <= 7; n++ {
		nums := make([]int, n)
		for i := range nums {
			nums[i] = i + 1
		}
		got := permutations(nums)
		ok := len(got) == fact[n] && len(distinctSorted(got)) == fact[n]
		for _, p := range got {
			s := slices.Clone(p)
			slices.Sort(s)
			ok = ok && slices.Equal(s, nums) // each result uses every number once
		}
		if !ok {
			fails++
		}
	}
	fmt.Println("permutations (n! results, all distinct, all valid) for n = 0..7, failures:", fails)

	// --- Duplicates ---
	fmt.Println("\nsubsets of {1,2,2}, plain:  ", len(subsets([]int{1, 2, 2})), "results")
	fmt.Println("subsets of {1,2,2}, unique: ", subsetsUnique([]int{1, 2, 2}))
	fmt.Println("permutations of {1,1,2}:    ", permutationsUnique([]int{1, 1, 2}))
	fails = 0
	for t := 0; t < 400; t++ {
		nums := make([]int, rng.Intn(8))
		for i := range nums {
			nums[i] = rng.Intn(4) // many repeats
		}
		var wantSub, wantPerm [][]int
		sorted := slices.Clone(nums)
		slices.Sort(sorted)
		for mask := 0; mask < 1<<len(sorted); mask++ {
			var s []int
			for i, x := range sorted {
				if mask>>i&1 == 1 {
					s = append(s, x)
				}
			}
			wantSub = append(wantSub, s)
		}
		wantPerm = permutations(sorted) // n! lists WITH duplicates, deduplicated below
		gotSub, gotPerm := subsetsUnique(nums), permutationsUnique(nums)
		if len(gotSub) != len(distinctSorted(gotSub)) || !slices.Equal(distinctSorted(gotSub), distinctSorted(wantSub)) ||
			len(gotPerm) != len(distinctSorted(gotPerm)) || !slices.Equal(distinctSorted(gotPerm), distinctSorted(wantPerm)) {
			fails++
		}
	}
	fmt.Println("unique subsets / permutations vs enumerate-and-deduplicate, failures:", fails)

	// --- Combination sum ---
	cands := []int{2, 3, 6, 7}
	res, _ := combinationSum(cands, 7, true)
	fmt.Println("\ncombination sum of {2,3,6,7} to 7:", res)
	fails = 0
	var slow, fast int
	for t := 0; t < 500; t++ {
		cs := make([]int, 1+rng.Intn(4))
		for i := range cs {
			cs[i] = 1 + rng.Intn(9)
		}
		slices.Sort(cs)
		cs = slices.Compact(cs)
		target := rng.Intn(25)
		a, n1 := combinationSum(cs, target, false)
		b, n2 := combinationSum(cs, target, true)
		slow += n1
		fast += n2
		ok := len(a) == countCombinations(cs, target) && slices.EqualFunc(a, b, slices.Equal[[]int])
		for _, r := range b {
			sum := 0
			for _, x := range r {
				sum += x
			}
			ok = ok && sum == target
		}
		if !ok {
			fails++
		}
	}
	fmt.Println("combination sum (lists vs DP count, same lists with pruning), failures:", fails)
	fmt.Printf("states visited over 500 random problems: without pruning %d, with pruning %d\n", slow, fast)

	// --- Parentheses ---
	fmt.Println("\nparentheses, n = 3:", parentheses(3))
	fails = 0
	for n := 0; n <= 7; n++ {
		got := parentheses(n)
		ok := len(got) == len(distinctStrings(got))
		for _, s := range got {
			ok = ok && balanced(s) && len(s) == 2*n
		}
		if n <= 6 { // 2^(2n) strings: brute force is fine up to n = 6
			ok = ok && len(got) == balancedBrute(n)
		}
		if !ok {
			fails++
		}
	}
	fmt.Println("parentheses (valid, distinct, count = brute force) for n = 0..7, failures:", fails)
	fmt.Print("results per n:")
	for n := 0; n <= 10; n++ {
		fmt.Print(" ", len(parentheses(n)))
	}
	fmt.Println("  (Catalan numbers)")
}

func distinctStrings(list []string) map[string]bool {
	seen := map[string]bool{}
	for _, s := range list {
		seen[s] = true
	}
	return seen
}
