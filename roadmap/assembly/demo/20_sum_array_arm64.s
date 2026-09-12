// ---------------------------------------------------------------------------
// 20_sum_array_arm64.s — scaled indexing and memory loads in ARM64.
//
// Build: as 20_sum_array_arm64.s -o asum.o && ld asum.o -o asum && ./asum
// Then:  echo "exit status = $?"      (expect 150, the sum of the array)
//
// Compare this directly with ../14_array_sum.asm (x86-64). The ALGORITHM is
// identical; only the spelling of the addressing and the branches changes.
// ---------------------------------------------------------------------------

        .section .rodata
values: .quad   10, 20, 30, 40, 50      // five 64-bit values (8 bytes each)
        .equ    COUNT, (. - values) / 8 // element count, computed for us

        .section .text
        .global _start

_start:
        adr     x0, values              // x0 = base address of the array
        mov     x1, #0                  // x1 = total = 0
        mov     x2, #0                  // x2 = index i = 0

.loop:
        cmp     x2, #COUNT
        b.ge    .done                   // if i >= COUNT, finish

        // THE key line: base + index, with the index SCALED by the shift.
        // `lsl #3` shifts the index left by 3, which multiplies it by 8 —
        // the size of a quadword. ARM expresses the scale as a shift because
        // there is no implicit scaling in the addressing mode.
        ldr     x3, [x0, x2, lsl #3]    // x3 = values[i]

        add     x1, x1, x3              // total += values[i]

        add     x2, x2, #1              // i++
        b       .loop

.done:
        mov     x0, x1                  // exit status = 150
        mov     x8, #93                 // syscall 93 = exit
        svc     #0

// Reading the addressing form: [base, index, lsl #n]
//   lsl #3  -> index * 8   (quadword array)
//   lsl #2  -> index * 4   (word array)
//   lsl #1  -> index * 2   (halfword array)
//   lsl #0  -> index * 1   (byte array; can be omitted)
//
// This is the ARM equivalent of x86-64's [rbx + rcx*8]. The difference is that
// x86 encodes the scale as a number (1, 2, 4, or 8) while ARM encodes it as a
// shift amount — the same idea, expressed in the idiom of the architecture.
//
// Try this: change the values to .word and the shift to lsl #2, then change
// the .equ divisor to 4. The loop body does not change at all: only the
// element size, and therefore the scale, is different.
