; ---------------------------------------------------------------------------
; 13_print_number.asm — print an unsigned 64-bit integer as decimal digits.
;
; Build:  nasm -f elf64 13_print_number.asm -o pnum.o
; Link:   ld pnum.o -o pnum
; Run:    ./pnum
;
; The kernel cannot format numbers; it only writes bytes. This is the
; conversion every language performs when you call printf("%d", n).
; ---------------------------------------------------------------------------

%define SYS_WRITE 1
%define SYS_EXIT  60
%define STDOUT    1

section .bss
    numbuf  resb 32                 ; digits, filled from the END backwards

section .rodata
    nl      db  10

section .text
    global _start

_start:
    mov     rax, 4294967296         ; 2^32 — needs all ten digits
    call    print_uint

    mov     rax, SYS_WRITE
    mov     rdi, STDOUT
    mov     rsi, nl
    mov     rdx, 1
    syscall

    mov     rax, SYS_EXIT
    xor     rdi, rdi
    syscall

; ---------------------------------------------------------------------------
; print_uint — write the value in rax to stdout, then a newline is the caller's
; job. Destroys rax, rbx, rcx, rdx, rsi, rdi.
; ---------------------------------------------------------------------------
print_uint:
    mov     rbx, 10                 ; divisor
    lea     rsi, [numbuf + 31]      ; one past the last usable byte
    xor     rcx, rcx                ; digit counter

.digit_loop:
    xor     rdx, rdx                ; clear the high half before dividing
    div     rbx                     ; rax = value / 10, rdx = value % 10
    add     dl, '0'                 ; 0..9 -> '0'..'9'
    dec     rsi                     ; step backwards through the buffer
    mov     [rsi], dl               ; store this digit
    inc     rcx                     ; one more digit produced
    test    rax, rax                ; anything left to divide?
    jnz     .digit_loop             ; yes -> next digit

    ; write the digits, which are already in the correct order at [rsi]
    mov     rdx, rcx                ; length = number of digits
    mov     rax, SYS_WRITE
    mov     rdi, STDOUT
    syscall
    ret

; Why fill backwards? Division yields the LEAST significant digit first
; (4296 -> '6', '9', '2', '4', ...). Writing those characters from the end of
; the buffer towards the front leaves them in reading order, so no reversal
; pass is needed.
;
; Try this: set rax to 0. The loop runs once (0 / 10 = 0, remainder 0), so it
; prints "0" — correct, and a useful edge case to check in any conversion.
