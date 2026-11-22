; ---------------------------------------------------------------------------
; 05_control.asm — if / else and the conditional-jump family.
;
; Build:  nasm -f elf64 05_control.asm -o control.o
; Link:   ld control.o -o control
; Run:    ./control ; echo "exit status = $?"
; ---------------------------------------------------------------------------

section .text
    global _start

_start:
    ; The value we are testing, in rax (signed).
    mov     rax, -15

    ; --- if (rax > 10) ----- ------------------------------------------------
    ; We jump past the "then" block when the condition is FALSE.
    cmp     rax, 10
    jle     .not_greater            ; signed compare: use jle, not jbe!

    ; --- then-block: rax > 10 ---
    mov     rdi, 1                  ; remember: status 1 means "greater"
    jmp     .finished               ; MUST skip the else-block

.not_greater:
    ; --- else-block -------------------------------------------------------
    cmp     rax, 0
    jl      .negative               ; signed: rax < 0

    mov     rdi, 2                  ; 0 <= rax <= 10
    jmp     .finished

.negative:
    mov     rdi, 3                  ; rax < 0  -> this branch will be taken

.finished:
    ; --- signed vs unsigned on the SAME flags -----------------------------
    ; rax is negative. Compare it two ways and observe that the answers differ.
    cmp     rax, 10
    jl      .signed_less            ; TRUE for -15 < 10  -> taken
    jmp     .done

.signed_less:
    ; An unsigned comparison of the same bits would say -15 is a huge number:
    ;   cmp rax, 10 / jb .taken    -> NOT taken, because 0xFFFFFFF1 > 10
    ; That single difference is why jl/jg and jb/ja are not interchangeable.
    nop

.done:
    mov     rax, 60                 ; exit
    syscall                         ; rdi already holds the status

; Try this: change the initial `mov rax, -15` to `mov rax, 100` and watch the
; exit status change from 3 to 1. Then change `jle` to `jbe` and see how a
; negative value is suddenly treated as enormous.
