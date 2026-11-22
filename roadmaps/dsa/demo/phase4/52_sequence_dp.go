// 52_sequence_dp.go — DP on sequences: LIS, LCS, edit distance, and diff.
//
// When the input is one or two sequences, the state is usually a PREFIX (or a
// pair of prefixes). "Solve for the first i elements" grows one element at a
// time, and each state looks at a few earlier states.
//
//	LIS        longest increasing subsequence of one sequence
//	           O(n^2) DP, then O(n log n) with binary search (Phase 3 idea)
//	LCS        longest common subsequence of two sequences: the table
//	           behind the `diff` tool and version control
//	edit dist. fewest insert / delete / substitute steps to turn one string
//	           into another: spell checkers, fuzzy search, DNA alignment
//
// A SUBSEQUENCE keeps the order but may skip elements ("ace" is a subsequence
// of "abcde"). A SUBSTRING must be contiguous. Do not confuse them.
//
// Each table is also WALKED BACKWARD to recover the answer itself, not only
// its length. Every function is checked against a brute-force oracle.
//
// Run: go run 52_sequence_dp.go
package main

import (
	"fmt"
	"math/rand"
	"slices"
	"strings"
)

// ---------------------------------------------------------------------------
// Longest increasing subsequence (strictly increasing).
// State: length[i] = length of the longest increasing subsequence that ENDS
// at index i. length[i] = 1 + max(length[j]) over earlier j with a[j] < a[i].
// ---------------------------------------------------------------------------

func lisQuadratic(a []int) []int {
	n := len(a)
	if n == 0 {
		return nil
	}
	length := make([]int, n)
	prev := make([]int, n) // prev[i]: the element before i in its best subsequence
	bestEnd := 0
	for i := range a {
		length[i], prev[i] = 1, -1
		for j := 0; j < i; j++ {
			if a[j] < a[i] && length[j]+1 > length[i] {
				length[i], prev[i] = length[j]+1, j
			}
		}
		if length[i] > length[bestEnd] {
			bestEnd = i
		}
	}
	var seq []int
	for i := bestEnd; i != -1; i = prev[i] { // follow prev[] back to the start
		seq = append(seq, a[i])
	}
	slices.Reverse(seq)
	return seq
}

// lisFast keeps tails[k] = the SMALLEST possible last element of an
// increasing subsequence of length k+1. tails is always sorted, so the spot
// for the next element x is found by binary search: x either extends the
// longest subsequence or replaces a larger tail (a better, smaller ending).
// The final length of tails is the answer. O(n log n).
func lisFast(a []int) int {
	var tails []int
	for _, x := range a {
		pos, _ := slices.BinarySearch(tails, x) // first tail >= x
		if pos == len(tails) {
			tails = append(tails, x)
		} else {
			tails[pos] = x
		}
	}
	return len(tails)
}

func lisBrute(a []int) int {
	best := 0
	for mask := 0; mask < 1<<len(a); mask++ {
		last, count, ok := -1<<62, 0, true
		for i, x := range a {
			if mask>>i&1 == 1 {
				if x <= last {
					ok = false
					break
				}
				last = x
				count++
			}
		}
		if ok {
			best = max(best, count)
		}
	}
	return best
}

// ---------------------------------------------------------------------------
// Longest common subsequence.
// State: l[i][j] = LCS length of a[:i] and b[:j] (the first i and j items).
//   a[i-1] == b[j-1]: l[i][j] = l[i-1][j-1] + 1   (match: use it)
//   otherwise:        l[i][j] = max(l[i-1][j], l[i][j-1])   (drop one item)
// ---------------------------------------------------------------------------

func lcsTable(a, b []string) [][]int {
	l := make([][]int, len(a)+1)
	for i := range l {
		l[i] = make([]int, len(b)+1) // row 0 and column 0 stay 0: an empty prefix
	}
	for i := 1; i <= len(a); i++ {
		for j := 1; j <= len(b); j++ {
			if a[i-1] == b[j-1] {
				l[i][j] = l[i-1][j-1] + 1
			} else {
				l[i][j] = max(l[i-1][j], l[i][j-1])
			}
		}
	}
	return l
}

// lcs walks the table from the corner back to the start, collecting matches.
func lcs(a, b []string) []string {
	l := lcsTable(a, b)
	var out []string
	i, j := len(a), len(b)
	for i > 0 && j > 0 {
		switch {
		case a[i-1] == b[j-1]:
			out = append(out, a[i-1])
			i, j = i-1, j-1
		case l[i-1][j] >= l[i][j-1]:
			i-- // the best answer does not need a[i-1]
		default:
			j--
		}
	}
	slices.Reverse(out)
	return out
}

func chars(s string) []string { return strings.Split(s, "") }

