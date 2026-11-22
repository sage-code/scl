// 61_trie.go — A trie (prefix tree): search by the letters of the key.
//
// A hash map answers "is this exact word stored?" in O(len(word)) and knows
// nothing else about the words. A TRIE spends one node per distinct prefix and
// one step per letter, so the shared beginning of words is stored once and
// every question about PREFIXES is a walk down one path:
//
//	Contains(word)      walk the letters, check the end mark
//	CountPrefix(p)      walk to the node of p, read a counter
//	Autocomplete(p, k)  walk to p, then list the words below it in order
//	Search("c.r")       wildcards branch into every child
//
// The cost depends on the LENGTH of the word, not on how many words are
// stored, and words come out in alphabetical order for free.
//
// The last section reuses the same idea on the BITS of an integer (a binary
// trie) to find the pair with the largest XOR without trying every pair.
//
// Run: go run 61_trie.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"strings"
)

type node struct {
	next [26]*node // one slot per letter 'a'..'z'; nil means no word continues that way
	end  bool      // a stored word ends exactly here
	pass int       // how many stored words pass through (or end at) this node
}

// Trie stores lowercase words a-z.
type Trie struct {
	root  *node
	words int // stored words
	nodes int // allocated nodes, counting the root
}

func NewTrie() *Trie { return &Trie{root: &node{}, nodes: 1} }

// find returns the node reached by following p, or nil if the path breaks.
func (t *Trie) find(p string) *node {
	n := t.root
	for i := 0; i < len(p) && n != nil; i++ {
		n = n.next[p[i]-'a']
	}
	return n
}

func (t *Trie) Contains(w string) bool {
	n := t.find(w)
	return n != nil && n.end
}

// CountPrefix returns how many stored words start with p, in O(len(p)).
func (t *Trie) CountPrefix(p string) int {
	if n := t.find(p); n != nil {
		return n.pass
	}
	return 0
}

// Insert adds w and reports whether it was new. The pass counters are updated
// only for a new word, so a repeated insert changes nothing.
func (t *Trie) Insert(w string) bool {
	if t.Contains(w) {
		return false
	}
	n := t.root
	n.pass++
	for i := 0; i < len(w); i++ {
		c := w[i] - 'a'
		if n.next[c] == nil {
			n.next[c] = &node{}
			t.nodes++
		}
		n = n.next[c]
		n.pass++
	}
	n.end = true
	t.words++
	return true
}

// Delete removes w. Walking down, each pass counter drops by one; the first
// node whose counter reaches zero starts a chain that belonged only to w, so
// the whole chain is cut off with a single pointer assignment.
func (t *Trie) Delete(w string) bool {
	if !t.Contains(w) {
		return false
	}
	t.words--
	n := t.root
	n.pass--
	for i := 0; i < len(w); i++ {
		c := w[i] - 'a'
		child := n.next[c]
		child.pass--
		if child.pass == 0 {
			n.next[c] = nil // the rest of the path served only this word
			t.nodes -= len(w) - i
			return true
		}
		n = child
	}
	n.end = false // other words continue below: the nodes stay
	return true
}

// Autocomplete returns up to limit stored words that start with p, in
// alphabetical order: the depth-first walk visits children a..z.
func (t *Trie) Autocomplete(p string, limit int) []string {
	var out []string
	var walk func(n *node, path []byte)
	walk = func(n *node, path []byte) {
		if n == nil || len(out) >= limit {
			return
		}
		if n.end {
			out = append(out, string(path))
		}
		for c := 0; c < 26; c++ {
			walk(n.next[c], append(path, byte('a'+c)))
		}
	}
	walk(t.find(p), []byte(p))
	return out
}

// LongestCommonPrefix of all stored words: follow the path while there is
// exactly one way to go and no word ends here.
func (t *Trie) LongestCommonPrefix() string {
	var sb strings.Builder
	n := t.root
	for !n.end {
		only, count := -1, 0
		for c := 0; c < 26; c++ {
			if n.next[c] != nil {
				only, count = c, count+1
			}
		}
		if count != 1 {
			break
		}
		sb.WriteByte(byte('a' + only))
		n = n.next[only]
	}
	return sb.String()
}

// Search matches a pattern where '.' stands for any single letter. A letter
// follows one child; a '.' tries all of them, so the cost grows with the
// number of dots, not with the number of words.
func (t *Trie) Search(pattern string) bool {
	var match func(n *node, i int) bool
	match = func(n *node, i int) bool {
		if n == nil {
			return false
		}
		if i == len(pattern) {
			return n.end
		}
		if pattern[i] != '.' {
			return match(n.next[pattern[i]-'a'], i+1)
		}
		for c := 0; c < 26; c++ {
			if match(n.next[c], i+1) {
				return true
			}
		}
		return false
	}
	return match(t.root, 0)
}

// countNodes recounts the tree from scratch, to check the incremental counter.
func countNodes(n *node) int {
	if n == nil {
		return 0
	}
	total := 1
	for _, c := range n.next {
		total += countNodes(c)
	}
	return total
}

// matches is the brute-force wildcard oracle.
func matches(pattern, w string) bool {
	if len(pattern) != len(w) {
		return false
	}
	for i := range pattern {
		if pattern[i] != '.' && pattern[i] != w[i] {
			return false
		}
	}
	return true
}

// ---------------------------------------------------------------------------
// Binary trie: the same structure with the BITS of an integer as the letters.
// ---------------------------------------------------------------------------

type bnode struct{ next [2]*bnode }

const bits = 20 // numbers below 2^20

