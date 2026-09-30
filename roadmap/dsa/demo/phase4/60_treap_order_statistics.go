// 60_treap_order_statistics.go — A randomized balanced tree with rank queries.
//
// A TREAP is two trees in one. By key it is a binary search tree. By a
// random PRIORITY it is a heap: every node has a higher priority than its
// children. For any set of keys and distinct priorities exactly one tree has
// both properties, and because the priorities are random, that tree has the
// shape of a randomly built BST: expected height O(log n) on ANY input, sorted
// or not. No rotation cases to remember.
//
// Everything is built from two operations:
//
//	split(t, k)   cut t into (keys < k) and (keys >= k)
//	merge(a, b)   join two trees where every key of a is below every key of b
//
//	insert = split, then merge(left, new node, right)
//	erase  = split twice to isolate the key, then merge the rest
//
// Then AUGMENT each node with the size of its subtree. Nothing else changes,
// but the tree can now answer questions a plain BST cannot:
//
//	kth(i)     the i-th smallest key           O(log n)
//	rank(k)    how many keys are smaller       O(log n)
//	count(a,b) how many keys lie in [a, b]     O(log n)
//
// The last section drops the keys and uses the size as the ONLY ordering: an
// array with O(log n) insert, delete and rotate at any position.
//
// Run: go run 60_treap_order_statistics.go
package main

import (
	"fmt"
	"math"
	"math/rand"
	"slices"
	"sort"
)

type node struct {
	key         int
	prio        uint32 // random; a parent's priority is >= its children's
	size        int    // number of nodes in this subtree, including this one
	left, right *node
}

func size(n *node) int {
	if n == nil {
		return 0
	}
	return n.size
}

// update repairs the augmented field. Any function that changes a child
// pointer must call it before returning, exactly like the height in demo 59.
func update(n *node) { n.size = 1 + size(n.left) + size(n.right) }

// split cuts n into two trees: keys < k on the left, keys >= k on the right.
// It follows one root-to-leaf path and reattaches subtrees on the way back.
func split(n *node, k int) (*node, *node) {
	if n == nil {
		return nil, nil
	}
	if n.key < k {
		l, r := split(n.right, k) // n and its left subtree belong to the left part
		n.right = l
		update(n)
		return n, r
	}
	l, r := split(n.left, k) // n and its right subtree belong to the right part
	n.left = r
	update(n)
	return l, n
}

// merge joins a and b, assuming every key in a is smaller than every key in
// b. The node with the higher priority becomes the root, which keeps the
// heap property; the other tree is merged into the matching side.
func merge(a, b *node) *node {
	switch {
	case a == nil:
		return b
	case b == nil:
		return a
	case a.prio > b.prio:
		a.right = merge(a.right, b)
		update(a)
		return a
	default:
		b.left = merge(a, b.left)
		update(b)
		return b
	}
}

// Treap is an ordered set of ints with rank queries.
type Treap struct {
	root *node
	rng  *rand.Rand
}

func NewTreap(seed int64) *Treap { return &Treap{rng: rand.New(rand.NewSource(seed))} }

func (t *Treap) Len() int { return size(t.root) }

func (t *Treap) Contains(k int) bool {
	for n := t.root; n != nil; {
		switch {
		case k < n.key:
			n = n.left
		case k > n.key:
			n = n.right
		default:
			return true
		}
	}
	return false
}

// Insert adds k if absent and reports whether it did.
func (t *Treap) Insert(k int) bool {
	if t.Contains(k) {
		return false
	}
	l, r := split(t.root, k)
	fresh := &node{key: k, prio: t.rng.Uint32(), size: 1}
	t.root = merge(merge(l, fresh), r)
	return true
}

// Erase removes k and reports whether it was present. Splitting at k and at
// k+1 isolates the middle tree, which holds only the key k (or nothing).
func (t *Treap) Erase(k int) bool {
	l, rest := split(t.root, k)
	mid, r := split(rest, k+1)
	t.root = merge(l, r)
	return mid != nil
}

