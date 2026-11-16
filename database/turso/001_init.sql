-- 001_init.sql
-- Turso (libSQL) schema for roadmap users, sessions and progress.
-- Every visitor gets a row in users: anonymous users have is_anonymous = 1
-- and no email/password until they register (which upgrades the same row).

create table if not exists users (
  id                text primary key,
  handle            text unique collate nocase,
  email             text unique collate nocase,
  password_hash     text,
  is_anonymous      integer not null default 1,
  email_verified_at text,
  created_at        text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_seen_at      text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists idx_users_anonymous_seen on users (is_anonymous, last_seen_at);

-- Session tokens are stored as SHA-256 hashes; the raw token lives only in the cookie.
create table if not exists sessions (
  token_hash text primary key,
  user_id    text not null references users (id) on delete cascade,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at text not null
);

create index if not exists idx_sessions_user on sessions (user_id);
create index if not exists idx_sessions_expires on sessions (expires_at);

-- One-time email tokens (purpose: 'verify' or 'reset'), also stored hashed.
create table if not exists email_tokens (
  token_hash text primary key,
  user_id    text not null references users (id) on delete cascade,
  purpose    text not null check (purpose in ('verify', 'reset')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at text not null,
  used_at    text
);

create index if not exists idx_email_tokens_user on email_tokens (user_id, purpose, created_at);

-- Rate-limit log (failed logins, emails sent).
create table if not exists auth_events (
  id         integer primary key autoincrement,
  kind       text not null,
  subject    text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists idx_auth_events_lookup on auth_events (kind, subject, created_at);

create table if not exists roadmap_progress (
  user_id          text not null references users (id) on delete cascade,
  roadmap_code     text not null,
  topic_key        text not null,
  status           text not null default 'done' check (status in ('todo', 'in_progress', 'done')),
  progress_percent integer not null default 100 check (progress_percent between 0 and 100),
  created_at       text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  primary key (user_id, roadmap_code, topic_key)
);

create table if not exists roadmap_favorites (
  user_id      text not null references users (id) on delete cascade,
  roadmap_code text not null,
  topic_key    text not null,
  category     text,
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  primary key (user_id, roadmap_code, topic_key)
);
