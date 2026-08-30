#!/usr/bin/env python3
"""Generate a Markdown migration status report from migration-status.json."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATUS_JSON = ROOT / "manual" / "migration-status.json"
STATUS_MD = ROOT / "manual" / "MIGRATION_STATUS.md"


def load_status() -> dict:
    if not STATUS_JSON.exists():
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "apply": False,
            "mode": "copy",
            "total": 0,
            "done": 0,
            "planned": 0,
            "missing": 0,
            "operations": [],
        }

    with STATUS_JSON.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def build_markdown(status: dict) -> str:
    lines = []
    lines.append("# Migration Status")
    lines.append("")
    lines.append(f"Last run (UTC): {status.get('timestamp', 'n/a')}")
    lines.append(f"Execution mode: {status.get('mode', 'n/a')} | Apply: {status.get('apply', False)}")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- Total operations: {status.get('total', 0)}")
    lines.append(f"- Completed: {status.get('done', 0)}")
    lines.append(f"- No-op (already normalized): {status.get('noop', 0)}")
    lines.append(f"- Planned (dry-run): {status.get('planned', 0)}")
    lines.append(f"- Missing source: {status.get('missing', 0)}")
    lines.append("")
    lines.append("## Operation Log")
    lines.append("")
    lines.append("| Action | Source | Target | Status |")
    lines.append("|---|---|---|---|")

    operations = status.get("operations", [])
    if not operations:
        lines.append("| n/a | n/a | n/a | no-data |")
    else:
        for op in operations:
            lines.append(
                f"| {op.get('action', 'n/a')} | {op.get('source', 'n/a')} | {op.get('target', 'n/a')} | {op.get('status', 'n/a')} |"
            )

    lines.append("")
    lines.append("## Rollout Notes")
    lines.append("")
    lines.append("- During migration, build publishes runtime HTML and assets from content root pages and content/labs.")
    lines.append("- New top-level pages should be authored directly in content/ and assembled through layouts/base.html.")
    lines.append("- Developer docs remain outside deploy output (manual is not copied to public).")
    lines.append("- Use maintenance labeling on pages that are still being migrated.")

    return "\n".join(lines) + "\n"


def main() -> int:
    status = load_status()
    report = build_markdown(status)
    with STATUS_MD.open("w", encoding="utf-8") as handle:
        handle.write(report)

    print(f"Wrote report: {STATUS_MD.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
