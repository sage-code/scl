// 68_aho_corasick.go — Searching for many patterns in one pass.
//
// KMP (demo 64) finds ONE pattern in O(n + m). With k patterns, running it k
// times costs O(k*n). The AHO-CORASICK automaton finds all patterns at once
// in a single left-to-right scan of the text, O(n + total pattern length +
// number of matches). It is a trie (demo 61) plus one extra pointer per node:
//
//	fail link   from the state for string x, the state for the LONGEST proper
//	            suffix of x that is also a prefix of some pattern
//
// This is exactly the KMP fall-back, generalized from one pattern to a whole
// trie. On a mismatch the search does not restart: it follows fail links to
// the longest suffix of what was just read that could still start a match.
//
// Because patterns can be suffixes of each other ("he" is a suffix of "she"),
// reaching one state may complete several patterns at once. An OUTPUT LINK
// from each state jumps straight to the next state, along the fail chain, that
// ends a pattern, so every match is reported without scanning empty states.
//
// The automaton is FULL: missing transitions are filled in with the
// transition of the fail state, so the scan does exactly one table lookup per
// text character and never loops.
//
// Run: go run 68_aho_corasick.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"strings"
)

// Automaton works over lowercase letters a-z.
type Automaton struct {
	next [][26]int32 // next[s][c]: state after reading c in state s (0 is the root)
	fail []int32     // longest proper suffix of the state's string that is a trie prefix
	out  []int32     // nearest state along the fail chain that ends a pattern, 0 if none
	ends [][]int     // ends[s]: ids of the patterns that end exactly at state s
	pats []string
}

func (a *Automaton) newState() int32 {
	a.next = append(a.next, [26]int32{})
	a.fail = append(a.fail, 0)
	a.out = append(a.out, 0)
	a.ends = append(a.ends, nil)
	return int32(len(a.next) - 1)
}

// Build inserts every pattern into a trie, then computes the links level by
// level (breadth-first), so that a state's fail link always points to a state
// that is already finished. Empty patterns are ignored.
func Build(patterns []string) *Automaton {
	a := &Automaton{pats: patterns}
	a.newState() // the root
	for id, p := range patterns {
		if p == "" {
			continue
		}
		s := int32(0)
		for i := 0; i < len(p); i++ {
			c := p[i] - 'a'
			if a.next[s][c] == 0 {
				a.next[s][c] = a.newState()
			}
			s = a.next[s][c]
		}
		a.ends[s] = append(a.ends[s], id)
	}
	var queue []int32
	for c := 0; c < 26; c++ {
		if v := a.next[0][c]; v != 0 {
			queue = append(queue, v) // depth 1: the fail link is the root
		}
	}
	for len(queue) > 0 {
		u := queue[0]
		queue = queue[1:]
		for c := 0; c < 26; c++ {
			v := a.next[u][c]
			if v == 0 {
				a.next[u][c] = a.next[a.fail[u]][c] // no child: borrow the fail state's move
				continue
			}
			a.fail[v] = a.next[a.fail[u]][c] // the longest suffix that can still be extended by c
			if len(a.ends[a.fail[v]]) > 0 {
				a.out[v] = a.fail[v]
			} else {
				a.out[v] = a.out[a.fail[v]]
			}
			queue = append(queue, v)
		}
	}
	return a
}

// Match says that pattern Pattern occurs in the text ending at index End.
type Match struct{ End, Pattern int }

// Search scans the text once. steps counts table lookups. Characters outside
// a-z cannot be part of any pattern, so they send the automaton back to the
// root.
func (a *Automaton) Search(text string, steps *int) []Match {
	var res []Match
	s := int32(0)
	for i := 0; i < len(text); i++ {
		c := text[i]
		if c < 'a' || c > 'z' {
			s = 0
			continue
		}
		*steps++
		s = a.next[s][c-'a']
		t := s // report the patterns ending here, then those ending in shorter suffixes
		if len(a.ends[t]) == 0 {
			t = a.out[t]
		}
		for ; t != 0; t = a.out[t] {
			for _, id := range a.ends[t] {
				res = append(res, Match{i, id})
			}
		}
	}
	return res
}

