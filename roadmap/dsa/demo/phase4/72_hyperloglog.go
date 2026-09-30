// 72_hyperloglog.go — Counting distinct items in a few kilobytes.
//
// How many different visitors, words, or IP addresses are in a stream? The
// exact answer needs a set holding every item: memory proportional to the
// answer. HYPERLOGLOG estimates it with a fixed array of small registers, a
// standard error of about 1%, and memory that does not grow with the count.
//
// The idea starts from a coin-flip fact. Hash every item to a random 64-bit
// number. A hash that begins with j zeros happens for about one item in 2^j,
// so if the LONGEST run of leading zeros seen is L, roughly 2^L different items
// have been hashed. One register gives a wildly noisy guess (one lucky hash
// ruins it), so HyperLogLog keeps m registers:
//
//	first p bits of the hash    choose one of m = 2^p registers
//	remaining bits              count leading zeros (+1), keep the MAX per register
//	estimate                    a harmonic mean over the registers, which
//	                            damps the effect of a few lucky registers
//
// Because each register keeps only a maximum, adding the same item twice
// changes nothing (duplicates are free), and two sketches merge by taking the
// larger value in every register: the union of two sets, for free.
//
// The relative error is 1.04 / sqrt(m): 0.81% with m = 16384 registers.
//
// Run: go run 72_hyperloglog.go
package main

import (
	"fmt"
	"hash/fnv"
	"math"
	"math/bits"
	"slices"
)

// hash64 is FNV-1a followed by a finalizer that spreads every input bit over
// all output bits. HyperLogLog needs the bits to look random, and raw FNV of
// similar keys ("item-1", "item-2") does not quite.
func hash64(key string) uint64 {
	f := fnv.New64a()
	f.Write([]byte(key))
	x := f.Sum64()
	x ^= x >> 30
	x *= 0xbf58476d1ce4e5b9
	x ^= x >> 27
	x *= 0x94d049bb133111eb
	x ^= x >> 31
	return x
}

// rank returns the position of the first 1-bit of x, counting from 1 at the
// most significant end: the number of leading zeros plus one.
func rank(x uint64) uint8 { return uint8(bits.LeadingZeros64(x)) + 1 }

type HLL struct {
	p    uint
	regs []uint8
}

func NewHLL(p uint) *HLL { return &HLL{p: p, regs: make([]uint8, 1<<p)} }

// Add hashes the key, uses the top p bits as the register number and the rest
// for the zero count. The rest is padded with a 1 bit at the bottom so that
// an all-zero remainder gives a finite rank.
func (h *HLL) Add(key string) {
	x := hash64(key)
	idx := x >> (64 - h.p)
	rest := x<<h.p | 1<<(h.p-1)
	h.regs[idx] = max(h.regs[idx], rank(rest))
}

// Merge makes h the sketch of the union of both sets.
func (h *HLL) Merge(o *HLL) {
	for i := range h.regs {
		h.regs[i] = max(h.regs[i], o.regs[i])
	}
}

// Count returns the estimate. The raw formula is alpha * m^2 / sum(2^-reg).
// Registers that are still 0 mean "no item landed here": when many are, the
// count is small and a different formula, LINEAR COUNTING (like a Bloom filter
// read backwards: how many of m buckets are still empty), is more accurate.
func (h *HLL) Count() float64 {
	m := float64(len(h.regs))
	sum, zeros := 0.0, 0
	for _, r := range h.regs {
		sum += math.Pow(2, -float64(r))
		if r == 0 {
			zeros++
		}
	}
	alpha := 0.7213 / (1 + 1.079/m)
	switch len(h.regs) {
	case 16:
		alpha = 0.673
	case 32:
		alpha = 0.697
	case 64:
		alpha = 0.709
	}
	est := alpha * m * m / sum
	if est <= 2.5*m && zeros > 0 {
		return m * math.Log(m/float64(zeros))
	}
	return est
}

// singleRegisterEstimate is the naive version of the idea: keep only the
// longest zero run over ALL items and answer 2^run.
func singleRegisterEstimate(n, seed int) float64 {
	best := uint8(0)
	for i := 0; i < n; i++ {
		best = max(best, rank(hash64(fmt.Sprintf("seed%d-item-%d", seed, i))))
	}
	return math.Pow(2, float64(best))
}

func main() {
	// --- 1. Why one register is not enough ---
	const n = 20000
	var singles []float64
	for seed := 0; seed < 40; seed++ {
		singles = append(singles, singleRegisterEstimate(n, seed))
	}
	slices.Sort(singles)
	fmt.Printf("a single register on %d distinct items, 40 different hash seeds:\n", n)
	fmt.Printf("  smallest estimate %.0f, median %.0f, largest %.0f (all are powers of two; the truth is %d)\n",
		singles[0], singles[len(singles)/2], singles[len(singles)-1], n)

	// --- 2. HyperLogLog with 16384 registers ---
	fmt.Println("\ndistinct items   estimate     error   (standard error 0.81%, 16 KB of registers)")
	h := NewHLL(14)
	added := 0
	for _, target := range []int{100, 1000, 10000, 100000, 1000000} {
		for ; added < target; added++ {
			h.Add(fmt.Sprintf("item-%d", added))
		}
		est := h.Count()
		fmt.Printf("%14d %10.0f %8.2f%%\n", target, est, 100*(est-float64(target))/float64(target))
	}

	// --- 3. Duplicates are free ---
	before := h.Count()
	for i := 0; i < 3000000; i++ { // add 3 million repeats of the same 1,000,000 keys
		h.Add(fmt.Sprintf("item-%d", i%1000000))
	}
	fmt.Printf("\nafter 3,000,000 more insertions of the same keys: estimate %.0f (was %.0f): unchanged %v\n",
		h.Count(), before, h.Count() == before)

	// --- 4. Memory against accuracy ---
	fmt.Println("\nregisters   memory   theory 1.04/sqrt(m)   measured mean |error| over 12 sets of 100,000")
	for _, p := range []uint{6, 8, 10, 12, 14} {
		m := 1 << p
		total := 0.0
		for set := 0; set < 12; set++ {
			s := NewHLL(p)
			for i := 0; i < 100000; i++ {
				s.Add(fmt.Sprintf("set%d-%d", set, i))
			}
			total += math.Abs(s.Count()-100000) / 100000
		}
		fmt.Printf("%9d %6d B %18.2f%% %26.2f%%\n", m, m, 100*1.04/math.Sqrt(float64(m)), 100*total/12)
	}

	// --- 5. Merging: the union of two sets ---
	a, b := NewHLL(14), NewHLL(14)
	for i := 0; i < 600000; i++ {
		a.Add(fmt.Sprintf("id-%d", i)) // ids 0..599999
	}
	for i := 400000; i < 1000000; i++ {
		b.Add(fmt.Sprintf("id-%d", i)) // ids 400000..999999
	}
	ea, eb := a.Count(), b.Count()
	a.Merge(b)
	fmt.Printf("\nset A: 600000 ids, estimate %.0f;  set B: 600000 ids, estimate %.0f\n", ea, eb)
	fmt.Printf("merged sketch: estimate %.0f for a true union of 1000000 (%.2f%% error)\n",
		a.Count(), 100*(a.Count()-1000000)/1000000)
	fmt.Printf("by inclusion-exclusion the overlap is about %.0f (truth: 200000): |A|+|B|-|A u B|,\n", ea+eb-a.Count())
	fmt.Println("but the error of a difference of large estimates is large, so small overlaps are not measurable this way")
}
