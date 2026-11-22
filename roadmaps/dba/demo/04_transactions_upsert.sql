-- 04_transactions_upsert.sql
-- Explicit transaction boundary, guarded update, and idempotent UPSERT.

BEGIN;

-- Guarded balance/status update: only transitions rows in the expected state
UPDATE customers
SET status = 'active'
WHERE customer_id = 42
  AND status = 'suspended';

-- Idempotent upsert: insert a new setting or update it atomically on conflict
INSERT INTO app_settings (setting_key, setting_value)
VALUES ('retention_days', '90')
ON CONFLICT (setting_key)
DO UPDATE SET setting_value = EXCLUDED.setting_value;

COMMIT;
