#!/usr/bin/env python3
"""Remove leftover <!--__MORE__--> placeholder markers from Rust roadmap pages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRACK = ROOT / "roadmap" / "rust"
FILES = [p.name for p in sorted(TRACK.glob("*.html"))]

for name in FILES:
    path = TRACK / name
    raw = path.read_bytes()
    if not raw:
        continue
    text = raw.decode("utf-8")
    crlf = "\r\n" in text
    lines = text.replace("\r\n", "\n").split("\n")
    out = []
    for ln in lines:
        if ln.strip() == "<!--__MORE__-->":
            # drop the placeholder and the blank line(s) that preceded it
            while out and out[-1].strip() == "":
                out.pop()
            continue
        out.append(ln)
    result = "\n".join(out)
    if crlf:
        result = result.replace("\n", "\r\n")
    new_raw = result.encode("utf-8")
    if new_raw != raw:
        path.write_bytes(new_raw)
        print(f"[OK] {name}: marker stripped")
    else:
        print(f"[--] {name}: no marker found")
print("done")
