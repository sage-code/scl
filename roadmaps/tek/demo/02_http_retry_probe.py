#!/usr/bin/env python3
"""02_http_retry_probe.py — HTTP health-check probe with exponential backoff and jitter."""

import random
import sys
import time
import urllib.error
import urllib.request


def probe(url: str, max_attempts: int = 3, timeout_s: float = 3.0) -> int:
    for attempt in range(1, max_attempts + 1):
        try:
            with urllib.request.urlopen(url, timeout=timeout_s) as resp:
                print(f"OK {resp.status} {url} (attempt {attempt})")
                return 0
        except (urllib.error.URLError, TimeoutError) as exc:
            if attempt == max_attempts:
                print(f"FAIL {url} after {max_attempts} attempts: {exc}", file=sys.stderr)
                return 1
            delay = (2 ** (attempt - 1)) + random.uniform(0.0, 0.5)
            print(f"WARN attempt {attempt} failed ({exc}); retrying in {delay:.2f}s", file=sys.stderr)
            time.sleep(delay)
    return 1


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "https://example.com/"
    raise SystemExit(probe(target))
