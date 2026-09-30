// 41_union_find.go — Disjoint sets (union-find).
//
// Union-find maintains a partition of elements into groups and answers
// "are x and y in the same group?" while groups keep MERGING. Uses:
// connectivity in a growing network, Kruskal's minimum spanning tree,
// detecting a cycle as edges are added, grouping duplicate accounts.
//
// Each group is a tree; its root is the group's representative.
//
//	Find(x)     follow parent links to the root
//	Union(x,y)  attach one root under the other
//
// Two small tricks make it almost O(1) per operation:
//
//	union by size     attach the SMALLER tree under the larger, so trees
//	                  stay shallow (height <= log2 n)
//	path compression  after Find, point every visited node at the root
//
// Together the amortized cost is O(α(n)), where α is the inverse Ackermann
// function: at most 4 for any n that fits in the universe.
//
// Run: go run 41_union_find.go
package main

import (
	"fmt"
	"math/rand"
)

type DSU struct {
	parent []int
	size   []int // size[r] is valid only for roots
	groups int
}

func NewDSU(n int) *DSU {
	d := &DSU{parent: make([]int, n), size: make([]int, n), groups: n}
	for i := range d.parent {
		d.parent[i] = i // every element starts as its own root
		d.size[i] = 1
	}
	return d
}

// Find returns the root of x, compressing the path on the way back.
func (d *DSU) Find(x int) int {
	root := x
	for d.parent[root] != root {
		root = d.parent[root]
	}
	for d.parent[x] != root { // second pass: repoint every node to the root
		next := d.parent[x]
		d.parent[x] = root
		x = next
	}
	return root
}

// Union merges the groups of x and y. It returns false if they were
// already in the same group — for an edge x-y that means a cycle.
func (d *DSU) Union(x, y int) bool {
	rx, ry := d.Find(x), d.Find(y)
	if rx == ry {
		return false
	}
	if d.size[rx] < d.size[ry] {
		rx, ry = ry, rx // make rx the larger tree
	}
	d.parent[ry] = rx
	d.size[rx] += d.size[ry]
	d.groups--
	return true
}

func (d *DSU) Connected(x, y int) bool { return d.Find(x) == d.Find(y) }
func (d *DSU) Size(x int) int          { return d.size[d.Find(x)] }

// NaiveDSU has neither trick: Union links root to root blindly.
type NaiveDSU struct{ parent []int }

func (d *NaiveDSU) Find(x int, steps *int) int {
	for d.parent[x] != x {
		x = d.parent[x]
		*steps++
	}
	return x
}

func (d *DSU) depth(x int) int {
	n := 0
	for d.parent[x] != x {
		x = d.parent[x]
		n++
	}
	return n
}

func main() {
	d := NewDSU(8)
	for _, e := range [][2]int{{0, 1}, {2, 3}, {1, 3}, {5, 6}} {
		d.Union(e[0], e[1])
	}
	fmt.Println("groups:", d.groups, " 0~2:", d.Connected(0, 2), " 0~5:", d.Connected(0, 5), " size(0):", d.Size(0))
	fmt.Println("adding edge 0-2 creates a cycle:", !d.Union(0, 2))

	// Oracle: a slow version that relabels a whole group on every union.
	rng := rand.New(rand.NewSource(11))
	fails := 0
	for trial := 0; trial < 200; trial++ {
		n := rng.Intn(50) + 1
		fast := NewDSU(n)
		label := make([]int, n)
		for i := range label {
			label[i] = i
		}
		for op := 0; op < 3*n; op++ {
			x, y := rng.Intn(n), rng.Intn(n)
			merged := fast.Union(x, y)
			if merged != (label[x] != label[y]) {
				fails++
			}
			old, nw := label[y], label[x]
			for i := range label {
				if label[i] == old {
					label[i] = nw
				}
			}
			a, b := rng.Intn(n), rng.Intn(n)
			if fast.Connected(a, b) != (label[a] == label[b]) {
				fails++
			}
		}
	}
	fmt.Println("random checks vs relabelling oracle, failures:", fails)

	// Worst case for the naive version: each union hangs the whole chain
	// under a single new element, building one path of length n. Finding
	// every element then walks that path: O(n^2) in total.
	const n = 1 << 14 // 16,384
	naive := &NaiveDSU{parent: make([]int, n)}
	for i := range naive.parent {
		naive.parent[i] = i
	}
	steps := 0
	for i := 0; i+1 < n; i++ {
		ri, rj := naive.Find(i, &steps), naive.Find(i+1, &steps)
		naive.parent[ri] = rj // the long chain goes under the single node
	}
	steps = 0
	for i := 0; i < n; i++ {
		naive.Find(i, &steps)
	}
	fmt.Printf("\n%d finds after a chain of naive unions: %d parent steps (%d per find)\n",
		n, steps, steps/n)

	// Worst case for union by size: always merge two trees of EQUAL size
	// (pairs, then pairs of pairs, ...). Each merge adds one level, so the
	// height reaches log2(n) = 14 — and never more.
	fast := NewDSU(n)
	for width := 1; width < n; width *= 2 {
		for i := 0; i+width < n; i += 2 * width {
			fast.Union(i, i+width)
		}
	}
	maxDepth := func() int {
		m := 0
		for i := 0; i < n; i++ {
			m = max(m, fast.depth(i))
		}
		return m
	}
	fmt.Printf("union by size, equal-size merges: max depth %d (log2 n = 14)\n", maxDepth())
	for i := 0; i < n; i++ {
		fast.Find(i) // path compression flattens every path it walks
	}
	fmt.Printf("after one Find per element:        max depth %d\n", maxDepth())
}
