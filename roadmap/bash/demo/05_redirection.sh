#!/usr/bin/env bash
# 05_redirection.sh — standard streams, pipes and here-documents.
#
# Run: ./05_redirection.sh
# Everything runs inside a temporary directory that is removed on exit.

set -euo pipefail

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$work"

printf '== output redirection ==\n'
printf 'first\n'  > log.txt        # create / overwrite
printf 'second\n' >> log.txt       # append
printf 'file now contains: '
wc -l < log.txt

printf '\n== stderr separate from stdout ==\n'
# A failing command writes to stderr; capture it without polluting stdout.
ls /definitely/not/here 2> err.txt || true
printf 'stderr captured: %s\n' "$(cat err.txt)"

printf '\n== both to the same file (order matters) ==\n'
{ printf 'out\n'; printf 'err\n' >&2; } > both.txt 2>&1
printf 'both.txt:\n'; sed 's/^/  /' both.txt

printf '\n== pipeline ==\n'
printf 'banana\napple\ncherry\n' | sort | tr 'a-z' 'A-Z'

printf '\n== tee: write and show ==\n'
printf 'logged line\n' | tee saved.txt >/dev/null
printf 'saved.txt has: %s\n' "$(cat saved.txt)"

printf '\n== here-document (quoted delimiter = literal) ==\n'
cat <<'EOF'
$PATH and $(id) stay literal inside a quoted here-document.
EOF

printf '\n== here-document (unquoted delimiter = expanded) ==\n'
cat <<EOF
This one expands: home is $HOME
EOF

printf '\n== process substitution ==\n'
diff <(printf 'a\nb\n') <(printf 'a\nc\n') || printf '(diff returned non-zero, as expected)\n'
