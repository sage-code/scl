#!/usr/bin/env bash
# 09_functions.sh — defining functions, arguments, return codes and scope.
#
# Run: ./09_functions.sh
# Remember: a function returns a STATUS (0-255), not a value. Values are printed.

set -euo pipefail

# A logger prints to stderr so it never mixes with real output.
log() { printf '[%s] %s\n' "$(date +%T)" "$*" >&2; }

# Returns a number by printing it; the caller captures stdout.
add() {
  local a="$1" b="$2"
  printf '%d\n' "$(( a + b ))"
}

# Returns a STATUS by using the last command's exit code.
is_even() {
  (( $1 % 2 == 0 ))
}

# Uses a global deliberately; 'local' keeps loop variables out of the caller.
count_words() {
  local -a words=("$@")
  printf '%d\n' "${#words[@]}"
}

main() {
  log "demo starting"

  local sum
  sum="$(add 3 4)"
  printf '3 + 4 = %s\n' "$sum"

  local n=7
  if is_even "$n"; then
    printf '%d is even\n' "$n"
  else
    printf '%d is odd\n' "$n"
  fi

  printf 'word count: %s\n' "$(count_words "one two" three four)"

  # Argument forwarding: "$@" preserves each argument exactly.
  printf 'this script name: %s\n' "$0"
  printf 'arguments passed : %s\n' "$#"

  log "demo finished"
}

main "$@"
