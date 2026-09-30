// 63_segment_tree.go — Range queries over changing data, for any operation.
//
// A Fenwick tree (demo 62) handles sums. A SEGMENT TREE handles any
// associative operation: sum, minimum, maximum, gcd, string concatenation,
// matrix product. Each node stores the answer for a range of the array:
//
//	           [0..7]
//	   [0..3]         [4..7]
//	[0..1] [2..3]  [4..5] [6..7]
//	[0] [1] [2] [3] [4] [5] [6] [7]     leaves = the array itself
//
// A node's value is op(left child, right child). Any query range splits into
// at most about 2 log2(n) nodes that lie completely inside it, so:
//
//	Set(i, v)     one leaf changes, its log2(n) ancestors are recomputed
//	Query(l, r)   combine the O(log n) whole nodes that tile [l, r]
//
// The demo covers four things:
//
//  1. a generic tree over any monoid (op plus identity), tested with sum,
//     minimum, gcd and a NON-commutative operation
//  2. LAZY propagation: add a value to a whole range in O(log n)
//  3. descending the tree: "first position holding at least x"
//  4. a sparse table, the static alternative with O(1) minimum queries
//
// Run: go run 63_segment_tree.go
package main

import (
	"fmt"
	"math"
	"math/bits"
	"math/rand"
	"strings"
)

// Seg is a segment tree over a slice of T. op must be associative and id must
// satisfy op(id, x) = op(x, id) = x; both are needed because a query returns
// id for the parts of a node that lie outside the query range.
type Seg[T any] struct {
	n      int
	t      []T // t[1] is the root; the children of node k are 2k and 2k+1
	id     T
	op     func(a, b T) T
	visits int // nodes touched by the last Query, to measure the cost
}

func NewSeg[T any](a []T, id T, op func(a, b T) T) *Seg[T] {
	s := &Seg[T]{n: len(a), t: make([]T, 4*max(1, len(a))), id: id, op: op}
	if s.n > 0 {
		s.build(1, 0, s.n-1, a)
	}
	return s
}

// 4n slots always suffice for the recursive layout used here.
func (s *Seg[T]) build(node, lo, hi int, a []T) {
	if lo == hi {
		s.t[node] = a[lo]
		return
	}
	mid := (lo + hi) / 2
	s.build(2*node, lo, mid, a)
	s.build(2*node+1, mid+1, hi, a)
	s.t[node] = s.op(s.t[2*node], s.t[2*node+1])
}

// Set replaces a[i] with v and recomputes the nodes above the leaf.
func (s *Seg[T]) Set(i int, v T) { s.set(1, 0, s.n-1, i, v) }

func (s *Seg[T]) set(node, lo, hi, i int, v T) {
	if lo == hi {
		s.t[node] = v
		return
	}
	mid := (lo + hi) / 2
	if i <= mid {
		s.set(2*node, lo, mid, i, v)
	} else {
		s.set(2*node+1, mid+1, hi, i, v)
	}
	s.t[node] = s.op(s.t[2*node], s.t[2*node+1])
}

// Query returns op over a[l..r], both included. Three cases per node: the
// node is outside the query (contribute id), completely inside (use its
// stored value), or partly inside (split into the two children). The left
// part is always combined before the right part, so the order of the
// elements is preserved and non-commutative operations work.
func (s *Seg[T]) Query(l, r int) T {
	s.visits = 0
	return s.query(1, 0, s.n-1, l, r)
}

func (s *Seg[T]) query(node, lo, hi, l, r int) T {
	s.visits++
	if r < lo || hi < l {
		return s.id
	}
	if l <= lo && hi <= r {
		return s.t[node]
	}
	mid := (lo + hi) / 2
	return s.op(s.query(2*node, lo, mid, l, r), s.query(2*node+1, mid+1, hi, l, r))
}

