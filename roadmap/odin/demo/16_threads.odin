// 16_threads.odin — spawning threads, passing data, and joining them back.
//
// Run it with:
//     odin run 16_threads.odin -file
//
// What it shows:
//   * A thread runs a procedure whose signature is fixed: `proc(^Thread)`.
//   * Your data reaches it through the thread handle's `data` field, set
//     BETWEEN create and start — that window is the whole argument-passing
//     mechanism.
//   * `join` waits for a thread to finish; skipping it means the program may
//     exit while workers are still running.
//   * An atomic operation on a shared flag, for the one piece of state that
//     both threads touch.
//
// The output order between the workers is not fixed. Run it a few times: the
// interleaving changes, and that is normal concurrency, not a bug.

package main

import "base:intrinsics"
import "core:fmt"
import "core:thread"

// How many workers to start. Keep it small so the interleaving is readable.
WORKERS :: 4

// The payload a worker needs. One struct per job, and the address of it travels
// through the thread handle.
Job :: struct {
	index:   int,
	label:   string,
	results: ^[WORKERS]int,		// shared: every worker writes its own slot
}

// Shared state that more than one thread touches. A bit_set is one small
// integer, and the atomic operation below makes the update indivisible.
Worker_Flag :: enum { Done }
Worker_Flags :: bit_set[Worker_Flag; u8]

var finished: Worker_Flags

// The thread procedure. The parameter is the THREAD, not your data: the data
// is reached through it, which is why this signature never changes.
worker :: proc(t: ^thread.Thread) {
	// Recover the payload. `data` is a rawptr — untyped — so the conversion
	// back to ^Job is written out explicitly.
	job := cast(^Job)t.data

	// Do the work. This is ordinary code: it has a context, allocators, and
	// access to everything the program owns.
	total := 0
	for i in 1..=job.index + 1 {
		total += i
	}

	// Write into this worker's own slot. No two threads write the same place,
	// which is what makes this safe without a lock.
	job.results[job.index] = total

	fmt.printfln("worker %v (%v) computed %v", job.index, job.label, total)

	// A shared flag, updated atomically. `atomic_or` on a bit_set mirrors the
	// idiom core:thread uses for its own bookkeeping.
	intrinsics.atomic_or(&finished, { .Done })
}

main :: proc() {
	// Storage for the results, owned by main and read only after joining.
	results: [WORKERS]int

	// Labels just to make the output easier to follow.
	labels := []string{"alpha", "beta", "gamma", "delta"}

	// One job record per worker, laid out so each worker has its own.
	jobs: [WORKERS]Job
	threads: [WORKERS]^thread.Thread

	// --- Create, fill in, then start ---
	// create() returns a thread in a SUSPENDED state, which is what gives you
	// the moment in which to set `data`.
	for i in 0..<WORKERS {
		jobs[i] = Job{
			index   = i,
			label   = labels[i],
			results = &results,
		}

		t := thread.create(worker)
		t.data = rawptr(&jobs[i])		// hand over the payload
		threads[i] = t

		// Nothing is running yet: `start` is what begins execution.
		thread.start(t)
	}

	fmt.println("all workers started; joining them now")

	// --- Join ---
	// join waits for the thread to finish. The loop below reads the results
	// only afterwards, when every write has certainly happened.
	for i in 0..<WORKERS {
		thread.join(threads[i])
	}

	// --- Read the results ---
	fmt.println("results collected:")
	for value, index in results {
		fmt.printfln("  worker %v contributed %v", index, value)
	}

	// The flag says every worker reported. Reading it after joining is safe
	// for the same reason.
	fmt.println("all workers done:", .Done in finished)

	// --- What to remember ---
	// A thread is a procedure plus a handle. Your data travels through the
	// handle, set between create and start. join is how you learn that the work
	// is finished, and it is also what guarantees the memory the worker used is
	// safe to read afterwards.
	//
	// Each thread also gets its own context, including its own temporary
	// allocator — which is why a worker may allocate freely without disturbing
	// the thread that started it.
}
