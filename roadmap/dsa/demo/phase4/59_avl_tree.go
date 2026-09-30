// 59_avl_tree.go — A self-balancing binary search tree (AVL).
//
// A plain binary search tree (demo 25) costs O(h) per operation, and h can be
// as bad as n: insert the keys 1, 2, 3, ... in order and the tree becomes a
// linked list. An AVL tree repairs the shape after every change so that
//
//	for every node, the heights of its two subtrees differ by at most 1
//
// That single rule forces h <= 1.44 * log2(n + 2), so search, insert and
// delete are all O(log n) in the worst case, not only on average.
//
// The repair tool is the ROTATION: a local pointer change that keeps the
// in-order sequence (so the search-tree property survives) but moves one
// subtree up a level and another down.
//
//	rotate right at y            y                x
//	                            / \              / \
//	                           x   C    ->      A   y
//	                          / \                  / \
//	                         A   B                B   C
//
// Only four shapes of imbalance exist, and each is fixed with one or two
// rotations (see rebalance). The demo checks the invariants after every
// operation against a plain map, and compares tree heights with an
// unbalanced tree on sorted input.
//
// Run: go run 59_avl_tree.go
package main

import (
	"fmt"
	"math"
	"math/rand"
	"slices"
)

type node struct {
	key         int
	height      int // height of the subtree rooted here: a leaf is 1, nil is 0
	left, right *node
}

var rotations int // counts every single rotation, to compare with the number of inserts

func height(n *node) int {
	if n == nil {
		return 0
	}
	return n.height
}

// fix recomputes the stored height from the two children. Every function that
// changes a child pointer must call it, bottom-up, before returning.
func fix(n *node) { n.height = 1 + max(height(n.left), height(n.right)) }

// balance is positive when the left side is taller, negative when the right is.
func balance(n *node) int { return height(n.left) - height(n.right) }

// rotateRight lifts the left child above n and returns it as the new subtree
// root. The subtree B (x's right child) changes parent: it is larger than x
// and smaller than y, so it fits exactly there.
func rotateRight(y *node) *node {
	x := y.left
	y.left = x.right
	x.right = y
	fix(y) // y is now the lower node, so it is updated first
	fix(x)
	rotations++
	return x
}

// rotateLeft is the mirror image.
func rotateLeft(x *node) *node {
	y := x.right
	x.right = y.left
	y.left = x
	fix(x)
	fix(y)
	rotations++
	return y
}

// rebalance restores the AVL rule at n, assuming both subtrees already obey
// it and differ from each other by at most 2 (true after one insert/delete).
//
//	left-left    left child leans left (or is even)    one right rotation
//	left-right   left child leans right                 rotate the child left
//	                                                    first, then right
//	right-right and right-left are the mirror images.
//
// The double rotation turns the "zig-zag" shape into a straight line, which
// the single rotation can then fix.
func rebalance(n *node) *node {
	fix(n)
	switch b := balance(n); {
	case b > 1:
		if balance(n.left) < 0 {
			n.left = rotateLeft(n.left) // left-right case
		}
		return rotateRight(n)
	case b < -1:
		if balance(n.right) > 0 {
			n.right = rotateRight(n.right) // right-left case
		}
		return rotateLeft(n)
	}
	return n
}

// insert adds k below n and rebalances every node on the way back up the
// path. Duplicates are ignored. The recursion returns the new subtree root,
// so the parent re-attaches whatever the rotations produced.
func insert(n *node, k int, added *bool) *node {
	if n == nil {
		*added = true
		return &node{key: k, height: 1}
	}
	switch {
	case k < n.key:
		n.left = insert(n.left, k, added)
	case k > n.key:
		n.right = insert(n.right, k, added)
	default:
		return n // already present: nothing changed, nothing to rebalance
	}
	return rebalance(n)
}

// remove deletes k. A node with two children takes the key of its in-order
// successor (the smallest key on its right), and that successor is removed
// from the right subtree instead. Deleting can unbalance several nodes on
// the path, so every one of them is rebalanced on the way up.
func remove(n *node, k int, removed *bool) *node {
	if n == nil {
		return nil
	}
	switch {
	case k < n.key:
		n.left = remove(n.left, k, removed)
	case k > n.key:
		n.right = remove(n.right, k, removed)
	default:
		*removed = true
		if n.left == nil {
			return n.right
		}
		if n.right == nil {
			return n.left
		}
		s := n.right
		for s.left != nil {
			s = s.left
		}
		n.key = s.key
		var ignore bool
		n.right = remove(n.right, s.key, &ignore)
	}
	return rebalance(n)
}

