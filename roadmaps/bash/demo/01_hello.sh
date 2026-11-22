#!/usr/bin/env bash
# 01_hello.sh — the smallest useful script, plus exit status.
#
# Run:  chmod +x 01_hello.sh && ./01_hello.sh
# Every script should start with a shebang and strict mode. Comments explain
# WHY a line exists, not what it obviously does.

set -euo pipefail

# printf is preferred over echo: it is predictable across shells and platforms.
printf 'Hello from Bash %s\n' "$BASH_VERSION"

# $0 is the script path, $# the argument count, $$ the shell PID.
printf 'script   : %s\n' "$0"
printf 'arguments: %d\n' "$#"
printf 'shell pid: %s\n' "$$"

# Demonstrate that a command returns an exit status in $?.
if true; then
  printf 'true  -> status %d\n' "$?"
fi

# 'false' fails; we temporarily disable errexit for the demonstration.
set +e
false
printf 'false -> status %d\n' "$?"
set -e

# Return success explicitly so the caller (or CI) sees a clean exit.
exit 0
