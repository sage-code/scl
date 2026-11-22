-- 010_scl_projects.sql
-- Global Sage-Code projects table shown on /projects/ and editable by Managers and Mentors.

create table if not exists scl_projects (
  id           text primary key,
  category     text not null,
  sort_order   integer not null default 0,
  status_icon  text not null default '🛠️',
  status_color text not null default '#6c757d',
  status_title text not null default 'In progress',
  name         text not null,
  url          text not null,
  description  text not null,
  technology   text not null,
  source_url   text not null,
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists idx_scl_projects_category_order
  on scl_projects (category, sort_order, created_at);

insert or ignore into scl_projects
  (id, category, sort_order, status_icon, status_color, status_title, name, url, description, technology, source_url)
values
  ('scl', 'Full Websites', 1, '🛠️', '#ffc107', 'In Work: Active development in progress', 'SCL', '/', 'Sage-Code Laboratory (This website)', 'HTML + JavaScript', 'https://github.com/sage-code/scl/'),
  ('csr', 'Full Websites', 2, '🛠️', '#28a745', 'Released: In maintenance/expansion', 'CSR', 'https://sage-csr.vercel.app', 'Computer Science Research - AI content', 'AI + Hugo + Learn CSS', 'https://github.com/sage-code/csr/'),
  ('bee', 'Languages', 1, '🛠️', '#6c757d', 'In review: Design phase resume 2026 April', 'Bee', '/projects/bee/', 'Compiled language - IP proprietary design', 'JavaScript & Zig', 'https://github.com/sage-code/bee'),
  ('eve', 'Languages', 2, '🛠️', '#6c757d', 'In progress: Development resumed 2026 April', 'EVE', '/projects/eve/', 'Interpreted language - IP proprietary design', 'JavaScript & Rust', 'https://github.com/sage-code/eve/'),
  ('maj', 'Languages', 3, '⏸️', '#ffc107', 'On Hold: Development paused.', 'MAJ', '/projects/maj/', 'Artificial Language for logic communication', 'HTML + AI + Python', 'https://github.com/sage-code/maj/');
