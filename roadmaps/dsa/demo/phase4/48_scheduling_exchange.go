// 48_scheduling_exchange.go — Proving greedy rules with the exchange argument.
//
// Most correct greedy algorithms are "sort by the right key, then scan".
// The hard part is finding the key and knowing it is right. The standard
// proof is the EXCHANGE ARGUMENT:
//
//  1. Take any schedule that does not follow the greedy order.
//  2. It has two ADJACENT jobs in the wrong order (an inversion).
//  3. Swapping them does not make the cost worse.
//  4. Repeat until no inversions are left: you reach the greedy order
//     without ever getting worse, so the greedy order is optimal.
//
// Step 3 is a small calculation about two jobs only, because swapping
// neighbours does not change when any other job starts or ends.
//
// One machine, jobs run back to back. This file covers:
//
//	total waiting time        shortest job first (SPT)
//	weighted completion time  Smith's rule: sort by time/weight
//	maximum lateness          earliest deadline first (EDF)
//	unit jobs with deadlines  most profitable first, latest free slot
//	and profits               (union-find finds the slot)
//
// Each rule is checked against every permutation or subset of small inputs.
//
// Run: go run 48_scheduling_exchange.go
package main

import (
	"cmp"
	"fmt"
	"math/rand"
	"slices"
)

// Job has a processing time, a weight (importance) and a deadline.
type Job struct {
	name              string
	time, weight, due int
}

// weightedCompletion is the sum of weight * finish time.
// With every weight 1 it is the total time customers spend waiting.
func weightedCompletion(order []Job) int {
	now, total := 0, 0
	for _, j := range order {
		now += j.time
		total += j.weight * now
	}
	return total
}

// maxLateness is the largest amount by which a job finishes after its due
// time (0 if every job is on time).
func maxLateness(order []Job) int {
	now, worst := 0, 0
	for _, j := range order {
		now += j.time
		worst = max(worst, now-j.due)
	}
	return worst
}

// smithCmp orders jobs by time/weight, smallest first (negative result: a
// runs before b). Cross-multiplying avoids division and floating point.
//
// Exchange step: with a then b, the pair adds a.w*(t+a.t) + b.w*(t+a.t+b.t).
// With b then a it adds b.w*(t+b.t) + a.w*(t+b.t+a.t). The difference is
// b.w*a.t - a.w*b.t, so a first is no worse exactly when a.t*b.w <= b.t*a.w.
func smithCmp(a, b Job) int { return cmp.Compare(a.time*b.weight, b.time*a.weight) }

// ---- the three sorting rules ----

// spt runs the shortest job first. It is Smith's rule with every weight 1.
func spt(jobs []Job) []Job {
	s := slices.Clone(jobs)
	slices.SortStableFunc(s, func(a, b Job) int { return cmp.Compare(a.time, b.time) })
	return s
}

func smith(jobs []Job) []Job {
	s := slices.Clone(jobs)
	slices.SortStableFunc(s, smithCmp)
	return s
}

// edf runs the earliest deadline first. Exchange step: the second job of an
// adjacent pair finishes at the same moment whichever job goes second, so
// putting the LATER deadline second can only lower the pair's worst lateness.
// The job moved earlier finishes sooner and gets no later.
func edf(jobs []Job) []Job {
	s := slices.Clone(jobs)
	slices.SortStableFunc(s, func(a, b Job) int { return cmp.Compare(a.due, b.due) })
	return s
}

// bestOverPermutations is the oracle: try all n! orders (n <= 8).
func bestOverPermutations(jobs []Job, cost func([]Job) int) int {
	best := 1 << 62
	order := slices.Clone(jobs)
	var permute func(k int)
	permute = func(k int) {
		if k == len(order) {
			best = min(best, cost(order))
			return
		}
		for i := k; i < len(order); i++ {
			order[k], order[i] = order[i], order[k]
			permute(k + 1)
			order[k], order[i] = order[i], order[k]
		}
	}
	permute(0)
	return best
}

// exchangeTrace starts from a bad order and repeatedly swaps the first
// adjacent pair that breaks Smith's rule, printing the cost after each
// swap. The cost never goes up, which is the exchange argument in action.
func exchangeTrace(order []Job) {
	order = slices.Clone(order)
	names := func() string {
		s := ""
		for _, j := range order {
			s += j.name
		}
		return s
	}
	fmt.Printf("  %s  cost %d\n", names(), weightedCompletion(order))
	for {
		swapped := false
		for i := 0; i+1 < len(order); i++ {
			if smithCmp(order[i], order[i+1]) > 0 { // an inversion
				order[i], order[i+1] = order[i+1], order[i]
				fmt.Printf("  %s  cost %d   (swapped %s and %s)\n",
					names(), weightedCompletion(order), order[i+1].name, order[i].name)
				swapped = true
				break
			}
		}
		if !swapped {
			return
		}
	}
}

// ---------------------------------------------------------------------------
// Unit-time jobs with deadlines and profits: each job takes one time slot,
// earns its profit only if it finishes by its deadline. Maximize profit.
// ---------------------------------------------------------------------------

type Offer struct{ due, profit int }

