// 15_singly_linked_list.go — Building a generic linked list from scratch.
//
// A singly linked list is a chain of nodes; each node holds a value and a
// pointer to the next node. The list itself only remembers the first node
// (head), and here also the last node (tail) so appending is O(1).
//
//	PushFront      O(1)   new node points at the old head
//	PushBack       O(1)   thanks to the tail pointer (O(n) without it)
//	PopFront       O(1)
//	Find / At(i)   O(n)   must walk from the head: no random access
//	Remove(value)  O(n)   find the node BEFORE the victim, then relink
//
// Run: go run 15_singly_linked_list.go
package main

import (
	"fmt"
	"strings"
)

// node is unexported: callers use the List API and never touch pointers.
type node[T comparable] struct {
	val  T
	next *node[T]
}

// List is a singly linked list with head and tail pointers.
// The zero value is an empty, ready-to-use list (head == tail == nil).
type List[T comparable] struct {
	head, tail *node[T]
	size       int
}

// PushFront inserts v before the current head.
func (l *List[T]) PushFront(v T) {
	n := &node[T]{val: v, next: l.head}
	l.head = n
	if l.tail == nil { // the list was empty: the new node is also the tail
		l.tail = n
	}
	l.size++
}

// PushBack appends v after the current tail.
func (l *List[T]) PushBack(v T) {
	n := &node[T]{val: v}
	if l.tail == nil { // empty list: head and tail both become n
		l.head, l.tail = n, n
	} else {
		l.tail.next = n
		l.tail = n
	}
	l.size++
}

// PopFront removes and returns the first value; ok=false when empty.
func (l *List[T]) PopFront() (v T, ok bool) {
	if l.head == nil {
		return v, false // v is the zero value of T
	}
	n := l.head
	l.head = n.next
	if l.head == nil { // removed the only node: the list is empty again
		l.tail = nil
	}
	n.next = nil // help the garbage collector and avoid accidental reuse
	l.size--
	return n.val, true
}

// Contains walks the list until it finds v: O(n).
func (l *List[T]) Contains(v T) bool {
	for n := l.head; n != nil; n = n.next {
		if n.val == v {
			return true
		}
	}
	return false
}

// Remove deletes the first node holding v and reports whether it did.
// In a singly linked list we must stop at the node BEFORE the victim,
// because that node's next pointer is what changes.
func (l *List[T]) Remove(v T) bool {
	if l.head == nil {
		return false
	}
	if l.head.val == v { // special case: removing the head
		l.PopFront()
		return true
	}
	prev := l.head
	for prev.next != nil && prev.next.val != v {
		prev = prev.next
	}
	if prev.next == nil {
		return false // not found
	}
	victim := prev.next
	prev.next = victim.next // unlink: the chain now skips the victim
	if victim == l.tail {   // removed the last node: move the tail back
		l.tail = prev
	}
	l.size--
	return true
}

// Len is O(1) because we maintain a counter instead of walking the list.
func (l *List[T]) Len() int { return l.size }

// String renders the list as "a -> b -> c -> nil".
func (l *List[T]) String() string {
	var b strings.Builder
	for n := l.head; n != nil; n = n.next {
		fmt.Fprintf(&b, "%v -> ", n.val)
	}
	b.WriteString("nil")
	return b.String()
}

// All returns an iterator over the values (Go 1.23 range-over-func), so
// callers can write: for v := range list.All() { ... }
func (l *List[T]) All() func(yield func(T) bool) {
	return func(yield func(T) bool) {
		for n := l.head; n != nil; n = n.next {
			if !yield(n.val) { // the caller stopped early (break)
				return
			}
		}
	}
}

// check prints PASS/FAIL so the demo verifies itself.
func check(name string, got, want any) {
	status := "PASS"
	if fmt.Sprint(got) != fmt.Sprint(want) {
		status = "FAIL"
	}
	fmt.Printf("%-4s %-28s got=%v\n", status, name, got)
}

func main() {
	var l List[string] // zero value is usable
	l.PushBack("b")
	l.PushBack("c")
	l.PushFront("a")
	fmt.Println(l.String())
	check("Len after 3 pushes", l.Len(), 3)
	check("Contains(c)", l.Contains("c"), true)

	check("Remove(c) = tail", l.Remove("c"), true)
	l.PushBack("d") // must attach after "b": proves the tail was moved back
	check("list after tail removal", l.String(), "a -> b -> d -> nil")

	check("Remove(missing)", l.Remove("zzz"), false)
	check("Remove(a) = head", l.Remove("a"), true)

	v, ok := l.PopFront()
	check("PopFront", fmt.Sprintf("%v %v", v, ok), "b true")
	v, ok = l.PopFront()
	check("PopFront last", fmt.Sprintf("%v %v", v, ok), "d true")
	_, ok = l.PopFront()
	check("PopFront on empty", ok, false)
	l.PushBack("x") // tail must have been reset to nil for this to work
	check("reuse after empty", l.String(), "x -> nil")

	var nums List[int]
	for i := 1; i <= 5; i++ {
		nums.PushBack(i * i)
	}
	sum := 0
	for v := range nums.All() {
		sum += v
	}
	check("sum via iterator", sum, 55)
}
