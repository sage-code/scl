#!/usr/bin/env bash
# 11_files.sh — file tests, find, reading and safe temporary files.
#
# Run: ./11_files.sh
# All work happens in a temp directory created with mktemp and cleaned by trap.

set -euo pipefail

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$work"

printf '== create some files ==\n'
printf 'hello\nworld\n' > data.txt
: > empty.txt                 # zero-byte file
mkdir -p nested/deep
printf 'x\n' > nested/deep/a.txt

printf '\n== file tests ==\n'
[[ -e data.txt    ]] && printf 'data.txt exists\n'
[[ -f data.txt    ]] && printf 'data.txt is a regular file\n'
[[ -d nested      ]] && printf 'nested is a directory\n'
[[ ! -s empty.txt ]] && printf 'empty.txt is empty\n'
[[ -r data.txt    ]] && printf 'data.txt is readable\n'

printf '\n== find ==\n'
printf 'all .txt files:\n'
find . -type f -name '*.txt' | sort | sed 's/^/  /'

printf 'files modified in the last day: %d\n' "$(find . -type f -mtime -1 | wc -l)"

printf '\n== NUL-safe handling of odd filenames ==\n'
touch -- "name with spaces.txt"
find . -type f -name '*.txt' -print0 | while IFS= read -r -d '' f; do
  printf '  found: [%s]\n' "${f#./}"
done

printf '\n== read a file line by line ==\n'
while IFS= read -r line; do
  printf '  line: %s\n' "$line"
done < data.txt

printf '\n== read a whole file into an array ==\n'
mapfile -t lines < data.txt
printf 'line count: %d\n' "${#lines[@]}"
printf 'first line: %s\n' "${lines[0]}"

printf '\n== atomic update via temp file + mv ==\n'
out="report.txt"
printf 'v1\n' > "$out"
new="$out.tmp.$$"
printf 'v2\n' > "$new"
mv "$new" "$out"
printf 'report.txt is now: %s\n' "$(cat "$out")"

printf '\n== path manipulation without external tools ==\n'
p="/var/log/app/error.log"
printf 'dir  = %s\n' "${p%/*}"
printf 'file = %s\n' "${p##*/}"
printf 'ext  = %s\n' "${p##*.}"
printf 'stem = %s\n' "$(basename "${p%.*}")"
