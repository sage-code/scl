-- 06_ops_catalog_queries.sql
-- Operational diagnostic queries against PostgreSQL system catalogs.

-- 1. Active or long-running queries (excluding idle sessions)
SELECT
    pid,
    usename,
    state,
    now() - query_start AS duration,
    wait_event_type,
    left(query, 120) AS query_preview
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY duration DESC;

-- 2. Tables with high sequential scan counts vs. index scans
SELECT
    relname,
    seq_scan,
    idx_scan,
    n_live_tup,
    n_dead_tup
FROM pg_stat_user_tables
ORDER BY seq_scan DESC
LIMIT 15;
