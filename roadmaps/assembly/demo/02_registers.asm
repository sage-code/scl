; ---------------------------------------------------------------------------
; 02_registers.asm — the register file, sub-registers, and what exit codes
; let you observe.
;
; Build:  nasm -f elf64 02_registers.asm -o regs.o
; Link:   ld regs.o -o regs
; Run:    ./regs ; echo "exit status = $?"
;
; Trick used throughout this demo folder: instead of printing numbers we exit
; with the value we want to inspect. The shell shows it via $? (0..255).
; ---------------------------------------------------------------------------

section .text
    global _start

_start:
    ; --- writing a 32-bit name zeroes the upper 32 bits ---------------------
    mov     rax, 0x1122334455667788 ; rax = 11223344 55667788
    mov     eax, 0x000000AB         ; rax = 00000000 000000AB
                                    ; NOTE: the top 32 bits were ZEROED.
                                    ; Writing to eax always clears rax[63:32].

    ; --- writing a 16-bit or 8-bit name leaves the higher bits intact -------
    mov     rax, 0x1122334455667788
    mov     ax,  0xFFFF             ; rax = 11223344 5566FFFF  (only low 16 changed)
    mov     al,  0x00               ; rax = 11223344 5566FF00  (only low 8 changed)

    ; --- register to register copying --------------------------------------
    mov     rbx, 42                 ; rbx = 42
    mov     rcx, rbx                ; rcx = 42 (a copy, not a link)
    inc     rcx                     ; rcx = 43 — rbx is unaffected

    ; --- the cheapest zero: xor with itself --------------------------------
    xor     rdx, rdx                ; rdx = 0

    ; --- exit with a value we can read from the shell ----------------------
    mov     rax, 60                 ; exit
    mov     rdi, 7                  ; status = 7
    syscall

; Try this: change `mov eax, 0x000000AB` to `mov rax, 0x000000AB` and diff the
; assembled bytes with `objdump -d regs`. The 64-bit form needs an extra
; prefix byte — that difference is why compilers prefer the 32-bit move.
