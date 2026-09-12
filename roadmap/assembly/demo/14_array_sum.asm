; ---------------------------------------------------------------------------
; 14_array_sum.asm — scaled indexing: walking an array of 64-bit values.
;
; Build:  nasm -f elf64 14_array_sum.asm -o asum.o
; Link:   ld asum.o -o asum
; Run:    ./asum ; echo "exit status = $?"   (sum = 150, but $? wraps mod 256)
; ---------------------------------------------------------------------------

%define SYS_EXIT 60

section .rodata
    values  dq  10, 20, 30, 40, 50  ; an array of five quadwords
    COUNT   equ ($ - values) / 8    ; element count: total bytes / 8

section .text
    global _start

_start:
    lea     rbx, [rel values]       ; rbx = base address (position independent)
    xor     rcx, rcx                ; rcx = index i = 0
    xor     rax, rax                ; rax = total = 0

.loop:
    cmp     rcx, COUNT
    jge     .done

    ; THE key line: base + index*scale. The scale is 8 because each element
    ; is a qword (8 bytes). No address arithmetic instruction is needed.
    add     rax, [rbx + rcx*8]

    inc     rcx
    jmp     .loop

.done:
    ; Sum = 150. 150 is a valid exit status (it fits in a byte).
    mov     rdi, rax
    mov     rax, SYS_EXIT
    syscall

; Two things to notice. First, `[$ - values] / 8` is computed by the
; assembler — you never hard-code the length. Second, `[rbx + rcx*8]` is the
; single addressing form behind array indexing in every compiled language.
;
; Try this: change the array to `dd` values and the scale to `*4`, then update
; the divisor to 4. The loop is otherwise identical — only the element size
; changed, which is exactly why the scale exists.
