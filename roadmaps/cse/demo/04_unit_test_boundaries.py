#!/usr/bin/env python3
"""Self-contained unittest example covering normal cases and boundary inputs."""

import unittest


def clamp(value: int, low: int, high: int) -> int:
    if low > high:
        raise ValueError("low must be <= high")
    return max(low, min(high, value))


class TestClamp(unittest.TestCase):
    def test_inside_range(self) -> None:
        self.assertEqual(clamp(5, 0, 10), 5)

    def test_clamps_bounds(self) -> None:
        self.assertEqual(clamp(-3, 0, 10), 0)
        self.assertEqual(clamp(42, 0, 10), 10)

    def test_invalid_bounds_raises(self) -> None:
        with self.assertRaises(ValueError):
            clamp(5, 10, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
