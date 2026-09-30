// 08_recursive_to_iterative.go — Replacing the call stack with your own stack.
//
// Every recursive algorithm can be rewritten as a loop plus an explicit
// stack. You do this when:
//   - recursion depth could be huge (deep trees, long linked chains);
//   - you need to pause/resume the traversal (iterators, generators);
//   - you want to control memory precisely.
//
// Example problem: a file-system-like tree. Compute the total size of all
// files and list every path. We solve it recursively, then iteratively,
// and check that both agree.
//
// Run: go run 08_recursive_to_iterative.go
package main

import (
	"fmt"
	"strings"
)

// Node is either a file (Size > 0, no children) or a directory.
type Node struct {
	Name     string
	Size     int
	Children []*Node
}

// totalRecursive: size(node) = node.Size + sum of size(child).
// The Go runtime keeps one frame per level of the tree for us.
func totalRecursive(n *Node) int {
	total := n.Size
	for _, c := range n.Children {
		total += totalRecursive(c)
	}
	return total
}

// totalIterative does the same work with an explicit stack (a slice).
// Pattern: push the root; while the stack is not empty, pop one node,
// process it, and push its children. Addition is order-independent, so
// the visiting order does not change the result.
func totalIterative(root *Node) int {
	total := 0
	stack := []*Node{root}
	for len(stack) > 0 {
		n := stack[len(stack)-1]     // peek at the top
		stack = stack[:len(stack)-1] // pop
		total += n.Size
		stack = append(stack, n.Children...) // push all children
	}
	return total
}

// frame is what the call stack would hold implicitly: the node AND the
// path that led to it. Making state explicit is the core of the conversion.
type frame struct {
	node *Node
	path string
}

// listPaths prints every path depth-first, in the same order recursion
// would, by pushing children in REVERSE so the first child is popped first.
func listPaths(root *Node) []string {
	var out []string
	stack := []frame{{root, root.Name}}
	for len(stack) > 0 {
		f := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		out = append(out, f.path)
		for i := len(f.node.Children) - 1; i >= 0; i-- {
			c := f.node.Children[i]
			stack = append(stack, frame{c, f.path + "/" + c.Name})
		}
	}
	return out
}

// deepChain builds a directory nested `depth` levels deep: the worst case
// for recursion depth, since the tree is really a long list.
func deepChain(depth int) *Node {
	root := &Node{Name: "d0"}
	cur := root
	for i := 1; i <= depth; i++ {
		next := &Node{Name: fmt.Sprintf("d%d", i), Size: 1}
		cur.Children = []*Node{next}
		cur = next
	}
	return root
}

func main() {
	root := &Node{Name: "root", Children: []*Node{
		{Name: "docs", Children: []*Node{
			{Name: "a.txt", Size: 120},
			{Name: "b.txt", Size: 80},
		}},
		{Name: "src", Children: []*Node{
			{Name: "main.go", Size: 300},
			{Name: "lib", Children: []*Node{{Name: "util.go", Size: 150}}},
		}},
		{Name: "README", Size: 50},
	}}

	fmt.Println("recursive total:", totalRecursive(root))
	fmt.Println("iterative total:", totalIterative(root))
	fmt.Println("\npaths (depth-first, iterative):")
	for _, p := range listPaths(root) {
		depth := strings.Count(p, "/")
		fmt.Printf("%s%s\n", strings.Repeat("  ", depth), p)
	}

	// On a 1,000,000-level chain the iterative version uses a small slice
	// (the stack never holds more than one node here) while the recursive
	// version needs a million stack frames.
	chain := deepChain(1_000_000)
	fmt.Println("\ndeep chain, iterative total:", totalIterative(chain))
}
