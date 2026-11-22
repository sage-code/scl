#!/usr/bin/env bash
# 13_processes.sh — background jobs, wait and signal traps.
#
# Run: ./13_processes.sh
# Demonstrates running work in parallel and always cleaning up.

set -euo pipefail

work="$(mktemp -d)"

cleanup() {
  local status=$?
  rm -rf "$work"
  printf 'cleanup: removed %s (previous status %d)\n' "$work" "$status"
}
trap cleanup EXIT                 # runs no matter how the script ends
trap 'printf "interrupted!\n" >&2; exit 130' INT

printf '== run three jobs in parallel ==\n'
pids=()
for i in 1 2 3; do
  # Each job writes a file and sleeps; '&' returns immediately.
  ( sleep 0.2; printf 'job %d done\n' "$i" > "$work/job$i" ) &
  pids+=($!)
  printf 'started job %d with pid %d\n' "$i" "$!"
done

printf '\n== wait for all of them ==\n'
fail=0
for pid in "${pids[@]}"; do
  wait "$pid" || fail=1
done
printf 'all jobs finished (fail=%d)\n' "$fail"

printf '\n== collect the results ==\n'
for f in "$work"/job*; do
  printf '  %s\n' "$(cat "$f")"
done

printf '\n== subshell vs current shell ==\n'
total=0
printf 'a\nb\nc\n' | while read -r _; do
  (( total++ )) || true          # subshell: this change is lost
done
printf 'after pipeline, total = %d (lost)\n' "$total"

total=0
while read -r _; do
  (( total++ )) || true          # current shell: kept
done < <(printf 'a\nb\nc\n')
printf 'after process substitution, total = %d (kept)\n' "$total"

printf '\n== inspect this shell ==\n'
printf 'shell pid : %s\n' "$$"
printf 'parent pid: %s\n' "$PPID"
ps -p "$$" -o pid,ppid,comm 2>/dev/null || true
