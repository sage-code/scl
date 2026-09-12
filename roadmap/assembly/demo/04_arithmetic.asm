; ---------------------------------------------------------------------------
; 04_arithmetic.asm — add, sub, inc, dec, imul, and reading the flags.
;
; Build:  nasm -f elf64 04_arithmetic.asm -o arith.o
; Link:   ld arith.o -o arith
; Run:    ./arith ; echo "exit status = $?"
;
; The demo computes with registers and exits with the final result, so the
; shell's $? shows whether the arithmetic did what you expected.
; ---------------------------------------------------------------------------

section .text
    global _start

_start:
    ; --- basic arithmetic ---------------------------------------------------
    mov     rax, 50
    add     rax, 8                  ; rax = 58
    sub     rax, 20                 ; rax = 38
    inc     rax                     ; rax = 39   (inc does NOT touch CF)
    dec     rax                     ; rax = 38

    ; --- negation -----------------------------------------------------------
    mov     rbx, 10
    neg     rbx                     ; rbx = -10 (two's complement)

    ; --- multiply: imul keeps the LOW half of the product -------------------
    mov     rax, 6
    mov     rcx, 7
    imul    rax, rcx                ; rax = 42

    ; --- the three-operand form: dst = src * constant -----------------------
    mov     rbx, 5
    imul    rdx, rbx, 3             ; rdx = 5 * 3 = 15

    ; --- divide: the dividend is ALWAYS rdx:rax ----------------------------
    mov     rax, 100                ; low half of the dividend
    xor     rdx, rdx                ; high half = 0  (UNSIGNED; use cqo if signed)
    mov     rcx, 7                  ; divisor
    div     rcx                     ; rax = 14 (quotient), rdx = 2 (remainder)

    ; --- shift as fast multiply --------------------------------------------
    mov     rax, 9
    shl     rax, 3                  ; rax = 9 * 8 = 72

    ; --- modulo without dividing, because 8 is a power of two --------------
    mov     rax, 12345
    and     rax, 7                  ; rax = 12345 % 8 = 1

    ; Return a value the shell can display (0..255).
    mov     rax, 42                 ; final answer
    mov     rdi, rax
    mov     rax, 60                 ; exit
    syscall

; Try this: remove the `xor rdx, rdx` before the `div`. The program dies with
; "Floating point exception" — that is SIGFPE, raised because the quotient
; would not fit. It is the most common arithmetic bug in assembly.
