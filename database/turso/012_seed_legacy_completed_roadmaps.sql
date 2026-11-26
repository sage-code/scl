-- 012_seed_legacy_completed_roadmaps.sql
-- Updates existing legacy community members with the roadmaps they have completed
-- based on their certificates (CSE for laura, elucian, gmoise, ineva, cmoise;
-- Dart for liviu; Go, Vue, and JavaScript for george) and records completed
-- roadmap_progress entries so each member's profile displays their completed courses
-- and generates one certificate per completed roadmap.

update community_members
set qualified_track = 'cse',
    qualified_topic = 'fundamentals'
where public_id in ('laura', 'elucian', 'gmoise', 'ineva', 'cmoise');

update community_members
set qualified_track = 'dart',
    qualified_topic = 'fundamentals'
where public_id = 'liviu';

update community_members
set qualified_track = 'go',
    qualified_topic = 'syntax'
where public_id = 'george';

-- Seed completed roadmap_progress (@card::status = 'done') for all 7 existing members
insert into roadmap_progress (user_id, roadmap_code, topic_key, status, progress_percent, created_at, updated_at)
select user_id, 'cse', '@card::status', 'done', 100, coalesce(claimed_at, created_at), updated_at
from community_members
where public_id in ('laura', 'elucian', 'gmoise', 'ineva', 'cmoise')
on conflict (user_id, roadmap_code, topic_key) do update set
  status = 'done',
  progress_percent = 100,
  updated_at = excluded.updated_at;

insert into roadmap_progress (user_id, roadmap_code, topic_key, status, progress_percent, created_at, updated_at)
select user_id, 'dart', '@card::status', 'done', 100, coalesce(claimed_at, created_at), updated_at
from community_members
where public_id = 'liviu'
on conflict (user_id, roadmap_code, topic_key) do update set
  status = 'done',
  progress_percent = 100,
  updated_at = excluded.updated_at;

insert into roadmap_progress (user_id, roadmap_code, topic_key, status, progress_percent, created_at, updated_at)
select user_id, 'go', '@card::status', 'done', 100, coalesce(claimed_at, created_at), updated_at
from community_members
where public_id = 'george'
on conflict (user_id, roadmap_code, topic_key) do update set
  status = 'done',
  progress_percent = 100,
  updated_at = excluded.updated_at;

insert into roadmap_progress (user_id, roadmap_code, topic_key, status, progress_percent, created_at, updated_at)
select user_id, 'vue', '@card::status', 'done', 100, coalesce(claimed_at, created_at), updated_at
from community_members
where public_id = 'george'
on conflict (user_id, roadmap_code, topic_key) do update set
  status = 'done',
  progress_percent = 100,
  updated_at = excluded.updated_at;

insert into roadmap_progress (user_id, roadmap_code, topic_key, status, progress_percent, created_at, updated_at)
select user_id, 'javascript', '@card::status', 'done', 100, coalesce(claimed_at, created_at), updated_at
from community_members
where public_id = 'george'
on conflict (user_id, roadmap_code, topic_key) do update set
  status = 'done',
  progress_percent = 100,
  updated_at = excluded.updated_at;
