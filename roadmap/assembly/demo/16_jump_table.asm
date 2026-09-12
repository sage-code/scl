; ---------------------------------------------------------------------------
; 16_jump_table.asm — multi-way dispatch with a table of code addresses.
;
; Build:  nasm -f elf64 16_jump_table.asm -o jt.o
; Link:   ld jt.o -o jt
; Run:    ./jt ; echo "exit status = $?"
; ---------------------------------------------------------------------------

%define SYS_EXIT 60

section .rodata
    ; A table of 8-byte CODE ADDRESSES. `dq` (quadword) is required because
    ; every address on x86-64 is 64 bits wide.
    dispatch dq  case_0, case_1, case_2, case_3
    TABLE_N  equ ($ - dispatch) / 8         ; number of cases = 4

section .text
    global _start

_start:
    ; The value we are dispatching on. Try changing it to 1, 2, 3, or 9.
    mov     rax, 9

    ; --- MANDATORY bounds check -------------------------------------------
    cmp     rax, TABLE_N
    jae     .default                ; unsigned compare: catches negative AND
                                    ; too-large values in one test

    ; --- indirect jump through the table ---------------------------------
    lea     rbx, [rel dispatch]
    jmp     [rbx + rax*8]           ; jump to the address stored at table[rax]

case_0:
    mov     rdi, 100                ; each case sets a different status
    jmp     .done
case_1:
    mov     rdi, 200
    jmp     .done
case_2:
    mov     rdi, 300                ; 300 wraps to 44 in the shell's $? display
    jmp     .done
case_3:
    mov     rdi, 111
    jmp     .done

.default:
    mov     rdi, 255                ; anything else

.done:
    mov     rax, SYS_EXIT
    syscall

; Why the bounds check matters: without `jae .default`, a selector of 9 would
; index past the end of the table and jump to whatever happens to be in memory
; there — a spectacular crash, and a classic security vulnerability.
;
; Try this: delete the `cmp`/`jae` pair and run with rax = 9. Also try a
; negative selector such as -1: the unsigned `jae` catches it, which is why
; the check uses an UNSIGNED jump even though the table index "feels" signed.
