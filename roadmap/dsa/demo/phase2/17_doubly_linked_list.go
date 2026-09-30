// 17_doubly_linked_list.go — Doubly linked list with a sentinel node.
//
// Each node points to BOTH neighbours, so a node can remove itself in O(1)
// without searching for its predecessor. A single sentinel node closes the
// list into a ring:
//
//	sentinel <-> first <-> ... <-> last <-> sentinel
//
// With the sentinel there are no nil checks: every real node always has a
// prev and a next. The empty list is a sentinel pointing to itself.
//
// Application: a playlist where the user moves songs to the front, removes
// songs, and plays from either end — every edit is O(1) given the node.
//
// Run: go run 17_doubly_linked_list.go
package main

import (
	"fmt"
	"strings"
)

type Node struct {
	Song       string
	prev, next *Node
}

type Playlist struct {
	root  Node // sentinel; root.next = first, root.prev = last
	size  int
	index map[string]*Node // song -> node, for O(1) access by name
}

func NewPlaylist() *Playlist {
	p := &Playlist{index: map[string]*Node{}}
	p.root.next = &p.root // empty ring: the sentinel links to itself
	p.root.prev = &p.root
	return p
}

// insertAfter links n directly after `at`. Four pointer writes, in an order
// that never loses a reference: first n's own links, then the neighbours.
func (p *Playlist) insertAfter(n, at *Node) {
	n.prev = at
	n.next = at.next
	at.next.prev = n
	at.next = n
	p.size++
}

// unlink removes n from the ring in O(1): its neighbours point past it.
func (p *Playlist) unlink(n *Node) {
	n.prev.next = n.next
	n.next.prev = n.prev
	n.prev, n.next = nil, nil // detached node must not be walked again
	p.size--
}

func (p *Playlist) AddFront(song string) {
	n := &Node{Song: song}
	p.insertAfter(n, &p.root)
	p.index[song] = n
}

func (p *Playlist) AddBack(song string) {
	n := &Node{Song: song}
	p.insertAfter(n, p.root.prev) // after the last node
	p.index[song] = n
}

// MoveToFront is the operation an LRU cache performs on every access
// (see Production Structures in Phase 4): unlink + insert, both O(1).
func (p *Playlist) MoveToFront(song string) bool {
	n, ok := p.index[song]
	if !ok {
		return false
	}
	p.unlink(n)
	p.insertAfter(n, &p.root)
	return true
}

func (p *Playlist) Remove(song string) bool {
	n, ok := p.index[song]
	if !ok {
		return false
	}
	p.unlink(n)
	delete(p.index, song)
	return true
}

// PopBack removes the last song — the "least recently used" end.
func (p *Playlist) PopBack() (string, bool) {
	if p.size == 0 {
		return "", false
	}
	last := p.root.prev
	p.unlink(last)
	delete(p.index, last.Song)
	return last.Song, true
}

// String walks forward; Reverse walks backward — possible only because
// every node has a prev pointer.
func (p *Playlist) String() string {
	var parts []string
	for n := p.root.next; n != &p.root; n = n.next {
		parts = append(parts, n.Song)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

func (p *Playlist) Reverse() string {
	var parts []string
	for n := p.root.prev; n != &p.root; n = n.prev {
		parts = append(parts, n.Song)
	}
	return "[" + strings.Join(parts, ", ") + "]"
}

// checkLinks verifies the invariant n.next.prev == n for every node:
// the most common doubly-linked-list bug is updating one direction only.
func (p *Playlist) checkLinks() bool {
	count := 0
	for n := p.root.next; n != &p.root; n = n.next {
		if n.next.prev != n || n.prev.next != n {
			return false
		}
		count++
	}
	return count == p.size && len(p.index) == p.size
}

func main() {
	p := NewPlaylist()
	for _, s := range []string{"Intro", "Blue", "Green", "Red"} {
		p.AddBack(s)
	}
	p.AddFront("Opening")
	fmt.Println("playlist       ", p, "links ok:", p.checkLinks())

	p.MoveToFront("Green")
	fmt.Println("Green to front ", p, "links ok:", p.checkLinks())

	p.Remove("Blue")
	fmt.Println("remove Blue    ", p, "links ok:", p.checkLinks())
	fmt.Println("backwards      ", p.Reverse())

	last, _ := p.PopBack()
	fmt.Println("pop back       ", last, "->", p, "links ok:", p.checkLinks())

	for p.size > 0 {
		p.PopBack()
	}
	fmt.Println("emptied        ", p, "sentinel self-linked:", p.root.next == &p.root && p.root.prev == &p.root)
}
