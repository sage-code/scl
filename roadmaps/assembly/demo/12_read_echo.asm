; ---------------------------------------------------------------------------
; 12_read_echo.asm — read one line from stdin and write it back.
;
; Build:  nasm -f elf64 12_read_echo.asm -o echo.o
; Link:   ld echo.o -o echo
; Run:    ./echo              (type a line, press Enter, Ctrl-D to finish)
;         echo "piped input" | ./echo
; ---------------------------------------------------------------------------

%define SYS_READ  0
%define SYS_WRITE 1
%define SYS_EXIT  60
%define STDIN     0
%define STDOUT    1

section .bss
    buffer  resb 128                ; input goes here; zero-filled by the loader

section .rodata
    prompt  db  "> "
    PROMPT_LEN equ $ - prompt

section .text
    global _start

_start:
    ; --- prompt ------------------------------------------------------------
    mov     rax, SYS_WRITE
    mov     rdi, STDOUT
    mov     rsi, prompt
    mov     rdx, PROMPT_LEN
    syscall

    ; --- read(0, buffer, 128) ---------------------------------------------
    xor     rax, rax                ; syscall 0 = read
    xor     rdi, rdi                ; fd 0 = stdin
    mov     rsi, buffer
    mov     rdx, 128
    syscall

    ; rax = number of bytes actually read, or <= 0 for EOF/error.
    test    rax, rax
    jle     .exit                   ; nothing to echo -> leave quietly

    ; --- write(1, buffer, rax) --------------------------------------------
    ; The byte count we just received is exactly what we must send back.
    mov     rdx, rax                ; rdx = bytes read (this is the key line)
    mov     rax, SYS_WRITE
    mov     rdi, STDOUT
    mov     rsi, buffer
    syscall

.exit:
    mov     rax, SYS_EXIT
    xor     rdi, rdi
    syscall

; Try this: delete the `test rax, rax` / `jle .exit` pair and pipe an empty
; input into the program (< /dev/null). read returns 0, and write would then be
; asked for zero bytes — harmless here, but the same mistake with a negative
; return value from an error would ask the kernel for four billion bytes.
