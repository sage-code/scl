// 71_bloom_and_sketches.go — Answering questions with a fixed, tiny memory.
//
// Exact structures (a map, a set) need memory proportional to the number of
// items. When the data is huge, a small approximate answer with a KNOWN error
// can be worth far more than an exact one that does not fit.
//
//	Bloom filter   "have I seen this key?"       never a false NEGATIVE,
//	                                             sometimes a false POSITIVE
//	Count-Min      "how often did this occur?"   never too LOW,
//	                                             sometimes too high
//
// Both hash every key to several positions of a fixed-size array. A Bloom
// filter sets k bits per key and answers "maybe" only if all k are set. A
// Count-Min sketch has d rows of counters, adds to one counter per row, and
// answers with the smallest of its d counters: collisions only ever ADD to a
// counter, so the minimum is the least polluted one.
//
// Typical use: a Bloom filter in front of a slow lookup (disk, network) so
// that most misses are answered without touching it; a Count-Min sketch to
// find heavy hitters in a stream.
//
// Run: go run 71_bloom_and_sketches.go
package main

import (
	"fmt"
	"hash/fnv"
	"math"
	"math/rand"
	"sort"
)

// hash2 derives two independent-looking 64-bit hashes from a key. Position i
// of a structure then uses h1 + i*h2, so k positions cost two hash
// computations instead of k ("double hashing").
func hash2(key string) (h1, h2 uint64) {
	f := fnv.New64a()
	f.Write([]byte(key))
	h1 = f.Sum64()
	x := h1 // a finalizer that scrambles all the bits of h1 into h2
	x ^= x >> 30
	x *= 0xbf58476d1ce4e5b9
	x ^= x >> 27
	x *= 0x94d049bb133111eb
	x ^= x >> 31
	return h1, x | 1 // odd, so it never collapses to the same position
}

// ---------------------------------------------------------------------------
// Bloom filter
// ---------------------------------------------------------------------------

type Bloom struct {
	words []uint64
	m     uint64 // number of bits
	k     int    // positions per key
}

// NewBloom sizes the filter for n keys and a target false-positive rate p.
// The optimal number of bits and hashes are
//
//	m = -n * ln(p) / (ln 2)^2        k = (m / n) * ln 2
//
// which is about 9.6 bits per key for p = 1% and 14.4 for p = 0.1%. The rate
// does not depend on how long the keys are.
func NewBloom(n int, p float64) *Bloom {
	m := uint64(math.Ceil(-float64(n) * math.Log(p) / (math.Ln2 * math.Ln2)))
	k := int(math.Round(float64(m) / float64(n) * math.Ln2))
	return &Bloom{words: make([]uint64, (m+63)/64), m: m, k: max(k, 1)}
}

func (b *Bloom) Add(key string) {
	h1, h2 := hash2(key)
	for i := 0; i < b.k; i++ {
		pos := (h1 + uint64(i)*h2) % b.m
		b.words[pos/64] |= 1 << (pos % 64)
	}
}

// MayContain is false only if some bit is clear, which is certain proof that
// the key was never added. If all k bits are set the key MAY be present:
// other keys could have set those same bits.
func (b *Bloom) MayContain(key string) bool {
	h1, h2 := hash2(key)
	for i := 0; i < b.k; i++ {
		pos := (h1 + uint64(i)*h2) % b.m
		if b.words[pos/64]>>(pos%64)&1 == 0 {
			return false
		}
	}
	return true
}

// Union merges another filter of the SAME size and hash count: a bitwise OR
// contains every key of both.
func (b *Bloom) Union(o *Bloom) {
	for i := range b.words {
		b.words[i] |= o.words[i]
	}
}

// expectedRate is the theoretical false-positive rate after n insertions:
// each bit is still 0 with probability (1 - 1/m)^(k*n) ~ e^(-kn/m), and a
// false positive needs all k probed bits to be 1.
func expectedRate(m uint64, k, n int) float64 {
	return math.Pow(1-math.Exp(-float64(k*n)/float64(m)), float64(k))
}

// ---------------------------------------------------------------------------
// Count-Min sketch
// ---------------------------------------------------------------------------

type CountMin struct {
	rows  [][]uint32
	width uint64
}

// NewCountMin picks the size from two numbers: the estimate is at most
// eps * N too high (N = total count) with probability at least 1 - delta.
// width = ceil(e / eps) counters per row, depth = ceil(ln(1/delta)) rows.
func NewCountMin(eps, delta float64) *CountMin {
	w := uint64(math.Ceil(math.E / eps))
	d := int(math.Ceil(math.Log(1 / delta)))
	rows := make([][]uint32, d)
	for i := range rows {
		rows[i] = make([]uint32, w)
	}
	return &CountMin{rows: rows, width: w}
}

func (c *CountMin) Add(key string, count uint32) {
	h1, h2 := hash2(key)
	for i := range c.rows {
		c.rows[i][(h1+uint64(i)*h2)%c.width] += count
	}
}

