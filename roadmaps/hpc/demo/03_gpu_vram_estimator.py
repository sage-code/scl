#!/usr/bin/env python3
"""Estimate GPU VRAM required for model weights plus runtime overhead."""


def estimate_vram_gb(params_billions: float, bytes_per_param: float, overhead_factor: float = 1.2) -> float:
    raw_weights_gb = (params_billions * 1e9 * bytes_per_param) / (1024 ** 3)
    return raw_weights_gb * overhead_factor


if __name__ == "__main__":
    for label, bpp in [("FP16 (2 bytes)", 2.0), ("INT8 (1 byte)", 1.0), ("INT4 (0.5 bytes)", 0.5)]:
        vram = estimate_vram_gb(params_billions=8.0, bytes_per_param=bpp)
        print(f"8B model @ {label:<16} -> ~{vram:.2f} GB VRAM (incl. 20% KV/activation headroom)")