// Kth returns the i-th smallest key, counting from 0. The subtree sizes tell
// which way to go: if the left subtree has more than i nodes the answer is
// there; if it has exactly i nodes the answer is this node; otherwise skip
// the left subtree and this node and look for a smaller index on the right.
func (t *Treap) Kth(i int) (int, bool) {
	if i < 0 || i >= t.Len() {
		return 0, false
	}
	n := t.root
	for {
		ls := size(n.left)
		switch {
		case i < ls:
			n = n.left
		case i == ls:
			return n.key, true
		default:
			i -= ls + 1
			n = n.right
		}
	}
}

// Rank returns how many keys are strictly smaller than k.
func (t *Treap) Rank(k int) int {
	count := 0
	for n := t.root; n != nil; {
		if k <= n.key {
			n = n.left
		} else {
			count += size(n.left) + 1 // this node and its whole left subtree are smaller
			n = n.right
		}
	}
	return count
}

// Count returns how many keys lie in the closed range [lo, hi].
func (t *Treap) Count(lo, hi int) int {
	if hi < lo {
		return 0
	}
	return t.Rank(hi+1) - t.Rank(lo)
}

// verify checks search order, the heap property and the stored sizes.
func verify(n *node, lo, hi int) (count int, ok bool) {
	if n == nil {
		return 0, true
	}
	if n.key <= lo || n.key >= hi {
		return 0, false
	}
	cl, okl := verify(n.left, lo, n.key)
	cr, okr := verify(n.right, n.key, hi)
	heap := (n.left == nil || n.left.prio <= n.prio) && (n.right == nil || n.right.prio <= n.prio)
	count = 1 + cl + cr
	return count, okl && okr && heap && n.size == count
}

func height(n *node) int {
	if n == nil {
		return 0
	}
	return 1 + max(height(n.left), height(n.right))
}

func totalDepth(n *node, depth int) int {
	if n == nil {
		return 0
	}
	return depth + totalDepth(n.left, depth+1) + totalDepth(n.right, depth+1)
}

// ---------------------------------------------------------------------------
// Sequence mode: no keys. Position in the in-order walk IS the value's index,
// and size is the only thing used to navigate.
// ---------------------------------------------------------------------------

// splitAt cuts n into the first i values and the rest.
func splitAt(n *node, i int) (*node, *node) {
	if n == nil {
		return nil, nil
	}
	if size(n.left) < i { // the whole left subtree and n are inside the first i
		l, r := splitAt(n.right, i-size(n.left)-1)
		n.right = l
		update(n)
		return n, r
	}
	l, r := splitAt(n.left, i)
	n.left = r
	update(n)
	return l, n
}

// Sequence is an array with O(log n) insert, delete and rotate anywhere.
type Sequence struct {
	root *node
	rng  *rand.Rand
}

func (s *Sequence) Len() int { return size(s.root) }

// InsertAt puts v so that it ends up at index i.
func (s *Sequence) InsertAt(i, v int) {
	l, r := splitAt(s.root, i)
	s.root = merge(merge(l, &node{key: v, prio: s.rng.Uint32(), size: 1}), r)
}

// DeleteRange removes the values at indexes [i, j).
func (s *Sequence) DeleteRange(i, j int) {
	l, rest := splitAt(s.root, i)
	_, r := splitAt(rest, j-i)
	s.root = merge(l, r)
}

// RotateLeft moves the first k values to the end: cut once, merge swapped.
func (s *Sequence) RotateLeft(k int) {
	a, b := splitAt(s.root, k)
	s.root = merge(b, a)
}

func (s *Sequence) Slice() []int {
	var out []int
	var walk func(n *node)
	walk = func(n *node) {
		if n == nil {
			return
		}
		walk(n.left)
		out = append(out, n.key)
		walk(n.right)
	}
	walk(s.root)
	return out
}

