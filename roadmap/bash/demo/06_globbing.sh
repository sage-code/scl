#!/usr/bin/env bash
# 06_globbing.sh — filename expansion and safe loops over files.
#
# Run: ./06_globbing.sh
# The lesson: never parse `ls`; let the shell expand a glob instead.

set -euo pipefail

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$work"

# Build a small tree, including a filename with spaces and a newline-free odd name.
touch report1.txt report2.txt notes.txt data.log "my file.txt"
mkdir -p sub
touch sub/deep.txt

printf '== simple globs ==\n'
printf '*.txt        -> %s\n' *.txt
printf 'report?.txt  -> %s\n' report?.txt
printf '[rd]*        -> %s\n' [rd]*

printf '\n== ** (globstar) crosses directories ==\n'
shopt -s globstar
for f in **/*.txt; do
  printf '  %s\n' "$f"
done

printf '\n== nullglob vs the literal star ==\n'
shopt -s nullglob
matches=( *.csv )            # no .csv files exist
printf 'with nullglob, count = %d\n' "${#matches[@]}"

printf '\n== safe iteration preserves spaces ==\n'
for f in *.txt; do
  printf '  [%s]\n' "$f"
done

printf '\n== excluding by pattern ==\n'
# extglob patterns such as !(*.log) are only parsed when extglob is already on,
# so here we filter with a case test, which needs no shell option.
for f in *; do
  [[ "$f" == *.log ]] && continue
  [[ -f "$f" ]] || continue
  printf '  not a log: %s\n' "$f"
done

printf '\n== find -print0 for NUL-safe pipelines ==\n'
count=$(find . -type f -print0 | tr -dc '\0' | wc -c)
printf 'total files found: %s\n' "$count"
