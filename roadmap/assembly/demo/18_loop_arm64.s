// ---------------------------------------------------------------------------
// 18_loop_arm64.s — loops and comparisons in ARM64.
//
// Build: as 18_loop_arm64.s -o loop.o && ld loop.o -o loop && ./loop
// Then:  echo "exit status = $?"      (expect 55: the sum 1..10)
//
// Cross-compile: aarch64-linux-gnu-as ... ; qemu-aarch64 ./loop
// ---------------------------------------------------------------------------

        .section .text
        .global _start

_start:
        // --- for (i = 1; i <= 10; i++) total += i ---------------------------
        mov     x1, #0                  // x1 = total = 0
        mov     x2, #1                  // x2 = i = 1

.for_loop:
        cmp     x2, #10                 // compare i with 10
        b.gt    .for_done               // b.gt = "branch if greater, signed"
        add     x1, x1, x2              // total += i
        add     x2, x2, #1              // i++
        b       .for_loop               // unconditional branch back

.for_done:
        // x1 = 55

        // --- while (n > 0) n >>= 1 ------------------------------------------
        mov     x3, #100                // n = 100
        mov     x4, #0                  // iteration counter

.while_loop:
        cbz     x3, .while_done         // cbz = "compare and branch if zero"
        lsr     x3, x3, #1              // n = n >> 1  (logical shift right)
        add     x4, x4, #1              // counter++
        b       .while_loop

.while_done:
        // 100 -> 50 -> 25 -> 12 -> 6 -> 3 -> 1 -> 0, so x4 = 7

        // --- exit, reporting the for-loop total ------------------------------
        mov     x0, x1                  // x0 = exit status = 55
        mov     x8, #93                 // syscall 93 = exit
        svc     #0

// ARM condition codes are SUFFIXES on the branch mnemonic, not separate
// instructions: b.gt, b.le, b.eq, b.ne, b.lt, b.ge, b.hi, b.ls.
//   - signed:   gt, ge, lt, le
//   - unsigned: hi (higher), hs/hs, lo (lower), ls (lower or same)
// Getting the signed/unsigned suffix wrong has exactly the same consequence
// as choosing jg when you needed ja on x86-64.
//
// Try this: replace `b.gt .for_done` with `b.ge .for_done`. The sum drops from
// 55 to 45 — an off-by-one that is invisible until you add up the numbers by
// hand, which is why testing loops at BOTH bounds matters.
