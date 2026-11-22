// ---------------------------------------------------------------------------
// 17_hello_arm64.s — the smallest complete Linux ARM64 program.
//
// Build (native ARM64 Linux, GNU as):
//     as 17_hello_arm64.s -o hello.o
//     ld hello.o -o hello
//     ./hello
//
// Build (cross-compile from x86-64, then run under QEMU):
//     aarch64-linux-gnu-as 17_hello_arm64.s -o hello.o
//     aarch64-linux-gnu-ld hello.o -o hello
//     qemu-aarch64 ./hello
//
// Or paste it into https://cpulator.01xz.net/ (select ARMv8 / AArch64).
// ---------------------------------------------------------------------------

        .section .rodata
msg:    .ascii  "Hello, ARM64!\n"       // 14 bytes, no terminator needed
        .equ    msg_len, . - msg        // assembler computes the length

        .section .text
        .global _start

_start:
        // --- write(1, msg, msg_len) ----------------------------------------
        // Linux ARM64 syscalls use x8 for the NUMBER and x0..x5 for the
        // ARGUMENTS. (On x86-64 it is rax for the number and rdi/rsi/rdx.)
        mov     x0, #1                  // x0 = fd 1 = stdout
        adr     x1, msg                 // x1 = address of the string (PC-relative)
        mov     x2, #msg_len            // x2 = number of bytes
        mov     x8, #64                 // x8 = syscall 64 = write
        svc     #0                      // supervisor call: enter the kernel

        // --- exit(0) --------------------------------------------------------
        mov     x0, #0                  // x0 = exit status
        mov     x8, #93                 // x8 = syscall 93 = exit
        svc     #0                      // never returns

// Differences from the x86-64 version worth noticing:
//   * the syscall mechanism is `svc #0`, not `syscall`
//   * the syscall NUMBER goes in x8, not rax
//   * `adr` computes a PC-relative address — there is no absolute addressing
//   * numbers arrive as `mov x0, #1` with a literal `#` prefix
//
// Try this: change `msg_len` to 5 in the `mov x2, #msg_len` line (write
// `mov x2, #5` instead) and only "Hello" appears — exactly as on x86-64.
