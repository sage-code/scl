-- 20260718000200_roadmap_progress.sql
-- Create roadmap progress tracking table.

create table if not exists public.roadmap_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_code text not null,
  topic_key text not null,
  status text not null default 'done' check (status in ('todo', 'in_progress', 'done')),
  progress_percent integer not null default 100 check (progress_percent >= 0 and progress_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, roadmap_code, topic_key)
);

drop trigger if exists trg_roadmap_progress_updated_at on public.roadmap_progress;
create trigger trg_roadmap_progress_updated_at
before update on public.roadmap_progress
for each row execute function public.set_updated_at();

alter table public.roadmap_progress enable row level security;

drop policy if exists "roadmap_progress_select_own" on public.roadmap_progress;
create policy "roadmap_progress_select_own"
on public.roadmap_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "roadmap_progress_insert_own" on public.roadmap_progress;
create policy "roadmap_progress_insert_own"
on public.roadmap_progress
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "roadmap_progress_update_own" on public.roadmap_progress;
create policy "roadmap_progress_update_own"
on public.roadmap_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "roadmap_progress_delete_own" on public.roadmap_progress;
create policy "roadmap_progress_delete_own"
on public.roadmap_progress
for delete
to authenticated
using (auth.uid() = user_id);
