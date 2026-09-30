// 69_bit_manipulation.go — Working with the bits of an integer.
//
// An integer is 64 yes/no flags that the processor handles in ONE
// instruction. Bit tricks matter for three reasons: a set of small numbers
// fits in a machine word (a bitmask, used by the DP in demo 54), a bitset
// packs 64 flags per word (8 times smaller than []bool, and 64 elements per
// operation), and a few identities replace loops entirely.
//
// The operators, with Go's spelling:
//
//	a & b     AND      both bits set          test / keep bits
//	a | b     OR       either bit set         set bits
//	a ^ b     XOR      exactly one set        toggle, find the difference
//	a &^ b    AND NOT  bits of a not in b     clear bits (Go-specific)
//	a << k    shift left: multiply by 2^k     a >> k   shift right: divide by 2^k
//
// Two identities do most of the work:
//
//	x & (x-1)   clears the LOWEST set bit    (subtracting 1 flips the lowest 1
//	x & -x      isolates the lowest set bit   and the zeros below it)
//
// Everything is checked against an obvious loop.
//
// Run: go run 69_bit_manipulation.go
package main

import (
	"fmt"
	"math/bits"
	"math/rand"
	"slices"
)

// popcount counts set bits by clearing the lowest one until nothing is left:
// one iteration per SET bit, not per bit position.
func popcount(x uint) int {
	n := 0
	for ; x != 0; x &= x - 1 {
		n++
	}
	return n
}

func popcountLoop(x uint) int {
	n := 0
	for i := 0; i < 64; i++ {
		n += int(x >> i & 1)
	}
	return n
}

// isPowerOfTwo: a power of two has exactly one set bit, so clearing it leaves 0.
func isPowerOfTwo(x uint) bool { return x != 0 && x&(x-1) == 0 }

// forEachSubmask calls visit for every subset of the bits of mask, including
// mask itself and 0. Subtracting 1 turns the lowest set bit of sub into 0 and
// all lower bits into 1; AND-ing with mask throws away the lower bits that are
// not in mask. That is "the next smaller subset". Total: 2^popcount(mask).
func forEachSubmask(mask uint, visit func(sub uint)) {
	for sub := mask; ; sub = (sub - 1) & mask {
		visit(sub)
		if sub == 0 {
			return
		}
	}
}

// gray returns the n-th Gray code: consecutive numbers differ in one bit.
func gray(n uint) uint { return n ^ n>>1 }

// nextSamePopcount is Gosper's hack: the next larger number with the same
// number of set bits. It moves the lowest block of ones one place left and
// puts the leftover ones at the bottom.
func nextSamePopcount(x uint) uint {
	c := x & -x // lowest set bit
	r := x + c  // carries through the lowest block of ones
	return (r^x)>>2/c | r
}

// singleNumber: every value appears twice except one. XOR cancels equal
// values (a^a = 0, a^0 = a), and is commutative, so the pairs vanish.
func singleNumber(nums []int) int {
	x := 0
	for _, v := range nums {
		x ^= v
	}
	return x
}

// twoSingles: two values appear once, all others twice. XOR of everything is
// a^b, which is non-zero; any set bit of it is a bit where a and b differ.
// Split the numbers by that bit: a and b land in different groups, and each
// group is a singleNumber problem.
func twoSingles(nums []int) (int, int) {
	all := singleNumber(nums)
	bit := all & -all
	a := 0
	for _, v := range nums {
		if v&bit != 0 {
			a ^= v
		}
	}
	return a, all ^ a
}

// swapXor swaps without a temporary. It is a classic puzzle and a real trap:
// when both pointers point at the SAME variable, the first line zeroes it.
func swapXor(a, b *int) {
	*a ^= *b
	*b ^= *a
	*a ^= *b
}

// ---------------------------------------------------------------------------
// Bitset: 64 flags per word.
// ---------------------------------------------------------------------------

type Bitset []uint64

func NewBitset(n int) Bitset { return make(Bitset, (n+63)/64) }

func (b Bitset) Set(i int)       { b[i>>6] |= 1 << (i & 63) } // i>>6 = i/64, i&63 = i%64
func (b Bitset) Clear(i int)     { b[i>>6] &^= 1 << (i & 63) }
func (b Bitset) Test(i int) bool { return b[i>>6]>>(i&63)&1 == 1 }

func (b Bitset) Count() int {
	n := 0
	for _, w := range b {
		n += bits.OnesCount64(w)
	}
	return n
}

// Intersect keeps only the bits present in both: 64 elements per operation.
func (b Bitset) Intersect(o Bitset) {
	for i := range b {
		b[i] &= o[i]
	}
}

// sieveBits counts primes below n with the sieve of Eratosthenes, storing one
// bit per number ("is composite").
func sieveBits(n int) (primes int, bytes int) {
	composite := NewBitset(n)
	for i := 2; i*i < n; i++ {
		if !composite.Test(i) {
			for j := i * i; j < n; j += i {
				composite.Set(j)
			}
		}
	}
	return n - 2 - composite.Count(), len(composite) * 8
}

func sieveBools(n int) (primes int, bytes int) {
	composite := make([]bool, n)
	for i := 2; i*i < n; i++ {
		if !composite[i] {
			for j := i * i; j < n; j += i {
				composite[j] = true
			}
		}
	}
	for i := 2; i < n; i++ {
		if !composite[i] {
			primes++
		}
	}
	return primes, n
}

