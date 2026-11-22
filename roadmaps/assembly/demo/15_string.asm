; ---------------------------------------------------------------------------
; 15_string.asm — compute a string's length, then write it.
;
; Build:  nasm -f elf64 15_string.asm -o str.o
; Link:   ld str.o -o str
; Run:    ./str
;
; Assembly has no string type. A string is bytes with a label, and the length
; is something YOU keep — either as a constant or by counting.
; ---------------------------------------------------------------------------

%define SYS_WRITE 1
%define SYS_EXIT  60
%define STDOUT    1

section .rodata
    msg     db  "Assembly has no strings, only bytes and length.", 10
    msg_len equ $ - msg             ; the assembler counts the bytes for us

section .text
    global _start

_start:
    ; --- method 1: the length the assembler computed -----------------------
    lea     rsi, [rel msg]
    call    write_string            ; writes exactly msg_len bytes

    ; --- method 2: count the bytes at run time until a NUL ---------------
    ; (the convention used by C, and the reason C strings need a terminator)
    lea     rsi, [rel msg]
    mov     rax, msg_len            ; pretend the string is NUL-terminated:
    ; For a real NUL-terminated string you would loop like this:
    ;
    ;     xor  rcx, rcx            ; length = 0
    ; .count:
    ;     cmp  byte [rsi + rcx], 0 ; is this byte the terminator?
    ;     je   .counted
    ;     inc  rcx
    ;     jmp  .count
    ; .counted:
    ;
    ; There is no terminator in `msg`, so that loop would read past the end of
    ; the data — which is exactly the bug C's strchr/strlen are famous for.

    mov     rdi, 0
    mov     rax, SYS_EXIT
    syscall

; ---------------------------------------------------------------------------
; write_string — write rsi-length bytes from the pointer in rsi.
; Expects the length in rdx, which the caller must set.
; ---------------------------------------------------------------------------
write_string:
    mov     rdx, msg_len            ; length (known at assembly time here)
    mov     rax, SYS_WRITE
    mov     rdi, STDOUT
    syscall
    ret

; Try this: add a terminating zero to msg (`db "...", 10, 0`) and re-run
; method 2's counting loop with `mov rax, 64` as an upper bound. Then remove
; the terminator again and watch the loop run off the end — a segmentation
; fault is the usual outcome. This is the single most instructive bug in C
; string handling, and in assembly you can see precisely why it happens.
