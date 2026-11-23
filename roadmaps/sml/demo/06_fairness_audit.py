#!/usr/bin/env python3
"""Audit positive prediction rate and true-positive rate across two subgroups."""


def group_rates(records: list[tuple[str, int, int]]) -> None:
    for group in sorted({g for g, _, _ in records}):
        subset = [(t, p) for g, t, p in records if g == group]
        pos_rate = sum(p for _, p in subset) / len(subset)
        positives = [(t, p) for t, p in subset if t == 1]
        tpr = sum(p for _, p in positives) / len(positives) if positives else 0.0
        print(f"Group {group}: selection_rate={pos_rate:.2f}, true_positive_rate={tpr:.2f}")


if __name__ == "__main__":
    # (group, y_true, y_pred)
    samples = [
        ("A", 1, 1), ("A", 1, 1), ("A", 0, 0), ("A", 0, 1),
        ("B", 1, 0), ("B", 1, 1), ("B", 0, 0), ("B", 0, 0),
    ]
    group_rates(samples)
