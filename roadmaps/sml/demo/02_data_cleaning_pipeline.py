#!/usr/bin/env python3
"""Clean tabular records: deduplicate by ID, impute missing values, and normalize."""

import statistics


def clean_records(rows: list[dict]) -> list[dict]:
    seen_ids = set()
    deduped = []
    for row in rows:
        if row["id"] not in seen_ids:
            seen_ids.add(row["id"])
            deduped.append(dict(row))

    valid_scores = [r["score"] for r in deduped if r["score"] is not None]
    median_score = statistics.median(valid_scores)

    for r in deduped:
        if r["score"] is None:
            r["score"] = median_score

    lo = min(r["score"] for r in deduped)
    hi = max(r["score"] for r in deduped)
    span = hi - lo or 1.0
    for r in deduped:
        r["score_norm"] = round((r["score"] - lo) / span, 4)

    return deduped


if __name__ == "__main__":
    raw = [
        {"id": 1, "score": 72.0},
        {"id": 2, "score": None},
        {"id": 2, "score": None},  # duplicate
        {"id": 3, "score": 90.0},
        {"id": 4, "score": 60.0},
    ]
    for item in clean_records(raw):
        print(item)
