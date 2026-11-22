-- 008_manager_role.sql
-- Replaces retired Instructor role with Manager in community_members.

update community_members
set role = 'Manager'
where role = 'Instructor';
