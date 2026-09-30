// 65_rolling_hash.go — Comparing strings by a number: rolling and prefix hashes.
//
// A POLYNOMIAL HASH turns a string into a number:
//
//	hash(s) = s[0]*B^(m-1) + s[1]*B^(m-2) + ... + s[m-1]    (mod M)
//
// It has two properties that make it useful:
//
//	rolling      sliding a window one step right costs O(1): subtract the
//	             leading character's term, multiply by B, add the new one
//	prefix       with the hash of every prefix stored, the hash of ANY
//	             substring is one subtraction and one multiplication
//
// Equal strings always have equal hashes; different strings USUALLY have
// different hashes. A collision is possible, so a hash match is a hint that
// must be verified when the answer has to be exact (Rabin-Karp below), or the
// modulus must be so large that a collision is practically impossible.
//
// The demo covers:
//
//  1. Rabin-Karp search with a weak and a strong modulus, counting false hits
//  2. modular multiplication for M = 2^61 - 1, checked against math/big
//  3. O(1) substring comparison from prefix hashes
//  4. longest repeated substring and longest common substring by binary
//     search on the length, and O(1) palindrome tests
//
// Run: go run 65_rolling_hash.go
package main

import (
	"fmt"
	"math/big"
	"math/bits"
	"math/rand"
	"slices"
	"strings"
)

// ---------------------------------------------------------------------------
// 1. Rabin-Karp with a small modulus (products stay inside uint64).
// ---------------------------------------------------------------------------

// rabinKarp reports every occurrence of pat in text. On a hash match it
// compares the actual characters, so the result is always exact; falseHits
// counts the matches that were only collisions.
func rabinKarp(text, pat string, base, mod uint64, falseHits *int) []int {
	m := len(pat)
	if m == 0 || m > len(text) {
		return nil
	}
	var hp, ht uint64
	pw := uint64(1) // base^(m-1): the weight of the window's first character
	for i := 0; i < m; i++ {
		hp = (hp*base + uint64(pat[i])) % mod
		ht = (ht*base + uint64(text[i])) % mod
		if i > 0 {
			pw = pw * base % mod
		}
	}
	var res []int
	for i := 0; ; i++ {
		if hp == ht {
			if text[i:i+m] == pat {
				res = append(res, i)
			} else {
				*falseHits++ // same hash, different text
			}
		}
		if i+m >= len(text) {
			return res
		}
		// roll: drop text[i], shift everything one place, add text[i+m]
		ht = ((ht+mod-uint64(text[i])*pw%mod)*base + uint64(text[i+m])) % mod
	}
}

