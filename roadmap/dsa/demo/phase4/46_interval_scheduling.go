// 46_interval_scheduling.go — Greedy choices on intervals.
//
// A GREEDY algorithm builds its answer one step at a time. At each step it
// takes the choice that looks best right now and never undoes it. That makes
// it fast and short, but it is only correct when two things hold:
//
//	greedy choice         some optimal solution starts with the greedy pick
//	optimal substructure  after the pick, what is left is a smaller copy of
//	                      the same problem
//
// Interval problems are the classic training ground. This file shows:
//
//  1. activity selection: four plausible rules, only one is always optimal
//  2. interval partitioning: the minimum number of rooms (heap of end times)
//  3. merging overlapping intervals
//  4. the minimum number of points that stab every interval
//
// Every greedy answer is checked against brute force on small random inputs.
// Intervals are half-open, [start, end): a meeting that ends at 10 does not
// clash with one that starts at 10. Section 3 uses closed intervals instead.
//
// Run: go run 46_interval_scheduling.go
package main

import (
	"cmp"
	"container/heap"
	"fmt"
	"math/rand"
	"slices"
)

// Interval is a half-open time range [s, e).
type Interval struct{ s, e int }

func overlap(a, b Interval) bool { return a.s < b.e && b.s < a.e }

// ---------------------------------------------------------------------------
// 1. Activity selection: choose as many non-overlapping intervals as possible.
// ---------------------------------------------------------------------------

// maxActivities is the correct greedy: sort by END time and take every
// interval that starts after the last taken one ends.
//
// Why it works (exchange argument): let f be the interval that finishes
// first. Take any optimal answer and replace its first interval with f.
// f ends no later, so it clashes with nothing the old first interval did not
// clash with. The answer is still valid and just as large, so some optimal
// answer starts with f. Repeat on the intervals that start after f ends.
func maxActivities(iv []Interval) []Interval {
	sorted := slices.Clone(iv)
	slices.SortFunc(sorted, func(a, b Interval) int { return cmp.Compare(a.e, b.e) })
	var chosen []Interval
	lastEnd := -1 << 62
	for _, x := range sorted {
		if x.s >= lastEnd { // starts after (or exactly when) the last one ends
			chosen = append(chosen, x)
			lastEnd = x.e
		}
	}
	return chosen
}

// greedyBy tries a different priority rule: sort by key, then take each
// interval that clashes with nothing taken so far. Only the rule "earliest
// end" is always optimal; the others look reasonable and are wrong.
func greedyBy(iv []Interval, key func(Interval) int) int {
	sorted := slices.Clone(iv)
	slices.SortStableFunc(sorted, func(a, b Interval) int { return cmp.Compare(key(a), key(b)) })
	var chosen []Interval
	for _, x := range sorted {
		ok := true
		for _, c := range chosen {
			if overlap(x, c) {
				ok = false
				break
			}
		}
		if ok {
			chosen = append(chosen, x)
		}
	}
	return len(chosen)
}

// conflicts counts how many other intervals each one overlaps.
func conflicts(iv []Interval) map[Interval]int {
	m := make(map[Interval]int)
	for i, a := range iv {
		for j, b := range iv {
			if i != j && overlap(a, b) {
				m[a]++
			}
		}
	}
	return m
}

// bruteMaxActivities tries every subset: O(2^n * n^2). The oracle.
func bruteMaxActivities(iv []Interval) int {
	best := 0
	for mask := 0; mask < 1<<len(iv); mask++ {
		var set []Interval
		for i := range iv {
			if mask>>i&1 == 1 {
				set = append(set, iv[i])
			}
		}
		ok := true
		for i := 0; i < len(set) && ok; i++ {
			for j := i + 1; j < len(set); j++ {
				if overlap(set[i], set[j]) {
					ok = false
					break
				}
			}
		}
		if ok && len(set) > best {
			best = len(set)
		}
	}
	return best
}

// ---------------------------------------------------------------------------
// 2. Interval partitioning: fewest rooms so that no room has two meetings
//    at the same time.
// ---------------------------------------------------------------------------

// endHeap is a min-heap of (end time, room) for the rooms in use.
type roomEnd struct{ end, room int }
type endHeap []roomEnd

