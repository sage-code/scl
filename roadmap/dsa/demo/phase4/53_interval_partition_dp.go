// 53_interval_partition_dp.go — DP over intervals and over split points.
//
// Some problems ask for the best way to CUT a sequence into pieces, or to
// combine neighbours in the best order. Two state shapes cover almost all of
// them:
//
//	prefix state    best[i] = answer for the first i elements; try every
//	                place j < i for the last piece.  (word break, palindrome cuts)
//	interval state  best[l][r] = answer for the elements between l and r; try
//	                every split k inside.             (matrix chain, balloons)
//
// Interval DP must fill SHORT intervals before long ones, because a long
// interval is built from shorter ones inside it. The outer loop is therefore
// over the LENGTH, not over the start.
//
// This file solves four problems; each is checked against plain recursion
// that tries every possibility:
//
//  1. matrix chain multiplication: the best order of parentheses
//  2. burst balloons: think of the LAST action, not the first
//  3. word break: count and list ways to cut a text into dictionary words
//  4. palindrome partitioning: fewest cuts into palindromes
//
// Run: go run 53_interval_partition_dp.go
package main

import (
	"fmt"
	"math/rand"
	"strings"
)

// ---------------------------------------------------------------------------
// 1. Matrix chain. Matrix i has size dims[i] x dims[i+1]. Multiplying an
//    (a x b) matrix by a (b x c) matrix costs a*b*c scalar multiplications.
//    The product is the same for any order of parentheses, but the COST is
//    not. State: cost[i][j] = cheapest way to multiply matrices i..j.
//    Try every last multiplication (split after matrix k):
//      cost[i][j] = min over k of cost[i][k] + cost[k+1][j] + dims[i]*dims[k+1]*dims[j+1]
// ---------------------------------------------------------------------------

func matrixChain(dims []int) (int, string) {
	n := len(dims) - 1 // number of matrices
	if n <= 0 {
		return 0, ""
	}
	cost := make([][]int, n)
	split := make([][]int, n)
	for i := range cost {
		cost[i] = make([]int, n) // a single matrix costs nothing
		split[i] = make([]int, n)
	}
	for length := 2; length <= n; length++ { // short intervals first
		for i := 0; i+length-1 < n; i++ {
			j := i + length - 1
			cost[i][j] = 1 << 60
			for k := i; k < j; k++ {
				c := cost[i][k] + cost[k+1][j] + dims[i]*dims[k+1]*dims[j+1]
				if c < cost[i][j] {
					cost[i][j], split[i][j] = c, k
				}
			}
		}
	}
	var paren func(i, j int) string
	paren = func(i, j int) string {
		if i == j {
			return string(rune('A' + i))
		}
		return "(" + paren(i, split[i][j]) + paren(split[i][j]+1, j) + ")"
	}
	return cost[0][n-1], paren(0, n-1)
}

// matrixChainNaive tries every split without remembering anything.
func matrixChainNaive(dims []int, i, j int) int {
	if i == j {
		return 0
	}
	best := 1 << 60
	for k := i; k < j; k++ {
		best = min(best, matrixChainNaive(dims, i, k)+matrixChainNaive(dims, k+1, j)+dims[i]*dims[k+1]*dims[j+1])
	}
	return best
}

// ---------------------------------------------------------------------------
// 2. Burst balloons. Bursting balloon k earns nums[left]*nums[k]*nums[right]
//    for its CURRENT neighbours. Maximize the total for bursting them all.
//
//    "Which balloon do I burst FIRST?" is hard: bursting it changes the
//    neighbours of the others, so the two sides are not independent.
//    "Which balloon do I burst LAST inside (l, r)?" is easy: when k is last,
//    its neighbours are the fixed edges l and r, and the balloons on its two
//    sides were burst independently earlier.
//      best[l][r] = max over k in (l, r) of best[l][k] + best[k][r] + v[l]*v[k]*v[r]
//    where l and r are NOT burst inside the interval (open interval).
// ---------------------------------------------------------------------------

