; ---------------------------------------------------------------------------
; 10_macros.asm — %macro, %endmacro, parameters, and %% local labels.
;
; Build:  nasm -f elf64 10_macros.asm -o macros.o
; Link:   ld macros.o -o macros
; Run:    ./macros
; ---------------------------------------------------------------------------

%define SYS_WRITE 1                 ; %define: a text substitution
%define SYS_EXIT  60
%define STDOUT    1

; --- a multi-line macro ----------------------------------------------------
; %1 and %2 are the parameters supplied at each call site.
%macro write_str 2
    mov     rax, SYS_WRITE
    mov     rdi, STDOUT
    mov     rsi, %1                 ; argument 1: pointer to the bytes
    mov     rdx, %2                 ; argument 2: byte count
    syscall
%endmacro

; --- a macro containing a label: %% makes the label unique per expansion ---
%macro print_digit 1
    mov     dl, %1
    add     dl, '0'                 ; convert 0..9 to the ASCII digit
    mov     [digit_buf], dl
    write_str digit_buf, 1
%endmacro

section .bss
    digit_buf resb 1

section .rodata
    banner db "Macros expand at assembly time:", 10
    BANNER_LEN equ $ - banner

section .text
    global _start

_start:
    write_str banner, BANNER_LEN     ; expand the macro once

    print_digit 4                    ; prints "4"
    print_digit 2                    ; prints "2"

    write_str newline, 1

    mov     rax, SYS_EXIT
    xor     rdi, rdi
    syscall

section .rodata
    newline db 10                     ; a separate section is allowed anywhere;
                                      ; NASM merges all .rodata blocks together

; Verify the expansion: `nasm -E 10_macros.asm | less` preprocesses the file
; and shows the macros already substituted — the instructions you would have
; typed by hand.
;
; Try this: call print_digit three times in a row. Nothing breaks, because each
; expansion gets its own label — which is exactly why %% exists.
