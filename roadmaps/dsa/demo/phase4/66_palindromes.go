// 66_palindromes.go — Palindromic substrings: expand around centers, Manacher.
//
// A palindrome reads the same in both directions, so it is defined by its
// CENTER. Every palindromic substring of an n-character string has one of
// 2n-1 centers: a character (odd length) or a gap between two characters
// (even length). That turns three problems into one question per center,
// "how far can the palindrome grow?":
//
//	the longest palindromic substring
//	how many palindromic substrings there are
//	the longest palindromic prefix (and from it, the shortest palindrome
//	that can be made by adding characters in front)
//
// Growing every center from scratch costs O(n) per center: O(n^2) in total,
// which is fine up to a few thousand characters. MANACHER'S ALGORITHM reuses
// the work already done. Inside a big palindrome, the left half is the mirror
// image of the right half, so the radius at a center in the right half starts
// from the radius of its mirror in the left half instead of from zero. Every
// character is then compared a constant number of times: O(n).
//
// Run: go run 66_palindromes.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"strings"
)

var cmps int // character comparisons made while growing palindromes

// expand returns d1 and d2 the slow way:
//
//	d1[i] = number of odd palindromes centered at i: the longest is s[i-d1[i]+1 : i+d1[i]]
//	d2[i] = number of even palindromes centered between i-1 and i: the longest is s[i-d2[i] : i+d2[i]]
func expand(s string) (d1, d2 []int) {
	n := len(s)
	d1, d2 = make([]int, n), make([]int, n)
	for i := 0; i < n; i++ {
		k := 1
		for i-k >= 0 && i+k < n && s[i-k] == s[i+k] {
			cmps++
			k++
		}
		d1[i] = k
		k = 0
		for i-k-1 >= 0 && i+k < n && s[i-k-1] == s[i+k] {
			cmps++
			k++
		}
		d2[i] = k
	}
	return d1, d2
}

// manacher computes the same arrays in O(n). [l, r] is the palindrome that
// reaches furthest to the right among those found so far. For a center i
// inside it, the mirror center is l+r-i: whatever palindrome fits around the
// mirror also fits around i, but only up to the edge r of the big palindrome.
// Beyond the edge nothing is known, so the loop tries to grow from there. The
// right edge r only moves right, which bounds the total work by O(n).
func manacher(s string) (d1, d2 []int) {
	n := len(s)
	d1, d2 = make([]int, n), make([]int, n)
	for i, l, r := 0, 0, -1; i < n; i++ {
		k := 1
		if i <= r {
			k = min(d1[l+r-i], r-i+1) // copy from the mirror, capped at the edge
		}
		for i-k >= 0 && i+k < n && s[i-k] == s[i+k] {
			cmps++
			k++
		}
		d1[i] = k
		if i+k-1 > r {
			l, r = i-k+1, i+k-1
		}
	}
	for i, l, r := 0, 0, -1; i < n; i++ {
		k := 0
		if i <= r {
			k = min(d2[l+r-i+1], r-i+1)
		}
		for i-k-1 >= 0 && i+k < n && s[i-k-1] == s[i+k] {
			cmps++
			k++
		}
		d2[i] = k
		if i+k-1 > r {
			l, r = i-k, i+k-1
		}
	}
	return d1, d2
}

// longest returns the longest palindromic substring (the leftmost on ties).
func longest(s string, d1, d2 []int) string {
	bestLen, bestStart := 0, 0
	for i := range s {
		if l := 2*d1[i] - 1; l > bestLen {
			bestLen, bestStart = l, i-d1[i]+1
		}
		if l := 2 * d2[i]; l > bestLen {
			bestLen, bestStart = l, i-d2[i]
		}
	}
	return s[bestStart : bestStart+bestLen]
}

// count returns the number of palindromic substrings, counted by position:
// a center with radius k owns exactly k palindromes (one per length).
func count(d1, d2 []int) int {
	total := 0
	for i := range d1 {
		total += d1[i] + d2[i]
	}
	return total
}