// firstAtLeast returns the smallest index whose value is >= x in a MAXIMUM
// tree, or -1. If the left child's maximum is big enough the answer is on the
// left, otherwise on the right: one root-to-leaf walk, O(log n).
func firstAtLeast(s *Seg[int], x int) int {
	if s.n == 0 || s.t[1] < x {
		return -1
	}
	node, lo, hi := 1, 0, s.n-1
	for lo < hi {
		mid := (lo + hi) / 2
		if s.t[2*node] >= x {
			node, hi = 2*node, mid
		} else {
			node, lo = 2*node+1, mid+1
		}
	}
	return lo
}

// ---------------------------------------------------------------------------
// Lazy propagation: range add, range sum.
// ---------------------------------------------------------------------------

// LazySum keeps, next to each node's sum, a PENDING addition that applies to
// every element of the node's range but has not been passed to the children.
// A range that covers a node completely stops there and leaves a note; the
// note is pushed down only when a later operation needs to look inside.
type LazySum struct {
	n   int
	sum []int
	add []int
}

func NewLazySum(a []int) *LazySum {
	s := &LazySum{n: len(a), sum: make([]int, 4*max(1, len(a))), add: make([]int, 4*max(1, len(a)))}
	if s.n > 0 {
		s.build(1, 0, s.n-1, a)
	}
	return s
}

func (s *LazySum) build(node, lo, hi int, a []int) {
	if lo == hi {
		s.sum[node] = a[lo]
		return
	}
	mid := (lo + hi) / 2
	s.build(2*node, lo, mid, a)
	s.build(2*node+1, mid+1, hi, a)
	s.sum[node] = s.sum[2*node] + s.sum[2*node+1]
}

// apply adds v to every element of the node's range in O(1): the sum grows by
// v times the range length, and the note records that the children are late.
func (s *LazySum) apply(node, lo, hi, v int) {
	s.sum[node] += v * (hi - lo + 1)
	s.add[node] += v
}

// push delivers the pending note to both children. It MUST run before
// descending into a node, or the children would answer with old values.
func (s *LazySum) push(node, lo, hi int) {
	if s.add[node] != 0 {
		mid := (lo + hi) / 2
		s.apply(2*node, lo, mid, s.add[node])
		s.apply(2*node+1, mid+1, hi, s.add[node])
		s.add[node] = 0
	}
}

func (s *LazySum) RangeAdd(l, r, v int) { s.rangeAdd(1, 0, s.n-1, l, r, v) }

func (s *LazySum) rangeAdd(node, lo, hi, l, r, v int) {
	if r < lo || hi < l {
		return
	}
	if l <= lo && hi <= r {
		s.apply(node, lo, hi, v) // fully covered: leave a note, do not descend
		return
	}
	s.push(node, lo, hi)
	mid := (lo + hi) / 2
	s.rangeAdd(2*node, lo, mid, l, r, v)
	s.rangeAdd(2*node+1, mid+1, hi, l, r, v)
	s.sum[node] = s.sum[2*node] + s.sum[2*node+1]
}

func (s *LazySum) Sum(l, r int) int { return s.query(1, 0, s.n-1, l, r) }

func (s *LazySum) query(node, lo, hi, l, r int) int {
	if r < lo || hi < l {
		return 0
	}
	if l <= lo && hi <= r {
		return s.sum[node]
	}
	s.push(node, lo, hi)
	mid := (lo + hi) / 2
	return s.query(2*node, lo, mid, l, r) + s.query(2*node+1, mid+1, hi, l, r)
}

// ---------------------------------------------------------------------------
// Sparse table: static minimum queries in O(1).
// ---------------------------------------------------------------------------

// SparseMin stores, for every start i and every power of two 2^k, the minimum
// of a[i .. i+2^k-1]. Level k is built from level k-1 with one min per entry.
// A query covers [l, r] with two OVERLAPPING blocks of the same power of two.
// Overlap is harmless for min (and max, gcd) because using an element twice
// does not change the answer; it would double-count in a sum.
type SparseMin struct{ level [][]int }

