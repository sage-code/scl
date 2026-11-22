-- 01_schema_constraints.sql
-- Normalized schema DDL with primary keys, foreign keys, CHECKs, and ON DELETE rules.
-- Compatible with PostgreSQL 14+ and SQLite 3.35+ (with PRAGMA foreign_keys = ON).

CREATE TABLE customers (
    customer_id  INTEGER PRIMARY KEY,
    email        TEXT NOT NULL UNIQUE,
    full_name    TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'suspended', 'closed')),
    created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    order_id     INTEGER PRIMARY KEY,
    customer_id  INTEGER NOT NULL
                 REFERENCES customers(customer_id) ON DELETE RESTRICT,
    total_cents  INTEGER NOT NULL CHECK (total_cents >= 0),
    currency     TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
    placed_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_customer_placed
    ON orders (customer_id, placed_at DESC);
