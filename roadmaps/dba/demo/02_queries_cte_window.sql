-- 02_queries_cte_window.sql
-- Joins, GROUP BY/HAVING, Common Table Expressions (CTEs), and window functions.

WITH customer_totals AS (
    SELECT
        c.customer_id,
        c.full_name,
        COUNT(o.order_id)               AS order_count,
        COALESCE(SUM(o.total_cents), 0) AS lifetime_cents
    FROM customers c
    LEFT JOIN orders o
        ON o.customer_id = c.customer_id
    WHERE c.status = 'active'
    GROUP BY c.customer_id, c.full_name
    HAVING COUNT(o.order_id) >= 1
)
SELECT
    customer_id,
    full_name,
    order_count,
    lifetime_cents,
    RANK() OVER (ORDER BY lifetime_cents DESC) AS spend_rank
FROM customer_totals
ORDER BY spend_rank, customer_id;