// censor replaces every occurrence of any pattern by '*'.
func censor(text string, patterns []string) string {
	a := Build(patterns)
	var steps int
	b := []byte(text)
	for _, m := range a.Search(text, &steps) {
		for i := m.End - len(patterns[m.Pattern]) + 1; i <= m.End; i++ {
			b[i] = '*'
		}
	}
	return string(b)
}

// oracle finds every occurrence of every pattern with strings.Index.
func oracle(text string, patterns []string) []Match {
	var res []Match
	for id, p := range patterns {
		if p == "" {
			continue
		}
		for i := 0; i+len(p) <= len(text); {
			j := strings.Index(text[i:], p)
			if j < 0 {
				break
			}
			res = append(res, Match{i + j + len(p) - 1, id})
			i += j + 1
		}
	}
	return res
}

func sortMatches(m []Match) []Match {
	slices.SortFunc(m, func(x, y Match) int {
		if x.End != y.End {
			return x.End - y.End
		}
		return x.Pattern - y.Pattern
	})
	return m
}

func randomString(rng *rand.Rand, n int, alphabet string) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = alphabet[rng.Intn(len(alphabet))]
	}
	return string(b)
}

func main() {
	// --- 1. The classic example ---
	patterns := []string{"he", "she", "his", "hers"}
	a := Build(patterns)
	var steps int
	fmt.Println("patterns", patterns, "-> automaton with", len(a.next), "states")
	for _, m := range sortMatches(a.Search("ushers", &steps)) {
		p := patterns[m.Pattern]
		fmt.Printf("  %-5q found at %d..%d\n", p, m.End-len(p)+1, m.End)
	}
	fmt.Println("(\"she\" and \"he\" end at the same character: one state completes two patterns)")
	fmt.Println("censor:", censor("this is a bad example of badge and dad", []string{"bad", "dad"}))

	// --- 2. Against strings.Index on random inputs ---
	rng := rand.New(rand.NewSource(68))
	fails := 0
	for t := 0; t < 4000; t++ {
		alphabet := []string{"ab", "abc", "abcdefghij"}[t%3]
		var pats []string
		for i := 0; i < 1+rng.Intn(6); i++ {
			pats = append(pats, randomString(rng, rng.Intn(5), alphabet)) // may be empty or repeated
		}
		text := randomString(rng, rng.Intn(60), alphabet)
		var st int
		got := sortMatches(Build(pats).Search(text, &st))
		if !slices.Equal(got, sortMatches(oracle(text, pats))) {
			fails++
		}
	}
	fmt.Println("\nAho-Corasick vs strings.Index (patterns may be empty, repeated, nested) on 4000 inputs, failures:", fails)

	// --- 3. Many patterns: one pass against one pass per pattern ---
	text := randomString(rng, 200000, "abcdefghijklmnopqrstuvwxyz")
	var pats []string
	for i := 0; i < 500; i++ {
		pats = append(pats, randomString(rng, 4, "abcdefghijklmnopqrstuvwxyz"))
	}
	auto := Build(pats)
	steps = 0
	found := auto.Search(text, &steps)
	fmt.Printf("\n%d patterns of 4 letters in %d letters of text: %d automaton states, %d matches\n",
		len(pats), len(text), len(auto.next), len(found))
	fmt.Printf("automaton: %d table lookups in one pass; one scan per pattern: at least %d\n", steps, len(pats)*len(text))
	fmt.Println("same matches as strings.Index:", slices.Equal(sortMatches(found), sortMatches(oracle(text, pats))))

	// --- 4. Nested patterns: a, aa, aaa, ... produce many matches per character ---
	var nested []string
	for L := 1; L <= 30; L++ {
		nested = append(nested, strings.Repeat("a", L))
	}
	all := strings.Repeat("a", 1000)
	steps = 0
	res := Build(nested).Search(all, &steps)
	fmt.Printf("\npatterns a..a^30 in a^1000: %d matches from %d lookups, same as strings.Index: %v\n",
		len(res), steps, slices.Equal(sortMatches(res), sortMatches(oracle(all, nested))))
}
