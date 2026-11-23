# Engineering Prompt Specification Template

## Context
- System: Payment reconciliation service (Python 3.12, PostgreSQL).
- Constraint: Idempotent retries; no external network calls in unit tests.

## Task
Write a pure function `reconcile(ledger_rows, bank_rows)` that returns unmatched IDs.

## Constraints
- Time complexity: `O(n + m)` using set/dict lookups.
- Preserve existing public types and raise `ValueError` on duplicate transaction IDs.

## Acceptance Criteria
1. Empty inputs return empty mismatch lists.
2. Duplicate IDs fail fast with `ValueError`.
3. Includes 3 `unittest` cases covering matches, mismatches, and duplicates.
