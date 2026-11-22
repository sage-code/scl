// 76_concurrent_structures.go — Data structures shared by many goroutines.
//
// A map, a slice or a linked list is NOT safe to use from several goroutines at
// once: two writers can corrupt it, and Go's runtime may crash the program
// with "fatal error: concurrent map writes". A production structure needs a
// plan for sharing. From simplest to most delicate:
//
//	one mutex           every operation locks the whole structure. Correct and
//	                    simple; contention grows with the number of cores.
//	sharded locks       split the data into shards, each with its own lock, so
//	                    operations on different keys rarely wait for each other.
//	atomics             a single word (a counter, a pointer) updated with one
//	                    hardware instruction, no lock.
//	lock-free (CAS)     retry loop: read the state, compute the new state,
//	                    compare-and-swap it in; try again if someone else won.
//	channels            hand ownership of data from one goroutine to another
//	                    (a bounded queue, a worker pool).
//	call collapsing     N goroutines asking for the same missing key run ONE
//	                    load and share its result.
//
// Every check below has a deterministic answer (a total, a set of values), so
// the output is the same on every run even though the goroutine schedule is not.
// Also run it under the race detector:  go run -race 76_concurrent_structures.go
//
// Run: go run 76_concurrent_structures.go
package main

import (
	"fmt"
	"hash/fnv"
	"runtime"
	"sync"
	"sync/atomic"
)

const (
	workers   = 8
	perWorker = 50000
)

// parallel runs fn(worker index) on `workers` goroutines and waits for all.
func parallel(fn func(w int)) {
	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			fn(w)
		}()
	}
	wg.Wait()
}

// --------------------------------------------------------- 1. counters

func demoCounters() {
	fmt.Println("== 1. Counting: mutex and atomic ==")
	want := workers * perWorker

	// The unsafe version is shown but its result is not printed as a fact:
	// it is a data race, and the total is usually WRONG (lost updates).
	// (It is left out so that `go run -race` stays clean.)

	var mu sync.Mutex
	locked := 0
	parallel(func(int) {
		for i := 0; i < perWorker; i++ {
			mu.Lock()
			locked++
			mu.Unlock()
		}
	})

	var atom atomic.Int64
	parallel(func(int) {
		for i := 0; i < perWorker; i++ {
			atom.Add(1)
		}
	})
	fmt.Printf("expected %d   mutex %d   atomic %d\n", want, locked, atom.Load())
}

// ------------------------------------------------- 2. one lock vs sharded

type SafeMap struct {
	mu sync.RWMutex
	m  map[string]int
}

func NewSafeMap() *SafeMap { return &SafeMap{m: map[string]int{}} }

func (s *SafeMap) Add(k string, d int) {
	s.mu.Lock()
	s.m[k] += d
	s.mu.Unlock()
}

func (s *SafeMap) Get(k string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.m[k]
}

func (s *SafeMap) Len() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.m)
}

type Sharded struct {
	shards []SafeMap
}

func NewSharded(n int) *Sharded {
	s := &Sharded{shards: make([]SafeMap, n)}
	for i := range s.shards {
		s.shards[i].m = map[string]int{}
	}
	return s
}

func (s *Sharded) shard(k string) *SafeMap {
	h := fnv.New32a()
	h.Write([]byte(k))
	return &s.shards[h.Sum32()%uint32(len(s.shards))]
}

func (s *Sharded) Add(k string, d int) { s.shard(k).Add(k, d) }
func (s *Sharded) Get(k string) int    { return s.shard(k).Get(k) }

func (s *Sharded) Len() int {
	n := 0
	for i := range s.shards {
		n += s.shards[i].Len()
	}
	return n
}

func demoMaps() {
	fmt.Println("\n== 2. A map behind one lock, and behind 16 locks ==")
	keys := make([]string, 1000)
	for i := range keys {
		keys[i] = fmt.Sprintf("key-%d", i)
	}
	type counter interface {
		Add(string, int)
		Get(string) int
		Len() int
	}
	for _, c := range []struct {
		name string
		m    counter
	}{{"one RWMutex", NewSafeMap()}, {"16 shards", NewSharded(16)}} {
		parallel(func(w int) {
			for i := 0; i < perWorker; i++ {
				c.m.Add(keys[(i*7+w)%len(keys)], 1)
			}
		})
		total := 0
		for _, k := range keys {
			total += c.m.Get(k)
		}
		fmt.Printf("%-12s keys=%d total=%d (expected %d)\n", c.name, c.m.Len(), total, workers*perWorker)
	}
	fmt.Println("Same answers. Sharding pays off in speed when many cores hit different keys,")
	fmt.Println("but cross-shard operations (Len, snapshots) must visit every shard.")
}

// --------------------------------------------- 3. lock-free (Treiber) stack

