-- 003_email_canonical.sql
-- Canonical email column and index to block duplicate accounts via +tags or Gmail dot/domain aliases.

alter table users add column email_canonical text;
create index if not exists idx_users_email_canonical on users (email_canonical);