// longestPalPrefix returns the length of the longest palindromic prefix: the
// palindromes whose left edge is at index 0.
func longestPalPrefix(s string, d1, d2 []int) int {
	best := 0
	for i := range s {
		if i-d1[i]+1 == 0 {
			best = max(best, 2*d1[i]-1)
		}
		if d2[i] > 0 && i-d2[i] == 0 {
			best = max(best, 2*d2[i])
		}
	}
	return best
}

func reverse(s string) string {
	b := []byte(s)
	slices.Reverse(b)
	return string(b)
}

// shortestPalindrome adds the fewest characters IN FRONT of s to make a
// palindrome. The longest palindromic prefix can stay; the rest of the string
// must be mirrored to the front.
func shortestPalindrome(s string) string {
	d1, d2 := manacher(s)
	p := longestPalPrefix(s, d1, d2)
	return reverse(s[p:]) + s
}

// ---------------------------------------------------------------- oracles

func isPal(s string) bool { return s == reverse(s) }

// bruteLongest tries every substring: O(n^3).
func bruteLongest(s string) int {
	best := 0
	for i := range s {
		for j := i + 1; j <= len(s); j++ {
			if j-i > best && isPal(s[i:j]) {
				best = j - i
			}
		}
	}
	return best
}

func bruteCount(s string) int {
	total := 0
	for i := range s {
		for j := i + 1; j <= len(s); j++ {
			if isPal(s[i:j]) {
				total++
			}
		}
	}
	return total
}

func bruteShortest(s string) string {
	for p := len(s); p >= 0; p-- {
		if isPal(s[:p]) {
			return reverse(s[p:]) + s
		}
	}
	return s
}

func randomString(rng *rand.Rand, n int, alphabet string) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = alphabet[rng.Intn(len(alphabet))]
	}
	return string(b)
}

func main() {
	// --- 1. The radius arrays for a small string ---
	s := "abaabac"
	d1, d2 := manacher(s)
	fmt.Println("s  =", s)
	fmt.Println("d1 =", d1, " (odd palindromes centered on each character)")
	fmt.Println("d2 =", d2, " (even palindromes centered on the gap before each character)")
	fmt.Printf("longest palindromic substring: %q, palindromic substrings in total: %d\n", longest(s, d1, d2), count(d1, d2))
	fmt.Printf("shortest palindrome by adding in front of %q: %q\n", "aacecaaa", shortestPalindrome("aacecaaa"))
	fmt.Printf("shortest palindrome by adding in front of %q: %q\n", "abcd", shortestPalindrome("abcd"))

	// --- 2. Manacher against the slow expansion and against brute force ---
	rng := rand.New(rand.NewSource(66))
	fails := 0
	for t := 0; t < 4000; t++ {
		alphabet := []string{"a", "ab", "abc"}[t%3]
		s := randomString(rng, rng.Intn(40), alphabet)
		a1, a2 := manacher(s)
		b1, b2 := expand(s)
		if !slices.Equal(a1, b1) || !slices.Equal(a2, b2) {
			fails++
		}
		if len(longest(s, a1, a2)) != bruteLongest(s) || count(a1, a2) != bruteCount(s) {
			fails++
		}
		if shortestPalindrome(s) != bruteShortest(s) {
			fails++
		}
	}
	fmt.Println("\nManacher vs expansion (arrays) and vs brute force (answers) on 4000 strings, failures:", fails)

	// --- 3. Counting comparisons ---
	fmt.Println("\ncharacter comparisons        n      expansion    Manacher")
	for _, c := range []struct{ name, s string }{
		{"random letters", randomString(rng, 20000, "abcdefghijklmnopqrstuvwxyz")},
		{"random a/b", randomString(rng, 20000, "ab")},
		{"all the same letter", strings.Repeat("a", 20000)},
	} {
		cmps = 0
		expand(c.s)
		slow := cmps
		cmps = 0
		manacher(c.s)
		fmt.Printf("%-22s %7d %14d %11d\n", c.name, len(c.s), slow, cmps)
	}
}
