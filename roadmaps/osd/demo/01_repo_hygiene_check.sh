#!/usr/bin/env bash
# Verify baseline open-source governance files exist in a repository root.
set -euo pipefail

required_files=("README.md" "LICENSE" "CONTRIBUTING.md")
missing=0

for file in "${required_files[@]}"; do
  if [[ -f "$file" ]]; then
    echo "[OK] Found $file"
  else
    echo "[MISSING] $file is required for contributor onboarding" >&2
    missing=$((missing + 1))
  fi
done

if (( missing > 0 )); then
  exit 1
fi
echo "Repository governance baseline check passed."
