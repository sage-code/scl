#!/usr/bin/env python3
"""Enhanced differential validation for static site output."""

from __future__ import annotations
import sys
import json
import subprocess
from pathlib import Path
import py_compile

ROOT = Path(__file__).resolve().parents[2]

def get_changed_files() -> list[Path]:
    """Get list of modified files using git."""
    try:
        output = subprocess.check_output(["git", "status", "--porcelain"], text=True)
        changed = []
        for line in output.splitlines():
            # Status format: ' M file'
            parts = line.strip().split(maxsplit=1)
            if len(parts) == 2:
                changed.append(ROOT / parts[1])
        return changed
    except subprocess.CalledProcessError:
        return []

def validate_json(file_path: Path):
    try:
        json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"[FAIL] Invalid JSON: {file_path.relative_to(ROOT)} - {e}")
        return False
    return True

def validate_js(file_path: Path):
    try:
        subprocess.check_output(["node", "--check", str(file_path)], stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        print(f"[FAIL] Invalid JS Syntax: {file_path.relative_to(ROOT)}\n{e.output.decode()}")
        return False
    return True

def validate_py(file_path: Path):
    try:
        py_compile.compile(str(file_path), doraise=True)
    except Exception as e:
        print(f"[FAIL] Invalid Python Syntax: {file_path.relative_to(ROOT)} - {e}")
        return False
    return True

def validate_html(file_path: Path):
    # Basic check: try to read/parse
    try:
        text = file_path.read_text(encoding="utf-8", errors="ignore")
        if "<html" not in text.lower():
            return True # Not a full page, skipping
    except Exception:
        return False
    return True

def main():
    changed = get_changed_files()
    if not changed:
        print("No changes detected.")
        return 0

    print(f"Validating {len(changed)} changed file(s)...")
    failures = 0
    
    for f in changed:
        if not f.exists(): continue
        
        valid = True
        if f.suffix == '.json':
            valid = validate_json(f)
        elif f.suffix == '.js':
            valid = validate_js(f)
        elif f.suffix == '.py':
            valid = validate_py(f)
        elif f.suffix == '.html':
            valid = validate_html(f)
            
        if not valid:
            failures += 1
            
    if failures > 0:
        print(f"\n{failures} validation failure(s) found.")
        return 1
        
    print("Validation passed for all modified files.")
    return 0

if __name__ == "__main__":
    sys.exit(main())

