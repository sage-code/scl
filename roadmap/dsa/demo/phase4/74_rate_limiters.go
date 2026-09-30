// 74_rate_limiters.go — Four ways to say "at most 10 requests per second".
//
// A rate limiter protects a service from a client that asks too often. The
// policies differ in memory, in accuracy, and in what a clever client can get
// away with:
//
//	fixed window        one counter per calendar second. Tiny, but a client can
//	                    send 10 at 0.99 s and 10 more at 1.00 s: 20 in 10 ms.
//	sliding window log  remember every accepted timestamp. Exact, O(limit) memory.
//	sliding window      two counters, weighted by how far into the window we are.
//	counter             O(1) memory, an approximation.
//	token bucket        tokens refill at a steady rate up to a burst size; each
//	                    request takes one. Allows short bursts, enforces the
//	                    average rate. Two numbers of state.
//
// Every limiter here reads time from a parameter (milliseconds), never from
// time.Now(), so the traffic below is replayed identically on every run and
// the tests need no sleeping.
//
// Run: go run 74_rate_limiters.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
)

type Limiter interface {
	Allow(nowMs int64) bool
}

// ------------------------------------------------------------ fixed window

type FixedWindow struct {
	limit    int
	windowMs int64
	start    int64
	count    int
}

func NewFixedWindow(limit int, windowMs int64) *FixedWindow {
	return &FixedWindow{limit: limit, windowMs: windowMs, start: -1}
}

func (f *FixedWindow) Allow(now int64) bool {
	w := now - now%f.windowMs // the start of the calendar window containing now
	if w != f.start {
		f.start, f.count = w, 0
	}
	if f.count >= f.limit {
		return false
	}
	f.count++
	return true
}

// ------------------------------------------------------- sliding window log

type SlidingLog struct {
	limit    int
	windowMs int64
	stamps   []int64 // accepted request times, oldest first
}

func NewSlidingLog(limit int, windowMs int64) *SlidingLog {
	return &SlidingLog{limit: limit, windowMs: windowMs}
}

func (s *SlidingLog) Allow(now int64) bool {
	// drop everything that has left the window (now-windowMs, now]
	i := 0
	for i < len(s.stamps) && s.stamps[i] <= now-s.windowMs {
		i++
	}
	s.stamps = s.stamps[i:]
	if len(s.stamps) >= s.limit {
		return false
	}
	s.stamps = append(s.stamps, now)
	return true
}

// --------------------------------------------------- sliding window counter

// SlidingCounter estimates the sliding count as
//
//	current window count + previous window count * (fraction of the previous
//	window still inside the sliding window)
//
// assuming the previous window's requests were spread evenly.
type SlidingCounter struct {
	limit    int
	windowMs int64
	start    int64
	cur, prv int
}

func NewSlidingCounter(limit int, windowMs int64) *SlidingCounter {
	return &SlidingCounter{limit: limit, windowMs: windowMs, start: -1}
}

func (s *SlidingCounter) Allow(now int64) bool {
	w := now - now%s.windowMs
	switch {
	case w == s.start:
	case w == s.start+s.windowMs:
		s.prv, s.cur, s.start = s.cur, 0, w
	default:
		s.prv, s.cur, s.start = 0, 0, w
	}
	overlap := float64(s.windowMs-(now-w)) / float64(s.windowMs)
	if float64(s.cur)+float64(s.prv)*overlap >= float64(s.limit) {
		return false
	}
	s.cur++
	return true
}

// ------------------------------------------------------------- token bucket

// TokenBucket holds up to burst tokens and gains ratePerSec tokens per second.
// Tokens are stored in thousandths so the arithmetic stays exact in integers.
type TokenBucket struct {
	burstMilli  int64
	ratePerSec  int64
	milliTokens int64
	last        int64
	initialized bool
}

func NewTokenBucket(ratePerSec, burst int64) *TokenBucket {
	return &TokenBucket{burstMilli: burst * 1000, ratePerSec: ratePerSec, milliTokens: burst * 1000}
}

func (b *TokenBucket) Allow(now int64) bool {
	if !b.initialized {
		b.last, b.initialized = now, true
	}
	// refill: ratePerSec tokens per 1000 ms is ratePerSec milli-tokens per ms
	b.milliTokens = min(b.burstMilli, b.milliTokens+(now-b.last)*b.ratePerSec)
	b.last = now
	if b.milliTokens < 1000 {
		return false
	}
	b.milliTokens -= 1000
	return true
}

// ------------------------------------------------------------------ helpers

// run sends requests at the given times and returns the times that were allowed.
func run(l Limiter, times []int64) []int64 {
	var ok []int64
	for _, t := range times {
		if l.Allow(t) {
			ok = append(ok, t)
		}
	}
	return ok
}