func burstBalloons(nums []int) int {
	v := append(append([]int{1}, nums...), 1) // virtual balloons of value 1 at both ends
	n := len(v)
	best := make([][]int, n)
	for i := range best {
		best[i] = make([]int, n)
	}
	for length := 2; length < n; length++ { // distance between l and r
		for l := 0; l+length < n; l++ {
			r := l + length
			for k := l + 1; k < r; k++ {
				best[l][r] = max(best[l][r], best[l][k]+best[k][r]+v[l]*v[k]*v[r])
			}
		}
	}
	return best[0][n-1]
}

// burstBrute tries every balloon as the FIRST one and recurses on the rest.
func burstBrute(nums []int) int {
	if len(nums) == 0 {
		return 0
	}
	best := 0
	for k := range nums {
		left, right := 1, 1
		if k > 0 {
			left = nums[k-1]
		}
		if k+1 < len(nums) {
			right = nums[k+1]
		}
		rest := append(append([]int{}, nums[:k]...), nums[k+1:]...)
		best = max(best, left*nums[k]*right+burstBrute(rest))
	}
	return best
}

// ---------------------------------------------------------------------------
// 3. Word break. State: ways[i] = number of ways to cut the first i letters
//    into dictionary words. The last word is s[j:i] for some j < i:
//      ways[i] = sum over j of ways[j], where s[j:i] is a word
// ---------------------------------------------------------------------------

func wordBreak(s string, dict map[string]bool) (int, []string) {
	n := len(s)
	ways := make([]int, n+1)
	from := make([]int, n+1) // from[i]: where the last word of one solution starts
	ways[0] = 1              // the empty prefix has one cutting: no words
	for i := 1; i <= n; i++ {
		for j := 0; j < i; j++ {
			if ways[j] > 0 && dict[s[j:i]] {
				ways[i] += ways[j]
				from[i] = j
			}
		}
	}
	if ways[n] == 0 {
		return 0, nil
	}
	var words []string
	for i := n; i > 0; i = from[i] {
		words = append([]string{s[from[i]:i]}, words...)
	}
	return ways[n], words
}

// wordBreakNaive counts segmentations by trying every first word.
func wordBreakNaive(s string, dict map[string]bool) int {
	if s == "" {
		return 1
	}
	n := 0
	for i := 1; i <= len(s); i++ {
		if dict[s[:i]] {
			n += wordBreakNaive(s[i:], dict)
		}
	}
	return n
}

// ---------------------------------------------------------------------------
// 4. Palindrome partitioning. Cut s into the fewest pieces that are all
//    palindromes. Two tables:
//      isPal[i][j]  is s[i..j] a palindrome? (interval state: equal ends and
//                   a palindrome inside, or a very short interval)
//      cuts[i]      fewest pieces for the first i letters (prefix state):
//                   cuts[i] = 1 + min cuts[j] over j where s[j..i-1] is a palindrome
// ---------------------------------------------------------------------------

func palindromeCuts(s string) (int, []string) {
	n := len(s)
	if n == 0 {
		return 0, nil
	}
	isPal := make([][]bool, n)
	for i := range isPal {
		isPal[i] = make([]bool, n)
	}
	for length := 1; length <= n; length++ {
		for i := 0; i+length-1 < n; i++ {
			j := i + length - 1
			isPal[i][j] = s[i] == s[j] && (length <= 2 || isPal[i+1][j-1])
		}
	}
	pieces := make([]int, n+1) // pieces[i]: fewest palindromes covering s[:i]
	from := make([]int, n+1)
	for i := 1; i <= n; i++ {
		pieces[i] = 1 << 30
		for j := 0; j < i; j++ {
			if isPal[j][i-1] && pieces[j]+1 < pieces[i] {
				pieces[i], from[i] = pieces[j]+1, j
			}
		}
	}
	var parts []string
	for i := n; i > 0; i = from[i] {
		parts = append([]string{s[from[i]:i]}, parts...)
	}
	return pieces[n] - 1, parts // cuts = pieces - 1
}

