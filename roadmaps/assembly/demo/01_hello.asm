; ---------------------------------------------------------------------------
; 01_hello.asm — the smallest complete Linux x86-64 program.
;
; Build:  nasm -f elf64 01_hello.asm -o hello.o
; Link:   ld hello.o -o hello
; Run:    ./hello
;
; Why it works: the program talks to the kernel directly. There is no C
; library, no main function, and no runtime — just two system calls.
; ---------------------------------------------------------------------------

section .rodata                     ; read-only data
    msg     db  "Hello, world!", 10 ; the text, then '\n' (byte 10)
    msg_len equ $ - msg             ; '$' is the current address, so this is
                                    ; the byte length of everything above

section .text                       ; executable code
    global _start                   ; export the entry symbol for ld

_start:
    ; --- write(1, msg, msg_len) -------------------------------------------
    mov     rax, 1                  ; rax = syscall number 1 = write
    mov     rdi, 1                  ; rdi = fd 1 = stdout
    mov     rsi, msg                ; rsi = pointer to the first byte
    mov     rdx, msg_len            ; rdx = number of bytes to write
    syscall                         ; enter the kernel

    ; --- exit(0) ----------------------------------------------------------
    mov     rax, 60                 ; rax = syscall number 60 = exit
    xor     rdi, rdi                ; rdi = 0 (xor clears it, and costs less
                                    ; than mov rdi, 0 — it has no immediate)
    syscall                         ; exits; nothing after this ever runs

; Try this: delete the '10' from the msg definition. The newline disappears,
; because rdx (msg_len) then excludes it — the kernel writes exactly the
; number of bytes you ask for and not one more.
