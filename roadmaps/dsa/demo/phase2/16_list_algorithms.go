// 16_list_algorithms.go — Classic pointer algorithms on linked lists.
//
// Linked-list problems are exercises in pointer discipline: before changing a
// `next` field, make sure you still hold every node you will need later.
// Five techniques cover most of them:
//
//	reverse          three pointers: prev, cur, next
//	slow/fast        one pointer moves 1 step, the other 2 (middle, cycles)
//	gap pointers     second pointer starts k steps ahead (k-th from the end)
//	sentinel (dummy) a fake head removes the "is it the first node?" case
//	merge            relink existing nodes instead of allocating new ones
//
// Run: go run 16_list_algorithms.go
package main

import (
	"fmt"
	"strings"
)

type Node struct {
	Val  int
	Next *Node
}

// fromSlice builds a list; toString prints it. Test helpers.
func fromSlice(vals []int) *Node {
	dummy := &Node{} // sentinel: we always append after `tail`
	tail := dummy
	for _, v := range vals {
		tail.Next = &Node{Val: v}
		tail = tail.Next
	}
	return dummy.Next // the real head (nil for an empty slice)
}

func toString(head *Node) string {
	var b strings.Builder
	for n := head; n != nil; n = n.Next {
		fmt.Fprintf(&b, "%d->", n.Val)
	}
	b.WriteString("nil")
	return b.String()
}

// reverse flips every Next pointer: O(n) time, O(1) space.
//
//	before: prev  cur -> next -> ...
//	after : prev <- cur    next -> ...   then slide all three one step right
func reverse(head *Node) *Node {
	var prev *Node
	cur := head
	for cur != nil {
		next := cur.Next // 1. save the rest of the list before we lose it
		cur.Next = prev  // 2. flip the pointer
		prev = cur       // 3. advance prev
		cur = next       // 4. advance cur
	}
	return prev // prev is the old tail = the new head
}

// reverseRecursive: reverse the rest, then hook the current node at its end.
// Elegant, but uses O(n) stack space — prefer the loop for long lists.
func reverseRecursive(head *Node) *Node {
	if head == nil || head.Next == nil {
		return head
	}
	newHead := reverseRecursive(head.Next)
	head.Next.Next = head // the node after head now points back to head
	head.Next = nil
	return newHead
}

// middle returns the middle node (the second of two middles for even length).
// fast moves twice as fast, so when fast reaches the end, slow is halfway.
func middle(head *Node) *Node {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
	}
	return slow
}

// hasCycle uses Floyd's tortoise-and-hare: in a cycle the fast pointer gains
// one step per iteration on the slow one, so it must eventually land on it.
// O(n) time, O(1) space — a map of visited nodes would need O(n) space.
func hasCycle(head *Node) bool {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
		if slow == fast { // compares POINTERS (node identity), not values
			return true
		}
	}
	return false
}

// removeNthFromEnd deletes the n-th node from the end (1 = last).
// Gap pointers: `lead` starts n+1 steps ahead of `trail`; when lead falls off
// the end, trail sits just BEFORE the victim. The sentinel makes removing the
// real head an ordinary case.
func removeNthFromEnd(head *Node, n int) *Node {
	dummy := &Node{Next: head}
	lead, trail := dummy, dummy
	for i := 0; i <= n; i++ {
		if lead == nil {
			return head // n is larger than the list: nothing to remove
		}
		lead = lead.Next
	}
	for lead != nil {
		lead = lead.Next
		trail = trail.Next
	}
	trail.Next = trail.Next.Next
	return dummy.Next // may differ from head if the head was removed
}

// mergeSorted merges two sorted lists by relinking nodes: O(n+m), O(1) extra.
func mergeSorted(a, b *Node) *Node {
	dummy := &Node{}
	tail := dummy
	for a != nil && b != nil {
		if a.Val <= b.Val {
			tail.Next, a = a, a.Next
		} else {
			tail.Next, b = b, b.Next
		}
		tail = tail.Next
	}
	if a != nil { // attach whatever remains — it is already sorted
		tail.Next = a
	} else {
		tail.Next = b
	}
	return dummy.Next
}

// isPalindrome combines three techniques: find the middle, reverse the
// second half, compare, then restore the list (leave inputs as you found them).
func isPalindrome(head *Node) bool {
	if head == nil {
		return true
	}
	mid := middle(head)
	second := reverse(mid)
	ok := true
	for p, q := head, second; q != nil; p, q = p.Next, q.Next {
		if p.Val != q.Val {
			ok = false
			break
		}
	}
	reverse(second) // restore the original order of the second half
	return ok
}

func main() {
	l := fromSlice([]int{1, 2, 3, 4, 5})
	fmt.Println("list          ", toString(l))
	fmt.Println("middle        ", middle(l).Val)
	l = reverse(l)
	fmt.Println("reverse       ", toString(l))
	l = reverseRecursive(l)
	fmt.Println("reverse again ", toString(l))
	l = removeNthFromEnd(l, 2)
	fmt.Println("remove 2nd-end", toString(l))
	l = removeNthFromEnd(l, 4) // removes the head: the sentinel handles it
	fmt.Println("remove head   ", toString(l))

	fmt.Println("merge         ", toString(mergeSorted(fromSlice([]int{1, 4, 6}), fromSlice([]int{2, 3, 7, 8}))))

	for _, vals := range [][]int{{1, 2, 3, 2, 1}, {1, 2, 2, 1}, {1, 2, 3}} {
		p := fromSlice(vals)
		fmt.Printf("palindrome %-11v %-5v list intact: %s\n", fmt.Sprint(vals), isPalindrome(p), toString(p))
	}

	c := fromSlice([]int{1, 2, 3, 4})
	fmt.Println("cycle before  ", hasCycle(c))
	c.Next.Next.Next.Next = c.Next // 4 -> 2 creates a loop; never print this list!
	fmt.Println("cycle after   ", hasCycle(c))
}
