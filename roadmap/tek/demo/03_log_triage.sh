#!/usr/bin/env bash
# 03_log_triage.sh
# Summarize HTTP status classes and top 5xx endpoints from an Nginx-style access log.
set -euo pipefail

LOG_FILE="${1:?Usage: $0 <access.log>}"

if [[ ! -r "$LOG_FILE" ]]; then
  echo "ERROR: cannot read $LOG_FILE" >&2
  exit 2
fi

echo "=== Status Code Counts ==="
awk '{ print $9 }' "$LOG_FILE" | sort | uniq -c | sort -rn

echo "=== Top 5xx Paths ==="
awk '$9 ~ /^5[0-9][0-9]$/ { print $7 }' "$LOG_FILE" | sort | uniq -c | sort -rn | head -n 10
