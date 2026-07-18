#!/usr/bin/env python3
"""Prepare and run incremental migration into the new static-site structure."""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MAP_FILE = ROOT / "config" / "migration-map.json"
STATUS_FILE = ROOT / "manual" / "migration-status.json"

REQUIRED_DIRS = [
    ROOT / "assets",
    ROOT / "assets" / "css",
    ROOT / "assets" / "js",
    ROOT / "assets" / "images",
    ROOT / "assets" / "fonts",
    ROOT / "content",
    ROOT / "content" / "pages",
    ROOT / "content" / "labs",
    ROOT / "content" / "components",
    ROOT / "content" / "system",
    ROOT / "layouts",
    ROOT / "public",
]


def ensure_dirs() -> None:
    for directory in REQUIRED_DIRS:
        directory.mkdir(parents=True, exist_ok=True)


def load_mapping(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def copy_or_move(source: Path, target: Path, mode: str, apply: bool) -> dict:
    action = "MOVE" if mode == "move" else "COPY"
    result = {
        "action": action,
        "source": str(source.relative_to(ROOT)),
        "target": str(target.relative_to(ROOT)),
        "status": "planned",
    }

    if not source.exists():
        result["status"] = "missing-source"
        return result

    # Normalized maps may intentionally reference the same file path; treat as no-op.
    if source.resolve() == target.resolve():
        result["status"] = "noop"
        return result

    if not apply:
        return result

    target.parent.mkdir(parents=True, exist_ok=True)
    if source.is_dir():
        if target.exists():
            shutil.rmtree(target)
        if mode == "move":
            shutil.move(str(source), str(target))
        else:
            shutil.copytree(source, target)
    else:
        if mode == "move":
            if target.exists():
                target.unlink()
            shutil.move(str(source), str(target))
        else:
            shutil.copy2(source, target)

    result["status"] = "done"
    return result


def run(mapping: dict, mode: str, apply: bool) -> dict:
    operations = []

    for item in mapping.get("fileMappings", []):
        source = ROOT / item["source"]
        target = ROOT / item["target"]
        operations.append(copy_or_move(source, target, mode, apply))

    for item in mapping.get("folderMappings", []):
        source = ROOT / item["source"]
        target = ROOT / item["target"]
        operations.append(copy_or_move(source, target, mode, apply))

    summary = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "apply": apply,
        "mode": mode,
        "total": len(operations),
        "done": len([op for op in operations if op["status"] == "done"]),
        "noop": len([op for op in operations if op["status"] == "noop"]),
        "planned": len([op for op in operations if op["status"] == "planned"]),
        "missing": len([op for op in operations if op["status"] == "missing-source"]),
        "operations": operations,
    }
    return summary


def write_status(summary: dict) -> None:
    STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with STATUS_FILE.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2)


def main() -> int:
    parser = argparse.ArgumentParser(description="Migrate website files into the new static structure.")
    parser.add_argument("--map", default=str(DEFAULT_MAP_FILE), help="Path to migration-map.json")
    parser.add_argument("--mode", choices=["copy", "move"], default="copy", help="Copy or move source files")
    parser.add_argument("--apply", action="store_true", help="Apply migration. Without this flag the run is dry-run.")
    args = parser.parse_args()

    ensure_dirs()
    mapping = load_mapping(Path(args.map))
    summary = run(mapping, args.mode, args.apply)
    write_status(summary)

    print(f"Migration mode: {args.mode}")
    print(f"Apply changes: {args.apply}")
    print(f"Total operations: {summary['total']}")
    print(
        f"Done: {summary['done']} | No-op: {summary['noop']} | "
        f"Planned: {summary['planned']} | Missing: {summary['missing']}"
    )
    print(f"Status file: {STATUS_FILE.relative_to(ROOT)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
