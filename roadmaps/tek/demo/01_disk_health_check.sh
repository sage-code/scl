#!/usr/bin/env bash
# 01_disk_health_check.sh
# Strict-mode disk usage check suitable for cron or systemd timer alerts.
set -euo pipefail

THRESHOLD="${1:-85}"
TARGET_FS="${2:-/}"

usage_pct="$(df -P "$TARGET_FS" | awk 'NR==2 { gsub(/%/, "", $5); print $5 }')"

if [[ -z "$usage_pct" || ! "$usage_pct" =~ ^[0-9]+$ ]]; then
  echo "ERROR: could not parse disk usage for $TARGET_FS" >&2
  exit 2
fi

if (( usage_pct >= THRESHOLD )); then
  echo "ALERT: $TARGET_FS usage at ${usage_pct}% (threshold ${THRESHOLD}%)" >&2
  exit 1
fi

echo "OK: $TARGET_FS usage at ${usage_pct}% (threshold ${THRESHOLD}%)"
