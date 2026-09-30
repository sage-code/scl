// 62_fenwick_tree.go — Prefix sums that can change (Binary Indexed Tree).
//
// Prefix sums (demo 14) answer "sum of a[l..r]" in O(1) but a single update
// forces an O(n) rebuild. Summing the range directly makes the update O(1)
// and the query O(n). A FENWICK TREE balances the two: both cost O(log n),
// using one flat array and no pointers.
//
// The trick is in the indexing. Positions are 1-based, and slot i stores the
// sum of the last lowbit(i) elements ending at i, where lowbit(i) = i & -i is
// the value of the lowest set bit of i:
//
//	i        1  2   3  4     5  6   7  8
//	binary   1  10  11 100   101 110 111 1000
//	lowbit   1  2   1  4     1  2   1  8
//	covers   1  1-2 3  1-4   5  5-6 7  1-8
//
// A prefix query jumps DOWN by clearing the lowest bit (i -= lowbit(i)), an
// update jumps UP by adding it (i += lowbit(i)). Each jump changes the number
// of set bits or moves a bit higher, so there are at most log2(n) jumps.
//
// Uses shown here: point update with prefix sums, range update with point
// query, finding the k-th item, and counting inversions.
//
// Run: go run 62_fenwick_tree.go
package main

import (
	"fmt"
	"math/bits"
	"math/rand"
	"slices"
)

// Fenwick is a Fenwick tree over positions 1..n.
type Fenwick struct {
	tree []int // tree[i] = sum of the lowbit(i) elements ending at position i
}

func NewFenwick(n int) *Fenwick { return &Fenwick{tree: make([]int, n+1)} }

// FenwickFrom builds a tree from a 0-based slice in O(n), not O(n log n):
// each slot pushes its finished total into the one slot that also covers it.
func FenwickFrom(a []int) *Fenwick {
	f := NewFenwick(len(a))
	for i := 1; i <= len(a); i++ {
		f.tree[i] += a[i-1]
		if j := i + i&-i; j <= len(a) {
			f.tree[j] += f.tree[i]
		}
	}
	return f
}

// Add adds delta to position i: every slot whose range contains i changes.
func (f *Fenwick) Add(i, delta int) {
	for ; i < len(f.tree); i += i & -i {
		f.tree[i] += delta
	}
}

// Prefix returns the sum of positions 1..i. The ranges met on the way down
// are disjoint and together cover exactly 1..i.
func (f *Fenwick) Prefix(i int) int {
	sum := 0
	for ; i > 0; i -= i & -i {
		sum += f.tree[i]
	}
	return sum
}

// Range returns the sum of positions l..r (both included).
func (f *Fenwick) Range(l, r int) int { return f.Prefix(r) - f.Prefix(l-1) }

// LowerBound returns the smallest position p with Prefix(p) >= target, or
// n+1 if the total is smaller. It requires all values to be non-negative, so
// that prefix sums never decrease. The loop is a binary search that reads the
// tree directly: try to jump by the largest power of two that stays below the
// target, then by the next smaller one.
func (f *Fenwick) LowerBound(target int) int {
	n := len(f.tree) - 1
	pos := 0
	for step := 1 << (bits.Len(uint(n)) - 1); step > 0; step >>= 1 {
		if pos+step <= n && f.tree[pos+step] < target {
			pos += step
			target -= f.tree[pos]
		}
	}
	return pos + 1
}

// RangeAdd adds v to every position in l..r, when the tree stores the
// DIFFERENCE array: d[i] = a[i] - a[i-1]. The value at one position is then
// the prefix sum of the differences, so PointQuery is Prefix.
func (f *Fenwick) RangeAdd(l, r, v int) {
	f.Add(l, v)
	if r+1 < len(f.tree) {
		f.Add(r+1, -v)
	}
}

func (f *Fenwick) PointQuery(i int) int { return f.Prefix(i) }

// inversions counts pairs i < j with a[i] > a[j]. Values are replaced by
// their rank so they fit the tree, then each element asks "how many of the
// elements I have already seen are larger?" — a prefix query.
func inversions(a []int) int {
	sorted := slices.Clone(a)
	slices.Sort(sorted)
	sorted = slices.Compact(sorted)
	f := NewFenwick(len(sorted))
	count := 0
	for seen, v := range a {
		rank, _ := slices.BinarySearch(sorted, v)
		rank++ // 1-based
		count += seen - f.Prefix(rank)
		f.Add(rank, 1)
	}
	return count
}

func inversionsBrute(a []int) int {
	count := 0
	for i := range a {
		for j := i + 1; j < len(a); j++ {
			if a[i] > a[j] {
				count++
			}
		}
	}
	return count
}

