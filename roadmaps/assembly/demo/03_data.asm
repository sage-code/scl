; ---------------------------------------------------------------------------
; 03_data.asm — declaring data with db / dw / dd / dq, times, and .bss.
;
; Build:  nasm -f elf64 03_data.asm -o data.o
; Link:   ld data.o -o data
; Run:    ./data ; echo "exit status = $?"
; ---------------------------------------------------------------------------

section .rodata                     ; constants: never written at run time
    one_byte    db  42              ; 1 byte
    two_bytes   dw  1000            ; 2 bytes
    four_bytes  dd  100000          ; 4 bytes
    eight_bytes dq  5000000000      ; 8 bytes (fits in 64 bits, not in 32)
    text        db  "ABC", 0        ; 4 bytes: 'A','B','C',NUL
    text_len    equ $ - text        ; 4 — computed by the assembler

section .data                       ; writable globals, with initial values
    counter     dd  0
    squares     dd  0, 1, 4, 9, 16  ; a table of five dwords (20 bytes)

section .bss                        ; zero-filled at load time, free on disk
    scratch     resb 64             ; 64 bytes of uninitialized space
    slot        resq 1              ; one 8-byte slot

section .text
    global _start

_start:
    ; Load values of different sizes. Each load must match the declaration,
    ; otherwise the assembler rejects it.
    mov     al,  [one_byte]         ; 8-bit load
    mov     ax,  [two_bytes]        ; 16-bit load
    mov     eax, [four_bytes]       ; 32-bit load
    mov     rax, [eight_bytes]      ; 64-bit load

    ; The declared sizes are visible in the object file. `readelf -S` shows
    ; .rodata, .data, and .bss as separate sections with their sizes.

    ; A writable variable accumulates:
    mov     eax, [counter]
    inc     eax
    mov     [counter], eax          ; counter is now 1

    ; Exit with the length of `text`, which the assembler computed for us.
    mov     rax, 60
    mov     rdi, text_len           ; = 4
    syscall

; Try this: run `size data` and `readelf -S data`. Notice that .bss occupies no
; space in the file itself — it is only reserved, and it is filled with zeros by
; the operating system when the program is loaded.
