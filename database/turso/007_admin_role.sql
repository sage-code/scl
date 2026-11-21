-- 007_admin_role.sql
-- Adds is_admin flag to users, designates elucian.moise@gmail.com as admin,
-- and links the email address to the legacy elucian account if unlinked.

alter table users add column is_admin integer not null default 0 check (is_admin in (0, 1));

update users
set email = coalesce(email, 'elucian.moise@gmail.com'),
    email_canonical = coalesce(email_canonical, 'elucianmoise@gmail.com'),
    email_verified_at = coalesce(email_verified_at, updated_at),
    is_admin = 1
where handle = 'elucian' or email_canonical = 'elucianmoise@gmail.com';
