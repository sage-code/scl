#!/usr/bin/env python3
"""Compute the next Semantic Version (MAJOR.MINOR.PATCH) from commit subjects."""


def next_semver(current: str, commits: list[str]) -> str:
    major, minor, patch = (int(part) for part in current.lstrip("v").split("."))

    has_breaking = any("!" in c.split(":")[0] or "BREAKING CHANGE" in c for c in commits)
    has_feature = any(c.startswith("feat") for c in commits)

    if has_breaking:
        return f"{major + 1}.0.0"
    if has_feature:
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


if __name__ == "__main__":
    print("Patch bump:", next_semver("1.4.2", ["fix: handle null header"]))
    print("Minor bump:", next_semver("1.4.2", ["feat: export CSV report"]))
    print("Major bump:", next_semver("1.4.2", ["feat!: drop legacy v1 endpoint"]))
