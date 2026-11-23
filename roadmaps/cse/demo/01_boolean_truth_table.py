#!/usr/bin/env python3
"""Verify De Morgan's Law: not (A and B) == (not A) or (not B)."""


def check_demorgan() -> None:
    print(" A | B | !(A && B) | (!A || !B) | Equal")
    print("---+---+-----------+------------+------")
    for a in (False, True):
        for b in (False, True):
            lhs = not (a and b)
            rhs = (not a) or (not b)
            assert lhs == rhs
            print(f" {int(a)} | {int(b)} |     {int(lhs)}     |     {int(rhs)}      |  {lhs == rhs}")


if __name__ == "__main__":
    check_demorgan()
