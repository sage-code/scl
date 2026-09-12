# Assembly Roadmap

A complete beginner-to-practice track for the **Assembly** language family,
taught from the machine outward.

## Primary dialect

**x86-64 with NASM** (Intel syntax) on Linux, because it is the dialect you will
read most often in the field. The track then shows the same ideas in **ARM64
(AArch64)**, **RISC-V (RV64)**, and **WebAssembly (WAT)** so that no processor
family looks unfamiliar.

## Page inventory

| # | Page | Topic |
|---|------|-------|
| 01 | `intro.html` | What assembly is, the machine model, the dialects |
| 02 | `toolchain.html` | NASM, the linker, the first program, the build loop |
| 03 | `numbers.html` | Binary, hexadecimal, two's complement, endianness |
| 04 | `registers.html` | The register file, flags, the System V ABI, ARM64 registers |
| 05 | `data.html` | `db`/`dw`/`dd`/`dq`, strings, `.bss`, memory access |
| 06 | `addressing.html` | Effective addresses, base + index + scale, RIP-relative |
| 07 | `instructions.html` | Instruction families, moves, logic, compare |
| 08 | `arithmetic.html` | Add/sub/mul/div, flags, overflow, floating point |
| 09 | `control.html` | Labels, jumps, if/else, loops, jump tables |
| 10 | `subprograms.html` | `call`/`ret`, stack frames, recursion, C interop |
| 11 | `macros.html` | `equ`, `%define`, `%macro`, conditional assembly |
| 12 | `io.html` | Linux syscalls, `read`/`write`, printing numbers, libc |
| 13 | `debug.html` | GDB, objdump, reading disassembly, common bugs |
| 14 | `flavors.html` | One program in x86-64, ARM64, RISC-V, and WAT |
| 15 | `demo_examples.html` | Index of the runnable demo programs |
| 16 | `samples.html` | Four study projects |
| 17 | `references.html` | Assemblers, simulators, manuals, courses |

## Structure

```
assembly/
├── index.html            # 7-phase dashboard + Free References
├── <topic>.html          # 17 topic pages
├── data/<topic>.json     # hierarchical sidebar JSON (one per page)
├── demo/                 # runnable demos
│   ├── 01..16_*.asm      # x86-64, NASM
│   └── 17..20_*_arm64.s  # ARM64, GNU as
└── img/                  # track-specific SVG diagrams
```

## Building the demos

```bash
# x86-64 (Linux / WSL2)
nasm -f elf64 01_hello.asm -o hello.o
ld hello.o -o hello
./hello

# ARM64 (native, cross-assembled, or in the browser)
aarch64-linux-gnu-as 17_hello_arm64.s -o hello.o
aarch64-linux-gnu-ld hello.o -o hello
qemu-aarch64 ./hello
# or paste into https://cpulator.01xz.net/
```

## Conventions

* Topic pages use `window.TOPIC_CONFIG` with `labId: 'assembly'` and load
  `/assets/js/topic-loader.js`; each page pulls its sidebar from
  `./data/<topicId>.json`.
* Code blocks use `language-nasm` (x86 Intel/AT&T), `language-armasm` (ARM), and
  `language-wasm` (WebAssembly). The `nasm` grammar is appended to
  `assets/prism.js`; the code viewer maps `.asm`/`.s`/`.inc` to it.
* References appear only on `index.html` and `references.html` — never as a
  per-topic section.


