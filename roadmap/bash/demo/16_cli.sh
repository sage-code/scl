#!/usr/bin/env bash
# 16_cli.sh — parse command-line options with getopts.
#
# Run: ./16_cli.sh -v -o out.txt -n 3 input.txt
# getopts handles short options; for long options use a manual while loop.

set -euo pipefail

verbose=0
output=""
repeat=1

usage() {
  cat >&2 <<EOF
usage: ${0##*/} [-v] [-o FILE] [-n COUNT] [FILE...]

  -v        verbose
  -o FILE   write the result to FILE instead of stdout
  -n COUNT  repeat COUNT times (default 1)
  -h        show this help
EOF
  exit "${1:-0}"
}

# getopts sets OPTARG to the option's value and OPTIND to the next argument.
while getopts ":vo:n:h" opt; do
  case "$opt" in
    v) verbose=1 ;;
    o) output="$OPTARG" ;;
    n) repeat="$OPTARG" ;;
    h) usage 0 ;;
    \?) printf 'unknown option: -%s\n' "$OPTARG" >&2; usage 1 ;;
    :)  printf 'option -%s requires an argument\n' "$OPTARG" >&2; usage 1 ;;
  esac
done
shift "$((OPTIND - 1))"      # drop the parsed options; "$@" is now files

# Validate numeric input: getopts gives us strings, not numbers.
[[ "$repeat" =~ ^[0-9]+$ ]] || { printf -- '-n must be a number\n' >&2; exit 1; }

[[ $verbose -eq 1 ]] && printf 'verbose on; output=%s repeat=%d\n' "${output:-<stdout>}" "$repeat" >&2

emit() {
  local line="$1" i
  for ((i = 0; i < repeat; i++)); do
    printf '%s\n' "$line"
  done
}

if [[ $# -eq 0 ]]; then
  emit "no input files; processing stdin is not implemented in this demo"
else
  for file in "$@"; do
    [[ -f "$file" ]] || { printf 'skip (not a file): %s\n' "$file" >&2; continue; }
    while IFS= read -r line; do
      emit "$line"
    done < "$file"
  done
fi | { [[ -n "$output" ]] && tee "$output" >/dev/null || cat; }
