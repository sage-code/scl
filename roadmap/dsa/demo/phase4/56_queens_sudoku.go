// 56_queens_sudoku.go — Constraint puzzles: pruning and choice order.
//
// Backtracking can be exponential, so two questions decide whether a search
// finishes in a millisecond or in a year:
//
//	PRUNING      detect a dead end as EARLY as possible. Do not place a queen
//	             where it is attacked; do not continue when a cell has no
//	             legal digit left.
//	CHOICE ORDER decide WHICH decision to make next. Filling the most
//	             constrained cell first (fewest legal digits) fails fast and
//	             cuts the tree dramatically.
//
// Two classic puzzles:
//
//	N-Queens  place n queens on an n x n board so none attack another.
//	          One queen per ROW is forced, so the search decides only the
//	          column, and keeps three sets of "taken" lines:
//	              columns, diagonals (row - col), anti-diagonals (row + col)
//	          A bitmask version keeps those sets in three integers.
//	Sudoku    fill a 9x9 grid so every row, column and 3x3 box holds 1-9.
//	          Constraint sets are bitmasks; candidates are the digits missing
//	          from all three sets.
//
// Checks: solution counts against a known table and a brute force over all
// column permutations; every Sudoku answer is verified against the rules and
// the given digits.
//
// Run: go run 56_queens_sudoku.go
package main

import (
	"fmt"
	"math/bits"
	"math/rand"
	"strings"
	"time"
)

// ---------------------------------------------------------------------------
// N-Queens with boolean arrays. State: which columns and diagonals are taken.
// ---------------------------------------------------------------------------

// queens counts all solutions and remembers the first one (col[r] = column of
// the queen in row r). nodes counts every placement that was tried.
func queens(n int) (count, nodes int, first []int) {
	col := make([]int, n)
	usedCol := make([]bool, n)
	usedDiag := make([]bool, 2*n) // index row - c + n - 1
	usedAnti := make([]bool, 2*n) // index row + c
	var place func(r int)
	place = func(r int) {
		if r == n {
			if count == 0 {
				first = append([]int(nil), col...)
			}
			count++
			return
		}
		for c := 0; c < n; c++ {
			d, a := r-c+n-1, r+c
			if usedCol[c] || usedDiag[d] || usedAnti[a] {
				continue // attacked: prune before going deeper
			}
			nodes++
			col[r] = c
			usedCol[c], usedDiag[d], usedAnti[a] = true, true, true // choose
			place(r + 1)
			usedCol[c], usedDiag[d], usedAnti[a] = false, false, false // un-choose
		}
	}
	place(0)
	return count, nodes, first
}

// queensBits keeps the three sets as bit masks. `free` holds a 1 for every
// column where a queen can go in this row. Shifting the diagonal masks by one
// per row moves each attack line to the next row, so no arrays are needed.
func queensBits(n int) int {
	all := 1<<n - 1
	var place func(cols, diag, anti int) int
	place = func(cols, diag, anti int) int {
		if cols == all {
			return 1 // every column is used: n queens are placed
		}
		count := 0
		free := all &^ (cols | diag | anti)
		for free != 0 {
			bit := free & -free // lowest free column
			free &^= bit
			count += place(cols|bit, (diag|bit)<<1&all, (anti|bit)>>1)
		}
		return count
	}
	return place(0, 0, 0)
}

// queensBrute tries every permutation of columns (one queen per row and per
// column) and tests all pairs for a shared diagonal.
func queensBrute(n int) int {
	perm := make([]int, n)
	for i := range perm {
		perm[i] = i
	}
	count := 0
	var permute func(k int)
	permute = func(k int) {
		if k == n {
			for i := 0; i < n; i++ {
				for j := i + 1; j < n; j++ {
					if perm[i]-perm[j] == i-j || perm[i]-perm[j] == j-i {
						return
					}
				}
			}
			count++
			return
		}
		for i := k; i < n; i++ {
			perm[k], perm[i] = perm[i], perm[k]
			permute(k + 1)
			perm[k], perm[i] = perm[i], perm[k]
		}
	}
	permute(0)
	return count
}

func drawBoard(col []int) string {
	var sb strings.Builder
	for _, c := range col {
		sb.WriteString("  " + strings.Repeat(". ", c) + "Q " + strings.Repeat(". ", len(col)-c-1) + "\n")
	}
	return sb.String()
}