// maxProfit takes jobs from most to least profitable and puts each one in the
// LATEST free slot on or before its deadline, keeping early slots open for
// jobs with tighter deadlines. If no slot is free, the job is skipped.
//
// Finding "the latest free slot <= d" naively scans backwards: O(n^2).
// Union-find makes it nearly O(1): free[d] points to the latest free slot
// <= d. When slot d is used, link it to d-1. Slot 0 means "no slot left".
func maxProfit(offers []Offer) (profit int, slot []int) {
	order := make([]int, len(offers))
	for i := range order {
		order[i] = i
	}
	slices.SortStableFunc(order, func(a, b int) int { return cmp.Compare(offers[b].profit, offers[a].profit) })

	maxDue := 0
	for _, o := range offers {
		maxDue = max(maxDue, o.due)
	}
	parent := make([]int, maxDue+1) // slots 1..maxDue; 0 is the sentinel
	for i := range parent {
		parent[i] = i
	}
	var find func(x int) int
	find = func(x int) int {
		if parent[x] != x {
			parent[x] = find(parent[x]) // path compression
		}
		return parent[x]
	}

	slot = make([]int, len(offers)) // 0 = not scheduled
	for _, i := range order {
		s := find(offers[i].due) // latest free slot on or before the deadline
		if s > 0 {
			slot[i] = s
			profit += offers[i].profit
			parent[s] = s - 1 // slot s is taken: next time look further left
		}
	}
	return profit, slot
}

// feasible: a set of unit jobs can all be on time iff, sorted by deadline,
// the k-th job (1-based) has deadline >= k.
func feasible(set []Offer) bool {
	s := slices.Clone(set)
	slices.SortFunc(s, func(a, b Offer) int { return cmp.Compare(a.due, b.due) })
	for k, o := range s {
		if o.due < k+1 {
			return false
		}
	}
	return true
}

func bruteProfit(offers []Offer) int {
	best := 0
	for mask := 0; mask < 1<<len(offers); mask++ {
		var set []Offer
		p := 0
		for i, o := range offers {
			if mask>>i&1 == 1 {
				set = append(set, o)
				p += o.profit
			}
		}
		if p > best && feasible(set) {
			best = p
		}
	}
	return best
}

func main() {
	// --- Smith's rule and the exchange argument, step by step ---
	jobs := []Job{
		{"A", 3, 1, 0}, // time 3, weight 1: ratio 3
		{"B", 1, 2, 0}, // ratio 0.5
		{"C", 4, 4, 0}, // ratio 1
		{"D", 2, 1, 0}, // ratio 2
	}
	fmt.Println("jobs (time, weight):", jobs)
	fmt.Println("bubbling inversions away, starting from input order:")
	exchangeTrace(jobs)
	fmt.Println("Smith order cost:", weightedCompletion(smith(jobs)),
		" best of all 24 orders:", bestOverPermutations(jobs, weightedCompletion))

	// --- EDF: a tempting wrong rule vs the right one ---
	tasks := []Job{{"report", 4, 1, 4}, {"email", 1, 1, 9}, {"review", 2, 1, 7}, {"deploy", 3, 1, 9}}
	fmt.Println("\ntasks (time, -, due):", tasks)
	fmt.Println("shortest first, max lateness:", maxLateness(spt(tasks)))
	fmt.Println("earliest due,   max lateness:", maxLateness(edf(tasks)))
	fmt.Println("best of all orders:          ", bestOverPermutations(tasks, maxLateness))

	// --- Random checks against all permutations ---
	rng := rand.New(rand.NewSource(48))
	type check struct {
		name  string
		order func([]Job) []Job
		cost  func([]Job) int
	}
	unweighted := func(o []Job) int { // every weight treated as 1
		now, total := 0, 0
		for _, j := range o {
			now += j.time
			total += now
		}
		return total
	}
	checks := []check{
		{"SPT     / total completion   ", spt, unweighted},
		{"Smith   / weighted completion", smith, weightedCompletion},
		{"EDF     / max lateness       ", edf, maxLateness},
		{"SPT     / weighted completion", spt, weightedCompletion}, // wrong rule
		{"SPT     / max lateness       ", spt, maxLateness},        // wrong rule
	}
	fmt.Println("\nrule    / objective             wrong answers in 1000 random sets")
	for _, c := range checks {
		wrong := 0
		for t := 0; t < 1000; t++ {
			js := make([]Job, 2+rng.Intn(6))
			for i := range js {
				js[i] = Job{string(rune('a' + i)), 1 + rng.Intn(9), 1 + rng.Intn(9), rng.Intn(25)}
			}
			if c.cost(c.order(js)) != bestOverPermutations(js, c.cost) {
				wrong++
			}
		}
		fmt.Printf("%s %6d\n", c.name, wrong)
	}

	// --- Unit jobs with deadlines and profits ---
	offers := []Offer{{2, 100}, {1, 19}, {2, 27}, {1, 25}, {3, 15}}
	p, slot := maxProfit(offers)
	fmt.Println("\noffers (due, profit):", offers)
	fmt.Println("slots:", slot, "profit:", p, " brute force:", bruteProfit(offers))
	fails := 0
	for t := 0; t < 2000; t++ {
		os := make([]Offer, 1+rng.Intn(12))
		for i := range os {
			os[i] = Offer{1 + rng.Intn(6), 1 + rng.Intn(100)}
		}
		got, sl := maxProfit(os)
		if got != bruteProfit(os) {
			fails++
		}
		used := map[int]bool{} // also check the schedule itself is valid
		for i, s := range sl {
			if s == 0 {
				continue // skipped job
			}
			if used[s] || s > os[i].due { // slot shared, or job is late
				fails++
			}
			used[s] = true
		}
	}
	fmt.Println("maxProfit vs all subsets, failures:", fails)
}
