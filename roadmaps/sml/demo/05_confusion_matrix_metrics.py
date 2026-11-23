#!/usr/bin/env python3
"""Evaluate binary classifier predictions beyond raw accuracy."""


def classification_report(y_true: list[int], y_pred: list[int]) -> dict[str, float]:
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)

    accuracy = (tp + tn) / len(y_true)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    return {"accuracy": accuracy, "precision": precision, "recall": recall, "f1": f1}


if __name__ == "__main__":
    # Imbalanced dataset: rare positive class (1)
    actual = [0, 0, 0, 0, 0, 0, 1, 1, 1, 0]
    predicted = [0, 0, 0, 0, 0, 1, 1, 1, 0, 0]
    for name, val in classification_report(actual, predicted).items():
        print(f"{name:<10}: {val:.3f}")
