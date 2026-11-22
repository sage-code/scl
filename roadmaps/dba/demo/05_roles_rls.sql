-- 05_roles_rls.sql
-- Least-privilege role setup and Row-Level Security (PostgreSQL).

-- Create a non-superuser application role
CREATE ROLE app_reader NOINHERIT LOGIN PASSWORD 'replace-with-secret-manager-value';

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO app_reader;
GRANT SELECT ON app.orders TO app_reader;

-- Enforce tenant isolation at the database layer
ALTER TABLE app.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON app.orders
    FOR SELECT
    TO app_reader
    USING (tenant_id = current_setting('app.current_tenant_id', true)::int);
