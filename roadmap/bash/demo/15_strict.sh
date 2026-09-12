#!/usr/bin/env bash
# 15_strict.sh — the production script skeleton: strict mode + cleanup.
#
# Run: ./15_strict.sh [path]
# Copy this file as the starting point for any real script.

# set -e : stop on the first failing command
# set -u : error on unset variables (catches typos)
# set -o pipefail : a pipeline fails if ANY stage fails
set -euo pipefail

# IFS reduced to newline+tab: removes the space as an accidental splitter.
IFS=$'\n\t'

# Resolve this script's own directory so sibling files are always found.
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly SCRIPT_NAME="${0##*/}"

# Conventional exit codes.
readonly E_USAGE=64
readonly E_DATA=65

# Logging goes to stderr so it never contaminates stdout data.
log()  { printf '[%s] %s\n' "$(date +%T)" "$*" >&2; }
die()  { printf '%s: ERROR: %s\n' "$SCRIPT_NAME" "$*" >&2; exit 1; }

usage() {
  printf 'usage: %s [path]\n' "$SCRIPT_NAME" >&2
  exit "$E_USAGE"
}

# ---- cleanup -------------------------------------------------------------
tmp=""
cleanup() {
  local status=$?
  [[ -n "$tmp" && -d "$tmp" ]] && rm -rf "$tmp"
  exit "$status"          # preserve the original exit status
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# ---- main ----------------------------------------------------------------
main() {
  local target="${1:-$SCRIPT_DIR}"
  [[ -e "$target" ]] || die "no such path: $target"

  tmp="$(mktemp -d)"
  log "working in $tmp"

  log "listing $target"
  find "$target" -maxdepth 1 -type f | head -5 | sed 's/^/  /' >&2

  # A failing command in the middle would abort the script under set -e.
  log "done"
}

[[ $# -gt 1 ]] && usage
main "$@"
