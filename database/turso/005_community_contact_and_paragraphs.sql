-- 005_community_contact_and_paragraphs.sql
-- Adds structured contact links and custom text paragraphs to community_members.

alter table community_members add column contact_json text not null default '{}';
alter table community_members add column paragraphs_json text not null default '[]';