// maxInWindow returns the largest number of events in any half-open span
// [t, t+windowMs). Times must be sorted.
func maxInWindow(times []int64, windowMs int64) int {
	best, j := 0, 0
	for i := range times {
		for times[i]-times[j] >= windowMs {
			j++
		}
		best = max(best, i-j+1)
	}
	return best
}

func burstAt(t int64, n int) []int64 {
	out := make([]int64, n)
	for i := range out {
		out[i] = t + int64(i) // one request per millisecond
	}
	return out
}

func limiters() []struct {
	name string
	l    Limiter
} {
	return []struct {
		name string
		l    Limiter
	}{
		{"fixed window", NewFixedWindow(10, 1000)},
		{"sliding log", NewSlidingLog(10, 1000)},
		{"sliding counter", NewSlidingCounter(10, 1000)},
		{"token bucket", NewTokenBucket(10, 10)},
	}
}

func demoBoundary() {
	fmt.Println("== 1. The boundary attack: 10 requests just before t=1000 ms, 10 just after ==")
	traffic := append(burstAt(990-9, 10), burstAt(1000, 10)...) // 981..990 and 1000..1009
	fmt.Println("limit: 10 per 1000 ms. Largest number accepted in ANY 1000 ms span:")
	for _, x := range limiters() {
		acc := run(x.l, traffic)
		fmt.Printf("  %-16s accepted %2d of %d, worst 1 s span = %2d\n",
			x.name, len(acc), len(traffic), maxInWindow(acc, 1000))
	}
	fmt.Println("The fixed window lets 20 through in about 20 ms: the price of one counter.")
}

func demoBurst() {
	fmt.Println("\n== 2. A burst of 25 at t=0, then 1 request every 50 ms (20 per second) ==")
	traffic := burstAt(0, 25)
	for t := int64(1000); t < 3000; t += 50 {
		traffic = append(traffic, t)
	}
	for _, x := range limiters() {
		acc := run(x.l, traffic)
		first := 0
		for _, t := range acc {
			if t < 25 {
				first++
			}
		}
		later := len(acc) - first
		fmt.Printf("  %-16s burst: %2d accepted   later 2 s: %2d accepted of %d\n",
			x.name, first, later, len(traffic)-25)
	}
	fmt.Println("The windows settle at 10 per second. The bucket refilled its 10 tokens during the pause,")
	fmt.Println("so it also spends that saved burst (10 + 10 per second * 2 s = up to 30): 29 accepted.")
}

func demoTokenTimeline() {
	fmt.Println("\n== 3. Token bucket timeline (rate 2 per second, burst 4) ==")
	b := NewTokenBucket(2, 4)
	times := []int64{0, 0, 0, 0, 0, 100, 500, 1000, 1000, 1500, 2000, 6000, 6000, 6000, 6000, 6000, 6000}
	var line []byte
	for _, t := range times {
		if b.Allow(t) {
			line = append(line, 'Y')
		} else {
			line = append(line, 'n')
		}
	}
	fmt.Println("times ms:", times)
	fmt.Println("allowed :", string(line))
	fmt.Println("Four instant tokens, then one every 500 ms; after a long silence the bucket refills")
	fmt.Println("only to the burst size (4), never more.")
}

// The guarantee each policy actually makes, checked on random traffic.
func demoProperties() {
	fmt.Println("\n== 4. Guarantees on 20 random traffic patterns (200 requests over 5 s each) ==")
	rng := rand.New(rand.NewSource(11))
	worstFixed, worstLog, worstCounter, worstBucket := 0, 0, 0, 0
	for trial := 0; trial < 20; trial++ {
		times := make([]int64, 200)
		for i := range times {
			times[i] = int64(rng.Intn(5000))
		}
		slices.Sort(times)
		f := run(NewFixedWindow(10, 1000), times)
		s := run(NewSlidingLog(10, 1000), times)
		c := run(NewSlidingCounter(10, 1000), times)
		b := run(NewTokenBucket(10, 10), times)
		worstFixed = max(worstFixed, maxInWindow(f, 1000))
		worstLog = max(worstLog, maxInWindow(s, 1000))
		worstCounter = max(worstCounter, maxInWindow(c, 1000))
		worstBucket = max(worstBucket, maxInWindow(b, 1000))
	}
	fmt.Println("worst accepted in any 1 s span (limit 10):")
	fmt.Println("  fixed window    ", worstFixed, " (can reach 2x the limit)")
	fmt.Println("  sliding log     ", worstLog, " (exact: never above the limit)")
	fmt.Println("  sliding counter ", worstCounter, " (close to the limit, an estimate)")
	fmt.Println("  token bucket    ", worstBucket, " (at most burst + rate * 1 s = 20)")
}

func main() {
	demoBoundary()
	demoBurst()
	demoTokenTimeline()
	demoProperties()
}
