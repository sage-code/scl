-- 006_community_testimonials.sql
-- Adds mentor-authored testimonials for community member profiles.

create table if not exists community_testimonials (
  id              text primary key,
  target_user_id  text not null references users (id) on delete cascade,
  author_user_id  text not null references users (id) on delete cascade,
  author_name     text not null,
  author_role     text not null,
  content         text not null,
  created_at      text not null,
  updated_at      text not null
);

create index if not exists idx_community_testimonials_target
  on community_testimonials (target_user_id, created_at desc);
