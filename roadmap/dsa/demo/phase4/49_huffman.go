// 49_huffman.go — Huffman coding: a greedy algorithm that builds a tree.
//
// Goal: give every symbol a binary code so that the whole text is as short
// as possible. Frequent symbols should get short codes, rare ones long codes.
//
// Codes must be PREFIX-FREE (no code is the start of another), otherwise
// decoding is ambiguous: with a=0, b=01, is "01" "b" or "a" then something?
// A prefix-free code is exactly a binary tree with the symbols at the leaves:
// the path from the root spells the code (left = 0, right = 1).
//
// Huffman's greedy rule: repeatedly MERGE THE TWO LEAST FREQUENT trees into
// one whose weight is their sum, until one tree is left. A min-heap makes
// each step O(log n), so building the code takes O(n log n) for n symbols.
//
// Why greedy works (exchange argument): in some optimal tree the two rarest
// symbols are siblings at the deepest level. If a rarer symbol sat higher
// than a more frequent one, swapping them would not increase the cost. So
// merging the two rarest first is always safe.
//
// This file builds the code, encodes and decodes a text, and checks that
// the result is optimal against every valid set of code lengths for small
// alphabets (Kraft's inequality).
//
// Run: go run 49_huffman.go
package main

import (
	"cmp"
	"container/heap"
	"fmt"
	"math/bits"
	"math/rand"
	"slices"
	"strings"
)

// Node is a Huffman tree node. Leaves carry a symbol.
type Node struct {
	weight      int
	sym         rune
	left, right *Node
	minSym      rune // smallest symbol below: a deterministic tie-breaker
}

func (n *Node) leaf() bool { return n.left == nil && n.right == nil }

// nodeHeap orders by weight, then by minSym so the output is reproducible.
type nodeHeap []*Node

