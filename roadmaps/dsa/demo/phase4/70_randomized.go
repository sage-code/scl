// 70_randomized.go — Using random numbers on purpose.
//
// Randomness is a design tool, not only a source of test data. Two families:
//
//	LAS VEGAS    always correct, running time is random
//	             (randomized quickselect: expected O(n) on EVERY input)
//	MONTE CARLO  always fast, answer is correct with high probability
//	             (Miller-Rabin primality, Freivalds' matrix check)
//
// The typical gain is robustness: a fixed rule can be defeated by a bad input
// (quickselect with "first element as pivot" on sorted data), but no input can
// defeat a random choice, because the adversary cannot predict it. And a
// Monte Carlo error that is 1/2 per trial falls to 2^-20 after 20 independent
// trials: repetition turns a weak guarantee into a strong one.
//
// The demo covers:
//
//  1. shuffling: the tempting shuffle is biased, Fisher-Yates is uniform
//  2. reservoir sampling: a fair sample from a stream of unknown length
//  3. quickselect: the k-th smallest without sorting
//  4. Miller-Rabin: exact primality of any 64-bit number
//  5. Freivalds: checking a matrix product in O(n^2) instead of O(n^3)
//
// Results that are random are tested statistically, with fixed seeds so that
// the output is the same on every run.
//
// Run: go run 70_randomized.go
package main

import (
	"fmt"
	"math"
	"math/bits"
	"math/rand"
	"slices"
	"sort"
)

// ---------------------------------------------------------------------------
// 1. Shuffling
// ---------------------------------------------------------------------------

// shuffleBiased swaps every position with a random position of the WHOLE
// slice. It looks fair, but it makes n^n equally likely choices, and n! does
// not divide n^n, so some permutations must be more likely than others.
func shuffleBiased(a []int, rng *rand.Rand) {
	for i := range a {
		j := rng.Intn(len(a))
		a[i], a[j] = a[j], a[i]
	}
}

// shuffleFisherYates fixes position i with a random choice among the
// positions i..n-1 that are still undecided: n * (n-1) * ... * 1 = n!
// equally likely paths, one per permutation.
func shuffleFisherYates(a []int, rng *rand.Rand) {
	for i := 0; i < len(a)-1; i++ {
		j := i + rng.Intn(len(a)-i)
		a[i], a[j] = a[j], a[i]
	}
}

// chiSquare of observed permutation counts against a uniform expectation.
func chiSquare(counts map[string]int, total, outcomes int) float64 {
	expected := float64(total) / float64(outcomes)
	sum := 0.0
	for _, c := range counts {
		d := float64(c) - expected
		sum += d * d / expected
	}
	return sum
}

// ---------------------------------------------------------------------------
// 2. Reservoir sampling
// ---------------------------------------------------------------------------

// reservoir keeps k items from a stream of unknown length so that at any
// moment each item seen so far is in the sample with probability k/seen. The
// first k items are kept; item number i (counting from 1) then replaces a
// random slot with probability k/i. The probabilities telescope:
// P(item stays to the end) = k/i * (i/(i+1)) * ... * ((n-1)/n) = k/n.
func reservoir(stream []int, k int, rng *rand.Rand) []int {
	sample := make([]int, 0, k)
	for i, v := range stream {
		if i < k {
			sample = append(sample, v)
		} else if j := rng.Intn(i + 1); j < k { // probability k/(i+1)
			sample[j] = v
		}
	}
	return sample
}

// ---------------------------------------------------------------------------
// 3. Quickselect with a three-way partition
// ---------------------------------------------------------------------------

// quickselect returns the k-th smallest element (0-based) of a, rearranging a.
// It partitions around a pivot into < / == / > and keeps only the part that
// contains index k. The pivot is chosen at random unless first is true. cmps
// counts element comparisons.
func quickselect(a []int, k int, first bool, rng *rand.Rand, cmps *int) int {
	lo, hi := 0, len(a)-1
	for lo < hi {
		pi := lo
		if !first {
			pi = lo + rng.Intn(hi-lo+1)
		}
		pv := a[pi]
		lt, i, gt := lo, lo, hi // invariant: [lo,lt) < pv, [lt,i) == pv, (gt,hi] > pv
		for i <= gt {
			*cmps++
			switch {
			case a[i] < pv:
				a[lt], a[i] = a[i], a[lt]
				lt++
				i++
			case a[i] > pv:
				a[i], a[gt] = a[gt], a[i]
				gt--
			default:
				i++
			}
		}
		switch {
		case k < lt:
			hi = lt - 1
		case k > gt:
			lo = gt + 1
		default:
			return pv
		}
	}
	return a[lo]
}