// maxXOR returns the largest a^b over all pairs in nums. For each x, walk the
// trie choosing at every bit the child that is DIFFERENT from x's bit when one
// exists: a 1 in a high bit of the result beats anything in the lower bits.
func maxXOR(nums []int) int {
	root := &bnode{}
	best := 0
	for _, x := range nums {
		n := root
		for b := bits - 1; b >= 0; b-- { // insert x
			bit := x >> b & 1
			if n.next[bit] == nil {
				n.next[bit] = &bnode{}
			}
			n = n.next[bit]
		}
		m, xor := root, 0
		for b := bits - 1; b >= 0; b-- { // query: best partner among numbers inserted so far
			bit := x >> b & 1
			if m.next[1-bit] != nil {
				xor |= 1 << b
				m = m.next[1-bit]
			} else {
				m = m.next[bit]
			}
		}
		best = max(best, xor)
	}
	return best
}

func maxXORBrute(nums []int) int {
	best := 0
	for i := range nums {
		for j := range nums {
			best = max(best, nums[i]^nums[j])
		}
	}
	return best
}

func randomWord(rng *rand.Rand, alphabet string, maxLen int) string {
	b := make([]byte, 1+rng.Intn(maxLen))
	for i := range b {
		b[i] = alphabet[rng.Intn(len(alphabet))]
	}
	return string(b)
}

func main() {
	// --- 1. A small dictionary ---
	t := NewTrie()
	dict := []string{"cat", "car", "card", "care", "careful", "dog", "dot"}
	chars := 0
	for _, w := range dict {
		t.Insert(w)
		chars += len(w)
	}
	fmt.Printf("%d words, %d letters in total, but only %d trie nodes (root included)\n",
		t.words, chars, t.nodes)
	fmt.Println("CountPrefix(\"car\"):", t.CountPrefix("car"), " CountPrefix(\"do\"):", t.CountPrefix("do"),
		" CountPrefix(\"x\"):", t.CountPrefix("x"))
	fmt.Println("Autocomplete(\"car\", 10):", t.Autocomplete("car", 10))
	fmt.Println("Autocomplete(\"car\", 2): ", t.Autocomplete("car", 2))
	fmt.Println("Search(\"c.r\"):", t.Search("c.r"), " Search(\"c.t\"):", t.Search("c.t"), " Search(\"..g\"):", t.Search("..g"),
		" Search(\"...\"):", t.Search("..."), " Search(\"c.\"):", t.Search("c."))
	c := NewTrie()
	for _, w := range []string{"interview", "internet", "internal", "interval"} {
		c.Insert(w)
	}
	fmt.Println("longest common prefix of interview/internet/internal/interval:", c.LongestCommonPrefix())
	t.Delete("careful")
	t.Delete("car") // "card" and "care" still need the path
	fmt.Println("after deleting careful and car:", t.Autocomplete("", 20), "nodes:", t.nodes)

	// --- 2. Random operations against a sorted slice of words ---
	// A small alphabet makes words share prefixes constantly.
	rng := rand.New(rand.NewSource(61))
	tr := NewTrie()
	var ref []string // sorted, unique
	fails := 0
	for i := 0; i < 20000; i++ {
		w := randomWord(rng, "abc", 5)
		pos, found := slices.BinarySearch(ref, w)
		switch rng.Intn(5) {
		case 0, 1:
			if tr.Insert(w) == found {
				fails++
			}
			if !found {
				ref = slices.Insert(ref, pos, w)
			}
		case 2:
			if tr.Delete(w) != found {
				fails++
			}
			if found {
				ref = slices.Delete(ref, pos, pos+1)
			}
		case 3:
			if tr.Contains(w) != found {
				fails++
			}
			// prefix count and autocomplete against a scan of the sorted words
			p := w[:rng.Intn(len(w)+1)]
			var want []string
			for _, r := range ref {
				if strings.HasPrefix(r, p) {
					want = append(want, r)
				}
			}
			if tr.CountPrefix(p) != len(want) {
				fails++
			}
			if got := tr.Autocomplete(p, 4); !slices.Equal(got, want[:min(4, len(want))]) {
				fails++
			}
		default:
			pat := []byte(w)
			for j := range pat {
				if rng.Intn(3) == 0 {
					pat[j] = '.'
				}
			}
			want := false
			for _, r := range ref {
				if matches(string(pat), r) {
					want = true
					break
				}
			}
			if tr.Search(string(pat)) != want {
				fails++
			}
		}
		if tr.words != len(ref) || tr.nodes != countNodes(tr.root) {
			fails++
		}
	}
	fmt.Printf("\n20000 random operations vs a sorted slice (%d words left), failures: %d\n", len(ref), fails)

	// --- 3. How much sharing? ---
	big := NewTrie()
	letters := 0
	for big.words < 20000 {
		w := randomWord(rng, "abcd", 12)
		if big.Insert(w) {
			letters += len(w)
		}
	}
	fmt.Printf("20000 random words over 4 letters: %d letters stored in %d nodes (%.0f%% of the letters)\n",
		letters, big.nodes, 100*float64(big.nodes)/float64(letters))

	// --- 4. Binary trie: the largest XOR of two numbers ---
	fmt.Println("\nmaxXOR({3, 10, 5, 25, 2, 8}) =", maxXOR([]int{3, 10, 5, 25, 2, 8}), "(5 ^ 25)")
	fails = 0
	for i := 0; i < 2000; i++ {
		nums := make([]int, rng.Intn(40))
		for j := range nums {
			nums[j] = rng.Intn(1 << bits)
		}
		if maxXOR(nums) != maxXORBrute(nums) {
			fails++
		}
	}
	fmt.Println("maxXOR vs all pairs on 2000 random arrays, failures:", fails)
}