// isSubsequence reports whether sub can be read from s by skipping elements.
func isSubsequence(sub, s []string) bool {
	k := 0
	for _, x := range s {
		if k < len(sub) && sub[k] == x {
			k++
		}
	}
	return k == len(sub)
}

// lcsBrute generates all 2^n subsequences of a and keeps the longest one
// that is also a subsequence of b.
func lcsBrute(a, b []string) int {
	best := 0
	for mask := 0; mask < 1<<len(a); mask++ {
		var sub []string
		for i, x := range a {
			if mask>>i&1 == 1 {
				sub = append(sub, x)
			}
		}
		if len(sub) > best && isSubsequence(sub, b) {
			best = len(sub)
		}
	}
	return best
}

// diff lists the lines of old and new: unchanged lines are the LCS, the rest
// were removed ("-") or added ("+"). This is the idea inside `git diff`.
func diff(old, new []string) []string {
	l := lcsTable(old, new)
	var out []string
	i, j := len(old), len(new)
	for i > 0 || j > 0 {
		switch {
		case i > 0 && j > 0 && old[i-1] == new[j-1]:
			out = append(out, "  "+old[i-1])
			i, j = i-1, j-1
		case j > 0 && (i == 0 || l[i][j-1] >= l[i-1][j]):
			out = append(out, "+ "+new[j-1])
			j--
		default:
			out = append(out, "- "+old[i-1])
			i--
		}
	}
	slices.Reverse(out)
	return out
}

// ---------------------------------------------------------------------------
// Edit distance (Levenshtein).
// State: d[i][j] = fewest edits to turn a[:i] into b[:j].
//   d[i][0] = i          delete all i characters
//   d[0][j] = j          insert all j characters
//   equal last chars:    d[i][j] = d[i-1][j-1]
//   otherwise:           1 + min( d[i-1][j-1]   substitute a[i-1] by b[j-1]
//                                 d[i-1][j]     delete a[i-1]
//                                 d[i][j-1] )   insert b[j-1]
// ---------------------------------------------------------------------------

func editTable(a, b string) [][]int {
	d := make([][]int, len(a)+1)
	for i := range d {
		d[i] = make([]int, len(b)+1)
		d[i][0] = i
	}
	for j := range d[0] {
		d[0][j] = j
	}
	for i := 1; i <= len(a); i++ {
		for j := 1; j <= len(b); j++ {
			if a[i-1] == b[j-1] {
				d[i][j] = d[i-1][j-1]
			} else {
				d[i][j] = 1 + min(d[i-1][j-1], d[i-1][j], d[i][j-1])
			}
		}
	}
	return d
}

// Op is one step of an edit script.
type Op struct {
	kind     string // "keep", "sub", "del" or "ins"
	from, to byte
}

func (o Op) String() string {
	switch o.kind {
	case "sub":
		return fmt.Sprintf("sub %c->%c", o.from, o.to)
	case "del":
		return fmt.Sprintf("del %c", o.from)
	case "ins":
		return fmt.Sprintf("ins %c", o.to)
	}
	return fmt.Sprintf("keep %c", o.from)
}

// editScript walks the table back from the corner, at each cell choosing a
// step that explains the value stored there.
func editScript(a, b string) []Op {
	d := editTable(a, b)
	var ops []Op
	i, j := len(a), len(b)
	for i > 0 || j > 0 {
		switch {
		case i > 0 && j > 0 && a[i-1] == b[j-1] && d[i][j] == d[i-1][j-1]:
			ops = append(ops, Op{"keep", a[i-1], b[j-1]})
			i, j = i-1, j-1
		case i > 0 && j > 0 && d[i][j] == d[i-1][j-1]+1:
			ops = append(ops, Op{"sub", a[i-1], b[j-1]})
			i, j = i-1, j-1
		case i > 0 && d[i][j] == d[i-1][j]+1:
			ops = append(ops, Op{"del", a[i-1], 0})
			i--
		default:
			ops = append(ops, Op{"ins", 0, b[j-1]})
			j--
		}
	}
	slices.Reverse(ops)
	return ops
}

// apply runs an edit script on a; the result must equal b.
func apply(a string, ops []Op) string {
	var sb strings.Builder
	i := 0
	for _, o := range ops {
		switch o.kind {
		case "keep":
			sb.WriteByte(a[i])
			i++
		case "sub":
			sb.WriteByte(o.to)
			i++
		case "del":
			i++
		case "ins":
			sb.WriteByte(o.to)
		}
	}
	return sb.String()
}

// editNaive is plain recursion on the last characters: the oracle.
func editNaive(a, b string) int {
	if a == "" {
		return len(b)
	}
	if b == "" {
		return len(a)
	}
	if a[len(a)-1] == b[len(b)-1] {
		return editNaive(a[:len(a)-1], b[:len(b)-1])
	}
	return 1 + min(editNaive(a[:len(a)-1], b[:len(b)-1]), editNaive(a[:len(a)-1], b), editNaive(a, b[:len(b)-1]))
}

