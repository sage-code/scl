-- 011_project_contributors.sql
-- Tracks user requests to join global Sage-Code projects and Manager approvals.

create table if not exists project_contributors (
  id           text primary key,
  project_id   text not null references scl_projects (id) on delete cascade,
  user_id      text not null references users (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'approved')),
  approved_by  text,
  approved_at  text,
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  unique (project_id, user_id)
);

create index if not exists idx_project_contributors_user
  on project_contributors (user_id, created_at);

create index if not exists idx_project_contributors_project
  on project_contributors (project_id, status);
