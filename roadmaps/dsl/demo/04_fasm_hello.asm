; FASM-style macro and flat 64-bit Linux syscall skeleton.
; Demonstrates how assembler macros act as a compile-time DSL.

format ELF64 executable 3
entry start

; Macro: write a constant string to stdout (sys_write = 1)
macro print msg, len {
    mov rax, 1          ; sys_write
    mov rdi, 1          ; fd = stdout
    mov rsi, msg
    mov rdx, len
    syscall
}

segment readable executable
start:
    print hello, hello_len
    mov rax, 60         ; sys_exit
    xor rdi, rdi        ; exit code 0
    syscall

segment readable writeable
hello db 'Hello from FASM!', 10
hello_len = $ - hello
