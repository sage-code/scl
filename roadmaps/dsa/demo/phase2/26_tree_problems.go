// 26_tree_problems.go — Thinking in subtrees.
//
// Nearly every binary-tree problem is solved by one question:
// "if I already had the answer for the left and right subtrees, how would I
// combine them into the answer for this node?" That is post-order thinking.
// When the value you RETURN is not the value you are asked for (diameter,
// balance), return a helper value and track the answer on the side.
//
// Run: go run 26_tree_problems.go
package main

import (
	"fmt"
	"strconv"
	"strings"
)

type Node struct {
	Val         int
	Left, Right *Node
}

// maxDepth: answer(node) = 1 + max(answer(left), answer(right)).
func maxDepth(n *Node) int {
	if n == nil {
		return 0
	}
	return 1 + max(maxDepth(n.Left), maxDepth(n.Right))
}

// diameter is the longest path (in edges) between any two nodes. The path
// through a node uses depth(left) + depth(right) edges; the function RETURNS
// depth but RECORDS the best diameter seen. One pass: O(n).
func diameter(root *Node) int {
	best := 0
	var depth func(n *Node) int
	depth = func(n *Node) int {
		if n == nil {
			return 0
		}
		l, r := depth(n.Left), depth(n.Right)
		best = max(best, l+r) // longest path bending at n
		return 1 + max(l, r)
	}
	depth(root)
	return best
}

// isBalanced: every node's subtrees differ in height by at most 1.
// Returning -1 as a "not balanced" signal stops the work early; calling
// maxDepth at every node instead would cost O(n^2) on a degenerate tree.
func isBalanced(root *Node) bool {
	var check func(n *Node) int
	check = func(n *Node) int {
		if n == nil {
			return 0
		}
		l := check(n.Left)
		if l < 0 {
			return -1
		}
		r := check(n.Right)
		if r < 0 || l-r > 1 || r-l > 1 {
			return -1
		}
		return 1 + max(l, r)
	}
	return check(root) >= 0
}

// hasPathSum: is there a root-to-leaf path whose values add to target?
// Pre-order thinking: pass the remaining target DOWN the tree.
func hasPathSum(n *Node, target int) bool {
	if n == nil {
		return false
	}
	rest := target - n.Val
	if n.Left == nil && n.Right == nil { // a leaf ends a path
		return rest == 0
	}
	return hasPathSum(n.Left, rest) || hasPathSum(n.Right, rest)
}

// lowestCommonAncestor of nodes with values p and q (both present).
// If p and q are found in different subtrees, this node is where their
// paths meet. Otherwise the answer is whichever subtree found something.
func lowestCommonAncestor(n *Node, p, q int) *Node {
	if n == nil || n.Val == p || n.Val == q {
		return n
	}
	l := lowestCommonAncestor(n.Left, p, q)
	r := lowestCommonAncestor(n.Right, p, q)
	if l != nil && r != nil {
		return n
	}
	if l != nil {
		return l
	}
	return r
}

// mirror swaps children everywhere, in place.
func mirror(n *Node) *Node {
	if n == nil {
		return nil
	}
	n.Left, n.Right = mirror(n.Right), mirror(n.Left)
	return n
}

// serialize writes the tree in pre-order with "#" for empty children, which
// makes the shape unambiguous: "1,2,#,#,3,#,#". deserialize reads it back
// with the same recursion. Used to store trees in files or send them over
// a network.
func serialize(n *Node) string {
	var parts []string
	var walk func(n *Node)
	walk = func(n *Node) {
		if n == nil {
			parts = append(parts, "#")
			return
		}
		parts = append(parts, strconv.Itoa(n.Val))
		walk(n.Left)
		walk(n.Right)
	}
	walk(n)
	return strings.Join(parts, ",")
}

func deserialize(s string) (*Node, error) {
	tokens := strings.Split(s, ",")
	pos := 0
	var build func() (*Node, error)
	build = func() (*Node, error) {
		if pos >= len(tokens) {
			return nil, fmt.Errorf("unexpected end of input")
		}
		tok := tokens[pos]
		pos++
		if tok == "#" {
			return nil, nil
		}
		v, err := strconv.Atoi(tok)
		if err != nil {
			return nil, err
		}
		n := &Node{Val: v}
		if n.Left, err = build(); err != nil {
			return nil, err
		}
		if n.Right, err = build(); err != nil {
			return nil, err
		}
		return n, nil
	}
	root, err := build()
	if err == nil && pos != len(tokens) {
		err = fmt.Errorf("%d unused tokens", len(tokens)-pos)
	}
	return root, err
}

func main() {
	//	        5
	//	      /   \
	//	     4     8
	//	    /     / \
	//	   11    13  4
	//	  /  \        \
	//	 7    2        1
	root := &Node{5,
		&Node{4, &Node{11, &Node{Val: 7}, &Node{Val: 2}}, nil},
		&Node{8, &Node{Val: 13}, &Node{4, nil, &Node{Val: 1}}},
	}
	fmt.Println("maxDepth:", maxDepth(root))
	fmt.Println("diameter:", diameter(root), "edges (7 -> 11 -> 4 -> 5 -> 8 -> 4 -> 1)")
	fmt.Println("balanced:", isBalanced(root))
	fmt.Println("path sum 22:", hasPathSum(root, 22), "(5+4+11+2)")
	fmt.Println("path sum 26:", hasPathSum(root, 26), "(5+8+13)")
	fmt.Println("path sum 10:", hasPathSum(root, 10))
	fmt.Println("LCA(7, 2): ", lowestCommonAncestor(root, 7, 2).Val)
	fmt.Println("LCA(7, 13):", lowestCommonAncestor(root, 7, 13).Val)

	s := serialize(root)
	fmt.Println("\nserialized:  ", s)
	copyRoot, err := deserialize(s)
	fmt.Println("round trip ok:", err == nil && serialize(copyRoot) == s)
	mirror(copyRoot)
	fmt.Println("mirrored:    ", serialize(copyRoot))
	_, err = deserialize("1,2,#")
	fmt.Println("bad input:   ", err)
}