type stackNode[T any] struct {
	val  T
	next *stackNode[T]
}

// Stack is a lock-free LIFO: the only shared word is the head pointer, changed
// with compare-and-swap. Go's garbage collector rules out the classic "ABA"
// problem (a freed node reused at the same address) that plagues this design in C.
type Stack[T any] struct {
	head atomic.Pointer[stackNode[T]]
}

func (s *Stack[T]) Push(v T) {
	n := &stackNode[T]{val: v}
	for {
		old := s.head.Load()
		n.next = old
		if s.head.CompareAndSwap(old, n) {
			return
		}
	}
}

func (s *Stack[T]) Pop() (T, bool) {
	for {
		old := s.head.Load()
		if old == nil {
			var zero T
			return zero, false
		}
		if s.head.CompareAndSwap(old, old.next) {
			return old.val, true
		}
	}
}

func demoStack() {
	fmt.Println("\n== 3. Lock-free stack: compare-and-swap loop ==")
	var s Stack[int]
	parallel(func(w int) {
		for i := 0; i < perWorker; i++ {
			s.Push(w*perWorker + i)
		}
	})
	seen := make([]bool, workers*perWorker)
	var popped atomic.Int64
	var dup atomic.Int64
	var mu sync.Mutex
	parallel(func(int) {
		for {
			v, ok := s.Pop()
			if !ok {
				return
			}
			mu.Lock()
			if seen[v] {
				dup.Add(1)
			}
			seen[v] = true
			mu.Unlock()
			popped.Add(1)
		}
	})
	missing := 0
	for _, ok := range seen {
		if !ok {
			missing++
		}
	}
	fmt.Printf("pushed %d from %d goroutines, popped %d, duplicates %d, missing %d\n",
		workers*perWorker, workers, popped.Load(), dup.Load(), missing)
}

// ------------------------------------------- 4. bounded queue and workers

func demoPipeline() {
	fmt.Println("\n== 4. Bounded queue and worker pool (channels) ==")
	jobs := make(chan int, 64) // the bound: a full queue blocks the producer (backpressure)
	results := make(chan int, 64)

	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				results <- j * j
			}
		}()
	}
	go func() { // producer
		for i := 1; i <= 10000; i++ {
			jobs <- i
		}
		close(jobs)
	}()
	go func() { wg.Wait(); close(results) }()

	sum, count := 0, 0
	for r := range results {
		sum += r
		count++
	}
	// sum of squares 1..n = n(n+1)(2n+1)/6
	fmt.Printf("jobs done %d, sum of squares %d (formula %d)\n", count, sum, 10000*10001*20001/6)
	fmt.Println("The queue holds at most 64 jobs: a slow consumer slows the producer instead of")
	fmt.Println("letting memory grow without limit.")
}

// ------------------------------------------------ 5. call collapsing

type call struct {
	wg  sync.WaitGroup
	val string
}

// Group collapses concurrent loads of the same key into one (the idea of
// golang.org/x/sync/singleflight): protects a database from a "cache stampede".
type Group struct {
	mu     sync.Mutex
	calls  map[string]*call
	Joined atomic.Int64 // callers that found a load in flight and waited for it
}

func (g *Group) Do(key string, load func() string) string {
	g.mu.Lock()
	if g.calls == nil {
		g.calls = map[string]*call{}
	}
	if c, ok := g.calls[key]; ok { // someone is already loading this key: wait for them
		g.Joined.Add(1)
		g.mu.Unlock()
		c.wg.Wait()
		return c.val
	}
	c := &call{}
	c.wg.Add(1)
	g.calls[key] = c
	g.mu.Unlock()

	c.val = load()
	c.wg.Done()

	g.mu.Lock()
	delete(g.calls, key)
	g.mu.Unlock()
	return c.val
}

func demoStampede() {
	fmt.Println("\n== 5. Cache stampede: 200 goroutines ask for the same missing key ==")
	var loads atomic.Int64
	var g Group
	var wg sync.WaitGroup
	results := make([]string, 200)
	for i := range results {
		wg.Add(1)
		go func() {
			defer wg.Done()
			results[i] = g.Do("report:2026", func() string {
				loads.Add(1)
				// The slow query: it finishes only after the other 199 callers
				// have joined it, so the count below is exact, not lucky.
				for g.Joined.Load() < 199 {
					runtime.Gosched()
				}
				return "42 rows"
			})
		}()
	}
	wg.Wait()

	same := 0
	for _, r := range results {
		if r == "42 rows" {
			same++
		}
	}
	fmt.Printf("callers with the right answer: %d of 200; database loads: %d (without collapsing: up to 200)\n",
		same, loads.Load())
}

func main() {
	demoCounters()
	demoMaps()
	demoStack()
	demoPipeline()
	demoStampede()
}
