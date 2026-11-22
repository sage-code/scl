// 18_stack_applications.go — Last in, first out: matching and evaluation.
//
// A stack remembers "what is still open". Whenever a problem has NESTED
// structure — brackets, function calls, undo history, expressions — the most
// recent open item is the first one that must be closed, which is exactly
// LIFO order.
//
// This demo builds a generic slice-backed stack and uses it for:
//   - bracket matching          (compilers, JSON/HTML validators)
//   - evaluating postfix (RPN)  (calculators, stack-based virtual machines)
//   - infix -> postfix          (Dijkstra's shunting-yard algorithm)
//   - undo / redo               (editors)
//
// Run: go run 18_stack_applications.go
package main

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// Stack is a LIFO container. The top is the END of the slice, so push and
// pop touch only the last element: O(1) (push is amortized O(1)).
type Stack[T any] struct{ items []T }

func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }
func (s *Stack[T]) Len() int { return len(s.items) }

func (s *Stack[T]) Pop() (T, bool) {
	var zero T
	if len(s.items) == 0 {
		return zero, false
	}
	v := s.items[len(s.items)-1]
	s.items[len(s.items)-1] = zero // clear the slot so the GC can free pointed-to data
	s.items = s.items[:len(s.items)-1]
	return v, true
}

func (s *Stack[T]) Peek() (T, bool) {
	var zero T
	if len(s.items) == 0 {
		return zero, false
	}
	return s.items[len(s.items)-1], true
}

// ---------------------------------------------------------------- brackets

// balanced reports whether every bracket is closed in the right order.
// Returns the index of the first error, or -1 when balanced.
func balanced(s string) (bool, int) {
	pairs := map[rune]rune{')': '(', ']': '[', '}': '{'}
	var st Stack[int] // store positions, so errors can point at the culprit
	runes := []rune(s)
	for i, c := range runes {
		switch c {
		case '(', '[', '{':
			st.Push(i)
		case ')', ']', '}':
			top, ok := st.Pop()
			if !ok || runes[top] != pairs[c] {
				return false, i // closer with no opener, or the wrong opener
			}
		}
	}
	if open, ok := st.Peek(); ok {
		return false, open // something was opened and never closed
	}
	return true, -1
}

// ---------------------------------------------------------------- RPN

// evalRPN evaluates a postfix expression such as "3 4 + 2 *" = 14.
// Operands are pushed; an operator pops two operands and pushes the result.
// No parentheses or precedence rules are needed — the order is explicit.
func evalRPN(expr string) (float64, error) {
	var st Stack[float64]
	for _, tok := range strings.Fields(expr) {
		switch tok {
		case "+", "-", "*", "/":
			b, ok1 := st.Pop() // right operand is on top
			a, ok2 := st.Pop()
			if !ok1 || !ok2 {
				return 0, fmt.Errorf("operator %q needs two operands", tok)
			}
			switch tok {
			case "+":
				st.Push(a + b)
			case "-":
				st.Push(a - b)
			case "*":
				st.Push(a * b)
			case "/":
				if b == 0 {
					return 0, errors.New("division by zero")
				}
				st.Push(a / b)
			}
		default:
			v, err := strconv.ParseFloat(tok, 64)
			if err != nil {
				return 0, fmt.Errorf("bad token %q", tok)
			}
			st.Push(v)
		}
	}
	if st.Len() != 1 {
		return 0, fmt.Errorf("malformed expression: %d values left", st.Len())
	}
	v, _ := st.Pop()
	return v, nil
}

// ---------------------------------------------------------------- shunting-yard

// toPostfix converts space-separated infix ("3 + 4 * 2") to postfix
// ("3 4 2 * +"). Operators wait on a stack until an operator of lower or
// equal precedence arrives (all four are left-associative), or a ")" closes
// their group.
func toPostfix(infix string) (string, error) {
	prec := map[string]int{"+": 1, "-": 1, "*": 2, "/": 2}
	var out []string
	var ops Stack[string]
	for _, tok := range strings.Fields(infix) {
		switch {
		case tok == "(":
			ops.Push(tok)
		case tok == ")":
			for {
				top, ok := ops.Pop()
				if !ok {
					return "", errors.New("unmatched )")
				}
				if top == "(" {
					break
				}
				out = append(out, top)
			}
		case prec[tok] > 0:
			for {
				top, ok := ops.Peek()
				if !ok || top == "(" || prec[top] < prec[tok] {
					break
				}
				ops.Pop()
				out = append(out, top)
			}
			ops.Push(tok)
		default: // a number goes straight to the output
			out = append(out, tok)
		}
	}
	for ops.Len() > 0 {
		top, _ := ops.Pop()
		if top == "(" {
			return "", errors.New("unmatched (")
		}
		out = append(out, top)
	}
	return strings.Join(out, " "), nil
}

// ---------------------------------------------------------------- undo/redo

// Editor keeps two stacks: undo holds past states, redo holds undone ones.
// Any new edit clears redo, because the undone future no longer applies.
type Editor struct {
	text       string
	undo, redo Stack[string]
}

func (e *Editor) Type(s string) {
	e.undo.Push(e.text)
	e.text += s
	e.redo = Stack[string]{} // a new edit invalidates the redo history
}

func (e *Editor) Undo() {
	if prev, ok := e.undo.Pop(); ok {
		e.redo.Push(e.text)
		e.text = prev
	}
}

func (e *Editor) Redo() {
	if next, ok := e.redo.Pop(); ok {
		e.undo.Push(e.text)
		e.text = next
	}
}

func main() {
	fmt.Println("== bracket matching ==")
	for _, s := range []string{"{[()()]}", "([)]", "((a+b)*c", "a)b", `f(x[0], {"k": 1})`} {
		ok, at := balanced(s)
		fmt.Printf("%-20q balanced=%-5v errorAt=%d\n", s, ok, at)
	}

	fmt.Println("\n== infix -> postfix -> value ==")
	for _, in := range []string{"3 + 4 * 2", "( 3 + 4 ) * 2", "10 - 4 - 3", "8 / ( 3 - 3 )", "( 1 + 2"} {
		post, err := toPostfix(in)
		if err != nil {
			fmt.Printf("%-16s error: %v\n", in, err)
			continue
		}
		v, err := evalRPN(post)
		fmt.Printf("%-16s -> %-12s = %v (err=%v)\n", in, post, v, err)
	}

	fmt.Println("\n== undo / redo ==")
	var e Editor
	e.Type("Hello")
	e.Type(", world")
	e.Type("!")
	fmt.Printf("typed:      %q\n", e.text)
	e.Undo()
	e.Undo()
	fmt.Printf("undo x2:    %q\n", e.text)
	e.Redo()
	fmt.Printf("redo:       %q\n", e.text)
	e.Type(" Go")
	e.Redo() // nothing to redo: the new edit cleared the redo stack
	fmt.Printf("type + redo: %q\n", e.text)
}