func (h nodeHeap) Len() int { return len(h) }
func (h nodeHeap) Less(i, j int) bool {
	return cmp.Or(cmp.Compare(h[i].weight, h[j].weight), cmp.Compare(h[i].minSym, h[j].minSym)) < 0
}
func (h nodeHeap) Swap(i, j int) { h[i], h[j] = h[j], h[i] }
func (h *nodeHeap) Push(x any)   { *h = append(*h, x.(*Node)) }
func (h *nodeHeap) Pop() any {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

// buildTree runs Huffman's algorithm on a frequency table.
func buildTree(freq map[rune]int) *Node {
	h := &nodeHeap{}
	for s, f := range freq {
		*h = append(*h, &Node{weight: f, sym: s, minSym: s})
	}
	heap.Init(h) // O(n) bottom-up build (see Heaps, Phase 2)
	if h.Len() == 1 {
		// One distinct symbol: give it a parent so its code is "0", not "".
		only := heap.Pop(h).(*Node)
		return &Node{weight: only.weight, left: only, minSym: only.sym}
	}
	for h.Len() > 1 {
		a := heap.Pop(h).(*Node) // the two least frequent trees
		b := heap.Pop(h).(*Node)
		heap.Push(h, &Node{weight: a.weight + b.weight, left: a, right: b, minSym: min(a.minSym, b.minSym)})
	}
	return heap.Pop(h).(*Node)
}

// codes walks the tree: going left appends '0', going right appends '1'.
func codes(root *Node) map[rune]string {
	table := make(map[rune]string)
	var walk func(n *Node, path string)
	walk = func(n *Node, path string) {
		if n == nil {
			return
		}
		if n.leaf() {
			table[n.sym] = path
			return
		}
		walk(n.left, path+"0")
		walk(n.right, path+"1")
	}
	walk(root, "")
	return table
}

// encode concatenates the codes. A real encoder would pack bits into bytes;
// a string of '0' and '1' keeps the demo easy to read.
func encode(text string, table map[rune]string) string {
	var sb strings.Builder
	for _, r := range text {
		sb.WriteString(table[r])
	}
	return sb.String()
}

// decode walks from the root, one bit at a time, and restarts at the root
// after every leaf. Because the code is prefix-free, no lookahead is needed.
func decode(bitsStr string, root *Node) string {
	var sb strings.Builder
	n := root
	for _, b := range bitsStr {
		if b == '0' {
			n = n.left
		} else {
			n = n.right
		}
		if n.leaf() {
			sb.WriteRune(n.sym)
			n = root
		}
	}
	return sb.String()
}

// cost is the total encoded length: sum of frequency * code length.
func cost(freq map[rune]int, table map[rune]string) int {
	total := 0
	for s, f := range freq {
		total += f * len(table[s])
	}
	return total
}

// prefixFree checks that no code is a prefix of another.
func prefixFree(table map[rune]string) bool {
	for a, ca := range table {
		for b, cb := range table {
			if a != b && strings.HasPrefix(cb, ca) {
				return false
			}
		}
	}
	return true
}

// bestByKraft is an oracle that does not use Huffman's idea at all.
// Kraft's inequality: code lengths l1..ln can be realised by a prefix-free
// code if and only if sum(2^-li) <= 1. So the optimal cost is the minimum of
// sum(fi * li) over all length vectors that satisfy it. We try them all.
func bestByKraft(weights []int) int {
	n := len(weights)
	if n == 1 {
		return weights[0] // one symbol still needs a 1-bit code
	}
	L := n - 1 // no optimal code is longer than n-1 bits
	lengths := make([]int, n)
	best := 1 << 62
	var try func(i, budget, c int)
	// budget = 2^L - sum(2^(L-l)) so far: the room left under Kraft's bound.
	try = func(i, budget, c int) {
		if c >= best {
			return
		}
		if i == n {
			best = c
			return
		}
		for l := 1; l <= L; l++ {
			use := 1 << (L - l)
			if use <= budget {
				lengths[i] = l
				try(i+1, budget-use, c+weights[i]*l)
			}
		}
	}
	try(0, 1<<L, 0)
	return best
}

func main() {
	text := "abracadabra alakazam"
	freq := make(map[rune]int)
	for _, r := range text {
		freq[r]++
	}
	root := buildTree(freq)
	table := codes(root)

	syms := make([]rune, 0, len(freq))
	for s := range freq {
		syms = append(syms, s)
	}
	// Most frequent first; ties alphabetically.
	slices.SortFunc(syms, func(a, b rune) int { return cmp.Or(cmp.Compare(freq[b], freq[a]), cmp.Compare(a, b)) })
	fmt.Printf("text: %q (%d symbols, %d distinct)\n\n", text, len(text), len(freq))
	fmt.Println("symbol  freq  code")
	for _, s := range syms {
		fmt.Printf("  %q   %3d   %s\n", s, freq[s], table[s])
	}

	encoded := encode(text, table)
	fixed := bits.Len(uint(len(freq) - 1)) // bits per symbol for a fixed-length code
	fmt.Println("\nencoded:", encoded)
	fmt.Printf("Huffman: %d bits   fixed %d-bit code: %d bits   8-bit ASCII: %d bits\n",
		len(encoded), fixed, fixed*len(text), 8*len(text))
	fmt.Println("prefix-free:", prefixFree(table), "  round trip ok:", decode(encoded, root) == text)

	// --- Random checks ---
	rng := rand.New(rand.NewSource(49))
	fails := 0
	for t := 0; t < 1500; t++ {
		n := 1 + rng.Intn(7) // alphabets of 1..7 symbols
		f := make(map[rune]int)
		weights := make([]int, n)
		for i := range weights {
			weights[i] = 1 + rng.Intn(30)
			f[rune('a'+i)] = weights[i]
		}
		tb := codes(buildTree(f))
		if cost(f, tb) != bestByKraft(weights) || !prefixFree(tb) {
			fails++
		}
		// Round trip on a random message over this alphabet.
		var sb strings.Builder
		for k := 0; k < 30; k++ {
			sb.WriteRune(rune('a' + rng.Intn(n)))
		}
		msg := sb.String()
		if decode(encode(msg, tb), buildTree(f)) != msg {
			fails++
		}
	}
	fmt.Println("\nHuffman cost vs every valid set of code lengths, failures:", fails)

	// A greedy that looks similar but is wrong: split the symbols (sorted by
	// frequency) into two halves of nearly equal weight, recursively, top
	// down (Shannon-Fano coding). It is prefix-free but not always optimal.
	worse := 0
	for t := 0; t < 1500; t++ {
		n := 2 + rng.Intn(6)
		w := make([]int, n)
		for i := range w {
			w[i] = 1 + rng.Intn(30)
		}
		if shannonFano(w) > bestByKraft(w) {
			worse++
		}
	}
	fmt.Println("Shannon-Fano (top-down split) longer than optimal:", worse, "of 1500")
}

// shannonFano returns the total cost of the top-down splitting code.
func shannonFano(weights []int) int {
	w := slices.Clone(weights)
	slices.SortFunc(w, func(a, b int) int { return cmp.Compare(b, a) })
	var split func(ws []int, depth int) int
	split = func(ws []int, depth int) int {
		if len(ws) == 1 {
			return ws[0] * max(depth, 1)
		}
		total := 0
		for _, x := range ws {
			total += x
		}
		// Choose the cut that makes the two halves' weights closest.
		bestCut, bestDiff, left := 1, 1<<62, 0
		for i := 0; i < len(ws)-1; i++ {
			left += ws[i]
			if d := abs(total - 2*left); d < bestDiff {
				bestCut, bestDiff = i+1, d
			}
		}
		return split(ws[:bestCut], depth+1) + split(ws[bestCut:], depth+1)
	}
	return split(w, 0)
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
