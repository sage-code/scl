#!/usr/bin/env bash
# 04_service_preflight.sh
# Idempotent pre-flight script demonstrating trap cleanup and dry-run support.
set -euo pipefail

DRY_RUN="${DRY_RUN:-false}"
LOCK_DIR="/tmp/deploy-preflight.lock"

cleanup() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "ERROR: another preflight run is already active ($LOCK_DIR)" >&2
  exit 1
fi

for cmd in git docker curl; do
  command -v "$cmd" >/dev/null || { echo "ERROR: missing required command: $cmd" >&2; exit 2; }
done

if [[ "$DRY_RUN" == "true" ]]; then
  echo "[DRY-RUN] All preflight checks passed; no changes applied."
else
  echo "Preflight checks passed; ready for deployment."
fi
