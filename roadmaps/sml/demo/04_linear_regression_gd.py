#!/usr/bin/env python3
"""Fit y = w*x + b via batch gradient descent using pure Python."""


def fit_linear(xs: list[float], ys: list[float], lr: float = 0.01, epochs: int = 500) -> tuple[float, float]:
    w, b = 0.0, 0.0
    n = len(xs)
    for epoch in range(epochs):
        preds = [w * x + b for x in xs]
        dw = (2.0 / n) * sum((p - y) * x for p, y, x in zip(preds, ys, xs))
        db = (2.0 / n) * sum(p - y for p, y in zip(preds, ys))
        w -= lr * dw
        b -= lr * db
        if epoch % 100 == 0:
            mse = sum((p - y) ** 2 for p, y in zip(preds, ys)) / n
            print(f"epoch={epoch:<3} mse={mse:.4f} w={w:.3f} b={b:.3f}")
    return w, b


if __name__ == "__main__":
    xs = [1.0, 2.0, 3.0, 4.0, 5.0]
    ys = [3.1, 5.0, 7.2, 8.9, 11.1]  # ~ 2x + 1
    w, b = fit_linear(xs, ys)
    print(f"Learned model: y = {w:.3f}x + {b:.3f}")
