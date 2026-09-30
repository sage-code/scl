// 19_ring_buffer_queue.go — A FIFO queue that reuses its memory.
//
// The obvious slice queue is `q = append(q, x)` to enqueue and `q = q[1:]`
// to dequeue. Dequeue is O(1), but the slice's start only moves forward:
// the memory in front of it is never reused while the queue lives, and
// append keeps reallocating at the back.
//
// A ring buffer (circular buffer) keeps a fixed array and two positions.
// Indices wrap around with modulo arithmetic, so freed slots at the front
// are reused for new elements at the back:
//
//	buf:  [ c | d | _ | _ | a | b ]      head=4 (oldest), size=4
//	                  ^tail = (head+size) % len(buf) = 2
//
// When full, it doubles its capacity, copying elements into order: every
// operation is O(1) amortized, and memory stays proportional to the size.
//
// Run: go run 19_ring_buffer_queue.go
package main

import "fmt"

// Queue is a generic FIFO ring buffer. It also works as a deque (double-ended
// queue) because both ends support push and pop in O(1).
type Queue[T any] struct {
	buf  []T
	head int // index of the front element
	size int // number of stored elements

	allocated int // total slots ever allocated (for the comparison below)
}

func NewQueue[T any](capacity int) *Queue[T] {
	c := max(capacity, 1)
	return &Queue[T]{buf: make([]T, c), allocated: c}
}

func (q *Queue[T]) Len() int { return q.size }

// grow doubles the capacity and "unrolls" the ring so head becomes 0.
func (q *Queue[T]) grow() {
	nb := make([]T, len(q.buf)*2)
	for i := 0; i < q.size; i++ {
		nb[i] = q.buf[(q.head+i)%len(q.buf)] // i-th element in queue order
	}
	q.buf, q.head = nb, 0
	q.allocated += len(nb)
}

// PushBack enqueues at the tail.
func (q *Queue[T]) PushBack(v T) {
	if q.size == len(q.buf) {
		q.grow()
	}
	q.buf[(q.head+q.size)%len(q.buf)] = v
	q.size++
}

// PopFront dequeues from the head.
func (q *Queue[T]) PopFront() (T, bool) {
	var zero T
	if q.size == 0 {
		return zero, false
	}
	v := q.buf[q.head]
	q.buf[q.head] = zero               // release the reference for the GC
	q.head = (q.head + 1) % len(q.buf) // wrap around at the end
	q.size--
	return v, true
}

// PushFront and PopBack make it a deque.
func (q *Queue[T]) PushFront(v T) {
	if q.size == len(q.buf) {
		q.grow()
	}
	// step head back one slot; adding len(buf) keeps the result non-negative
	q.head = (q.head - 1 + len(q.buf)) % len(q.buf)
	q.buf[q.head] = v
	q.size++
}

func (q *Queue[T]) PopBack() (T, bool) {
	var zero T
	if q.size == 0 {
		return zero, false
	}
	i := (q.head + q.size - 1) % len(q.buf)
	v := q.buf[i]
	q.buf[i] = zero
	q.size--
	return v, true
}

// ---------------------------------------------------------------- scenario

// A print server receives jobs in bursts and processes them in arrival order.
type Job struct {
	ID    int
	Pages int
}

// naiveAllocated simulates the q = q[1:] approach with the same traffic and
// counts every slot append allocates. Dequeued slots at the front are never
// written again; once the back fills up, append must allocate a new array.
func naiveAllocated(rounds, burst int) int {
	var q []Job
	total, id := 0, 0
	for r := 0; r < rounds; r++ {
		for i := 0; i < burst; i++ {
			id++
			full := len(q) == cap(q)
			q = append(q, Job{id, 1})
			if full { // append had to allocate a new backing array
				total += cap(q)
			}
		}
		for i := 0; i < burst; i++ {
			q = q[1:] // the front slot is skipped, never reused
		}
	}
	return total
}

func main() {
	q := NewQueue[Job](2)
	for i := 1; i <= 5; i++ {
		q.PushBack(Job{i, i * 10})
	}
	fmt.Println("len:", q.Len(), "capacity:", len(q.buf))
	for q.Len() > 0 {
		j, _ := q.PopFront()
		fmt.Printf("printing job %d (%d pages)\n", j.ID, j.Pages)
	}

	// Steady traffic: bursts of 100 jobs, fully drained each round.
	rounds, burst := 1000, 100
	ring := NewQueue[Job](16)
	id := 0
	for r := 0; r < rounds; r++ {
		for i := 0; i < burst; i++ {
			id++
			ring.PushBack(Job{id, 1})
		}
		for i := 0; i < burst; i++ {
			ring.PopFront()
		}
	}
	fmt.Printf("\n%d jobs processed\n", id)
	fmt.Println("ring buffer: slots allocated in total:", ring.allocated, "(capacity", len(ring.buf), "reused)")
	fmt.Println("q = q[1:]:   slots allocated in total:", naiveAllocated(rounds, burst))
	// Every slot the naive queue allocates becomes garbage for the GC to
	// collect; the ring buffer allocates once and recycles its slots.

	// Deque usage: both ends.
	d := NewQueue[string](4)
	d.PushBack("b")
	d.PushBack("c")
	d.PushFront("a")
	d.PushFront("start")
	d.PushBack("end") // triggers grow() while head != 0: order must survive
	var order []string
	for d.Len() > 0 {
		v, _ := d.PopFront()
		order = append(order, v)
	}
	fmt.Println("\ndeque order:", order)
}
