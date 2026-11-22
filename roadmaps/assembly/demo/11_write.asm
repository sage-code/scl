; ---------------------------------------------------------------------------
; 11_write.asm — output helpers: strings, a character, and a hex digit.
;
; Build:  nasm -f elf64 11_write.asm -o w.o
; Link:   ld w.o -o w
; Run:    ./w
; ---------------------------------------------------------------------------

%define SYS_WRITE 1
%define SYS_EXIT  60
%define STDOUT    1

%macro write 2                      ; write(pointer, length) — two arguments
    mov     rax, SYS_WRITE
    mov     rdi, STDOUT
    mov     rsi, %1
    mov     rdx, %2
    syscall
%endmacro

section .rodata
    line1   db  "Assembly output is just bytes.", 10
    L1      equ $ - line1
    line2   db  "No formatting, no padding, no newline.", 10
    L2      equ $ - line2
    tab     db  9                   ; the TAB character
    nl      db  10

section .text
    global _start

_start:
    write   line1, L1
    write   line2, L2

    ; A single character is still a write with a length of 1.
    write   tab, 1
    write   nl, 1

    ; Exit with 0
    mov     rax, SYS_EXIT
    xor     rdi, rdi
    syscall

; Notice what the macro buys you: `write line1, L1` expands to five
; instructions, and every call site stays one line long. Compare this source
; with `nasm -E 11_write.asm` to see the expansion.
;
; Try this: change `write line2, L2` to `write line2, 5`. Only "Assem" appears.
; The kernel writes exactly the number of bytes in rdx; it has no idea what a
; string is, and it will not stop at a terminator.
