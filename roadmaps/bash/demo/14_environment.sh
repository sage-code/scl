#!/usr/bin/env bash
# 14_environment.sh — environment variables and shell options.
#
# Run: ./14_environment.sh
# Shows what a script inherits and how options change behaviour.

set -euo pipefail

printf '== identity and location ==\n'
printf 'user      : %s\n' "${USER:-unknown}"
printf 'home      : %s\n' "${HOME:-unset}"
printf 'pwd       : %s\n' "${PWD:-unset}"
printf 'shell     : %s\n' "${SHELL:-unset}"
printf 'bash ver  : %s\n' "$BASH_VERSION"

printf '\n== PATH ==\n'
printf 'entries: %d\n' "$(tr ':' '\n' <<<"$PATH" | wc -l)"
printf 'first three:\n'
tr ':' '\n' <<<"$PATH" | head -3 | sed 's/^/  /'

printf '\n== is this shell interactive? ==\n'
case "$-" in
  *i*) printf 'interactive (reads ~/.bashrc)\n' ;;
  *)   printf 'non-interactive (a script: ~/.bashrc is NOT read)\n' ;;
esac
printf 'flags (-): %s\n' "$-"

printf '\n== exported vs shell-only ==\n'
shell_only="private"
export exported_var="shared"
printf 'child sees exported_var : %s\n' "$(bash -c 'printf %s "${exported_var:-unset}"')"
printf 'child sees shell_only   : %s\n' "$(bash -c 'printf %s "${shell_only:-unset}"')"

printf '\n== shell-maintained variables ==\n'
printf 'seconds since start : %s\n' "$SECONDS"
printf 'current line number : %s\n' "$LINENO"
printf 'random 0..32767     : %s\n' "$RANDOM"

printf '\n== shell options change behaviour ==\n'
shopt -s nullglob
files=( *.definitely_no_such_extension )
printf 'with nullglob, unmatched glob count = %d\n' "${#files[@]}"

if shopt -u nullglob; then
  printf 'nullglob disabled again\n'
fi

printf '\n== set -u protects against typos ==\n'
(
  set -u
  # Subshell so the error does not stop this demo.
  printf 'unset variable would abort here: %s\n' "$NEVER_SET" 2>/dev/null || \
    printf 'referencing an unset variable aborts under set -u (as intended)\n'
) 2>/dev/null || true
