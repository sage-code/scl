#!/usr/bin/env python3
"""Compute central tendency and dispersion metrics using the Python standard library."""

import math
import statistics


def summarize(values: list[float]) -> dict[str, float]:
    ordered = sorted(values)
    n = len(ordered)
    q1 = statistics.median(ordered[: n // 2])
    q3 = statistics.median(ordered[(n + 1) // 2 :])
    return {
        "count": n,
        "mean": statistics.mean(ordered),
        "median": statistics.median(ordered),
        "std_dev": statistics.stdev(ordered),
        "iqr": q3 - q1,
    }


if __name__ == "__main__":
    latencies_ms = [12.4, 15.1, 14.8, 13.0, 16.2, 42.0, 14.1, 13.7]
    for metric, value in summarize(latencies_ms).items():
        print(f"{metric:<10}: {value:.3f}" if not math.isclose(value, int(value)) else f"{metric:<10}: {int(value)}")
