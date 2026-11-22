// 07_hanoi.go — Trusting the recursion: the Tower of Hanoi.
//
// Rules: move a stack of n disks from peg A to peg C using peg B as spare.
// Only one disk moves at a time and a larger disk never sits on a smaller one.
//
// Thinking recursively means you do NOT simulate every move in your head.
// You assume the smaller problem is already solved ("the recursive leap of
// faith") and only describe how to use it:
//
//  1. move the top n-1 disks  A -> B   (recursive call, C is spare)
//  2. move the largest disk   A -> C   (one direct move)
//  3. move the n-1 disks      B -> C   (recursive call, A is spare)
//
// Move count: M(n) = 2*M(n-1) + 1 with M(0) = 0, which solves to 2^n - 1.
// That is exponential growth — 64 disks would need 18 quintillion moves.
//
// Run: go run 07_hanoi.go
package main

import "fmt"

// Move records one step so the caller can print, count, or verify it.
type Move struct {
	Disk     int
	From, To byte
}

// hanoi appends the moves that transfer n disks from `from` to `to`.
// Passing the slice pointer lets every recursive level append to one list.
func hanoi(n int, from, spare, to byte, moves *[]Move) {
	if n == 0 {
		return // base case: nothing to move
	}
	hanoi(n-1, from, to, spare, moves) // step 1: clear the way
	*moves = append(*moves, Move{n, from, to})
	hanoi(n-1, spare, from, to, moves) // step 3: rebuild on top
}

// verify replays the moves on three real stacks and checks every rule.
// Independent verification is how you gain confidence in recursive code
// whose execution is too long to trace by hand.
func verify(n int, moves []Move) error {
	pegs := map[byte][]int{'A': {}, 'B': {}, 'C': {}}
	for d := n; d >= 1; d-- {
		pegs['A'] = append(pegs['A'], d) // largest at the bottom (index 0)
	}
	for i, m := range moves {
		src := pegs[m.From]
		if len(src) == 0 || src[len(src)-1] != m.Disk {
			return fmt.Errorf("move %d: disk %d is not on top of %c", i+1, m.Disk, m.From)
		}
		dst := pegs[m.To]
		if len(dst) > 0 && dst[len(dst)-1] < m.Disk {
			return fmt.Errorf("move %d: disk %d placed on smaller disk", i+1, m.Disk)
		}
		pegs[m.From] = src[:len(src)-1]  // pop
		pegs[m.To] = append(dst, m.Disk) // push
	}
	if len(pegs['C']) != n {
		return fmt.Errorf("only %d of %d disks reached C", len(pegs['C']), n)
	}
	return nil
}

func main() {
	var moves []Move
	hanoi(3, 'A', 'B', 'C', &moves)
	fmt.Println("n=3 moves:")
	for i, m := range moves {
		fmt.Printf("  %d. disk %d  %c -> %c\n", i+1, m.Disk, m.From, m.To)
	}

	fmt.Println("\nn   moves   2^n-1   verified")
	for n := 1; n <= 20; n++ {
		moves = moves[:0] // reuse the backing array between runs
		hanoi(n, 'A', 'B', 'C', &moves)
		fmt.Printf("%-3d %-7d %-7d %v\n", n, len(moves), 1<<n-1, verify(n, moves) == nil)
	}
}
