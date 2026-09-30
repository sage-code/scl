// 57_search_and_paths.go — Backtracking on grids and strings.
//
// Four search problems, each with a different kind of state to un-choose:
//
//	word search       mark a grid cell as visited, restore it on the way back
//	prefix pruning    stop as soon as the letters so far cannot start any word
//	letter combos     build strings from a choice at every position
//	palindrome cuts   choose where to end the next piece of a string
//	walk every cell   a path that visits each free cell exactly once, checked
//	                  against the bitmask DP from 54_bitmask_state_dp.go
//
// The same two questions keep returning: what exactly must be undone when we
// step back, and how early can we tell that this branch is hopeless?
//
// Every result is compared with an independent brute force.
//
// Run: go run 57_search_and_paths.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"sort"
	"strings"
)

var dirs = [4][2]int{{0, 1}, {1, 0}, {0, -1}, {-1, 0}}

// ---------------------------------------------------------------------------
// 1. Word search. Is `word` spelled by a path of adjacent cells (up, down,
//    left, right) that never uses a cell twice?
//    The visited mark IS the state: set on choose, cleared on un-choose.
//    Here the mark is written into the grid itself ('#'), which needs no
//    extra array. The grid must therefore be a copy that we may modify.
// ---------------------------------------------------------------------------

func wordExists(grid []string, word string) bool {
	g := make([][]byte, len(grid))
	for i := range grid {
		g[i] = []byte(grid[i])
	}
	var dfs func(r, c, k int) bool
	dfs = func(r, c, k int) bool {
		if r < 0 || c < 0 || r >= len(g) || c >= len(g[0]) || g[r][c] != word[k] {
			return false // outside, already used ('#'), or the wrong letter
		}
		if k == len(word)-1 {
			return true // the whole word is matched
		}
		saved := g[r][c]
		g[r][c] = '#' // choose: this cell is now used
		for _, d := range dirs {
			if dfs(r+d[0], c+d[1], k+1) {
				g[r][c] = saved // leave the grid as we found it, even on success
				return true
			}
		}
		g[r][c] = saved // un-choose
		return false
	}
	for r := range g {
		for c := range g[r] {
			if dfs(r, c, 0) {
				return true
			}
		}
	}
	return false
}

// allPaths lists every string spelled by a path of 1..maxLen cells: the
// oracle for both word functions. No pruning at all.
func allPaths(grid []string, maxLen int) map[string]bool {
	out := map[string]bool{}
	used := make([][]bool, len(grid))
	for i := range used {
		used[i] = make([]bool, len(grid[0]))
	}
	var walk func(r, c int, cur string)
	walk = func(r, c int, cur string) {
		cur += string(grid[r][c])
		out[cur] = true
		if len(cur) == maxLen {
			return
		}
		used[r][c] = true
		for _, d := range dirs {
			nr, nc := r+d[0], c+d[1]
			if nr >= 0 && nc >= 0 && nr < len(grid) && nc < len(grid[0]) && !used[nr][nc] {
				walk(nr, nc, cur)
			}
		}
		used[r][c] = false
	}
	for r := range grid {
		for c := range grid[r] {
			walk(r, c, "")
		}
	}
	return out
}

// ---------------------------------------------------------------------------
// 2. Many words at once, with PREFIX PRUNING. Without pruning we would follow
//    every path up to the longest word. With a set of all prefixes of the
//    dictionary, we stop the moment the letters so far start no word.
//    (A trie stores the same information compactly; see Advanced Trees.)
// ---------------------------------------------------------------------------

