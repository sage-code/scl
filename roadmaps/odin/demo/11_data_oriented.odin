// 11_data_oriented.odin — layout, cache-friendly iteration, flags and timing.
//
// Run it with:
//     odin run 11_data_oriented.odin -file
// For a release-shaped measurement, build it instead:
//     odin build 11_data_oriented.odin -file -o:speed
//
// What it shows:
//   * Field order decides a struct's size, because alignment inserts padding.
//   * Array-of-structs walks bytes it does not use; structure-of-arrays walks
//     only what the loop needs.
//   * A bit_set stores many yes/no facts in one small integer, so flags cost
//     almost nothing to carry along.
//   * `read_cycle_counter` measures work in processor cycles, with no profiler.
//
// This demo is the reason Phase 2 insisted that every type has a size. Once you
// can see sizes, data layout stops being a detail and becomes a decision.

package main

import "base:runtime"
import "core:fmt"

ENTITY_COUNT :: 20_000

// The order of these two fields decides the size of the struct. A bool is one
// byte, an f32 wants four, and alignment inserts three bytes of padding so the
// f32 can start on a four-byte boundary.
Padded :: struct {
	visible: bool,			// 1 byte  + 3 bytes of padding
	speed:   f32,			// 4 bytes
}

// The same two fields, the other way round. The f32 goes first, the bool tucks
// in behind it, and no padding is needed.
Packed :: struct {
	speed:   f32,			// 4 bytes
	visible: bool,			// 1 byte + 3 bytes of tail padding
}

// Flags for one entity, all of them in a single small integer.
Entity_Flag :: enum { Alive, Visible, Selected }
Entity_Flags :: bit_set[Entity_Flag; u8]

main :: proc() {
	// --- Field order is a decision ---
	fmt.println("size_of(Padded) =", size_of(Padded))
	fmt.println("size_of(Packed) =", size_of(Packed))
	// Both hold one bool and one f32. Reordering shrinks the struct, and the
	// compiler never reorders fields for you — data modelling is your job.

	// --- Array of structs: convenient, and sometimes wasteful ---
	// Each entity keeps position, health and flags together. That is natural to
	// write and natural to read.
	entities := make([]Entity, ENTITY_COUNT)
	defer delete(entities)

	for i in 0..<ENTITY_COUNT {
		entities[i] = Entity{
			x      = f32(i),
			y      = f32(i) * 0.5,
			health = 100,
			flags  = { .Alive },
		}
	}

	// --- Structure of arrays: only the fields the loop touches ---
	// Three separate arrays. The position loop below reads nothing but x and y,
	// so no cache line is spent dragging health and flags along for the ride.
	xs := make([]f32, ENTITY_COUNT)
	defer delete(xs)

	ys := make([]f32, ENTITY_COUNT)
	defer delete(ys)

	for i in 0..<ENTITY_COUNT {
		xs[i] = f32(i)
		ys[i] = f32(i) * 0.5
	}

	// --- The same work, two layouts, measured ---
	// `runtime.read_cycle_counter` reads the processor's own clock, which makes
	// it the cheapest measurement available. Numbers vary between runs, so
	// compare the two figures below rather than trusting either one alone.
	cycles_aos := runtime.read_cycle_counter()
	sum_aos: f32 = 0
	for i in 0..<ENTITY_COUNT {
		sum_aos += entities[i].x + entities[i].y
	}
	cycles_aos = runtime.read_cycle_counter() - cycles_aos

	cycles_soa := runtime.read_cycle_counter()
	sum_soa: f32 = 0
	for i in 0..<ENTITY_COUNT {
		sum_soa += xs[i] + ys[i]
	}
	cycles_soa = runtime.read_cycle_counter() - cycles_soa

	fmt.printfln("array of structs : %v cycles (sum %v)", cycles_aos, sum_aos)
	fmt.printfln("struct of arrays : %v cycles (sum %v)", cycles_soa, sum_soa)
	// Both sums match — the same numbers, read the same way. Only the layout
	// differs, and the difference is measured in how much memory the processor
	// had to fetch to do the same arithmetic.

	// --- Flags cost a byte for all of them ---
	// One integer holds three facts, and the whole set still occupies a byte.
	fmt.println("size_of(Entity_Flags) =", size_of(Entity_Flags))

	state: Entity_Flags = { .Alive, .Visible }

	// Setting and clearing are the set operations from the structs demo: `+`
	// adds a member, `&~` removes one.
	state = state + { .Selected }
	state = state &~ { .Visible }

	fmt.println("state:", state)
	fmt.println("alive :", .Alive in state)
	fmt.println("visible:", .Visible in state)

	// Because a bit_set is an integer, describing an entity costs one byte
	// instead of three separate booleans — and the whole set can be copied,
	// compared and stored as a single value.
}

// The two layouts of the same data, declared together for comparison.
Entity :: struct {
	x, y:   f32,
	health: int,
	flags:  Entity_Flags,
}
