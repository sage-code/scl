#!/usr/bin/env python3
"""05_slo_burn_rate.py — Compute error budget and multi-window SLO burn rate."""


def error_budget_minutes(slo_target: float, window_days: int = 30) -> float:
    total_minutes = window_days * 24 * 60
    return total_minutes * (1.0 - slo_target)


def burn_rate(observed_error_rate: float, slo_target: float) -> float:
    allowed_error_rate = 1.0 - slo_target
    if allowed_error_rate <= 0:
        raise ValueError("slo_target must be strictly less than 1.0")
    return observed_error_rate / allowed_error_rate


if __name__ == "__main__":
    slo = 0.999  # 99.9% availability over 30 days
    budget = error_budget_minutes(slo, window_days=30)
    observed = 0.0144  # 1.44% errors (14.4x burn consumes 30-day budget in ~50 hours)
    rate = burn_rate(observed, slo)
    print(f"30-day error budget: {budget:.2f} minutes")
    print(f"Observed burn rate:  {rate:.1f}x")
