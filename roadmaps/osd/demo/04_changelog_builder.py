#!/usr/bin/env python3
"""Group Conventional Commit messages into Keep a Changelog categories."""

from collections import defaultdict

TYPE_TO_SECTION = {
    "feat": "Added",
    "fix": "Fixed",
    "perf": "Changed",
    "refactor": "Changed",
    "docs": "Documentation",
}


def build_changelog(commits: list[str]) -> str:
    sections: dict[str, list[str]] = defaultdict(list)
    for msg in commits:
        prefix, _, summary = msg.partition(":")
        kind = prefix.split("(")[0].rstrip("!")
        section = TYPE_TO_SECTION.get(kind)
        if section and summary.strip():
            sections[section].append(summary.strip())

    lines = ["## [Unreleased]"]
    for heading in ("Added", "Changed", "Fixed", "Documentation"):
        if sections[heading]:
            lines.append(f"\n### {heading}")
            lines.extend(f"- {item}" for item in sections[heading])
    return "\n".join(lines)


if __name__ == "__main__":
    sample_commits = [
        "feat(cli): add --json output flag",
        "fix(parser): reject trailing commas in strict mode",
        "docs(readme): document minimum Python version",
    ]
    print(build_changelog(sample_commits))