func contains(n *node, k int) bool {
	for n != nil {
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

// bstInsert is the plain, unbalanced insert used for comparison.
func bstInsert(n *node, k int) *node {
	if n == nil {
		return &node{key: k, height: 1}
	}
	if k < n.key {
		n.left = bstInsert(n.left, k)
	} else if k > n.key {
		n.right = bstInsert(n.right, k)
	}
	fix(n)
	return n
}

// inorder appends the keys in sorted order.
func inorder(n *node, out *[]int) {
	if n == nil {
		return
	}
	inorder(n.left, out)
	*out = append(*out, n.key)
	inorder(n.right, out)
}

func preorder(n *node) string {
	if n == nil {
		return ""
	}
	s := fmt.Sprint(n.key)
	if l := preorder(n.left); l != "" {
		s += " " + l
	}
	if r := preorder(n.right); r != "" {
		s += " " + r
	}
	return s
}

// check verifies every invariant below n and returns the true height:
// keys strictly inside (lo, hi), stored height correct, balance within 1.
func check(n *node, lo, hi int) (h int, ok bool) {
	if n == nil {
		return 0, true
	}
	if n.key <= lo || n.key >= hi {
		return 0, false
	}
	hl, okl := check(n.left, lo, n.key)
	hr, okr := check(n.right, n.key, hi)
	h = 1 + max(hl, hr)
	ok = okl && okr && n.height == h && hl-hr >= -1 && hl-hr <= 1
	return h, ok
}

// minNodes(h) is the fewest nodes an AVL tree of height h can have: one
// subtree of height h-1, one of height h-2 and the root. It grows like the
// Fibonacci numbers, which is where the 1.44 log2 n height bound comes from.
func minNodes(h int) int {
	if h <= 0 {
		return 0
	}
	if h == 1 {
		return 1
	}
	return minNodes(h-1) + minNodes(h-2) + 1
}

func main() {
	// --- 1. The four imbalance shapes: every one ends as the same tree ---
	fmt.Println("insert order   shape         rotations   preorder after inserts")
	shapes := []struct {
		keys  []int
		shape string
	}{
		{[]int{30, 20, 10}, "left-left"},
		{[]int{10, 20, 30}, "right-right"},
		{[]int{30, 10, 20}, "left-right"},
		{[]int{10, 30, 20}, "right-left"},
	}
	for _, s := range shapes {
		var root *node
		rotations = 0
		for _, k := range s.keys {
			var added bool
			root = insert(root, k, &added)
		}
		fmt.Printf("%-13s  %-12s  %d           %s\n", fmt.Sprint(s.keys), s.shape, rotations, preorder(root))
	}

	// --- 2. Sorted input: the plain tree degenerates, AVL stays shallow ---
	fmt.Println("\nsorted keys   plain height   AVL height   ceil(log2(n+1))   1.44*log2(n+2)   rotations")
	for _, n := range []int{100, 1000, 2000} {
		var plain, avl *node
		rotations = 0
		for k := 1; k <= n; k++ {
			var added bool
			plain = bstInsert(plain, k)
			avl = insert(avl, k, &added)
		}
		fmt.Printf("%11d   %12d   %10d   %15d   %14.1f   %9d\n", n, plain.height, avl.height,
			int(math.Ceil(math.Log2(float64(n+1)))), 1.44*math.Log2(float64(n+2)), rotations)
	}

	// --- 3. Random order: the plain tree is decent on average, AVL is never bad ---
	rng := rand.New(rand.NewSource(59))
	worstPlain, worstAVL := 0, 0
	for t := 0; t < 200; t++ {
		var plain, avl *node
		for _, k := range rng.Perm(1000) {
			var added bool
			plain = bstInsert(plain, k)
			avl = insert(avl, k, &added)
		}
		worstPlain = max(worstPlain, plain.height)
		worstAVL = max(worstAVL, avl.height)
	}
	fmt.Printf("\n200 random orders of 1000 keys: tallest plain tree %d, tallest AVL tree %d (bound %d)\n",
		worstPlain, worstAVL, int(1.44*math.Log2(1002)))

	// --- 4. Random inserts, deletes and lookups against a map ---
	// After EVERY operation the whole tree is checked: search order, stored
	// heights and the balance rule.
	var root *node
	ref := map[int]bool{}
	fails := 0
	for i := 0; i < 20000; i++ {
		k := rng.Intn(300)
		switch rng.Intn(3) {
		case 0:
			var added bool
			root = insert(root, k, &added)
			if added == ref[k] { // added exactly when the key was not present
				fails++
			}
			ref[k] = true
		case 1:
			var removed bool
			root = remove(root, k, &removed)
			if removed != ref[k] {
				fails++
			}
			delete(ref, k)
		default:
			if contains(root, k) != ref[k] {
				fails++
			}
		}
		if _, ok := check(root, math.MinInt, math.MaxInt); !ok {
			fails++
		}
		if len(ref) < minNodes(height(root)) { // a tree this tall needs at least this many keys
			fails++
		}
	}
	var keys, want []int
	inorder(root, &keys)
	for k := range ref {
		want = append(want, k)
	}
	slices.Sort(want)
	if !slices.Equal(keys, want) {
		fails++
	}
	fmt.Printf("20000 random operations on a map and an AVL tree (%d keys left), failures: %d\n",
		len(keys), fails)

	// --- 5. Deleting in sorted order is the mirror of inserting in sorted order ---
	root = nil
	for k := 1; k <= 2000; k++ {
		var added bool
		root = insert(root, k, &added)
	}
	before := root.height
	for k := 1; k <= 1900; k++ {
		var removed bool
		root = remove(root, k, &removed)
	}
	_, ok := check(root, math.MinInt, math.MaxInt)
	fmt.Printf("\n2000 sorted inserts: height %d. After deleting the 1900 smallest keys: height %d, valid %v\n",
		before, root.height, ok)

	// --- 6. The height bound, from the smallest possible AVL trees ---
	fmt.Println("\nheight   fewest nodes in an AVL tree of that height")
	for _, h := range []int{5, 10, 20, 30} {
		fmt.Printf("%6d   %d\n", h, minNodes(h))
	}
	h := 1
	for minNodes(h+1) <= 1_000_000 {
		h++
	}
	fmt.Printf("a tree of 1,000,000 keys has height at most %d (a perfect tree would need 20)\n", h)
}