func findWords(grid []string, dict []string, prune bool) (found []string, nodes int) {
	words := map[string]bool{}
	prefix := map[string]bool{}
	maxLen := 0
	for _, w := range dict {
		words[w] = true
		maxLen = max(maxLen, len(w))
		for i := 1; i <= len(w); i++ {
			prefix[w[:i]] = true
		}
	}
	used := make([][]bool, len(grid))
	for i := range used {
		used[i] = make([]bool, len(grid[0]))
	}
	seen := map[string]bool{}
	var walk func(r, c int, cur string)
	walk = func(r, c int, cur string) {
		cur += string(grid[r][c])
		nodes++
		if prune && !prefix[cur] {
			return // no dictionary word starts with cur: abandon the branch
		}
		if words[cur] {
			seen[cur] = true
		}
		if len(cur) == maxLen {
			return
		}
		used[r][c] = true
		for _, d := range dirs {
			nr, nc := r+d[0], c+d[1]
			if nr >= 0 && nc >= 0 && nr < len(grid) && nc < len(grid[0]) && !used[nr][nc] {
				walk(nr, nc, cur)
			}
		}
		used[r][c] = false
	}
	for r := range grid {
		for c := range grid[r] {
			walk(r, c, "")
		}
	}
	for w := range seen {
		found = append(found, w)
	}
	sort.Strings(found)
	return found, nodes
}

// ---------------------------------------------------------------------------
// 3. Letter combinations of a phone number: one letter per digit.
// ---------------------------------------------------------------------------

var keypad = map[byte]string{'2': "abc", '3': "def", '4': "ghi", '5': "jkl",
	'6': "mno", '7': "pqrs", '8': "tuv", '9': "wxyz"}

func letterCombos(digits string) []string {
	if digits == "" {
		return nil
	}
	var result []string
	path := make([]byte, 0, len(digits))
	var explore func(i int)
	explore = func(i int) {
		if i == len(digits) {
			result = append(result, string(path))
			return
		}
		for _, ch := range []byte(keypad[digits[i]]) {
			path = append(path, ch)
			explore(i + 1)
			path = path[:len(path)-1]
		}
	}
	explore(0)
	return result
}

// ---------------------------------------------------------------------------
// 4. Palindrome partitions: list every way to cut s into palindromes. The
//    choice at each step is where the NEXT piece ends. Only palindromic
//    prefixes are tried, so bad cuts are pruned before they grow.
// ---------------------------------------------------------------------------

func isPalindrome(s string) bool {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		if s[i] != s[j] {
			return false
		}
	}
	return true
}

func palindromePartitions(s string) [][]string {
	var result [][]string
	var path []string
	var explore func(start int)
	explore = func(start int) {
		if start == len(s) {
			result = append(result, slices.Clone(path))
			return
		}
		for end := start + 1; end <= len(s); end++ {
			if !isPalindrome(s[start:end]) {
				continue // this piece cannot be part of any answer
			}
			path = append(path, s[start:end])
			explore(end)
			path = path[:len(path)-1]
		}
	}
	explore(0)
	return result
}

// partitionsBrute tries every subset of the len(s)-1 cut positions.
func partitionsBrute(s string) []string {
	var out []string
	for mask := 0; mask < 1<<(len(s)-1); mask++ {
		var pieces []string
		from := 0
		for i := 1; i < len(s); i++ {
			if mask>>(i-1)&1 == 1 {
				pieces = append(pieces, s[from:i])
				from = i
			}
		}
		pieces = append(pieces, s[from:])
		ok := true
		for _, p := range pieces {
			ok = ok && isPalindrome(p)
		}
		if ok {
			out = append(out, strings.Join(pieces, "|"))
		}
	}
	sort.Strings(out)
	return out
}

// ---------------------------------------------------------------------------
// 5. Walk every cell. The grid holds 'S' (start), 'E' (end), '.' (free) and
//    '#' (wall). Count the routes from S to E that visit every non-wall cell
//    exactly once, moving up, down, left or right.
//
//    State to undo: the visited mark. Two prunings: never step on a used
//    cell, and reaching E before every cell is visited is a dead end.
// ---------------------------------------------------------------------------

