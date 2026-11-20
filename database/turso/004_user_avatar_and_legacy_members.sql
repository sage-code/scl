-- 004_user_avatar_and_legacy_members.sql
-- Adds learner avatar columns on users (allowing no-email profile customization)
-- and legacy member metadata columns on community_members for file-to-DB migration.

alter table users add column avatar_url text;
alter table users add column avatar_path text;

alter table community_members add column role text not null default 'VCP Graduate';
alter table community_members add column certification_label text;
alter table community_members add column certificate_url text;
alter table community_members add column member_since integer;
alter table community_members add column is_legacy_verified integer not null default 0 check (is_legacy_verified in (0, 1));
