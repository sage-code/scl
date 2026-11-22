#!/usr/bin/env bash
# 02_variables.sh — assignment, quoting and default values.
#
# Run: ./02_variables.sh
# The point of this demo is how quoting changes the number of arguments.

set -euo pipefail

name="World"
count=3

# Double quotes expand variables; single quotes do not.
printf 'double: "Hello, %s"\n' "$name"
printf 'single: %s\n' 'Hello, $name'

# ${var:-default} substitutes when unset OR empty; ${var-default} only when unset.
unset missing
printf 'default      : %s\n' "${missing:-fallback}"
empty=""
printf 'empty default: %s\n' "${empty:-fallback}"

# readonly variables cannot be reassigned.
readonly MAX=100
printf 'readonly MAX : %d\n' "$MAX"

# Word splitting: unquoted expands to many arguments, quoted to one.
csv="a, b, c"
set -- $csv
printf 'unquoted -> %d arguments\n' "$#"
set -- "$csv"
printf 'quoted   -> %d argument(s)\n' "$#"

# Environment variables are inherited by child processes; shell variables are not.
export DEMO_ENV="visible-to-children"
printf 'child sees  : %s\n' "$(bash -c 'echo "$DEMO_ENV"')"

# String length and substring.
printf 'length of name: %d\n' "${#name}"
printf 'name[1..2]    : %s\n' "${name:1:2}"
