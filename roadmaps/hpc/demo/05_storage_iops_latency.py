#!/usr/bin/env python3
"""Estimate IOPS from average latency and queue depth using Little's Law."""


def iops_from_latency(latency_ms: float, queue_depth: int) -> float:
    latency_sec = latency_ms / 1000.0
    return queue_depth / latency_sec


if __name__ == "__main__":
    profiles = [
        ("7200 RPM HDD (QD=1)", 8.5, 1),
        ("SATA SSD (QD=4)", 0.25, 4),
        ("NVMe Gen4 SSD (QD=32)", 0.08, 32),
    ]
    for name, lat_ms, qd in profiles:
        print(f"{name:<24} -> {iops_from_latency(lat_ms, qd):>10,.0f} IOPS")
