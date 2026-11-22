// 25_binary_search_tree.go — An ordered set built on a binary search tree.
//
// BST property: for every node, all keys in its LEFT subtree are smaller and
// all keys in its RIGHT subtree are larger. Each comparison discards one
// whole subtree, so search, insert and delete cost O(h), where h is the
// height of the tree.
//
//	balanced tree   h ≈ log2(n)   1,000,000 keys -> about 20 levels
//	degenerate tree h = n         sorted input produces a linked list
//
// Unlike a hash map, a BST keeps keys ORDERED: minimum, maximum, sorted
// iteration, "next larger key" and range queries all come for free.
// Self-balancing variants (AVL, red-black) guarantee h = O(log n); they are
// covered in Advanced Trees (Phase 4).
//
// Run: go run 25_binary_search_tree.go
package main

import (
	"cmp"
	"fmt"
	"math/rand"
)

type node[K cmp.Ordered] struct {
	key         K
	left, right *node[K]
}

// BST is an ordered set of keys. cmp.Ordered covers ints, floats, strings.
type BST[K cmp.Ordered] struct {
	root *node[K]
	size int
}

// Contains walks down one path from the root: O(h).
func (t *BST[K]) Contains(k K) bool {
	n := t.root
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

// Insert adds k if absent. The recursive helper returns the (possibly new)
// subtree root, which lets the parent re-attach it without special cases.
func (t *BST[K]) Insert(k K) {
	var added bool
	t.root = insert(t.root, k, &added)
	if added {
		t.size++
	}
}

func insert[K cmp.Ordered](n *node[K], k K, added *bool) *node[K] {
	if n == nil {
		*added = true
		return &node[K]{key: k} // empty spot found: the new leaf goes here
	}
	switch {
	case k < n.key:
		n.left = insert(n.left, k, added)
	case k > n.key:
		n.right = insert(n.right, k, added)
	} // equal: already present, nothing to do (a set holds no duplicates)
	return n
}

// Delete removes k. Three cases:
//  1. leaf           -> just remove it
//  2. one child      -> the child takes the node's place
//  3. two children   -> copy the SUCCESSOR (smallest key in the right
//     subtree) into this node, then delete the successor
//     from the right subtree (it has no left child, so
//     that deletion is case 1 or 2).
func (t *BST[K]) Delete(k K) {
	var removed bool
	t.root = del(t.root, k, &removed)
	if removed {
		t.size--
	}
}

func del[K cmp.Ordered](n *node[K], k K, removed *bool) *node[K] {
	if n == nil {
		return nil // not found
	}
	switch {
	case k < n.key:
		n.left = del(n.left, k, removed)
	case k > n.key:
		n.right = del(n.right, k, removed)
	default:
		*removed = true
		if n.left == nil { // cases 1 and 2 together
			return n.right
		}
		if n.right == nil {
			return n.left
		}
		succ := n.right // case 3: leftmost node of the right subtree
		for succ.left != nil {
			succ = succ.left
		}
		n.key = succ.key
		n.right = del(n.right, succ.key, new(bool)) // don't double-count
	}
	return n
}

// Min follows left pointers; Max follows right pointers. O(h).
func (t *BST[K]) Min() (K, bool) {
	var zero K
	if t.root == nil {
		return zero, false
	}
	n := t.root
	for n.left != nil {
		n = n.left
	}
	return n.key, true
}

// Ceiling returns the smallest key >= k: the "next larger or equal" query a
// hash map cannot answer. Whenever we go left, the current node is a
// candidate answer, because everything left of it is smaller.
func (t *BST[K]) Ceiling(k K) (K, bool) {
	var best K
	found := false
	for n := t.root; n != nil; {
		if n.key >= k {
			best, found = n.key, true
			n = n.left // look for a smaller candidate that is still >= k
		} else {
			n = n.right
		}
	}
	return best, found
}

// Range appends keys in [lo, hi] in sorted order, skipping subtrees that
// cannot contain matches: O(h + number of results).
func (t *BST[K]) Range(lo, hi K) []K {
	var out []K
	var walk func(n *node[K])
	walk = func(n *node[K]) {
		if n == nil {
			return
		}
		if lo < n.key {
			walk(n.left) // left subtree may hold keys >= lo
		}
		if lo <= n.key && n.key <= hi {
			out = append(out, n.key)
		}
		if n.key < hi {
			walk(n.right)
		}
	}
	walk(t.root)
	return out
}

// valid checks the BST property using bounds passed down the tree. Checking
// only "left child < node < right child" is a classic bug: a grandchild can
// still be on the wrong side of its grandparent.
func valid[K cmp.Ordered](n *node[K], lo, hi *K) bool {
	if n == nil {
		return true
	}
	if (lo != nil && n.key <= *lo) || (hi != nil && n.key >= *hi) {
		return false
	}
	return valid(n.left, lo, &n.key) && valid(n.right, &n.key, hi)
}

func height[K cmp.Ordered](n *node[K]) int {
	if n == nil {
		return 0
	}
	return 1 + max(height(n.left), height(n.right))
}

func main() {
	var t BST[int]
	for _, k := range []int{50, 30, 70, 20, 40, 60, 80, 35, 45, 65} {
		t.Insert(k)
	}
	fmt.Println("size", t.size, "valid", valid(t.root, nil, nil), "height", height(t.root))
	fmt.Println("contains 45:", t.Contains(45), " contains 55:", t.Contains(55))
	c, _ := t.Ceiling(52)
	fmt.Println("ceiling(52):", c)
	fmt.Println("range [33, 62]:", t.Range(33, 62))

	t.Delete(20) // case 1, leaf: simply removed
	t.Delete(30) // case 2, one child left (40): the 40 subtree moves up
	t.Delete(70) // case 3, two children: replaced by its successor 80
	fmt.Println("after deletes:", t.Range(0, 100), "size", t.size, "valid", valid(t.root, nil, nil))

	// Insertion order decides the shape: random vs sorted, 2,000 keys.
	n := 2000
	var random, sorted BST[int]
	for _, k := range rand.New(rand.NewSource(1)).Perm(n) {
		random.Insert(k)
	}
	for k := 0; k < n; k++ {
		sorted.Insert(k)
	}
	fmt.Printf("\n%d keys: random-order height=%d, sorted-order height=%d\n",
		n, height(random.root), height(sorted.root))
	fmt.Println("the sorted-order tree is a linked list: every operation is O(n)")
}