// ---------------------------------------------------------------------------
// 4. Miller-Rabin primality
// ---------------------------------------------------------------------------

// mulMod computes a*b mod m for any 64-bit m: the 128-bit product is divided
// by m using the hardware instruction behind bits.Div64.
func mulMod(a, b, m uint64) uint64 {
	hi, lo := bits.Mul64(a, b)
	_, rem := bits.Div64(hi, lo, m) // requires hi < m, true because a, b < m
	return rem
}

func powMod(b, e, m uint64) uint64 {
	result := uint64(1)
	b %= m
	for ; e > 0; e >>= 1 {
		if e&1 == 1 {
			result = mulMod(result, b, m)
		}
		b = mulMod(b, b, m)
	}
	return result
}

// fermat is the simple test: if n is prime then a^(n-1) = 1 (mod n). It is
// fooled by CARMICHAEL numbers such as 561, which pass for every base that is
// coprime to them.
func fermat(n, a uint64) bool { return powMod(a, n-1, n) == 1 }

var testBases = []uint64{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}

// isPrime is Miller-Rabin. Write n-1 = d * 2^r with d odd. If n is prime, then
// for any base a either a^d = 1, or squaring a^d up to r-1 times reaches -1
// (mod n), because the only square roots of 1 modulo a prime are 1 and -1.
// A composite number fails this for most bases; the twelve smallest primes as
// bases are proven enough for every n below 3.3 * 10^24, which includes all
// 64-bit numbers. With random bases the test is Monte Carlo (error <= 1/4 per
// base); with these fixed bases it is deterministic.
func isPrime(n uint64) bool {
	if n < 2 {
		return false
	}
	for _, p := range testBases {
		if n%p == 0 {
			return n == p
		}
	}
	d, r := n-1, 0
	for d%2 == 0 {
		d /= 2
		r++
	}
	for _, a := range testBases {
		x := powMod(a, d, n)
		if x == 1 || x == n-1 {
			continue
		}
		witness := true // a proves n composite unless -1 shows up
		for i := 1; i < r; i++ {
			x = mulMod(x, x, n)
			if x == n-1 {
				witness = false
				break
			}
		}
		if witness {
			return false
		}
	}
	return true
}

// ---------------------------------------------------------------------------
// 5. Freivalds' check: is A*B == C ?
// ---------------------------------------------------------------------------

type Matrix [][]int64

func mulVec(m Matrix, v []int64) []int64 {
	out := make([]int64, len(m))
	for i, row := range m {
		for j, x := range row {
			out[i] += x * v[j]
		}
	}
	return out
}

func mul(a, b Matrix) Matrix {
	n := len(a)
	c := make(Matrix, n)
	for i := range c {
		c[i] = make([]int64, n)
		for k := 0; k < n; k++ {
			for j := 0; j < n; j++ {
				c[i][j] += a[i][k] * b[k][j]
			}
		}
	}
	return c
}

// freivalds tests A*B == C with a random 0/1 vector r: compute A*(B*r) and C*r,
// three matrix-vector products, O(n^2). If A*B == C they always agree. If not,
// they disagree for at least half of the vectors r. Repeat to shrink the error.
func freivalds(a, b, c Matrix, rounds int, rng *rand.Rand) bool {
	n := len(a)
	for t := 0; t < rounds; t++ {
		r := make([]int64, n)
		for i := range r {
			r[i] = int64(rng.Intn(2))
		}
		if !slices.Equal(mulVec(a, mulVec(b, r)), mulVec(c, r)) {
			return false // certainly wrong
		}
	}
	return true // probably right
}

func randomMatrix(n int, rng *rand.Rand) Matrix {
	m := make(Matrix, n)
	for i := range m {
		m[i] = make([]int64, n)
		for j := range m[i] {
			m[i][j] = int64(rng.Intn(10))
		}
	}
	return m
}

