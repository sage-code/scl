#!/usr/bin/env python3
"""Validate commit subjects against Conventional Commits (type(scope): summary)."""

import re
import sys

PATTERN = re.compile(
    r"^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\([a-z0-9._-]+\))?!?: .{3,72}$"
)


def validate_commit(subject: str) -> tuple[bool, str]:
    line = subject.strip().splitlines()[0] if subject.strip() else ""
    if not PATTERN.match(line):
        return False, f"Invalid commit subject: {line!r}"
    return True, f"OK: {line}"


if __name__ == "__main__":
    samples = [
        "feat(auth): add PKCE token refresh",
        "fix: handle empty pagination cursor",
        "updated stuff",
    ]
    failures = 0
    for msg in samples:
        ok, report = validate_commit(msg)
        print(report)
        if not ok:
            failures += 1
    sys.exit(1 if failures and len(sys.argv) > 1 and sys.argv[1] == "--strict" else 0)
