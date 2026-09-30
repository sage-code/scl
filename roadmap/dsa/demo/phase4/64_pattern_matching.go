// 64_pattern_matching.go — Finding a pattern in a text: naive, KMP, Z, Horspool.
//
// Problem: list every position where the pattern occurs in the text (matches
// may overlap). With text length n and pattern length m:
//
//	naive       try every start, compare from the left      O(n*m) worst case
//	KMP         never re-read a text character              O(n + m), always
//	Z-function  match the pattern against every suffix      O(n + m), always
//	Horspool    compare from the RIGHT, skip by a table     O(n*m) worst,
//	                                                        often below n
//
// The idea behind KMP: after a mismatch, the part of the text already matched
// is a prefix of the pattern, so we already know something about it. The
// PREFIX FUNCTION pi[i] stores the length of the longest proper prefix of
// pattern[:i+1] that is also a suffix of it (a "border"). On a mismatch the
// pattern slides so that this border lines up again, and the text pointer
// never moves backwards.
//
// The demo counts character comparisons so the difference is visible, and
// checks every method against strings.Index on thousands of random inputs.
//
// Run: go run 64_pattern_matching.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"strings"
)

// naive compares from every start position. cmps counts character comparisons.
func naive(text, pat string, cmps *int) []int {
	var res []int
	for i := 0; i+len(pat) <= len(text); i++ {
		j := 0
		for j < len(pat) {
			*cmps++
			if text[i+j] != pat[j] {
				break
			}
			j++
		}
		if j == len(pat) {
			res = append(res, i)
		}
	}
	return res
}

// prefixFunction returns pi where pi[i] is the length of the longest proper
// border of p[:i+1]. It is computed with the same "fall back on mismatch"
// loop that the search uses, so it costs O(m) in total: k rises by at most
// one per character and every fall-back lowers it.
func prefixFunction(p string) []int {
	pi := make([]int, len(p))
	k := 0 // length of the border of p[:i] that we are trying to extend
	for i := 1; i < len(p); i++ {
		for k > 0 && p[i] != p[k] {
			k = pi[k-1] // try the next shorter border
		}
		if p[i] == p[k] {
			k++
		}
		pi[i] = k
	}
	return pi
}

// kmp scans the text once. k is the number of pattern characters currently
// matched. On a mismatch k falls back to the longest border, without moving
// the text position; on a full match the search continues from the border,
// so overlapping matches are found.
func kmp(text, pat string, cmps *int) []int {
	var res []int
	if len(pat) == 0 {
		return res
	}
	pi := prefixFunction(pat)
	k := 0
	for i := 0; i < len(text); i++ {
		for k > 0 && text[i] != pat[k] {
			*cmps++
			k = pi[k-1]
		}
		*cmps++
		if text[i] == pat[k] {
			k++
		}
		if k == len(pat) {
			res = append(res, i-k+1)
			k = pi[k-1]
		}
	}
	return res
}

// zFunction returns z where z[i] is the length of the longest common prefix
// of s and s[i:]. [l, r) is the rightmost window that matches a prefix of s;
// inside it, z[i] can be copied from z[i-l] instead of compared again.
func zFunction(s string) []int {
	z := make([]int, len(s))
	l, r := 0, 0
	for i := 1; i < len(s); i++ {
		if i < r {
			z[i] = min(r-i, z[i-l])
		}
		for i+z[i] < len(s) && s[z[i]] == s[i+z[i]] {
			z[i]++
		}
		if i+z[i] > r {
			l, r = i, i+z[i]
		}
	}
	return z
}

// zSearch glues pattern + separator + text. A position where z equals the
// pattern length is an occurrence. The separator byte must occur in neither
// string, so no match can run across it.
func zSearch(text, pat string) []int {
	var res []int
	if len(pat) == 0 {
		return res
	}
	z := zFunction(pat + "\x00" + text)
	for i := len(pat) + 1; i < len(z); i++ {
		if z[i] == len(pat) {
			res = append(res, i-len(pat)-1)
		}
	}
	return res
}

// horspool compares the window from its RIGHT end. Whatever the outcome, the
// window then slides by a distance that depends only on the text character
// under the window's last cell: how far that character is from the end of the
// pattern (or the whole pattern length if it does not occur in it).
func horspool(text, pat string, cmps *int) []int {
	var res []int
	m := len(pat)
	if m == 0 {
		return res
	}
	var shift [256]int
	for c := range shift {
		shift[c] = m
	}
	for j := 0; j < m-1; j++ {
		shift[pat[j]] = m - 1 - j
	}
	for i := 0; i+m <= len(text); {
		j := m - 1
		for j >= 0 {
			*cmps++
			if text[i+j] != pat[j] {
				break
			}
			j--
		}
		if j < 0 {
			res = append(res, i)
		}
		i += shift[text[i+m-1]]
	}
	return res
}

