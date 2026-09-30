// 67_suffix_array.go — Sort all suffixes once, answer many questions.
//
// The SUFFIX ARRAY of a string s lists the start positions of all its
// suffixes in sorted (dictionary) order. For "banana":
//
//	sa   suffix   lcp with the one above
//	5    a        0
//	3    ana      1
//	1    anana    3
//	0    banana   0
//	4    na       0
//	2    nana     2
//
// Two facts make it powerful:
//
//	every substring is a PREFIX of some suffix, and suffixes that share a
//	prefix are neighbours in sorted order
//	the LCP array (longest common prefix of neighbouring suffixes) then holds
//	the answers to repetition questions
//
// From sa and lcp:
//
//	find a pattern       binary search over sa: O(m log n) per query
//	longest repeated     the largest lcp value
//	distinct substrings  n(n+1)/2 minus the sum of lcp
//	longest common       build one array for a + separator + b, and take the
//	substring of two     largest lcp between suffixes from different strings
//
// Construction here is PREFIX DOUBLING: sort suffixes by their first 1
// character, then by the first 2 (a pair of ranks from the previous round),
// then 4, 8, ... after at most log2(n) rounds all ranks are distinct.
// Overall O(n log^2 n). Linear-time constructions exist but are far longer.
//
// Run: go run 67_suffix_array.go
package main

import (
	"cmp"
	"fmt"
	"math/rand"
	"slices"
	"sort"
	"strings"
)

var rounds int // doubling rounds used by the last construction

// suffixArray builds sa by prefix doubling. rank[i] is the position of suffix
// i among the suffixes ordered by their first k characters (equal prefixes
// share a rank). One round sorts by the pair (rank[i], rank[i+k]) which
// orders by the first 2k characters; a suffix shorter than k has no second
// half and sorts before any real one (-1).
func suffixArray(s string) []int {
	n := len(s)
	rounds = 0
	if n == 0 {
		return nil
	}
	sa, rank, next := make([]int, n), make([]int, n), make([]int, n)
	for i := range sa {
		sa[i], rank[i] = i, int(s[i])
	}
	for k := 1; ; k <<= 1 {
		rounds++
		second := func(i int) int {
			if i+k < n {
				return rank[i+k]
			}
			return -1
		}
		compare := func(a, b int) int {
			if c := cmp.Compare(rank[a], rank[b]); c != 0 {
				return c
			}
			return cmp.Compare(second(a), second(b))
		}
		slices.SortFunc(sa, compare)
		next[sa[0]] = 0
		for i := 1; i < n; i++ {
			next[sa[i]] = next[sa[i-1]]
			if compare(sa[i-1], sa[i]) != 0 {
				next[sa[i]]++
			}
		}
		copy(rank, next)
		if rank[sa[n-1]] == n-1 { // all ranks distinct: fully sorted
			return sa
		}
	}
}

// lcpArray is Kasai's algorithm. lcp[i] is the common prefix length of the
// suffixes sa[i-1] and sa[i] (lcp[0] = 0). Suffixes are visited in TEXT order,
// not sorted order, because of one fact: if suffix i shares h characters with
// its sorted predecessor, then suffix i+1 shares at least h-1 with ITS
// predecessor. So h only ever falls by one per step and rises by at most n in
// total: O(n).
func lcpArray(s string, sa []int) []int {
	n := len(s)
	rank := make([]int, n)
	for i, p := range sa {
		rank[p] = i
	}
	lcp := make([]int, n)
	h := 0
	for i := 0; i < n; i++ {
		if rank[i] == 0 {
			h = 0
			continue
		}
		j := sa[rank[i]-1] // the suffix just before i in sorted order
		for i+h < n && j+h < n && s[i+h] == s[j+h] {
			h++
		}
		lcp[rank[i]] = h
		if h > 0 {
			h--
		}
	}
	return lcp
}

// find returns the start positions of pat, in increasing order. Suffixes that
// begin with pat form one block of the sorted array; two binary searches find
// its ends.
func find(s string, sa []int, pat string) []int {
	lo := sort.Search(len(sa), func(i int) bool { return s[sa[i]:] >= pat })
	hi := sort.Search(len(sa), func(i int) bool {
		suffix := s[sa[i]:]
		return suffix >= pat && !strings.HasPrefix(suffix, pat)
	})
	res := slices.Clone(sa[lo:hi])
	slices.Sort(res)
	return res
}

// longestRepeated: two suffixes that share a long prefix are neighbours, so
// the largest lcp value is the longest substring that occurs twice.
func longestRepeated(s string, sa, lcp []int) string {
	best := 0
	for i := range lcp {
		if lcp[i] > lcp[best] {
			best = i
		}
	}
	if len(s) == 0 {
		return ""
	}
	return s[sa[best] : sa[best]+lcp[best]]
}

// distinctSubstrings: each suffix contributes its length in new prefixes,
// except the lcp[i] prefixes it shares with the suffix before it.
func distinctSubstrings(n int, lcp []int) int {
	total := n * (n + 1) / 2
	for _, l := range lcp {
		total -= l
	}
	return total
}

// longestCommonSubstring builds one suffix array for a + "\x00" + b. A common
// substring is a shared prefix of a suffix that starts in a and one that
// starts in b; sorted neighbours are the best candidates, so look at every
// neighbouring pair that comes from different strings.
func longestCommonSubstring(a, b string) string {
	t := a + "\x00" + b
	sa := suffixArray(t)
	lcp := lcpArray(t, sa)
	bestLen, bestAt := 0, 0
	for i := 1; i < len(sa); i++ {
		inA, prevInA := sa[i] < len(a), sa[i-1] < len(a)
		if inA != prevInA && lcp[i] > bestLen { // the separator is unique, so lcp stops before it
			bestLen, bestAt = lcp[i], sa[i]
		}
	}
	return t[bestAt : bestAt+bestLen]
}

