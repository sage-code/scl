#!/usr/bin/env python3
"""Replace branching if/elif chains with interchangeable pricing strategies."""

from collections.abc import Callable

ShippingStrategy = Callable[[float], float]


def standard_shipping(weight_kg: float) -> float:
    return 4.50 + 1.25 * weight_kg


def express_shipping(weight_kg: float) -> float:
    return 12.00 + 2.50 * weight_kg


STRATEGIES: dict[str, ShippingStrategy] = {
    "standard": standard_shipping,
    "express": express_shipping,
}


def quote_shipping(tier: str, weight_kg: float) -> float:
    if tier not in STRATEGIES:
        raise ValueError(f"Unknown shipping tier: {tier}")
    return STRATEGIES[tier](weight_kg)


if __name__ == "__main__":
    for tier in ("standard", "express"):
        print(f"{tier:<10} (3.0 kg) -> ${quote_shipping(tier, 3.0):.2f}")