func oracle(text, pat string) []int {
	var res []int
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

// ---------------------------------------------------------------------------
// 2. Arithmetic modulo the Mersenne prime 2^61 - 1.
// ---------------------------------------------------------------------------

const mod = 1<<61 - 1

// mulmod multiplies modulo 2^61-1 without overflow. The 122-bit product
// hi:lo is split at bit 61: because 2^61 is congruent to 1, the high part
// can simply be ADDED to the low part.
func mulmod(a, b uint64) uint64 {
	hi, lo := bits.Mul64(a, b)
	r := (lo & mod) + (lo >> 61) + (hi << 3)
	r = (r & mod) + (r >> 61)
	if r >= mod {
		r -= mod
	}
	return r
}

func addmod(a, b uint64) uint64 {
	if r := a + b; r < mod {
		return r
	}
	return a + b - mod
}

func submod(a, b uint64) uint64 {
	if a >= b {
		return a - b
	}
	return a + mod - b
}

// ---------------------------------------------------------------------------
// 3. Prefix hashes: hash of any substring in O(1).
// ---------------------------------------------------------------------------

// Hasher stores pre[i] = hash of s[:i] and pow[i] = base^i.
type Hasher struct {
	pre, pow []uint64
}

func NewHasher(s string, base uint64) *Hasher {
	h := &Hasher{pre: make([]uint64, len(s)+1), pow: make([]uint64, len(s)+1)}
	h.pow[0] = 1
	for i := 0; i < len(s); i++ {
		h.pre[i+1] = addmod(mulmod(h.pre[i], base), uint64(s[i])+1)
		h.pow[i+1] = mulmod(h.pow[i], base)
	}
	return h
}

// Get returns the hash of s[l:r]. pre[r] is pre[l] shifted left by r-l places
// (multiplied by base^(r-l)) plus the hash of s[l:r], so removing that shifted
// copy leaves exactly the substring's own hash.
func (h *Hasher) Get(l, r int) uint64 {
	return submod(h.pre[r], mulmod(h.pre[l], h.pow[r-l]))
}

// longestRepeated finds the longest substring that occurs at least twice
// (occurrences may overlap). If a substring of length L repeats, so does one
// of length L-1, so the answer can be found by binary search on L. For a
// given L, hash every window and look for two equal hashes; each hit is
// verified with a real comparison, so a collision cannot cause a wrong answer.
func longestRepeated(s string, base uint64) string {
	h := NewHasher(s, base)
	repeated := func(L int) int { // start of some repeated window of length L, or -1
		seen := map[uint64][]int{}
		for i := 0; i+L <= len(s); i++ {
			key := h.Get(i, i+L)
			for _, j := range seen[key] {
				if s[i:i+L] == s[j:j+L] {
					return i
				}
			}
			seen[key] = append(seen[key], i)
		}
		return -1
	}
	lo, hi, at := 0, len(s)-1, 0 // invariant: length lo works, length hi+1 does not
	for lo < hi {
		mid := (lo + hi + 1) / 2
		if i := repeated(mid); i >= 0 {
			lo, at = mid, i
		} else {
			hi = mid - 1
		}
	}
	return s[at : at+lo]
}

func longestRepeatedBrute(s string) int {
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

// longestCommonSubstring: the same binary search over two strings. Hash the
// windows of a, then look for a window of b with the same (verified) hash.
func longestCommonSubstring(a, b string, base uint64) string {
	ha, hb := NewHasher(a, base), NewHasher(b, base)
	common := func(L int) (int, bool) {
		windows := map[uint64][]int{}
		for i := 0; i+L <= len(a); i++ {
			key := ha.Get(i, i+L)
			windows[key] = append(windows[key], i)
		}
		for j := 0; j+L <= len(b); j++ {
			for _, i := range windows[hb.Get(j, j+L)] {
				if a[i:i+L] == b[j:j+L] {
					return i, true
				}
			}
		}
		return 0, false
	}
	lo, hi, at := 0, min(len(a), len(b)), 0
	for lo < hi {
		mid := (lo + hi + 1) / 2
		if i, ok := common(mid); ok {
			lo, at = mid, i
		} else {
			hi = mid - 1
		}
	}
	return a[at : at+lo]
}

// lcsubDP is the O(n*m) table oracle: t[i][j] = length of the common suffix
// of a[:i] and b[:j].
func lcsubDP(a, b string) int {
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

func reverse(s string) string {
	b := []byte(s)
	slices.Reverse(b)
	return string(b)
}

func randomString(rng *rand.Rand, n int, alphabet string) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = alphabet[rng.Intn(len(alphabet))]
	}
	return string(b)
}

func main() {
	rng := rand.New(rand.NewSource(65))
	base := uint64(rng.Int63n(mod-1000)) + 500 // random base: fixed ones can be attacked

	// --- 1. Rabin-Karp: the modulus decides how many false hits there are ---
	text := randomString(rng, 100000, "abcdefghijklmnopqrstuvwxyz")
	pat := text[70000:70008]
	want := oracle(text, pat)
	fmt.Println("Rabin-Karp on 100000 random letters, pattern of 8 letters:")
	for _, m := range []uint64{101, 10007, 1_000_000_007} {
		falseHits := 0
		got := rabinKarp(text, pat, 131, m, &falseHits)
		fmt.Printf("  modulus %-10d matches %d (correct: %v), false hits %d\n",
			m, len(got), slices.Equal(got, want), falseHits)
	}
	fails := 0
	for t := 0; t < 3000; t++ {
		s := randomString(rng, rng.Intn(50), "ab")
		p := randomString(rng, 1+rng.Intn(5), "ab")
		var fh int
		if !slices.Equal(rabinKarp(s, p, 131, 101, &fh), oracle(s, p)) { // even with the weak modulus
			fails++
		}
	}
	fmt.Println("  with modulus 101 vs strings.Index on 3000 small inputs, failures:", fails)

	// --- 2. mulmod against math/big ---
	fails = 0
	M := new(big.Int).SetUint64(mod)
	for t := 0; t < 100000; t++ {
		a, b := uint64(rng.Int63n(mod)), uint64(rng.Int63n(mod))
		if t%1000 == 0 {
			a, b = mod-1, mod-1 // the largest possible operands
		}
		w := new(big.Int).Mul(new(big.Int).SetUint64(a), new(big.Int).SetUint64(b))
		if mulmod(a, b) != w.Mod(w, M).Uint64() {
			fails++
		}
	}
	fmt.Println("\nmulmod modulo 2^61-1 vs math/big on 100000 products, failures:", fails)

	// --- 3. Substring comparison in O(1) ---
	s := randomString(rng, 2000, "ab") // a tiny alphabet: many equal substrings
	h := NewHasher(s, base)
	equalSeen, wrong := 0, 0
	for t := 0; t < 200000; t++ {
		L := rng.Intn(12)
		i, j := rng.Intn(len(s)-L+1), rng.Intn(len(s)-L+1)
		same := s[i:i+L] == s[j:j+L]
		if same {
			equalSeen++
		}
		if same != (h.Get(i, i+L) == h.Get(j, j+L)) {
			wrong++
		}
	}
	fmt.Printf("\n200000 substring comparisons (%d of them equal): hash and real comparison disagree %d times\n",
		equalSeen, wrong)

	// --- 4. Binary search on the length ---
	fmt.Printf("\nlongest repeated substring of \"banana\": %q\n", longestRepeated("banana", base))
	fmt.Printf("longest common substring of \"xabcdey\" and \"zabcdew\": %q\n", longestCommonSubstring("xabcdey", "zabcdew", base))
	fails = 0
	for t := 0; t < 300; t++ {
		alphabet := []string{"ab", "abc"}[t%2]
		a, b := randomString(rng, 1+rng.Intn(30), alphabet), randomString(rng, 1+rng.Intn(30), alphabet)
		if len(longestRepeated(a, base)) != longestRepeatedBrute(a) {
			fails++
		}
		if len(longestCommonSubstring(a, b, base)) != lcsubDP(a, b) {
			fails++
		}
	}
	fmt.Println("both searches vs brute force and a DP table on 300 random pairs, failures:", fails)
	dna := randomString(rng, 200000, "acgt")
	fmt.Println("random DNA-like text of 200000 letters: longest repeated substring has length", len(longestRepeated(dna, base)))

	// --- 5. Palindrome test in O(1): a substring equals its own reverse ---
	// The reverse of s[l:r] is a substring of reverse(s), at [n-r, n-l).
	p := randomString(rng, 300, "ab")
	fw, rv := NewHasher(p, base), NewHasher(reverse(p), base)
	fails = 0
	for t := 0; t < 50000; t++ {
		l := rng.Intn(len(p))
		r := l + 1 + rng.Intn(min(8, len(p)-l))
		isPal := p[l:r] == reverse(p[l:r])
		if isPal != (fw.Get(l, r) == rv.Get(len(p)-r, len(p)-l)) {
			fails++
		}
	}
	fmt.Println("palindrome tests by hashing vs reversing, failures:", fails)
}
