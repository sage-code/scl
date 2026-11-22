#!/usr/bin/env bash
# 07_conditionals.sh — if, [[ ]] and case.
#
# Run: ./07_conditionals.sh [number]
# Pass a number to change the branch taken; the default is 42.

set -euo pipefail

value="${1:-42}"

printf '== numeric comparison ==\n'
if (( value > 100 )); then
  printf '%d is large\n' "$value"
elif (( value > 10 )); then
  printf '%d is medium\n' "$value"       # 42 lands here
else
  printf '%d is small\n' "$value"
fi

printf '\n== string tests ==\n'
name=""
if [[ -z "$name" ]]; then
  printf 'name is empty\n'
fi
if [[ -n "${1:-}" ]]; then
  printf 'an argument was supplied: %s\n' "$1"
else
  printf 'no argument supplied\n'
fi

printf '\n== glob match inside [[ ]] ==\n'
file="report.txt"
if [[ "$file" == *.txt ]]; then
  printf '%s is a text file\n' "$file"
fi

printf '\n== combining conditions ==\n'
if [[ "$value" -gt 0 && "$value" -lt 1000 ]]; then
  printf '%d is between 1 and 999\n' "$value"
fi

printf '\n== command status gates ==\n'
if command -v ls >/dev/null 2>&1; then
  printf 'ls is available\n'
fi
# || runs the right side only on failure.
grep -q root /etc/passwd 2>/dev/null && printf 'found root in /etc/passwd\n' || printf 'no /etc/passwd here\n'

printf '\n== case dispatch ==\n'
case "$value" in
  1|2|3)      printf 'small integer\n' ;;
  [4-9])      printf 'single digit\n' ;;
  *[05])      printf '%s ends in 0 or 5\n' "$value" ;;
  *)          printf '%s: no special case\n' "$value" ;;
esac
