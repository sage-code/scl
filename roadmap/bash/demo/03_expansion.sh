#!/usr/bin/env bash
# 03_expansion.sh — brace, tilde, parameter, command and arithmetic expansion.
#
# Run: ./03_expansion.sh
# Expansion happens in a fixed order; this demo prints the result of each kind.

set -euo pipefail

printf '== brace expansion ==\n'
# Braces run FIRST: {$a,$b} would not do what you expect, so keep them literal.
printf '%s\n' file{1..3}.txt
printf '%s\n' {a,b}{1,2}

printf '\n== tilde expansion ==\n'
printf 'home = %s\n' ~

printf '\n== command substitution ==\n'
# $(...) captures stdout; trailing newlines are stripped.
now="$(date +%Y-%m-%d)"
printf 'today = %s\n' "$now"
printf 'kernel = %s\n' "$(uname -s)"

printf '\n== arithmetic expansion ==\n'
n=7
printf 'n*3    = %d\n' "$((n * 3))"
printf '2**10  = %d\n' "$((2 ** 10))"
printf 'hex ff = %d\n' "$((16#ff))"

printf '\n== parameter expansion ==\n'
path="/var/log/app/error.log"
printf 'dirname  = %s\n' "${path%/*}"
printf 'basename = %s\n' "${path##*/}"
printf 'no ext   = %s\n' "${path%.*}"
printf 'replaced = %s\n' "${path//\//-}"

printf '\n== filename expansion (globbing) ==\n'
# Save cwd and create a scratch directory so the demo is self-contained.
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

touch "$work/a.txt" "$work/b.txt" "$work/c.log"
shopt -s nullglob          # no match expands to nothing instead of the literal *
for f in "$work"/*.txt; do
  printf 'match: %s\n' "${f##*/}"
done