// ---------------------------------------------------------------------------
// Sudoku. Digits 1..9 are stored as bits 1..9 of a uint16.
// ---------------------------------------------------------------------------

type Grid [9][9]int

type solver struct {
	g                 Grid
	rows, cols, box   [9]uint16 // digits already used in each row, column, box
	mrv               bool      // pick the most constrained cell first?
	nodes, limit      int       // states visited; give up after limit (0 = never)
	gaveUp            bool
	solutions, stopAt int
	first             Grid
}

func newSolver(puzzle []string, mrv bool) *solver {
	s := &solver{mrv: mrv}
	for r := 0; r < 9; r++ {
		for c := 0; c < 9; c++ {
			if d := int(puzzle[r][c] - '0'); d != 0 {
				s.put(r, c, d)
			}
		}
	}
	return s
}

func (s *solver) put(r, c, d int) {
	s.g[r][c] = d
	bit := uint16(1) << d
	s.rows[r] |= bit
	s.cols[c] |= bit
	s.box[r/3*3+c/3] |= bit
}

func (s *solver) remove(r, c, d int) {
	s.g[r][c] = 0
	bit := ^(uint16(1) << d)
	s.rows[r] &= bit
	s.cols[c] &= bit
	s.box[r/3*3+c/3] &= bit
}

// candidates returns the digits still legal at (r, c) as a bit set.
func (s *solver) candidates(r, c int) uint16 {
	return ^(s.rows[r] | s.cols[c] | s.box[r/3*3+c/3]) & 0x3FE // bits 1..9
}

// pick chooses the next empty cell. Without MRV it takes the first one in
// reading order. With MRV it scans all empty cells and takes the one with the
// fewest candidates; a cell with 0 candidates is a dead end found at once.
func (s *solver) pick() (r, c int, cand uint16, ok bool) {
	best := 10
	for i := 0; i < 9; i++ {
		for j := 0; j < 9; j++ {
			if s.g[i][j] != 0 {
				continue
			}
			cd := s.candidates(i, j)
			if !s.mrv {
				return i, j, cd, true
			}
			if n := bits.OnesCount16(cd); n < best {
				best, r, c, cand, ok = n, i, j, cd, true
				if n <= 1 {
					return
				}
			}
		}
	}
	return
}

// search returns true when the whole search should stop.
func (s *solver) search() bool {
	s.nodes++
	if s.limit > 0 && s.nodes > s.limit {
		s.gaveUp = true
		return true
	}
	r, c, cand, ok := s.pick()
	if !ok { // no empty cell left: the grid is complete
		s.solutions++
		if s.solutions == 1 {
			s.first = s.g
		}
		return s.solutions >= s.stopAt
	}
	for cand != 0 {
		d := bits.TrailingZeros16(cand)
		cand &= cand - 1 // remove the lowest candidate from the set
		s.put(r, c, d)   // choose
		if s.search() {
			return true
		}
		s.remove(r, c, d) // un-choose
	}
	return false
}

// valid checks the sudoku rules and that every given digit is kept.
func valid(g Grid, puzzle []string) bool {
	for r := 0; r < 9; r++ {
		var row, col, box uint16
		for c := 0; c < 9; c++ {
			row |= 1 << g[r][c]
			col |= 1 << g[c][r]
			box |= 1 << g[r/3*3+c/3][r%3*3+c%3]
			if p := int(puzzle[r][c] - '0'); p != 0 && p != g[r][c] {
				return false
			}
		}
		if row != 0x3FE || col != 0x3FE || box != 0x3FE {
			return false
		}
	}
	return true
}

func rowsOf(g Grid) []string {
	out := make([]string, 9)
	for r := range out {
		var sb strings.Builder
		for _, d := range g[r] {
			sb.WriteByte(byte('0' + d))
		}
		out[r] = sb.String()
	}
	return out
}

func show(g Grid) {
	for r := 0; r < 9; r++ {
		if r%3 == 0 && r > 0 {
			fmt.Println("  ------+-------+------")
		}
		fmt.Print("  ")
		for c := 0; c < 9; c++ {
			if c%3 == 0 && c > 0 {
				fmt.Print("| ")
			}
			fmt.Print(g[r][c], " ")
		}
		fmt.Println()
	}
}

