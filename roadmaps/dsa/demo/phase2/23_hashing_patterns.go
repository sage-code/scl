// 23_hashing_patterns.go — Problems that collapse from O(n^2) to O(n) with a map.
//
// Most "use a hash map" solutions follow one of a few patterns. Recognizing
// the pattern is the skill; the code is short once you see it.
//
//	count        map[key]int            frequencies, majority, anagram check
//	seen set     map[key]struct{}       duplicates, first repeat, intersection
//	index        map[key]int (position) Two Sum, first unique, last position
//	group        map[canonicalKey][]T   anagram groups, bucketing by property
//	membership   set + neighbour lookup longest consecutive run in O(n)
//
// Run: go run 23_hashing_patterns.go
package main

import (
	"fmt"
	"maps"
	"slices"
	"strings"
)

// ---------------------------------------------------------------- count

// isAnagram: same letters with the same counts. One map, counting up for a
// and down for b; every count must return to zero. O(n) vs O(n log n) sorting.
func isAnagram(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	counts := map[rune]int{}
	for _, r := range a {
		counts[r]++
	}
	for _, r := range b {
		counts[r]--
		if counts[r] < 0 { // b has more of r than a
			return false
		}
	}
	return true
}

// topWords returns the k most frequent words, ties broken alphabetically.
func topWords(text string, k int) []string {
	freq := map[string]int{}
	for _, w := range strings.Fields(strings.ToLower(text)) {
		freq[strings.Trim(w, ".,;:!?")]++
	}
	words := slices.Collect(maps.Keys(freq)) // Go 1.23+
	slices.SortFunc(words, func(a, b string) int {
		if freq[a] != freq[b] {
			return freq[b] - freq[a] // higher count first
		}
		return strings.Compare(a, b)
	})
	return words[:min(k, len(words))]
}

// ---------------------------------------------------------------- seen set

// firstRepeat returns the first value that appears a second time.
func firstRepeat(nums []int) (int, bool) {
	seen := map[int]struct{}{}
	for _, v := range nums {
		if _, ok := seen[v]; ok {
			return v, true
		}
		seen[v] = struct{}{}
	}
	return 0, false
}

// intersect returns values present in both slices, without duplicates,
// in the order they appear in b. Build the set from one input, probe with
// the other: O(len(a) + len(b)).
func intersect(a, b []int) []int {
	inA := map[int]bool{}
	for _, v := range a {
		inA[v] = true
	}
	var out []int
	for _, v := range b {
		if inA[v] {
			out = append(out, v)
			inA[v] = false // emit each common value once
		}
	}
	return out
}

// ---------------------------------------------------------------- index

// firstUniqueChar returns the index of the first byte that occurs once.
// Two passes: count, then scan in original order. A [256]int array is a
// perfect "hash map" when keys are bytes: no hashing at all.
func firstUniqueChar(s string) int {
	var counts [256]int
	for i := 0; i < len(s); i++ {
		counts[s[i]]++
	}
	for i := 0; i < len(s); i++ {
		if counts[s[i]] == 1 {
			return i
		}
	}
	return -1
}

// ---------------------------------------------------------------- group

// groupAnagrams groups words that are anagrams of each other. The trick is a
// CANONICAL KEY that is equal for all members of a group: here the letter
// counts as a [26]byte array. Arrays are comparable in Go, so they can be map
// keys directly (slices cannot).
func groupAnagrams(words []string) [][]string {
	groups := map[[26]byte][]string{}
	var order [][26]byte // remember first-seen order for stable output
	for _, w := range words {
		var key [26]byte
		for _, c := range w {
			key[c-'a']++ // assumes lowercase ASCII letters
		}
		if _, ok := groups[key]; !ok {
			order = append(order, key)
		}
		groups[key] = append(groups[key], w)
	}
	out := make([][]string, 0, len(order))
	for _, k := range order {
		out = append(out, groups[k])
	}
	return out
}

// ---------------------------------------------------------------- membership

// longestConsecutive finds the longest run of consecutive integers in any
// order, e.g. [100 4 200 1 3 2] -> 4 (1,2,3,4). Sorting would cost O(n log n).
// With a set: only start counting at a number whose predecessor is ABSENT
// (the start of a run). Each number is then visited at most twice: O(n).
func longestConsecutive(nums []int) int {
	set := map[int]struct{}{}
	for _, v := range nums {
		set[v] = struct{}{}
	}
	best := 0
	for v := range set {
		if _, hasPrev := set[v-1]; hasPrev {
			continue // not the start of a run; its run is counted elsewhere
		}
		length := 1
		for {
			if _, ok := set[v+length]; !ok {
				break
			}
			length++
		}
		best = max(best, length)
	}
	return best
}

func main() {
	fmt.Println("isAnagram(listen, silent):", isAnagram("listen", "silent"))
	fmt.Println("isAnagram(apple, paple):  ", isAnagram("apple", "paple"))
	fmt.Println("isAnagram(rat, car):      ", isAnagram("rat", "car"))

	text := "The cat and the dog. The dog sat; a cat ran and the cat slept!"
	fmt.Println("top 3 words:", topWords(text, 3))

	v, ok := firstRepeat([]int{3, 1, 4, 1, 5, 9, 2, 6, 5})
	fmt.Println("firstRepeat:", v, ok)
	fmt.Println("intersect:  ", intersect([]int{1, 2, 2, 3, 4}, []int{2, 4, 4, 6, 2}))

	for _, s := range []string{"leetcode", "loveleetcode", "aabb"} {
		fmt.Printf("firstUniqueChar(%q) = %d\n", s, firstUniqueChar(s))
	}

	fmt.Println("groupAnagrams:", groupAnagrams([]string{"eat", "tea", "tan", "ate", "nat", "bat"}))
	fmt.Println("longestConsecutive:", longestConsecutive([]int{100, 4, 200, 1, 3, 2}))
	fmt.Println("longestConsecutive:", longestConsecutive([]int{0, 3, 7, 2, 5, 8, 4, 6, 0, 1}))
}