func randomString(rng *rand.Rand, n int, alphabet string) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = alphabet[rng.Intn(len(alphabet))]
	}
	return string(b)
}

func main() {
	rng := rand.New(rand.NewSource(52))

	// --- LIS ---
	a := []int{10, 9, 2, 5, 3, 7, 101, 18, 4, 20}
	fmt.Println("LIS of", a, "->", lisQuadratic(a), " length by binary search:", lisFast(a))
	fails := 0
	for t := 0; t < 3000; t++ {
		s := make([]int, rng.Intn(14))
		for i := range s {
			s[i] = rng.Intn(20)
		}
		seq := lisQuadratic(s)
		increasing := true
		for i := 1; i < len(seq); i++ {
			increasing = increasing && seq[i-1] < seq[i]
		}
		want := lisBrute(s)
		if len(seq) != want || lisFast(s) != want || !increasing || !isSubsequence(strs(seq), strs(s)) {
			fails++
		}
	}
	fmt.Println("LIS (both versions, and the sequence itself) vs all subsets, failures:", fails)

	// --- LCS ---
	x, y := "ABCBDAB", "BDCABA"
	fmt.Printf("\nLCS(%s, %s) = %s\n", x, y, strings.Join(lcs(chars(x), chars(y)), ""))
	fails = 0
	for t := 0; t < 2000; t++ {
		p := chars(randomString(rng, rng.Intn(10), "abc"))
		q := chars(randomString(rng, rng.Intn(10), "abc"))
		got := lcs(p, q)
		if len(got) != lcsBrute(p, q) || !isSubsequence(got, p) || !isSubsequence(got, q) {
			fails++
		}
	}
	fmt.Println("LCS (length, and the string is a subsequence of both) vs brute force, failures:", fails)

	// Longest palindromic subsequence = LCS of a string and its reverse.
	s := "character"
	rev := chars(s)
	slices.Reverse(rev)
	fmt.Printf("longest palindromic subsequence of %q: %q\n", s, strings.Join(lcs(chars(s), rev), ""))

	// --- diff ---
	oldFile := []string{"package main", "", "func main() {", "\tprintln(\"hi\")", "}"}
	newFile := []string{"package main", "", "import \"fmt\"", "", "func main() {", "\tfmt.Println(\"hi\")", "}"}
	fmt.Println("\ndiff:")
	for _, line := range diff(oldFile, newFile) {
		fmt.Println("  " + line)
	}
	fails = 0
	for t := 0; t < 2000; t++ {
		p := chars(randomString(rng, rng.Intn(9), "abcd"))
		q := chars(randomString(rng, rng.Intn(9), "abcd"))
		var rebuilt, kept []string
		for _, line := range diff(p, q) {
			if line[0] != '-' {
				rebuilt = append(rebuilt, line[2:]) // keeping " " and "+" lines gives q
			}
			if line[0] == ' ' {
				kept = append(kept, line[2:])
			}
		}
		if !slices.Equal(rebuilt, q) || len(kept) != len(lcs(p, q)) {
			fails++
		}
	}
	fmt.Println("diff rebuilds the new file, unchanged lines = LCS, failures:", fails)

	// --- Edit distance ---
	from, to := "kitten", "sitting"
	d := editTable(from, to)
	ops := editScript(from, to)
	fmt.Printf("\nedit distance %s -> %s = %d\n", from, to, d[len(from)][len(to)])
	fmt.Println("script:", ops)
	fmt.Println("table: row = prefix of", from, "(top row: empty), column = prefix of", to)
	fmt.Println("        -", strings.Join(chars(to), " "))
	for i, row := range d {
		label := "-"
		if i > 0 {
			label = string(from[i-1])
		}
		fmt.Printf("      %s %v\n", label, strings.Trim(fmt.Sprint(row), "[]"))
	}
	fails = 0
	for t := 0; t < 3000; t++ {
		p := randomString(rng, rng.Intn(7), "abc")
		q := randomString(rng, rng.Intn(7), "abc")
		script := editScript(p, q)
		cost := 0
		for _, o := range script {
			if o.kind != "keep" {
				cost++
			}
		}
		want := editNaive(p, q)
		if editTable(p, q)[len(p)][len(q)] != want || cost != want || apply(p, script) != q {
			fails++
		}
	}
	fmt.Println("edit distance (value, script cost, script result) vs plain recursion, failures:", fails)
}

func strs(nums []int) []string {
	out := make([]string, len(nums))
	for i, n := range nums {
		out[i] = fmt.Sprint(n)
	}
	return out
}
