"""Shared helpers for the unittest suite (`python -m unittest discover -s . -p "test_*.py"`)."""
from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / ".temp" / "output"  # git-ignored; every test result log lands here

sys.path.insert(0, str(ROOT / "scripts"))


class ScriptTestCase(unittest.TestCase):
    """Runs a validation script and stores its full output in .temp/output/<log_name>."""

    script: str = ""
    log_name: str = ""

    def run_script(self) -> subprocess.CompletedProcess:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        result = subprocess.run(
            [sys.executable, str(ROOT / self.script)],
            cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace",
        )
        (OUTPUT_DIR / self.log_name).write_text(result.stdout + result.stderr, encoding="utf-8")
        return result