func main() {
	// --- N-Queens ---
	known := []int{1, 0, 0, 2, 10, 4, 40, 92, 352, 724} // solutions for n = 1..10
	fmt.Println("n   solutions   nodes visited   (checks)")
	fails := 0
	for n := 1; n <= 10; n++ {
		count, nodes, _ := queens(n)
		ok := count == known[n-1] && queensBits(n) == count
		if n <= 8 && queensBrute(n) != count {
			ok = false
		}
		if !ok {
			fails++
		}
		fmt.Printf("%-3d %9d %15d\n", n, count, nodes)
	}
	fmt.Println("array version vs known table, bitmask version, and all column permutations (n <= 8), failures:", fails)

	_, _, sol := queens(8)
	fmt.Println("\nfirst solution for n = 8:")
	fmt.Print(drawBoard(sol))
	_, nodes, _ := queens(8)
	fmt.Printf("placing 8 queens on any of 64 squares: 4,426,165,368 ways; the search tried %d placements\n", nodes)

	for _, n := range []int{11, 12, 13} {
		t := time.Now()
		count, _, _ := queens(n)
		slow := time.Since(t)
		t = time.Now()
		fast := queensBits(n)
		fmt.Printf("n = %d: %d solutions (bitmask agrees: %v); arrays %v, bitmask %v\n",
			n, count, fast == count, slow.Round(time.Millisecond), time.Since(t).Round(time.Millisecond))
	}

	// --- Sudoku ---
	easy := []string{"530070000", "600195000", "098000060", "800060003", "400803001", "700020006", "060000280", "000419005", "000080079"}
	naive, smart := newSolver(easy, false), newSolver(easy, true)
	naive.stopAt, smart.stopAt = 1, 1 // stop at the first solution
	naive.search()
	smart.search()
	solved := smart.first // the random puzzles below blank out cells of this grid
	fmt.Println("\nsudoku (a newspaper puzzle):")
	show(solved)
	fmt.Printf("first-empty-cell order: %d states.  most-constrained-cell order: %d states\n", naive.nodes, smart.nodes)
	unique := newSolver(easy, true)
	unique.stopAt = 2 // keep searching after the first solution: is there a second?
	unique.search()
	fmt.Println("solutions found when searching for up to 2:", unique.solutions,
		" valid:", valid(solved, easy) && valid(naive.first, easy))

	hard := []string{"000000000", "000003085", "001020000", "000507000", "004000100", "090000000", "500000073", "002010000", "000040009"}
	naive, smart = newSolver(hard, false), newSolver(hard, true)
	naive.stopAt, smart.stopAt, naive.limit = 1, 1, 5_000_000
	naive.search()
	smart.search()
	fmt.Printf("\na puzzle built to defeat brute force:\n  first-empty-cell order: gave up after %d states: %v\n", naive.nodes-1, naive.gaveUp)
	fmt.Printf("  most-constrained-cell order: solved in %d states, valid: %v\n", smart.nodes, valid(smart.first, hard))

	// Random puzzles: blank 40 cells of the solved newspaper puzzle.
	rng := rand.New(rand.NewSource(56))
	var nodesNaive, nodesMRV int
	fails = 0
	for t := 0; t < 300; t++ {
		puzzle := rowsOf(solved)
		for k := 0; k < 40; k++ {
			r, c := rng.Intn(9), rng.Intn(9)
			row := []byte(puzzle[r])
			row[c] = '0'
			puzzle[r] = string(row)
		}
		a, b := newSolver(puzzle, false), newSolver(puzzle, true)
		a.stopAt, b.stopAt = 1, 1
		a.search()
		b.search()
		nodesNaive += a.nodes
		nodesMRV += b.nodes
		if a.solutions != 1 || b.solutions != 1 || !valid(a.first, puzzle) || !valid(b.first, puzzle) {
			fails++
		}
	}
	fmt.Println("\n300 random puzzles (40 cells blanked): both solvers valid and consistent with the givens, failures:", fails)
	fmt.Printf("total states: first-empty-cell %d, most-constrained-cell %d\n", nodesNaive, nodesMRV)
}
