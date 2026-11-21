-- 03_indexes_explain.sql
-- Composite, partial, and expression indexes with EXPLAIN (ANALYZE, BUFFERS) in PostgreSQL.

-- 1. Composite index: equality column (status) first, range/sort column (placed_at) second
CREATE INDEX idx_orders_status_placed
    ON orders (status, placed_at DESC);

-- 2. Partial index: index only rows that are still open/pending (keeps index small)
CREATE INDEX idx_orders_pending_only
    ON orders (placed_at)
    WHERE status = 'pending';

-- 3. Expression index: supports case-insensitive email lookup without a sequential scan
CREATE INDEX idx_customers_lower_email
    ON customers (lower(email));

-- Verify the planner chooses the index rather than a sequential scan
EXPLAIN (ANALYZE, BUFFERS)
SELECT order_id, total_cents
FROM orders
WHERE status = 'pending'
ORDER BY placed_at DESC
LIMIT 20;