func main() {
	rng := rand.New(rand.NewSource(70))

	// --- 1. Shuffling three cards, a million times ---
	const trials = 600000
	biased, fair := map[string]int{}, map[string]int{}
	for t := 0; t < trials; t++ {
		a, b := []int{1, 2, 3}, []int{1, 2, 3}
		shuffleBiased(a, rng)
		shuffleFisherYates(b, rng)
		biased[fmt.Sprint(a)]++
		fair[fmt.Sprint(b)]++
	}
	fmt.Printf("%d shuffles of [1 2 3], each permutation should appear %d times\n", trials, trials/6)
	keys := make([]string, 0, 6)
	for k := range fair {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	fmt.Println("permutation   biased shuffle   Fisher-Yates")
	for _, k := range keys {
		fmt.Printf("%-12s %14d %14d\n", k, biased[k], fair[k])
	}
	fmt.Printf("chi-square (5 degrees of freedom; above 20.5 is a failure at the 0.1%% level): biased %.0f, Fisher-Yates %.1f\n",
		chiSquare(biased, trials, 6), chiSquare(fair, trials, 6))

	// --- 2. Reservoir sampling ---
	const n, k, runs = 10, 3, 200000
	stream := make([]int, n)
	for i := range stream {
		stream[i] = i
	}
	hits := make([]int, n)
	for t := 0; t < runs; t++ {
		for _, v := range reservoir(stream, k, rng) {
			hits[v]++
		}
	}
	lo, hi := hits[0], hits[0]
	for _, h := range hits {
		lo, hi = min(lo, h), max(hi, h)
	}
	fmt.Printf("\nreservoir sample of %d from %d, %d runs: each item should be chosen %d times; range %d..%d (%.1f%% spread)\n",
		k, n, runs, runs*k/n, lo, hi, 100*float64(hi-lo)/float64(runs*k/n))

	// --- 3. Quickselect ---
	fails := 0
	for t := 0; t < 3000; t++ {
		a := make([]int, 1+rng.Intn(40))
		for i := range a {
			a[i] = rng.Intn(15) // many duplicates
		}
		sorted := slices.Clone(a)
		slices.Sort(sorted)
		kth := rng.Intn(len(a))
		var c int
		if quickselect(slices.Clone(a), kth, t%2 == 0, rng, &c) != sorted[kth] {
			fails++
		}
	}
	fmt.Println("\nquickselect (first-element and random pivot) vs sorting on 3000 arrays, failures:", fails)
	const size = 20000
	sortedIn := make([]int, size)
	shuffled := make([]int, size)
	for i := range sortedIn {
		sortedIn[i], shuffled[i] = i, i
	}
	rng.Shuffle(size, func(i, j int) { shuffled[i], shuffled[j] = shuffled[j], shuffled[i] })
	fmt.Printf("comparisons to find the median of %d numbers:\n", size)
	fmt.Println("input      first-element pivot   random pivot")
	for _, in := range []struct {
		name string
		data []int
	}{{"sorted", sortedIn}, {"shuffled", shuffled}} {
		var c1, c2 int
		quickselect(slices.Clone(in.data), size/2, true, rng, &c1)
		quickselect(slices.Clone(in.data), size/2, false, rng, &c2)
		fmt.Printf("%-9s %19d %14d\n", in.name, c1, c2)
	}

	// --- 4. Miller-Rabin ---
	limit := 2_000_000
	composite := make([]bool, limit)
	for i := 2; i*i < limit; i++ {
		if !composite[i] {
			for j := i * i; j < limit; j += i {
				composite[j] = true
			}
		}
	}
	fails = 0
	for i := 0; i < limit; i++ {
		if isPrime(uint64(i)) != (i >= 2 && !composite[i]) {
			fails++
		}
	}
	fmt.Println("\nisPrime vs a sieve for every number below 2,000,000, failures:", fails)
	fmt.Println("Fermat test, base 2, on the Carmichael number 561 = 3*11*17:", fermat(561, 2), "(fooled); Miller-Rabin:", isPrime(561))
	for _, c := range []struct {
		n    uint64
		note string
	}{
		{3215031751, "composite, strong pseudoprime to bases 2, 3, 5 and 7"},
		{1<<61 - 1, "Mersenne prime 2^61-1"},
		{18446744073709551557, "the largest prime below 2^64"},
		{1000000007 * 998244353, "product of two primes near 10^9"},
	} {
		fmt.Printf("  isPrime(%d) = %v   %s\n", c.n, isPrime(c.n), c.note)
	}

	// --- 5. Freivalds ---
	const dim = 60
	a, b := randomMatrix(dim, rng), randomMatrix(dim, rng)
	c := mul(a, b)
	fmt.Println("\ncorrect product accepted by Freivalds:", freivalds(a, b, c, 1, rng))
	for _, rounds := range []int{1, 3, 10, 20} {
		caught := 0
		const attempts = 4000
		for t := 0; t < attempts; t++ {
			bad := make(Matrix, dim) // a copy of the right product...
			for i := range bad {
				bad[i] = slices.Clone(c[i])
			}
			bad[rng.Intn(dim)][rng.Intn(dim)]++ // ...with one wrong entry
			if !freivalds(a, b, bad, rounds, rng) {
				caught++
			}
		}
		fmt.Printf("  one wrong entry among %d, %2d round(s): caught %d of %d (miss rate %.4f, bound %.6f)\n",
			dim*dim, rounds, caught, attempts, 1-float64(caught)/attempts, math.Pow(0.5, float64(rounds)))
	}
}