func walkAll(grid []string) (count, nodes int) {
	rows, cols := len(grid), len(grid[0])
	var sr, sc, er, ec, total int
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			switch grid[r][c] {
			case 'S':
				sr, sc = r, c
			case 'E':
				er, ec = r, c
			}
			if grid[r][c] != '#' {
				total++
			}
		}
	}
	visited := make([][]bool, rows)
	for i := range visited {
		visited[i] = make([]bool, cols)
	}
	var dfs func(r, c, left int)
	dfs = func(r, c, left int) { // left = cells still unvisited
		nodes++
		if r == er && c == ec {
			if left == 0 {
				count++
			}
			return // E is the end of the route: do not walk past it
		}
		for _, d := range dirs {
			nr, nc := r+d[0], c+d[1]
			if nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] == '#' || visited[nr][nc] {
				continue
			}
			visited[nr][nc] = true // choose
			dfs(nr, nc, left-1)
			visited[nr][nc] = false // un-choose
		}
	}
	visited[sr][sc] = true
	dfs(sr, sc, total-1)
	return count, nodes
}

// walkAllDP counts the same routes with the bitmask DP of demo 54:
// ways[mask][i] = routes from S that visit exactly the cells in mask and
// stand on cell i. It is an independent oracle for the backtracking.
func walkAllDP(grid []string) int {
	rows, cols := len(grid), len(grid[0])
	index := map[[2]int]int{}
	var cells [][2]int
	start, end := 0, 0
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if grid[r][c] == '#' {
				continue
			}
			index[[2]int{r, c}] = len(cells)
			if grid[r][c] == 'S' {
				start = len(cells)
			}
			if grid[r][c] == 'E' {
				end = len(cells)
			}
			cells = append(cells, [2]int{r, c})
		}
	}
	n := len(cells)
	ways := make([][]int, 1<<n)
	for m := range ways {
		ways[m] = make([]int, n)
	}
	ways[1<<start][start] = 1
	for mask := 1; mask < 1<<n; mask++ {
		for i := 0; i < n; i++ {
			if ways[mask][i] == 0 || i == end && mask != 1<<n-1 {
				continue // a route that ends at E early cannot continue
			}
			for _, d := range dirs {
				j, ok := index[[2]int{cells[i][0] + d[0], cells[i][1] + d[1]}]
				if ok && mask>>j&1 == 0 {
					ways[mask|1<<j][j] += ways[mask][i]
				}
			}
		}
	}
	return ways[1<<n-1][end]
}

func randomGrid(rng *rand.Rand, letters string, rows, cols int) []string {
	g := make([]string, rows)
	for r := range g {
		b := make([]byte, cols)
		for c := range b {
			b[c] = letters[rng.Intn(len(letters))]
		}
		g[r] = string(b)
	}
	return g
}

func randomWord(rng *rand.Rand, letters string, n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[rng.Intn(len(letters))]
	}
	return string(b)
}