func NewSparseMin(a []int) *SparseMin {
	levels := [][]int{append([]int(nil), a...)}
	for k := 1; 1<<k <= len(a); k++ {
		prev := levels[k-1]
		cur := make([]int, len(a)-(1<<k)+1)
		for i := range cur {
			cur[i] = min(prev[i], prev[i+1<<(k-1)])
		}
		levels = append(levels, cur)
	}
	return &SparseMin{level: levels}
}

func (s *SparseMin) Query(l, r int) int {
	k := bits.Len(uint(r-l+1)) - 1 // largest k with 2^k <= length
	return min(s.level[k][l], s.level[k][r-(1<<k)+1])
}

func gcd(a, b int) int {
	for b != 0 {
		a, b = b, a%b
	}
	return a
}

func main() {
	// --- 1. One structure, several operations ---
	a := []int{2, 5, 1, 4, 9, 3}
	sum := NewSeg(a, 0, func(x, y int) int { return x + y })
	lo := NewSeg(a, math.MaxInt, func(x, y int) int { return min(x, y) })
	fmt.Println("a =", a)
	fmt.Println("sum a[1..4] =", sum.Query(1, 4), "(nodes visited:", sum.visits, ")  min a[1..4] =", lo.Query(1, 4))
	sum.Set(2, 10)
	lo.Set(2, 10)
	fmt.Println("after a[2] = 10: sum a[1..4] =", sum.Query(1, 4), " min a[1..4] =", lo.Query(1, 4))

	// --- 2. Random tests: four different operations against brute force ---
	rng := rand.New(rand.NewSource(63))
	type brute func(vals []int, l, r int) int
	checks := []struct {
		name string
		id   int
		op   func(x, y int) int
		ref  brute
	}{
		{"sum", 0, func(x, y int) int { return x + y }, func(v []int, l, r int) int {
			s := 0
			for _, x := range v[l : r+1] {
				s += x
			}
			return s
		}},
		{"min", math.MaxInt, func(x, y int) int { return min(x, y) }, func(v []int, l, r int) int {
			m := math.MaxInt
			for _, x := range v[l : r+1] {
				m = min(m, x)
			}
			return m
		}},
		{"gcd", 0, gcd, func(v []int, l, r int) int {
			g := 0
			for _, x := range v[l : r+1] {
				g = gcd(g, x)
			}
			return g
		}},
	}
	for _, c := range checks {
		fails := 0
		for t := 0; t < 300; t++ {
			n := 1 + rng.Intn(40)
			vals := make([]int, n)
			for i := range vals {
				vals[i] = 1 + rng.Intn(60)
			}
			seg := NewSeg(vals, c.id, c.op)
			for q := 0; q < 40; q++ {
				if rng.Intn(3) == 0 {
					i, v := rng.Intn(n), 1+rng.Intn(60)
					seg.Set(i, v)
					vals[i] = v
				} else {
					l := rng.Intn(n)
					r := l + rng.Intn(n-l)
					if seg.Query(l, r) != c.ref(vals, l, r) {
						fails++
					}
				}
			}
		}
		fmt.Printf("%-3s tree vs brute force on 300 random arrays, failures: %d\n", c.name, fails)
	}
	// Concatenation is associative but NOT commutative: swapping the children
	// would reverse the text. The test passes only if Query keeps the order.
	fails := 0
	for t := 0; t < 300; t++ {
		n := 1 + rng.Intn(30)
		letters := make([]string, n)
		for i := range letters {
			letters[i] = string(rune('a' + rng.Intn(26)))
		}
		seg := NewSeg(letters, "", func(x, y string) string { return x + y })
		for q := 0; q < 20; q++ {
			l := rng.Intn(n)
			r := l + rng.Intn(n-l)
			if seg.Query(l, r) != strings.Join(letters[l:r+1], "") {
				fails++
			}
		}
	}
	fmt.Println("concat tree (order matters) vs strings.Join, failures:", fails)

	// --- 3. Cost of a query ---
	const big = 100000
	vals := make([]int, big)
	for i := range vals {
		vals[i] = rng.Intn(1000)
	}
	seg := NewSeg(vals, 0, func(x, y int) int { return x + y })
	worst := 0
	for q := 0; q < 20000; q++ {
		l := rng.Intn(big)
		seg.Query(l, l+rng.Intn(big-l))
		worst = max(worst, seg.visits)
	}
	fmt.Printf("\nn = %d: most nodes visited by 20000 random queries: %d (4*ceil(log2 n) = %d)\n",
		big, worst, 4*int(math.Ceil(math.Log2(big))))

	// --- 4. Lazy range add against a plain array ---
	fails = 0
	for t := 0; t < 200; t++ {
		n := 1 + rng.Intn(60)
		arr := make([]int, n)
		for i := range arr {
			arr[i] = rng.Intn(20)
		}
		lazy := NewLazySum(arr)
		for q := 0; q < 60; q++ {
			l := rng.Intn(n)
			r := l + rng.Intn(n-l)
			if rng.Intn(2) == 0 {
				v := rng.Intn(21) - 10
				lazy.RangeAdd(l, r, v)
				for i := l; i <= r; i++ {
					arr[i] += v
				}
			} else {
				want := 0
				for _, x := range arr[l : r+1] {
					want += x
				}
				if lazy.Sum(l, r) != want {
					fails++
				}
			}
		}
	}
	fmt.Println("lazy RangeAdd/Sum vs a plain array, failures:", fails)
	lz := NewLazySum(make([]int, 1_000_000))
	lz.RangeAdd(0, 999_999, 3)
	lz.RangeAdd(250_000, 749_999, 4)
	fmt.Println("1,000,000 zeros: +3 everywhere, +4 on the middle half; Sum(0, 999999) =", lz.Sum(0, 999_999),
		"(3,000,000 + 2,000,000)")

	// --- 5. Descending the tree ---
	fails = 0
	for t := 0; t < 300; t++ {
		n := 1 + rng.Intn(40)
		arr := make([]int, n)
		for i := range arr {
			arr[i] = rng.Intn(100)
		}
		mx := NewSeg(arr, -1, func(x, y int) int { return max(x, y) })
		for q := 0; q < 30; q++ {
			if rng.Intn(3) == 0 {
				i, v := rng.Intn(n), rng.Intn(100)
				mx.Set(i, v)
				arr[i] = v
				continue
			}
			x := rng.Intn(110)
			want := -1
			for i, v := range arr {
				if v >= x {
					want = i
					break
				}
			}
			if firstAtLeast(mx, x) != want {
				fails++
			}
		}
	}
	fmt.Println("firstAtLeast vs a linear scan, failures:", fails)

	// --- 6. Static minimum: sparse table ---
	fails = 0
	for t := 0; t < 300; t++ {
		n := 1 + rng.Intn(80)
		arr := make([]int, n)
		for i := range arr {
			arr[i] = rng.Intn(1000)
		}
		sp := NewSparseMin(arr)
		for q := 0; q < 40; q++ {
			l := rng.Intn(n)
			r := l + rng.Intn(n-l)
			want := arr[l]
			for _, v := range arr[l : r+1] {
				want = min(want, v)
			}
			if sp.Query(l, r) != want {
				fails++
			}
		}
	}
	fmt.Println("sparse table minimum vs a linear scan, failures:", fails)
	sp := NewSparseMin(vals)
	cells := 0
	for _, lv := range sp.level {
		cells += len(lv)
	}
	fmt.Printf("sparse table for n = %d stores %d numbers (segment tree: %d slots); a query reads exactly 2\n",
		big, cells, len(seg.t))
}
