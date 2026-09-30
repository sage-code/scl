// 24_tree_traversals.go — Visiting every node of a binary tree, four ways.
//
// A binary tree node has a value and up to two children. "Traversal" means
// visiting every node exactly once — O(n) time. The ORDER is what differs:
//
//	pre-order   node, left, right   copy a tree, print a directory listing
//	in-order    left, node, right   sorted order in a binary search tree
//	post-order  left, right, node   delete a tree, compute sizes bottom-up
//	level-order row by row (BFS)    shortest path in steps, printing by level
//
// The first three are depth-first and read naturally as recursion; each is
// also shown iteratively with an explicit stack. Level-order uses a queue.
//
// The tree used below:
//
//	     8
//	   /   \
//	  3     10
//	 / \      \
//	1   6      14
//	   / \    /
//	  4   7  13
//
// Run: go run 24_tree_traversals.go
package main

import (
	"fmt"
	"strings"
)

type Node struct {
	Val         int
	Left, Right *Node
}

// ---------------------------------------------------------------- recursive

// Each recursive traversal is the same three lines in a different order.
// The nil check is the base case: an empty subtree contributes nothing.
func preOrder(n *Node, out *[]int) {
	if n == nil {
		return
	}
	*out = append(*out, n.Val)
	preOrder(n.Left, out)
	preOrder(n.Right, out)
}

func inOrder(n *Node, out *[]int) {
	if n == nil {
		return
	}
	inOrder(n.Left, out)
	*out = append(*out, n.Val)
	inOrder(n.Right, out)
}

func postOrder(n *Node, out *[]int) {
	if n == nil {
		return
	}
	postOrder(n.Left, out)
	postOrder(n.Right, out)
	*out = append(*out, n.Val)
}

// ---------------------------------------------------------------- iterative

// preOrderIter: pop a node, record it, push RIGHT then LEFT so that the left
// child is popped (visited) first.
func preOrderIter(root *Node) []int {
	var out []int
	if root == nil {
		return out
	}
	stack := []*Node{root}
	for len(stack) > 0 {
		n := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		out = append(out, n.Val)
		if n.Right != nil {
			stack = append(stack, n.Right)
		}
		if n.Left != nil {
			stack = append(stack, n.Left)
		}
	}
	return out
}

// inOrderIter: walk left as far as possible, pushing the path; when you
// cannot go left, pop, record, then turn to the right subtree.
// This is exactly what an ordered-map iterator does step by step.
func inOrderIter(root *Node) []int {
	var out []int
	var stack []*Node
	cur := root
	for cur != nil || len(stack) > 0 {
		for cur != nil { // descend left, remembering the way back
			stack = append(stack, cur)
			cur = cur.Left
		}
		cur = stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		out = append(out, cur.Val)
		cur = cur.Right
	}
	return out
}

// levelOrder visits nodes row by row with a FIFO queue. Processing the queue
// in batches of its current length separates the levels.
func levelOrder(root *Node) [][]int {
	var levels [][]int
	if root == nil {
		return levels
	}
	queue := []*Node{root}
	for len(queue) > 0 {
		width := len(queue) // nodes on the current level
		var level []int
		for i := 0; i < width; i++ {
			n := queue[0]
			queue = queue[1:]
			level = append(level, n.Val)
			if n.Left != nil {
				queue = append(queue, n.Left)
			}
			if n.Right != nil {
				queue = append(queue, n.Right)
			}
		}
		levels = append(levels, level)
	}
	return levels
}

// ---------------------------------------------------------------- bottom-up

// height and size are post-order computations: a node's answer needs its
// children's answers first. height(nil) = 0 by convention here.
func height(n *Node) int {
	if n == nil {
		return 0
	}
	return 1 + max(height(n.Left), height(n.Right))
}

func size(n *Node) int {
	if n == nil {
		return 0
	}
	return 1 + size(n.Left) + size(n.Right)
}

// sideways prints the tree rotated 90° left (root at the left edge):
// a reverse in-order walk (right, node, left) with indentation by depth.
func sideways(n *Node, depth int, b *strings.Builder) {
	if n == nil {
		return
	}
	sideways(n.Right, depth+1, b)
	fmt.Fprintf(b, "%s%d\n", strings.Repeat("    ", depth), n.Val)
	sideways(n.Left, depth+1, b)
}

func main() {
	root := &Node{8,
		&Node{3, &Node{Val: 1}, &Node{6, &Node{Val: 4}, &Node{Val: 7}}},
		&Node{10, nil, &Node{14, &Node{Val: 13}, nil}},
	}

	var pre, in, post []int
	preOrder(root, &pre)
	inOrder(root, &in)
	postOrder(root, &post)
	fmt.Println("pre-order  ", pre, " iterative:", preOrderIter(root))
	fmt.Println("in-order   ", in, " iterative:", inOrderIter(root), "<- sorted: it is a BST")
	fmt.Println("post-order ", post)
	fmt.Println("level-order", levelOrder(root))
	fmt.Println("height", height(root), "size", size(root))

	var b strings.Builder
	sideways(root, 0, &b)
	fmt.Print("\nsideways (root on the left, right subtree on top):\n", b.String())
}