func main() {
	// --- 1. A small set: order statistics ---
	t := NewTreap(60)
	for _, k := range []int{5, 3, 8, 1, 4, 7, 9, 2, 6} {
		t.Insert(k)
	}
	fmt.Println("size:", t.Len(), " duplicate insert accepted:", t.Insert(5))
	var sorted []int
	for i := 0; i < t.Len(); i++ {
		k, _ := t.Kth(i)
		sorted = append(sorted, k)
	}
	fmt.Println("Kth(0..n-1):", sorted)
	fmt.Println("Rank(6) =", t.Rank(6), "(keys smaller than 6)")
	fmt.Println("Count(3, 7) =", t.Count(3, 7), "(keys 3,4,5,6,7)")
	median, _ := t.Kth(t.Len() / 2)
	fmt.Println("median =", median)

	// --- 2. Sorted input, the worst case for a plain BST ---
	big := NewTreap(61)
	const n = 100000
	for k := 1; k <= n; k++ {
		big.Insert(k)
	}
	cnt, ok := verify(big.root, math.MinInt, math.MaxInt)
	fmt.Printf("\n%d sorted inserts: height %d, average depth %.1f, log2(n) = %.1f, valid %v\n",
		n, height(big.root), float64(totalDepth(big.root, 1))/float64(n), math.Log2(n), ok && cnt == n)

	// --- 3. Random operations against a sorted slice ---
	rng := rand.New(rand.NewSource(60))
	tr := NewTreap(62)
	var ref []int // sorted, no duplicates
	fails := 0
	for i := 0; i < 30000; i++ {
		k := rng.Intn(500)
		pos, found := slices.BinarySearch(ref, k)
		switch rng.Intn(5) {
		case 0:
			if tr.Insert(k) == found {
				fails++
			}
			if !found {
				ref = slices.Insert(ref, pos, k)
			}
		case 1:
			if tr.Erase(k) != found {
				fails++
			}
			if found {
				ref = slices.Delete(ref, pos, pos+1)
			}
		case 2:
			if got, ok := tr.Kth(pos); ok != (pos < len(ref)) || (ok && got != ref[pos]) {
				fails++
			}
		case 3:
			if tr.Rank(k) != pos { // BinarySearch position = number of smaller keys
				fails++
			}
		default:
			hi := k + rng.Intn(100)
			want := sort.SearchInts(ref, hi+1) - pos
			if tr.Count(k, hi) != want {
				fails++
			}
		}
		if c, ok := verify(tr.root, math.MinInt, math.MaxInt); !ok || c != len(ref) {
			fails++
		}
	}
	fmt.Printf("30000 random operations vs a sorted slice (%d keys left), failures: %d\n", len(ref), fails)

	// --- 4. Sequence mode: an array with cheap insert, delete and rotate ---
	seq := &Sequence{rng: rand.New(rand.NewSource(63))}
	for i := 0; i < 10; i++ {
		seq.InsertAt(i, i)
	}
	seq.RotateLeft(3)
	fmt.Println("\n0..9 rotated left by 3:", seq.Slice())
	seq.DeleteRange(2, 5)
	fmt.Println("then delete indexes [2,5): ", seq.Slice())
	seq.InsertAt(1, 99)
	fmt.Println("then insert 99 at index 1: ", seq.Slice())

	seq = &Sequence{rng: rand.New(rand.NewSource(64))}
	var arr []int
	fails = 0
	for i := 0; i < 5000; i++ {
		switch op := rng.Intn(6); {
		case op < 3 || len(arr) < 5:
			at, v := rng.Intn(len(arr)+1), rng.Intn(1000)
			seq.InsertAt(at, v)
			arr = slices.Insert(arr, at, v)
		case op == 3:
			a := rng.Intn(len(arr))
			b := a + rng.Intn(min(4, len(arr)-a)+1)
			seq.DeleteRange(a, b)
			arr = slices.Delete(arr, a, b)
		default:
			k := rng.Intn(len(arr) + 1)
			seq.RotateLeft(k)
			arr = slices.Concat(arr[k:], arr[:k])
		}
		if !slices.Equal(seq.Slice(), arr) || seq.Len() != len(arr) {
			fails++
		}
	}
	fmt.Printf("5000 insert/delete/rotate operations vs a slice (%d values left), failures: %d\n", len(arr), fails)
}
