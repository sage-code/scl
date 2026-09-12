; ---------------------------------------------------------------------------
; 07_functions.asm — call, ret, arguments in registers, and return values.
;
; Build:  nasm -f elf64 07_functions.asm -o funcs.o
; Link:   ld funcs.o -o funcs
; Run:    ./funcs ; echo "exit status = $?"   (expect 42)
;
; Calling convention (System V AMD64, Linux):
;   arguments 1..6  ->  rdi, rsi, rdx, rcx, r8, r9
;   return value    ->  rax
;   caller-saved    ->  rax, rcx, rdx, rsi, rdi, r8..r11
;   callee-saved    ->  rbx, rbp, r12..r15, rsp
; ---------------------------------------------------------------------------

section .text
    global _start

_start:
    ; --- call triple(14) and check the answer -----------------------------
    mov     rdi, 14                 ; argument 1 = 14
    call    triple                  ; rax = 42 on return

    ; --- call add_two(rax, 5) ---------------------------------------------
    mov     rdi, rax                ; pass the result of triple() as arg 1
    mov     rsi, 5                  ; arg 2 = 5
    call    add_two                 ; rax = 47

    ; --- exit, showing the result -----------------------------------------
    mov     rdi, rax                ; status = 47
    mov     rax, 60
    syscall

; ---------------------------------------------------------------------------
; long triple(long x)   — x in rdi, result in rax
; A leaf function that touches only rax needs no frame at all.
; ---------------------------------------------------------------------------
triple:
    mov     rax, rdi                ; rax = x
    imul    rax, 3                  ; rax = x * 3
    ret

; ---------------------------------------------------------------------------
; long add_two(long a, long b)   — a in rdi, b in rsi
; Demonstrates a callee-saved register: rbx must be restored before returning,
; because the caller may be keeping a value in it.
; ---------------------------------------------------------------------------
add_two:
    push    rbx                     ; preserve rbx (we are about to use it)
    mov     rbx, rdi                ; rbx = a
    add     rbx, rsi                ; rbx = a + b
    mov     rax, rbx                ; return value goes in rax
    pop     rbx                     ; restore the caller's rbx
    ret

; Try this: delete the `push rbx` / `pop rbx` pair. This program still works,
; because _start keeps nothing in rbx — but the moment a caller does, this
; function quietly corrupts it. That is the class of bug that makes ABI
; compliance matter.
