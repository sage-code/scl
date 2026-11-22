// ---------------------------------------------------------------------------
// 19_call_arm64.s — function calls, the link register, and stack frames.
//
// Build: as 19_call_arm64.s -o call.o && ld call.o -o call && ./call
// Then:  echo "exit status = $?"      (expect 42)
//
// ARM64 calling convention (AAPCS64):
//   arguments 0..7  ->  x0..x7
//   return value    ->  x0
//   return address  ->  x30 (also called lr, the link register)
//   stack pointer   ->  sp (must stay 16-byte aligned)
// ---------------------------------------------------------------------------

        .section .text
        .global _start

_start:
        mov     x0, #14                 // argument 1 = 14
        bl      triple                  // bl = "branch with link": sets lr then jumps

        mov     x1, x0                  // keep triple()'s result
        mov     x0, x1                  // argument 1 = that result
        mov     x1, #5                  // argument 2 = 5
        bl      add_two                 // x0 = 47

        mov     x0, x0                  // exit status = the returned value
        // (the line above is a no-op; the result is already in x0)
        mov     x8, #93                 // syscall 93 = exit
        svc     #0

// ---------------------------------------------------------------------------
// long triple(long x)   — x in x0, result in x0
// A LEAF function calls nothing, so it never has to save lr.
// ---------------------------------------------------------------------------
triple:
        lsl     x0, x0, #1              // x0 = x0 << 1  (= x * 2)
        add     x0, x0, #14             // + 14  ->  for x = 14 this is 42
        ret                             // return to the address in lr

// ---------------------------------------------------------------------------
// long add_two(long a, long b)   — a in x0, b in x1
// Demonstrates a NON-LEAF function frame. `bl` overwrites lr, so the caller's
// return address must be stored on the stack first.
// ---------------------------------------------------------------------------
add_two:
        stp     x29, x30, [sp, #-16]!   // pre-decrement sp by 16 and store
                                        // x29 (frame pointer) and x30 (lr)
        mov     x29, sp                 // establish the frame pointer

        add     x0, x0, x1              // x0 = a + b   (result already in x0)

        ldp     x29, x30, [sp], #16     // post-increment sp by 16 and load
                                        // the saved frame pointer and lr
        ret                             // return via the restored lr

// Why the save is mandatory: `bl add_two` from within another function would
// overwrite lr, and without saving it the eventual `ret` would jump back to
// the wrong place. The stp/ldp pair is the ARM equivalent of the x86
// `push rbp; mov rbp, rsp` / `pop rbp` prologue-and-epilogue.
//
// Try this: comment out the `stp` and `ldp`. This program still returns
// correctly (there is only one level of call), but as soon as add_two calls
// another function, the return address is lost — the classic ARM beginner bug.
