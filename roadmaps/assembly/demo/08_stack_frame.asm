; ---------------------------------------------------------------------------
; 08_stack_frame.asm — the full prologue, local variables, and the epilogue.
;
; Build:  nasm -f elf64 08_stack_frame.asm -o frame.o
; Link:   ld frame.o -o frame
; Run:    ./frame ; echo "exit status = $?"   (expect 30)
; ---------------------------------------------------------------------------

section .text
    global _start

_start:
    mov     rdi, 10                 ; argument for the function below
    mov     rsi, 20
    call    local_sum
    mov     rdi, rax                ; exit with the returned value
    mov     rax, 60
    syscall

; ---------------------------------------------------------------------------
; long local_sum(long a, long b)
; Stores both arguments in stack locals, sums them, then returns the result.
; Uses a complete frame so that the layout is visible in GDB.
; ---------------------------------------------------------------------------
local_sum:
    push    rbp                     ; 1. save the caller's frame pointer
    mov     rbp, rsp                ; 2. rbp marks the base of OUR frame
    sub     rsp, 16                 ; 3. reserve 16 bytes for two locals
                                    ;    (keeps rsp 16-byte aligned too)

    ; --- locals live at fixed offsets BELOW rbp ---------------------------
    mov     [rbp - 8],  rdi         ; local a
    mov     [rbp - 16], rsi         ; local b

    mov     rax, [rbp - 8]          ; load a back from memory
    add     rax, [rbp - 16]         ; add b

    ; --- epilogue: leave = mov rsp, rbp + pop rbp -------------------------
    leave                           ; discards both locals in one instruction
    ret                             ; pops the return address into rip

; Stack layout inside local_sum, with the stack growing DOWNWARD:
;
;   [rbp + 16]  second stack argument (if there were one)
;   [rbp + 8]   return address   (pushed by call)
;   [rbp]       saved caller rbp
;   [rbp - 8]   local a          <- 10
;   [rbp - 16]  local b          <- 20
;   [rsp]       bottom of the frame
;
; Try this: run the program under GDB, break at `local_sum`, and print
; `x/4gx $rbp-16`. You will see your two locals in memory at exactly the
; offsets named above — the frame is a real, inspectable object.