func isPalindrome(s string) bool {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		if s[i] != s[j] {
			return false
		}
	}
	return true
}

func palindromeNaive(s string) int {
	if s == "" {
		return -1 // no piece, so "pieces - 1" works out to -1 cuts
	}
	best := 1 << 30
	for i := 1; i <= len(s); i++ {
		if isPalindrome(s[:i]) {
			best = min(best, 1+palindromeNaive(s[i:]))
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
	rng := rand.New(rand.NewSource(53))

	// --- 1. Matrix chain ---
	dims := []int{10, 30, 5, 60} // A is 10x30, B is 30x5, C is 5x60
	cost, order := matrixChain(dims)
	fmt.Println("matrices 10x30, 30x5, 5x60: best order", order, "costs", cost,
		"multiplications; the other order costs", 30*5*60+10*30*60)
	fails := 0
	for t := 0; t < 2000; t++ {
		d := make([]int, 2+rng.Intn(8))
		for i := range d {
			d[i] = 1 + rng.Intn(30)
		}
		got, _ := matrixChain(d)
		if got != matrixChainNaive(d, 0, len(d)-2) {
			fails++
		}
	}
	fmt.Println("matrix chain vs trying every split without a table, failures:", fails)

	// --- 2. Burst balloons ---
	balloons := []int{3, 1, 5, 8}
	fmt.Println("\nballoons", balloons, "-> max coins", burstBalloons(balloons))
	fails = 0
	for t := 0; t < 500; t++ {
		b := make([]int, rng.Intn(8))
		for i := range b {
			b[i] = 1 + rng.Intn(9)
		}
		if burstBalloons(b) != burstBrute(b) {
			fails++
		}
	}
	fmt.Println("burst balloons (last-balloon DP) vs every bursting order, failures:", fails)

	// --- 3. Word break ---
	dict := map[string]bool{"cat": true, "cats": true, "and": true, "sand": true, "dog": true}
	n, words := wordBreak("catsanddog", dict)
	fmt.Printf("\n%q: %d ways, one of them: %v\n", "catsanddog", n, words)
	n, _ = wordBreak("catsandog", dict)
	fmt.Printf("%q: %d ways\n", "catsandog", n)
	fails = 0
	for t := 0; t < 3000; t++ {
		d := map[string]bool{}
		for k := 0; k < 1+rng.Intn(5); k++ {
			d[randomString(rng, 1+rng.Intn(3), "ab")] = true
		}
		s := randomString(rng, rng.Intn(12), "ab")
		got, ws := wordBreak(s, d)
		ok := got == wordBreakNaive(s, d) && (got == 0 || strings.Join(ws, "") == s)
		for _, w := range ws {
			ok = ok && d[w]
		}
		if !ok {
			fails++
		}
	}
	fmt.Println("word break (count, and the words rebuild the text) vs plain recursion, failures:", fails)

	// --- 4. Palindrome partitioning ---
	for _, s := range []string{"aab", "racecarxyz", "abacdc"} {
		c, parts := palindromeCuts(s)
		fmt.Printf("\n%q: %d cut(s) -> %v", s, c, parts)
	}
	fmt.Println()
	fails = 0
	for t := 0; t < 3000; t++ {
		s := randomString(rng, rng.Intn(13), "abc")
		got, parts := palindromeCuts(s)
		ok := len(s) == 0 || got == palindromeNaive(s) && len(parts) == got+1 && strings.Join(parts, "") == s
		for _, p := range parts {
			ok = ok && isPalindrome(p)
		}
		if !ok {
			fails++
		}
	}
	fmt.Println("palindrome cuts (value and pieces) vs plain recursion, failures:", fails)
}
