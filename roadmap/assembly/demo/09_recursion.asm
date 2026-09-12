; ---------------------------------------------------------------------------
; 09_recursion.asm — factorial, and why the argument must be saved.
;
; Build:  nasm -f elf64 09_recursion.asm -o fact.o
; Link:   ld fact.o -o fact
; Run:    ./fact ; echo "exit status = $?"    (5! = 120)
; ---------------------------------------------------------------------------

section .text
    global _start

_start:
    mov     rdi, 5                  ; compute 5!
    call    factorial               ; rax = 120
    mov     rdi, rax                ; exit status = 120
    mov     rax, 60
    syscall

; ---------------------------------------------------------------------------
; long factorial(long n)   — n in rdi, result in rax
;
; The recursive call clobbers rdi (it takes an argument of its own), so n must
; be saved on the stack before the call and restored afterwards.
; ---------------------------------------------------------------------------
factorial:
    cmp     rdi, 1
    jle     .base                   ; n <= 1 -> 0! = 1! = 1

    push    rdi                     ; SAVE n; the recursive call will overwrite rdi
    dec     rdi                     ; n - 1
    call    factorial               ; rax = (n-1)!
    pop     rdi                     ; RESTORE n (LIFO order: same as pushed)

    imul    rax, rdi                ; rax = (n-1)! * n
    ret

.base:
    mov     rax, 1                  ; 0! and 1! both equal 1
    ret

; Trace of factorial(5):
;   factorial(5) push 5 -> factorial(4) push 4 -> factorial(3) push 3
;   -> factorial(2) push 2 -> factorial(1) = 1
;   unwind: 1*2=2 -> 2*3=6 -> 6*4=24 -> 24*5=120
;
; Try this: comment out `push rdi` and `pop rdi`. The result becomes wrong
; (and possibly zero), because every level would multiply by the argument of
; the innermost call. Deep recursion also needs each level's frame — this is
; why a missing base case ends in a stack overflow rather than an error message.