func (h endHeap) Len() int           { return len(h) }
func (h endHeap) Less(i, j int) bool { return h[i].end < h[j].end }
func (h endHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *endHeap) Push(x any)        { *h = append(*h, x.(roomEnd)) }
func (h *endHeap) Pop() any {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

// minRooms processes meetings by START time. The room that frees up first
// is on top of the heap: reuse it if it is free, otherwise open a new room.
// Returns the room count and the room of each meeting (in input order).
func minRooms(iv []Interval) (int, []int) {
	order := make([]int, len(iv)) // sort indices so we can report rooms
	for i := range order {
		order[i] = i
	}
	slices.SortFunc(order, func(a, b int) int { return cmp.Compare(iv[a].s, iv[b].s) })
	room := make([]int, len(iv))
	h := &endHeap{}
	rooms := 0
	for _, i := range order {
		if h.Len() > 0 && (*h)[0].end <= iv[i].s {
			r := heap.Pop(h).(roomEnd) // the earliest-free room is free now
			room[i] = r.room
		} else {
			room[i] = rooms // every room is busy: open a new one
			rooms++
		}
		heap.Push(h, roomEnd{iv[i].e, room[i]})
	}
	return rooms, room
}

// maxDepth is the lower bound: the most meetings running at the same moment.
// Nobody can use fewer rooms than that. Greedy always reaches the bound,
// which proves it optimal. The oracle checks every start time.
func maxDepth(iv []Interval) int {
	best := 0
	for _, p := range iv {
		d := 0
		for _, q := range iv {
			if q.s <= p.s && p.s < q.e {
				d++
			}
		}
		best = max(best, d)
	}
	return best
}

// ---------------------------------------------------------------------------
// 3. Merge overlapping CLOSED intervals [s, e]: [1,3] and [3,5] touch and merge.
// ---------------------------------------------------------------------------

func merge(iv []Interval) []Interval {
	if len(iv) == 0 {
		return nil
	}
	sorted := slices.Clone(iv)
	slices.SortFunc(sorted, func(a, b Interval) int { return cmp.Compare(a.s, b.s) })
	out := []Interval{sorted[0]}
	for _, x := range sorted[1:] {
		last := &out[len(out)-1]
		if x.s <= last.e { // overlaps or touches the current block: extend it
			last.e = max(last.e, x.e)
		} else {
			out = append(out, x) // a gap: start a new block
		}
	}
	return out
}

// mergeOracle paints every point on a doubled grid (so that the gap between
// 2 and 3 is visible as the point 2.5) and reads back the painted runs.
func mergeOracle(iv []Interval, limit int) []Interval {
	painted := make([]bool, 2*limit+2)
	for _, x := range iv {
		for p := 2 * x.s; p <= 2*x.e; p++ {
			painted[p] = true
		}
	}
	var out []Interval
	for p := 0; p < len(painted); p++ {
		if painted[p] && (p == 0 || !painted[p-1]) {
			q := p
			for painted[q+1] {
				q++
			}
			out = append(out, Interval{p / 2, q / 2})
		}
	}
	return out
}

// ---------------------------------------------------------------------------
// 4. Stabbing: the fewest points such that every closed interval [s, e]
//    contains one (the "minimum arrows to burst balloons" puzzle).
// ---------------------------------------------------------------------------

// minStabs sorts by end and shoots at the end of the first interval that is
// not yet hit. Shooting any earlier would miss nothing more, and shooting
// any later would miss this interval.
func minStabs(iv []Interval) []int {
	sorted := slices.Clone(iv)
	slices.SortFunc(sorted, func(a, b Interval) int { return cmp.Compare(a.e, b.e) })
	var points []int
	for _, x := range sorted {
		if len(points) == 0 || x.s > points[len(points)-1] {
			points = append(points, x.e)
		}
	}
	return points
}

// bruteStabs tries every subset of right endpoints (an optimal answer can
// always use right endpoints only) and returns the smallest that works.
func bruteStabs(iv []Interval) int {
	best := len(iv)
	for mask := 0; mask < 1<<len(iv); mask++ {
		n := 0
		var pts []int
		for i := range iv {
			if mask>>i&1 == 1 {
				pts = append(pts, iv[i].e)
				n++
			}
		}
		if n >= best {
			continue
		}
		all := true
		for _, x := range iv {
			hit := false
			for _, p := range pts {
				if x.s <= p && p <= x.e {
					hit = true
					break
				}
			}
			if !hit {
				all = false
				break
			}
		}
		if all {
			best = n
		}
	}
	return best
}

func randomIntervals(rng *rand.Rand, n, limit int) []Interval {
	iv := make([]Interval, n)
	for i := range iv {
		s := rng.Intn(limit - 1)
		iv[i] = Interval{s, s + 1 + rng.Intn(min(8, limit-s-1)+1)}
	}
	return iv
}

func main() {
	// --- 1. Activity selection on a small day of meetings ---
	day := []Interval{{1, 4}, {3, 5}, {0, 6}, {5, 7}, {3, 9}, {5, 9}, {6, 10}, {8, 11}, {8, 12}, {2, 14}, {12, 16}}
	fmt.Println("meetings:           ", day)
	fmt.Println("earliest end picks: ", maxActivities(day))

	// Three tempting rules, each with a small input that defeats it.
	rules := []struct {
		name string
		key  func(iv []Interval) func(Interval) int
		trap []Interval
	}{
		{"earliest start", func([]Interval) func(Interval) int { return func(x Interval) int { return x.s } },
			[]Interval{{0, 10}, {1, 2}, {3, 4}}}, // the long early meeting blocks two
		{"shortest first", func([]Interval) func(Interval) int { return func(x Interval) int { return x.e - x.s } },
			[]Interval{{0, 5}, {4, 7}, {6, 11}}}, // the short one sits across two long ones
		{"fewest clashes", func(iv []Interval) func(Interval) int {
			c := conflicts(iv)
			return func(x Interval) int { return c[x] }
		}, []Interval{ // M = {8 11} clashes least but blocks B and C
			{0, 4}, {5, 9}, {10, 14}, {15, 19}, // A B C D: the optimal four
			{8, 11},                // M
			{3, 6}, {3, 6}, {3, 6}, // three copies across A and B
			{13, 16}, {13, 16}, {13, 16}}}, // three copies across C and D
		{"earliest end", func([]Interval) func(Interval) int { return func(x Interval) int { return x.e } }, nil},
	}
	fmt.Println("\nrule             trap: greedy/optimal   random: wrong answers")
	rng := rand.New(rand.NewSource(46))
	tests := make([][]Interval, 3000)
	for i := range tests {
		tests[i] = randomIntervals(rng, 2+rng.Intn(10), 20)
	}
	opt := make([]int, len(tests))
	for i, t := range tests {
		opt[i] = bruteMaxActivities(t)
	}
	for _, r := range rules {
		trap := "      -     "
		if r.trap != nil {
			trap = fmt.Sprintf("     %d / %d    ", greedyBy(r.trap, r.key(r.trap)), bruteMaxActivities(r.trap))
		}
		wrong := 0
		for i, t := range tests {
			if greedyBy(t, r.key(t)) != opt[i] {
				wrong++
			}
		}
		fmt.Printf("%-15s %s   %5d of %d\n", r.name, trap, wrong, len(tests))
	}
	fastWrong := 0 // the O(n log n) version must agree too
	for i, t := range tests {
		if len(maxActivities(t)) != opt[i] {
			fastWrong++
		}
	}
	fmt.Println("maxActivities (sorted by end, O(n log n)) vs brute force, wrong:", fastWrong)

	// --- 2. Rooms ---
	rooms, assign := minRooms(day)
	fmt.Printf("\nrooms needed for the day: %d (max overlap %d)\n", rooms, maxDepth(day))
	for r := 0; r < rooms; r++ {
		fmt.Printf("  room %d:", r)
		for i, x := range day {
			if assign[i] == r {
				fmt.Print(" ", x)
			}
		}
		fmt.Println()
	}
	roomFails := 0
	for _, t := range tests {
		k, as := minRooms(t)
		if k != maxDepth(t) {
			roomFails++
		}
		for i := range t { // no room may host two overlapping meetings
			for j := i + 1; j < len(t); j++ {
				if as[i] == as[j] && overlap(t[i], t[j]) {
					roomFails++
				}
			}
		}
	}
	fmt.Println("minRooms vs max overlap on random days, failures:", roomFails)

	// --- 3. Merge ---
	blocks := []Interval{{8, 10}, {1, 3}, {2, 6}, {15, 18}, {6, 7}, {11, 11}}
	fmt.Println("\nmerge", blocks, "->", merge(blocks))
	mergeFails := 0
	for _, t := range tests {
		if !slices.Equal(merge(t), mergeOracle(t, 30)) {
			mergeFails++
		}
	}
	fmt.Println("merge vs painted grid, failures:", mergeFails)

	// --- 4. Stabbing ---
	balloons := []Interval{{10, 16}, {2, 8}, {1, 6}, {7, 12}}
	fmt.Println("\nballoons", balloons, "-> arrows at", minStabs(balloons))
	stabFails := 0
	for _, t := range tests {
		if len(minStabs(t)) != bruteStabs(t) {
			stabFails++
		}
	}
	fmt.Println("minStabs vs brute force, failures:", stabFails)
}
