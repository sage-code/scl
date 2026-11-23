#!/usr/bin/env python3
"""Compare sequential vs. strided array traversal to observe memory locality."""

import time


def benchmark_stride(size: int, stride: int) -> float:
    data = list(range(size))
    start = time.perf_counter()
    total = 0
    for i in range(0, size, stride):
        total += data[i]
    elapsed = time.perf_counter() - start
    # Prevent dead-code elimination mental model; return elapsed ms
    return elapsed * 1000.0 + (total * 0.0)


if __name__ == "__main__":
    n = 2_000_000
    for step in (1, 8, 64):
        ms = benchmark_stride(n, step)
        print(f"stride={step:<2} visited={n // step:>8} elapsed={ms:.2f} ms")
