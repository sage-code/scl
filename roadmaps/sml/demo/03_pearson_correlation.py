#!/usr/bin/env python3
"""Compute Pearson correlation coefficient (r) between two numeric variables."""

import math


def pearson_r(xs: list[float], ys: list[float]) -> float:
    if len(xs) != len(ys) or len(xs) < 2:
        raise ValueError("Inputs must have equal length >= 2")
    mean_x = sum(xs) / len(xs)
    mean_y = sum(ys) / len(ys)
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den_x = math.sqrt(sum((x - mean_x) ** 2 for x in xs))
    den_y = math.sqrt(sum((y - mean_y) ** 2 for y in ys))
    return num / (den_x * den_y)


if __name__ == "__main__":
    study_hours = [1, 2, 3, 4, 5, 6]
    exam_scores = [52, 58, 65, 74, 82, 88]
    print(f"Pearson r = {pearson_r(study_hours, exam_scores):.4f}")