// oracle uses the standard library: repeatedly ask strings.Index.
func oracle(text, pat string) []int {
	var res []int
	if len(pat) == 0 {
		return res
	}
	for i := 0; i+len(pat) <= len(text); {
		j := strings.Index(text[i:], pat)
		if j < 0 {
			break
		}
		res = append(res, i+j)
		i += j + 1
	}
	return res
}

// smallestPeriod returns the length of the shortest block that, repeated,
// builds s exactly. A border of length b means s repeats with shift n-b; that
// shift is a full period only if it divides n.
func smallestPeriod(s string) int {
	n := len(s)
	if n == 0 {
		return 0
	}
	p := n - prefixFunction(s)[n-1]
	if n%p == 0 {
		return p
	}
	return n
}

func smallestPeriodBrute(s string) int {
	for p := 1; p <= len(s); p++ {
		if len(s)%p == 0 && strings.Repeat(s[:p], len(s)/p) == s {
			return p
		}
	}
	return 0
}

func randomString(rng *rand.Rand, n int, alphabet string) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = alphabet[rng.Intn(len(alphabet))]
	}
	return string(b)
}

func main() {
	// --- 1. The prefix function on small strings ---
	for _, p := range []string{"aabaaab", "abcabcabc", "abcdef"} {
		fmt.Printf("prefix function of %-10q %v\n", p, prefixFunction(p))
	}
	fmt.Println("Z function of \"aabxaab\":", zFunction("aabxaab"))
	fmt.Println("positions of \"aba\" in \"abababa\":", oracle("abababa", "aba"), "(overlapping matches count)")

	// --- 2. All four methods against strings.Index ---
	// A two-letter alphabet makes near-matches and overlaps very common.
	rng := rand.New(rand.NewSource(64))
	fails := 0
	for t := 0; t < 5000; t++ {
		alphabet := []string{"ab", "abc", "abcdefghijklmnopqrstuvwxyz"}[t%3]
		text := randomString(rng, rng.Intn(60), alphabet)
		pat := randomString(rng, 1+rng.Intn(6), alphabet)
		want := oracle(text, pat)
		var c int
		if !slices.Equal(naive(text, pat, &c), want) || !slices.Equal(kmp(text, pat, &c), want) ||
			!slices.Equal(zSearch(text, pat), want) || !slices.Equal(horspool(text, pat, &c), want) {
			fails++
		}
	}
	fmt.Println("\nnaive, KMP, Z and Horspool vs strings.Index on 5000 random inputs, failures:", fails)

	// --- 3. Counting comparisons ---
	fmt.Println("\ncharacter comparisons          text length   naive        KMP    Horspool   matches")
	type job struct{ name, text, pat string }
	jobs := []job{
		{"random letters, m = 8", randomString(rng, 100000, "abcdefghijklmnopqrstuvwxyz"), randomString(rng, 8, "abcdefghijklmnopqrstuvwxyz")},
		{"two letters, m = 10", randomString(rng, 100000, "ab"), randomString(rng, 10, "ab")},
		{"worst for naive: a^n, a^999 b", strings.Repeat("a", 100000), strings.Repeat("a", 999) + "b"},
		{"worst for Horspool: a^n, b a^99", strings.Repeat("a", 100000), "b" + strings.Repeat("a", 99)},
	}
	for _, j := range jobs {
		var cn, ck, ch int
		a := naive(j.text, j.pat, &cn)
		b := kmp(j.text, j.pat, &ck)
		c := horspool(j.text, j.pat, &ch)
		if !slices.Equal(a, b) || !slices.Equal(b, c) {
			fmt.Println("  MISMATCH in", j.name)
		}
		fmt.Printf("%-31s %9d %11d %10d %10d %9d\n", j.name, len(j.text), cn, ck, ch, len(a))
	}

	// --- 4. Periods from the prefix function ---
	fmt.Println("\nsmallest period of \"abcabcabc\":", smallestPeriod("abcabcabc"),
		" \"abcabca\":", smallestPeriod("abcabca"), " \"aaaa\":", smallestPeriod("aaaa"))
	fails = 0
	for t := 0; t < 3000; t++ {
		var s string
		if t%2 == 0 { // build a periodic string on purpose
			s = strings.Repeat(randomString(rng, 1+rng.Intn(4), "ab"), 1+rng.Intn(5))
		} else {
			s = randomString(rng, rng.Intn(12), "ab")
		}
		if smallestPeriod(s) != smallestPeriodBrute(s) {
			fails++
		}
	}
	fmt.Println("smallestPeriod vs trying every length on 3000 strings, failures:", fails)
}