func main() {
	// --- 1. What each slot stores ---
	a := []int{3, 1, 4, 1, 5, 9, 2, 6}
	f := FenwickFrom(a)
	fmt.Println("a       =", a)
	fmt.Print("slot i  = ")
	for i := 1; i <= len(a); i++ {
		fmt.Printf("%3d", i)
	}
	fmt.Print("\ncovers  = ")
	for i := 1; i <= len(a); i++ {
		fmt.Printf("%d-%d", i-i&-i+1, i)
		fmt.Print(" ")
	}
	fmt.Println("\ntree[i] =", f.tree[1:])
	fmt.Println("Prefix(6) =", f.Prefix(6), " (jumps 6 -> 4 -> 0, so tree[6] + tree[4])")
	fmt.Println("Range(3, 5) =", f.Range(3, 5))
	f.Add(4, 10) // a[4] becomes 11; slots 4 and 8 change (4 -> 8 -> stop)
	fmt.Println("after Add(4, +10): Range(3, 5) =", f.Range(3, 5), " tree =", f.tree[1:])

	// --- 2. Random updates and queries against a plain array ---
	rng := rand.New(rand.NewSource(62))
	const n = 200
	ref := make([]int, n+1) // 1-based, index 0 unused
	fw := NewFenwick(n)
	fails := 0
	for i := 0; i < 20000; i++ {
		switch rng.Intn(3) {
		case 0:
			p, d := 1+rng.Intn(n), rng.Intn(21)-10
			fw.Add(p, d)
			ref[p] += d
		case 1:
			p := rng.Intn(n + 1)
			sum := 0
			for _, v := range ref[1 : p+1] {
				sum += v
			}
			if fw.Prefix(p) != sum {
				fails++
			}
		default:
			l := 1 + rng.Intn(n)
			r := l + rng.Intn(n-l+1)
			sum := 0
			for _, v := range ref[l : r+1] {
				sum += v
			}
			if fw.Range(l, r) != sum {
				fails++
			}
		}
	}
	fmt.Println("\n20000 random Add/Prefix/Range operations vs a plain array, failures:", fails)

	// --- 3. Finding the k-th item: a Fenwick tree of counts ---
	// count[v] = how many times v is stored. The k-th smallest stored value is
	// the smallest v with Prefix(v) >= k, exactly what LowerBound computes.
	fails = 0
	for t := 0; t < 300; t++ {
		counts := NewFenwick(50)
		var items []int
		for i := 0; i < 1+rng.Intn(60); i++ {
			v := 1 + rng.Intn(50)
			counts.Add(v, 1)
			items = append(items, v)
		}
		slices.Sort(items)
		for k := 1; k <= len(items); k++ {
			if counts.LowerBound(k) != items[k-1] {
				fails++
			}
		}
		if counts.LowerBound(len(items)+1) != 51 { // no such item: n+1
			fails++
		}
	}
	fmt.Println("k-th smallest via LowerBound vs sorting, failures:", fails)

	// --- 4. Range update, point query ---
	fr := NewFenwick(n)
	arr := make([]int, n+1)
	fails = 0
	for i := 0; i < 5000; i++ {
		if rng.Intn(2) == 0 {
			l := 1 + rng.Intn(n)
			r := l + rng.Intn(n-l+1)
			v := rng.Intn(11) - 5
			fr.RangeAdd(l, r, v)
			for j := l; j <= r; j++ {
				arr[j] += v
			}
		} else if p := 1 + rng.Intn(n); fr.PointQuery(p) != arr[p] {
			fails++
		}
	}
	fmt.Println("RangeAdd/PointQuery vs a plain array, failures:", fails)

	// --- 5. Counting inversions ---
	fmt.Println("\ninversions of [2 4 1 3 5]:", inversions([]int{2, 4, 1, 3, 5}), "(2>1, 4>1, 4>3)")
	fails = 0
	for t := 0; t < 500; t++ {
		arr := make([]int, rng.Intn(60))
		for i := range arr {
			arr[i] = rng.Intn(20) // many duplicates: equal values are NOT inversions
		}
		if inversions(arr) != inversionsBrute(arr) {
			fails++
		}
	}
	fmt.Println("inversions vs all pairs on 500 random arrays, failures:", fails)
	rev := make([]int, 100000)
	for i := range rev {
		rev[i] = len(rev) - i
	}
	fmt.Println("a reversed array of 100000 numbers has", inversions(rev), "inversions (= n(n-1)/2)")

	// --- 6. Cost: how many jumps does a query need? ---
	worst := 0
	for i := 1; i <= 1_000_000; i++ {
		steps := 0
		for j := i; j > 0; j -= j & -j {
			steps++
		}
		worst = max(worst, steps)
	}
	fmt.Println("\nn = 1,000,000: the most jumps any Prefix query makes:", worst)
}