// ---------------------------------------------------------------- oracles

// suffixArrayNaive sorts the suffix strings themselves.
func suffixArrayNaive(s string) []int {
	sa := make([]int, len(s))
	for i := range sa {
		sa[i] = i
	}
	slices.SortFunc(sa, func(a, b int) int { return strings.Compare(s[a:], s[b:]) })
	return sa
}

func lcpNaive(s string, sa []int) []int {
	lcp := make([]int, len(s))
	for i := 1; i < len(sa); i++ {
		a, b := s[sa[i-1]:], s[sa[i]:]
		for lcp[i] < len(a) && lcp[i] < len(b) && a[lcp[i]] == b[lcp[i]] {
			lcp[i]++
		}
	}
	return lcp
}

func distinctBrute(s string) int {
	seen := map[string]bool{}
	for i := range s {
		for j := i + 1; j <= len(s); j++ {
			seen[s[i:j]] = true
		}
	}
	return len(seen)
}

func occurrences(text, pat string) []int {
	var res []int
	for i := 0; i+len(pat) <= len(text); i++ {
		if text[i:i+len(pat)] == pat {
			res = append(res, i)
		}
	}
	return res
}

func repeatedBrute(s string) int {
	for L := len(s) - 1; L > 0; L-- {
		seen := map[string]bool{}
		for i := 0; i+L <= len(s); i++ {
			if seen[s[i:i+L]] {
				return L
			}
			seen[s[i:i+L]] = true
		}
	}
	return 0
}

// commonBrute is the O(n*m) table: t[i][j] = common suffix length of a[:i], b[:j].
func commonBrute(a, b string) int {
	best := 0
	t := make([][]int, len(a)+1)
	for i := range t {
		t[i] = make([]int, len(b)+1)
	}
	for i := 1; i <= len(a); i++ {
		for j := 1; j <= len(b); j++ {
			if a[i-1] == b[j-1] {
				t[i][j] = t[i-1][j-1] + 1
				best = max(best, t[i][j])
			}
		}
	}
	return best
}

func randomString(rng *rand.Rand, n int, alphabet string) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = alphabet[rng.Intn(len(alphabet))]
	}
	return string(b)
}

func main() {
	// --- 1. A small example ---
	s := "banana"
	sa := suffixArray(s)
	lcp := lcpArray(s, sa)
	fmt.Println("sa   lcp  suffix")
	for i, p := range sa {
		fmt.Printf("%-4d %-4d %s\n", p, lcp[i], s[p:])
	}
	fmt.Println("positions of \"ana\":", find(s, sa, "ana"), " of \"na\":", find(s, sa, "na"), " of \"x\":", find(s, sa, "x"))
	fmt.Printf("longest repeated substring: %q, distinct substrings: %d\n", longestRepeated(s, sa, lcp), distinctSubstrings(len(s), lcp))
	fmt.Printf("longest common substring of \"xabcdey\" and \"zabcdew\": %q\n", longestCommonSubstring("xabcdey", "zabcdew"))

	// --- 2. Everything against brute force ---
	rng := rand.New(rand.NewSource(67))
	fails := 0
	for t := 0; t < 3000; t++ {
		alphabet := []string{"a", "ab", "abc"}[t%3]
		s := randomString(rng, rng.Intn(40), alphabet)
		sa := suffixArray(s)
		lcp := lcpArray(s, sa)
		if !slices.Equal(sa, suffixArrayNaive(s)) || !slices.Equal(lcp, lcpNaive(s, suffixArrayNaive(s))) {
			fails++
		}
		if distinctSubstrings(len(s), lcp) != distinctBrute(s) || len(longestRepeated(s, sa, lcp)) != repeatedBrute(s) {
			fails++
		}
		pat := randomString(rng, 1+rng.Intn(4), alphabet)
		if !slices.Equal(find(s, sa, pat), occurrences(s, pat)) {
			fails++
		}
		other := randomString(rng, rng.Intn(30), alphabet)
		if len(longestCommonSubstring(s, other)) != commonBrute(s, other) {
			fails++
		}
	}
	fmt.Println("\nsuffix array, lcp, search, repeats, distinct count, common substring vs brute force on 3000 strings, failures:", fails)

	// --- 3. How many doubling rounds? ---
	fmt.Println("\nprefix doubling rounds (each round sorts by twice as many characters)")
	for _, c := range []struct{ name, s string }{
		{"random 4 letters, n = 30000", randomString(rng, 30000, "acgt")},
		{"all the same letter, n = 30000", strings.Repeat("a", 30000)},
		{"\"ab\" repeated, n = 30000", strings.Repeat("ab", 15000)},
	} {
		sa := suffixArray(c.s)
		fmt.Printf("  %-34s %2d rounds (log2 n = 14.9), sorted correctly: %v\n", c.name, rounds,
			sort.SliceIsSorted(sa, func(i, j int) bool { return c.s[sa[i]:] < c.s[sa[j]:] }))
	}
	dna := randomString(rng, 100000, "acgt")
	sa = suffixArray(dna)
	fmt.Println("occurrences of an 8-letter pattern in 100000 random letters:", len(find(dna, sa, dna[5000:5008])))
}