func main() {
	rng := rand.New(rand.NewSource(69))

	// --- 1. The two identities, on one number ---
	x := uint(0b10110100)
	fmt.Printf("x            = %08b\n", x)
	fmt.Printf("x - 1        = %08b\n", x-1)
	fmt.Printf("x & (x-1)    = %08b   lowest set bit cleared\n", x&(x-1))
	fmt.Printf("x & -x       = %08b   only the lowest set bit\n", x&-x)
	fmt.Printf("x &^ 0b110   = %08b   bits 1 and 2 cleared (AND NOT)\n", x&^0b110)
	var shift uint = 64
	fmt.Println("in Go, shifting by the width or more gives 0, not undefined behaviour: 1<<64 =", uint64(1)<<shift)

	// --- 2. Counting and testing ---
	fails := 0
	for t := 0; t < 20000; t++ {
		v := uint(rng.Uint64()) >> rng.Intn(64) // vary how many bits are set
		if popcount(v) != popcountLoop(v) || popcount(v) != bits.OnesCount(v) {
			fails++
		}
		if isPowerOfTwo(v) != (popcountLoop(v) == 1) {
			fails++
		}
	}
	fmt.Println("\npopcount (clear-lowest loop), 64-step loop and bits.OnesCount agree on 20000 values, failures:", fails)

	// --- 3. Enumerating subsets of a mask ---
	mask := uint(0b101101)
	var subs []uint
	forEachSubmask(mask, func(s uint) { subs = append(subs, s) })
	fmt.Printf("\nsubsets of %06b in decreasing order: ", mask)
	for _, s := range subs {
		fmt.Printf("%06b ", s)
	}
	fmt.Println()
	fails = 0
	for t := 0; t < 300; t++ {
		m := uint(rng.Intn(1 << 12))
		var got []uint
		forEachSubmask(m, func(s uint) { got = append(got, s) })
		var want []uint // brute force: every number up to m whose bits all lie inside m
		for s := uint(0); s <= m; s++ {
			if s&^m == 0 {
				want = append(want, s)
			}
		}
		slices.Sort(got)
		if !slices.Equal(got, want) {
			fails++
		}
	}
	fmt.Println("submask enumeration vs filtering every number up to the mask, failures:", fails)

	// --- 4. Gray code and Gosper's hack ---
	fmt.Print("\nGray code 0..7: ")
	for i := uint(0); i < 8; i++ {
		fmt.Printf("%03b ", gray(i))
	}
	fails = 0
	for i := uint(1); i < 1<<16; i++ {
		if popcount(gray(i)^gray(i-1)) != 1 {
			fails++
		}
	}
	fmt.Println("\nneighbouring Gray codes differ in exactly one bit for 0..65535, failures:", fails)
	fails = 0
	for n := 1; n <= 12; n++ {
		for k := 1; k <= n; k++ {
			var got []uint
			for s := uint(1)<<k - 1; s < 1<<n; s = nextSamePopcount(s) {
				got = append(got, s)
			}
			var want []uint
			for s := uint(0); s < 1<<n; s++ {
				if popcount(s) == k {
					want = append(want, s)
				}
			}
			if !slices.Equal(got, want) { // Gosper's hack must yield them in increasing order
				fails++
			}
		}
	}
	fmt.Println("Gosper's hack enumerates every k-subset of n bits in order for n <= 12, failures:", fails)

	// --- 5. XOR puzzles ---
	fmt.Println("\nsingleNumber([4 1 2 1 2]) =", singleNumber([]int{4, 1, 2, 1, 2}))
	a, b := twoSingles([]int{1, 2, 1, 3, 2, 5})
	fmt.Println("twoSingles([1 2 1 3 2 5]) =", a, b)
	fails = 0
	for t := 0; t < 2000; t++ {
		var nums []int
		seen := map[int]bool{}
		pairs := 1 + rng.Intn(8)
		for len(seen) < pairs {
			v := rng.Intn(1000)
			if !seen[v] {
				seen[v] = true
				nums = append(nums, v, v) // a pair
			}
		}
		p, q := 2000+rng.Intn(1000), 3000+rng.Intn(1000) // two distinct values that appear once
		nums = append(nums, p, q)
		rng.Shuffle(len(nums), func(i, j int) { nums[i], nums[j] = nums[j], nums[i] })
		r1, r2 := twoSingles(nums)
		if !(r1 == p && r2 == q || r1 == q && r2 == p) {
			fails++
		}
	}
	fmt.Println("twoSingles vs the planted answer on 2000 shuffled arrays, failures:", fails)
	u, v := 3, 5
	swapXor(&u, &v)
	same := 7
	swapXor(&same, &same)
	fmt.Println("swapXor(3, 5) gives", u, v, "but swapXor(&same, &same) turns 7 into", same)

	// --- 6. Bitset ---
	const n = 5_000_000
	p1, bytes1 := sieveBits(n)
	p2, bytes2 := sieveBools(n)
	fmt.Printf("\nprimes below %d: %d with a bitset (%d bytes), %d with []bool (%d bytes)\n", n, p1, bytes1, p2, bytes2)
	s1, s2 := NewBitset(1000), NewBitset(1000)
	for i := 0; i < 1000; i += 2 {
		s1.Set(i) // multiples of 2
	}
	for i := 0; i < 1000; i += 3 {
		s2.Set(i) // multiples of 3
	}
	s1.Intersect(s2)
	fmt.Println("multiples of 2 and 3 below 1000 (multiples of 6):", s1.Count(), "in", len(s1), "word operations")
	s1.Clear(0)
	fmt.Println("after Clear(0):", s1.Count(), " Test(0) =", s1.Test(0), " Test(6) =", s1.Test(6))
}
