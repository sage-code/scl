#!/usr/bin/env python3
"""Immutable context signature for the Sage-Code SCL website.

Content-addressed SHA-256 over the canonical *static context* files that every
remote Sage-Code SCL session loads (frozen system prefix, `.clinerules/`,
agent profiles, architecture manuals, skills). Properties:

  - deterministic     (UTF-8, CRLF->LF, BOM-stripped, path-sorted, no
                       timestamps in the payload => identical on any machine)
  - immutable         (changes ONLY when context content changes, never per
                       task, never per commit, never per session)
  - content-addressed (same context bytes => same digest on any replica)

The digest lets remote sessions (Fireworks/DeepSeek OpenAI-compatible API)
identify the cached static prefix and maximize prompt-cache hit rate: same
context => same signature => same cached prefix (agents/fireworks.md §4.1).

Usage
-----
  python scripts/tools/context_signature.py                    # compute + print feed block
  python scripts/tools/context_signature.py --verify <digest>  # exit 0 = context matches
  python scripts/tools/context_signature.py --scope            # print manifest paths
  python scripts/tools/context_signature.py --write <path>     # artifact destination

Artifact: `.temp/context-signature.json` (git-ignored, full manifest + digest).
The `created` timestamp is informational only — never part of the digest.

Feed block (paste at the top of a new task, after the frozen prefix):

  SCL_CONTEXT_SIGNATURE=sha256:<digest>; v1; files=14

Model contract: open the first reply with `CONTEXT-SIGNED: sha256:<digest>` and
keep it byte-identical for the whole session. A missing manifest file is a hard
error. Depends only on the Python 3 standard library.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = "SCL-CONTEXT-SIGNATURE"
VERSION = 1
PAYLOAD_HEADER = f"{SCHEMA} v{VERSION}\n".encode("utf-8")
BOM = b"\xef\xbb\xbf"
DIGEST_PREFIX = "sha256:"
DEFAULT_WRITE = ROOT / ".temp" / "context-signature.json"

# Canonical static-context manifest — the files every remote SCL session loads.
# Records are sorted by path before hashing, so the digest is independent of
# list order. Adding a file here changes the signature (correct: the context
# that the signature identifies changed).
MANIFEST = [
    "agents/fireworks.md",
    "agents/instructions.md",
    "agents/deepseek/README.md",
    "agents/deepseek/executor.md",
    "agents/static-context-prefix.md",
    ".clinerules/01-core.md",
    ".clinerules/02-architecture.md",
    ".clinerules/03-execution-protocol.md",
    ".clinerules/04-file-editing.md",
    "manual/ARCHITECTURE.md",
    "manual/PROJECTS-ARCHITECTURE.md",
    ".cline/skills/architecture/SKILL.md",
    ".cline/skills/author-topic/SKILL.md",
    ".cline/skills/build-validate/SKILL.md",
]


def normalize(data: bytes) -> bytes:
    """Byte-identical normalization: strip UTF-8 BOM, collapse CRLF to LF."""
    if data.startswith(BOM):
        data = data[3:]
    return data.replace(b"\r\n", b"\n")


def file_digest(path: Path) -> str:
    """SHA-256 of one manifest file over its normalized bytes."""
    return hashlib.sha256(normalize(path.read_bytes())).hexdigest()


def compute_manifest() -> list[dict[str, str]]:
    """Per-file digests; hard error on any missing manifest file."""
    missing = [rel for rel in MANIFEST if not (ROOT / rel).is_file()]
    if missing:
        for rel in missing:
            print(f"[FAIL] manifest file missing: {rel}", file=sys.stderr)
        raise SystemExit(
            f"context-signature: {len(missing)} manifest file(s) missing"
        )
    return [
        {"path": rel, "sha256": file_digest(ROOT / rel)} for rel in sorted(MANIFEST)
    ]


def aggregate(records: list[dict[str, str]]) -> str:
    """Content-addressed digest over `path<TAB>sha256` records (sorted).

    The payload is namespaced with the schema header so the digest cannot
    collide with a bare hash of concatenated file contents.
    """
    payload = PAYLOAD_HEADER + b"\n".join(
        f"{rec['path']}\t{rec['sha256']}".encode("utf-8") for rec in records
    ) + b"\n"
    return DIGEST_PREFIX + hashlib.sha256(payload).hexdigest()


def feed_block(digest: str, count: int) -> str:
    """One-line marker to paste at the top of a new task (after the prefix)."""
    return f"SCL_CONTEXT_SIGNATURE={digest}; v1; files={count}"


def write_artifact(records: list[dict[str, str]], digest: str, dest: Path) -> None:
    """Persist the full manifest + digest as the machine-readable artifact."""
    artifact = {
        "schema": SCHEMA,
        "version": VERSION,
        "digest": digest,
        "algorithm": "sha256",
        "normalization": "utf-8, CRLF->LF, BOM stripped, sorted POSIX paths",
        "count": len(records),
        "feed_block": feed_block(digest, len(records)),
        "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),  # informational only
        "files": records,
    }
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")


def print_report(records: list[dict[str, str]], digest: str) -> None:
    """Human-readable digest, paste-ready feed block and the model contract."""
    count = len(records)
    print(f"{SCHEMA} v{VERSION}")
    print(f"digest: {digest}")
    print(f"files:  {count}")
    print("scope:  " + ", ".join(rec["path"] for rec in records))
    print()
    print("FEED BLOCK — paste at the top of a new task (after the frozen prefix):")
    print(f"  {feed_block(digest, count)}")
    print()
    print("MODEL CONTRACT — when a task carries the feed block:")
    print("  1. verify your loaded context matches (missing file = mismatch)")
    print(f"  2. open your first reply with:  CONTEXT-SIGNED: {digest}")
    print("  3. keep the marker byte-identical for the whole session")
    print("  4. record it in the task report (SIGNATURE line)")
    print()
    print(f"artifact: {DEFAULT_WRITE.relative_to(ROOT).as_posix()}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Immutable content-addressed signature of the SCL static context.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--verify",
        metavar="DIGEST",
        help="recompute the digest and exit 0 only if it equals DIGEST (sha256:… or bare hex)",
    )
    parser.add_argument(
        "--scope",
        action="store_true",
        help="print the canonical manifest paths (one per line) and exit",
    )
    parser.add_argument(
        "--write",
        metavar="PATH",
        default=str(DEFAULT_WRITE),
        help=f"artifact destination (default: .temp/context-signature.json)",
    )
    args = parser.parse_args()

    if args.scope:
        for rel in sorted(MANIFEST):
            print(rel)
        return 0

    records = compute_manifest()
    digest = aggregate(records)

    if args.verify:
        expected = args.verify
        if not expected.startswith(DIGEST_PREFIX):
            expected = DIGEST_PREFIX + expected
        if digest == expected:
            print(f"CONTEXT-MATCH: {digest}")
            return 0
        print(f"CONTEXT-MISMATCH: got {digest} expected {expected}", file=sys.stderr)
        return 1

    write_artifact(records, digest, Path(args.write))
    print_report(records, digest)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

