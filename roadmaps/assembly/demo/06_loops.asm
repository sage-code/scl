; ---------------------------------------------------------------------------
; 06_loops.asm — building while, for, and countdown loops.
;
; Build:  nasm -f elf64 06_loops.asm -o loops.o
; Link:   ld loops.o -o loops
; Run:    ./loops ; echo "exit status = $?"    (expect 55, the sum 1..10)
; ---------------------------------------------------------------------------

section .text
    global _start

_start:
    ; --- for (i = 1; i <= 10; i++) total += i -----------------------------
    xor     rcx, rcx                ; rcx = i = 0
    xor     rbx, rbx                ; rbx = total = 0

.for_loop:
    inc     rcx                     ; i++  (start at 1 on the first pass)
    cmp     rcx, 10
    jg      .for_done               ; signed compare: i > 10 -> exit
    add     rbx, rcx                ; total += i
    jmp     .for_loop

.for_done:
    ; rbx = 55 when the loop is correct.

    ; --- while (n > 0) n /= 2   — halving until it reaches zero -----------
    mov     rdx, 100                ; n = 100
    xor     rsi, rsi                ; rsi counts the iterations

.while_loop:
    cmp     rdx, 0
    jle     .while_done             ; n <= 0 -> stop
    shr     rdx, 1                  ; n = n / 2  (unsigned divide by two)
    inc     rsi                     ; iterations++
    jmp     .while_loop

.while_done:
    ; 100 -> 50 -> 25 -> 12 -> 6 -> 3 -> 1 -> 0, so rsi = 7.

    ; --- do-while: test at the BOTTOM, so the body always runs at least once
    mov     rdi, 0                  ; counter
.do_loop:
    inc     rdi
    cmp     rdi, 3
    jl      .do_loop                ; repeat while counter < 3
    ; rdi = 3

    ; Report the for-loop total, which is the most interesting number here.
    mov     rdi, rbx                ; status = 55
    mov     rax, 60                 ; exit
    syscall

; Try this: replace `cmp rcx, 10` with `cmp rcx, 0` and `jg` with `jnz` —
; that is the classic counting-down loop. Compare the two disassemblies with
; `objdump -d loops | head -40` to see how little the shape changes.
