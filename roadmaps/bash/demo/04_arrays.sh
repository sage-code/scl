#!/usr/bin/env bash
# 04_arrays.sh — indexed and associative arrays.
#
# Run: ./04_arrays.sh
# Always expand arrays as "${arr[@]}" (quoted) so spaces in elements survive.

set -euo pipefail

printf '== indexed arrays ==\n'
fruits=(apple "banana split" cherry)   # three elements, index 0..2
fruits+=(date)                         # append
printf 'count     : %d\n' "${#fruits[@]}"
printf 'first     : %s\n' "${fruits[0]}"
printf 'last      : %s\n' "${fruits[-1]}"

# Quote "[@]" to keep each element as one word.
for f in "${fruits[@]}"; do
  printf '  item: %s\n' "$f"
done

printf '\nindices: %s\n' "${!fruits[@]}"

printf '\n== slicing ==\n'
printf 'slice 1,2: %s\n' "${fruits[*]:1:2}"

printf '\n== associative arrays ==\n'
# MUST declare -A first, or Bash creates an indexed array and keys silently fail.
declare -A score
score[alice]=90
score[bob]=75
score+=( [carol]=88 )

for who in "${!score[@]}"; do
  printf '  %-6s %s\n' "$who" "${score[$who]}"
done

printf '\nunknown key with default: %s\n' "${score[dave]:-n/a}"

printf '\n== passing an array to a function ==\n'
# A function cannot see the caller's array by name; pass the elements.
sum() {
  local -a nums=("$@")      # rebuild a local array from the arguments
  local total=0 n
  for n in "${nums[@]}"; do
    (( total += n ))
  done
  printf '%d\n' "$total"
}
printf 'sum of score values: %s\n' "$(sum 90 75 88)"
