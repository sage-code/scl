#!/usr/bin/env bash
# 08_loops.sh — for, while, until, and loop control.
#
# Run: ./08_loops.sh
# The most important idiom here is the safe file-reading while loop.

set -euo pipefail

printf '== for over a word list ==\n'
for fruit in apple banana cherry; do
  printf '  %s\n' "$fruit"
done

printf '\n== C-style counter ==\n'
for ((i = 1; i <= 3; i++)); do
  printf '  i=%d square=%d\n' "$i" "$((i * i))"
done

printf '\n== brace range ==\n'
for n in {5..1}; do printf '  %s' "$n"; done
printf '\n'

printf '\n== while with a counter ==\n'
n=0
while (( n < 3 )); do
  printf '  attempt %d\n' "$n"
  (( n++ )) || true      # ((n++)) is "false" when n was 0; guard with || true
done

printf '\n== until: loop until the condition becomes true ==\n'
n=0
until (( n >= 3 )); do
  printf '  n=%d\n' "$n"
  (( n++ )) || true
done

printf '\n== safe line-by-line file read ==\n'
work="$(mktemp)"
trap 'rm -f "$work"' EXIT
printf 'alpha beta\n\ngamma\n' > "$work"

while IFS= read -r line; do
  [[ -z "$line" ]] && continue        # skip blank lines
  printf '  line: [%s]\n' "$line"     # spaces preserved by IFS= and -r
done < "$work"

printf '\n== break and continue ==\n'
for i in {1..10}; do
  (( i % 2 == 0 )) && continue        # skip even numbers
  (( i > 7 )) && break                # stop after 7
  printf '  odd: %d\n' "$i"
done
