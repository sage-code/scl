-- Server-scored attempts are the source of truth for roadmap graduation.
create table if not exists quiz_attempts (
  id              text primary key,
  user_id         text not null references users (id) on delete cascade,
  quiz_id         text not null,
  track           text not null,
  topic           text not null,
  level           text not null check (level in ('A', 'B', 'C')),
  revision        integer not null check (revision > 0),
  points_earned   integer not null check (points_earned >= 0),
  points_possible integer not null check (points_possible > 0),
  score_percent   real not null check (score_percent between 0 and 100),
  status          text not null check (status in ('pass', 'fail')),
  completed_at    text not null
);

create index if not exists idx_quiz_attempts_user_pass
  on quiz_attempts (user_id, status, track, topic, level, revision);

-- A row is created only after the account passes all three current quiz sets.
create table if not exists community_members (
  user_id        text primary key references users (id) on delete cascade,
  public_id      text not null unique,
  display_name   text not null,
  avatar_url     text,
  avatar_path    text,
  bio            text not null default '',
  country_code   text,
  projects_json  text not null default '[]',
  qualified_track text not null,
  qualified_topic text not null,
  is_published   integer not null default 0 check (is_published in (0, 1)),
  claimed_at     text,
  created_at     text not null,
  updated_at     text not null
);

create index if not exists idx_community_members_published
  on community_members (is_published, updated_at);