// Estimate returns the smallest counter among the key's positions. Every
// counter holds the true count plus whatever collided into it, so each is
// >= the truth, and so is their minimum.
func (c *CountMin) Estimate(key string) uint32 {
	h1, h2 := hash2(key)
	best := uint32(math.MaxUint32)
	for i := range c.rows {
		best = min(best, c.rows[i][(h1+uint64(i)*h2)%c.width])
	}
	return best
}

func main() {
	// --- 1. A Bloom filter for 100,000 keys ---
	const n = 100000
	b := NewBloom(n, 0.01)
	for i := 0; i < n; i++ {
		b.Add(fmt.Sprintf("user-%d", i))
	}
	missing := 0
	for i := 0; i < n; i++ {
		if !b.MayContain(fmt.Sprintf("user-%d", i)) {
			missing++
		}
	}
	falsePos := 0
	for i := 0; i < n; i++ {
		if b.MayContain(fmt.Sprintf("other-%d", i)) {
			falsePos++
		}
	}
	fmt.Printf("Bloom filter for %d keys, target rate 1%%: %d bits (%.1f bits per key, %d KB), k = %d hashes\n",
		n, b.m, float64(b.m)/n, b.m/8/1024, b.k)
	fmt.Printf("  added keys reported absent (must be 0): %d\n", missing)
	fmt.Printf("  never-added keys reported present: %d of %d = %.2f%% (theory %.2f%%)\n",
		falsePos, n, 100*float64(falsePos)/n, 100*expectedRate(b.m, b.k, n))

	// --- 2. Memory against error ---
	fmt.Println("\nbits per key   hashes   measured false positives   theory")
	for _, bitsPerKey := range []int{4, 8, 10, 16} {
		m := uint64(bitsPerKey * n)
		k := int(math.Round(float64(bitsPerKey) * math.Ln2))
		f := &Bloom{words: make([]uint64, (m+63)/64), m: m, k: k}
		for i := 0; i < n; i++ {
			f.Add(fmt.Sprintf("user-%d", i))
		}
		fp := 0
		for i := 0; i < n; i++ {
			if f.MayContain(fmt.Sprintf("other-%d", i)) {
				fp++
			}
		}
		fmt.Printf("%12d %8d %25.3f%% %8.3f%%\n", bitsPerKey, k, 100*float64(fp)/n, 100*expectedRate(m, k, n))
	}

	// --- 3. Union of two filters ---
	x, y := NewBloom(1000, 0.01), NewBloom(1000, 0.01)
	for i := 0; i < 1000; i++ {
		x.Add(fmt.Sprintf("a-%d", i))
		y.Add(fmt.Sprintf("b-%d", i))
	}
	x.Union(y)
	lost := 0
	for i := 0; i < 1000; i++ {
		if !x.MayContain(fmt.Sprintf("a-%d", i)) || !x.MayContain(fmt.Sprintf("b-%d", i)) {
			lost++
		}
	}
	fmt.Println("\nafter the union, keys of either filter reported absent (must be 0):", lost)

	// --- 4. Count-Min on a skewed stream ---
	// A Zipf distribution: a few keys are very frequent, most are rare, like
	// words in text or URLs in a log.
	rng := rand.New(rand.NewSource(71))
	zipf := rand.NewZipf(rng, 1.2, 1, 49999) // keys 0..49999
	const events = 1_000_000
	exact := map[string]uint32{}
	cm := NewCountMin(0.001, 0.01)
	for i := 0; i < events; i++ {
		key := fmt.Sprintf("key-%d", zipf.Uint64())
		exact[key]++
		cm.Add(key, 1)
	}
	bound := uint32(0.001 * events)
	under, within, worst := 0, 0, uint32(0)
	for key, truth := range exact {
		est := cm.Estimate(key)
		if est < truth {
			under++
		}
		if est-truth <= bound {
			within++
		}
		worst = max(worst, est-truth)
	}
	fmt.Printf("\nCount-Min: %d events, %d distinct keys, %d rows x %d counters (%d KB); exact map has %d entries\n",
		events, len(exact), len(cm.rows), cm.width, len(cm.rows)*int(cm.width)*4/1024, len(exact))
	fmt.Printf("  estimates below the true count (must be 0): %d\n", under)
	fmt.Printf("  estimates within eps*N = %d of the truth: %d of %d (%.2f%%; guarantee at least 99%%), worst error %d\n",
		bound, within, len(exact), 100*float64(within)/float64(len(exact)), worst)

	// The heavy hitters: the five most frequent keys, exact and estimated.
	type kv struct {
		key   string
		count uint32
	}
	var all []kv
	for k, c := range exact {
		all = append(all, kv{k, c})
	}
	sort.Slice(all, func(i, j int) bool { return all[i].count > all[j].count })
	fmt.Println("  key         exact   estimate")
	for _, e := range all[:5] {
		fmt.Printf("  %-10s %7d %9d\n", e.key, e.count, cm.Estimate(e.key))
	}
}