func main() {
	rng := rand.New(rand.NewSource(57))

	// --- Word search ---
	board := []string{"abce", "sfcs", "adee"}
	for _, w := range []string{"abcced", "see", "abcb"} {
		fmt.Printf("%q in %v: %v\n", w, board, wordExists(board, w))
	}
	fails := 0
	for t := 0; t < 1500; t++ {
		g := randomGrid(rng, "abc", 2+rng.Intn(2), 2+rng.Intn(3))
		w := randomWord(rng, "abc", 1+rng.Intn(6))
		if wordExists(g, w) != allPaths(g, len(w))[w] {
			fails++
		}
	}
	fmt.Println("word search vs listing every path, failures:", fails)

	// --- Many words with prefix pruning ---
	grid := []string{"oaan", "etae", "ihkr", "iflv"}
	dict := []string{"oath", "pea", "eat", "rain", "tea", "eta", "ate"}
	found, nodesPruned := findWords(grid, dict, true)
	_, nodesFull := findWords(grid, dict, false)
	fmt.Printf("\nwords found in %v: %v\n", grid, found)
	fmt.Printf("states visited: %d without pruning, %d with prefix pruning\n", nodesFull, nodesPruned)
	fails = 0
	var sumFull, sumPruned int
	for t := 0; t < 300; t++ {
		g := randomGrid(rng, "abcd", 3, 3+rng.Intn(2))
		var d []string
		maxLen := 0
		for k := 0; k < 3+rng.Intn(6); k++ {
			w := randomWord(rng, "abcd", 2+rng.Intn(4))
			d = append(d, w)
			maxLen = max(maxLen, len(w))
		}
		var want []string
		for p := range allPaths(g, maxLen) {
			if slices.Contains(d, p) {
				want = append(want, p)
			}
		}
		sort.Strings(want)
		got, n1 := findWords(g, d, true)
		_, n2 := findWords(g, d, false)
		sumPruned += n1
		sumFull += n2
		if !slices.Equal(got, want) {
			fails++
		}
	}
	fmt.Println("findWords vs listing every path and filtering, failures:", fails)
	fmt.Printf("states over 300 random boards: without pruning %d, with pruning %d\n", sumFull, sumPruned)

	// --- Letter combinations ---
	fmt.Println("\nletter combinations of 23:", letterCombos("23"))
	fails = 0
	for t := 0; t < 300; t++ {
		digits := randomWord(rng, "23456789", 1+rng.Intn(5))
		got := letterCombos(digits)
		want := 1
		for i := range digits {
			want *= len(keypad[digits[i]])
		}
		seen := map[string]bool{}
		ok := len(got) == want
		for _, s := range got {
			seen[s] = true
			for i := range s {
				ok = ok && strings.IndexByte(keypad[digits[i]], s[i]) >= 0
			}
		}
		if !ok || len(seen) != want {
			fails++
		}
	}
	fmt.Println("letter combinations (count = product, all valid, all distinct), failures:", fails)

	// --- Palindrome partitions ---
	fmt.Println("\npalindrome partitions of aab:", palindromePartitions("aab"))
	fmt.Println("palindrome partitions of aaba:", palindromePartitions("aaba"))
	fails = 0
	for t := 0; t < 500; t++ {
		s := randomWord(rng, "ab", 1+rng.Intn(11))
		var got []string
		for _, p := range palindromePartitions(s) {
			got = append(got, strings.Join(p, "|"))
		}
		sort.Strings(got)
		if !slices.Equal(got, partitionsBrute(s)) {
			fails++
		}
	}
	fmt.Println("palindrome partitions vs all 2^(n-1) cut sets, failures:", fails)

	// --- Walk every cell ---
	maze := []string{"S...", "....", "...E"}
	count, nodes := walkAll(maze)
	fmt.Printf("\nroutes from S to E through all 12 cells of a 3x4 grid: %d (%d states); DP says %d\n",
		count, nodes, walkAllDP(maze))
	fails = 0
	for t := 0; t < 400; t++ {
		rows, cols := 2+rng.Intn(3), 2+rng.Intn(3)
		g := make([][]byte, rows)
		var free [][2]int
		for r := range g {
			g[r] = make([]byte, cols)
			for c := range g[r] {
				g[r][c] = '.'
				if rng.Intn(6) == 0 {
					g[r][c] = '#'
				} else {
					free = append(free, [2]int{r, c})
				}
			}
		}
		if len(free) < 2 {
			continue
		}
		g[free[0][0]][free[0][1]] = 'S'
		g[free[len(free)-1][0]][free[len(free)-1][1]] = 'E'
		grid := make([]string, rows)
		for r := range g {
			grid[r] = string(g[r])
		}
		if c, _ := walkAll(grid); c != walkAllDP(grid) {
			fails++
		}
	}
	fmt.Println("walk-every-cell: backtracking vs bitmask DP on random grids, failures:", fails)
}
