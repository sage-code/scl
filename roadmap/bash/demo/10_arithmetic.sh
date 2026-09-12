#!/usr/bin/env bash
# 10_arithmetic.sh — integer math, bases and floating point with bc.
#
# Run: ./10_arithmetic.sh
# Bash is integer-only; use bc or awk when you need decimals.

set -euo pipefail

printf '== integer arithmetic ==\n'
a=7 b=3
printf '%d + %d = %d\n' "$a" "$b" "$((a + b))"
printf '%d - %d = %d\n' "$a" "$b" "$((a - b))"
printf '%d * %d = %d\n' "$a" "$b" "$((a * b))"
printf '%d / %d = %d  (truncated)\n' "$a" "$b" "$((a / b))"
printf '%d %% %d = %d\n' "$a" "$b" "$((a % b))"
printf '%d ** 2 = %d\n' "$a" "$((a ** 2))"

printf '\n== bitwise and shift ==\n'
printf '6 & 3  = %d\n' "$((6 & 3))"
printf '1 << 4 = %d\n' "$((1 << 4))"

printf '\n== bases ==\n'
printf '16#ff = %d\n' "$((16#ff))"
printf '2#1010 = %d\n' "$((2#1010))"
printf 'as hex : '; printf '%x\n' 255
printf 'as oct : '; printf '%o\n' 8

printf '\n== leading zeros are octal (a classic bug) ==\n'
n=08
set +e
# The expansion error is reported by the shell itself, so redirect the whole
# subshell (not just the command) to keep the demonstration output clean.
( : "$((n + 1))" ) 2>/dev/null || printf 'ERROR: 08 is not a valid octal number\n'
set -e
printf 'forced base 10: %d\n' "$((10#$n + 1))"

printf '\n== (( )) as a condition ==\n'
n=5
while (( n-- )); do
  printf '  n=%d\n' "$n"
done

printf '\n== floating point with bc ==\n'
if command -v bc >/dev/null 2>&1; then
  printf '3/2 with scale 2 : %s\n' "$(printf 'scale=2; 3/2\n' | bc)"
  printf 'sqrt(2)          : %s\n' "$(printf 'scale=6; sqrt(2)\n' | bc)"
else
  printf 'bc is not installed; falling back to awk\n'
fi

printf '\n== floating point with awk ==\n'
awk 'BEGIN { printf "22/7 = %.5f\n", 22/7 }'

printf '\n== sum a column with awk ==\n'
printf '1\n2\n3\n4\n' | awk '{ s += $1 } END { printf "sum = %d\n", s }'
