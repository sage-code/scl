#!/usr/bin/env bash
# 12_text.sh — text processing with grep, sed, awk, cut and tr.
#
# Run: ./12_text.sh
# A tiny log file is generated, then queried in several ways.

set -euo pipefail

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$work"

cat > access.log <<'EOF'
10.0.0.1 GET /index.html 200
10.0.0.2 GET /missing 404
10.0.0.3 POST /api/login 500
10.0.0.1 GET /style.css 200
10.0.0.4 GET /api/users 500
EOF

printf '== grep ==\n'
printf 'lines with 500 : %s\n' "$(grep -c ' 500$' access.log)"
printf 'GET requests  : %s\n' "$(grep -c 'GET' access.log)"
printf 'non-200 lines :\n'
grep -v ' 200$' access.log | sed 's/^/  /'

printf '\n== grep with extended regex ==\n'
grep -E '^10\.0\.0\.[0-9]+ .* (500|404)$' access.log | sed 's/^/  /'

printf '\n== cut: field extraction ==\n'
printf 'unique client IPs:\n'
cut -d' ' -f1 access.log | sort -u | sed 's/^/  /'

printf '\n== awk: fields and aggregation ==\n'
printf 'status counts:\n'
awk '{ count[$4]++ } END { for (s in count) printf "  %s -> %d\n", s, count[s] }' access.log

printf 'requests per IP:\n'
awk '{ total[$1]++ } END { for (ip in total) printf "  %-10s %d\n", ip, total[ip] }' access.log

printf '\n== awk: filter and reformat ==\n'
awk '$4 != 200 { printf "  FAIL %s %s\n", $1, $3 }' access.log

printf '\n== sed: substitution and deletion ==\n'
printf 'anonymised (IPs masked):\n'
sed -E 's/^[0-9.]+/x.x.x.x/' access.log | sed 's/^/  /'

printf '\n== tr: case and character cleanup ==\n'
printf 'METHODS: '
cut -d' ' -f2 access.log | sort -u | tr '\n' ' '
printf '\n'

printf '\n== a pipeline that answers a real question ==\n'
printf 'top client: %s\n' "$(cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')"
