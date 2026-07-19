-- 20260719000400_roadmap_favorites.sql
-- Create roadmap favorites table for language/topic bookmarks.

create table if not exists public.roadmap_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_code text not null,
  topic_key text not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, roadmap_code, topic_key)
);

drop trigger if exists trg_roadmap_favorites_updated_at on public.roadmap_favorites;
create trigger trg_roadmap_favorites_updated_at
before update on public.roadmap_favorites
for each row execute function public.set_updated_at();

alter table public.roadmap_favorites enable row level security;

drop policy if exists "roadmap_favorites_select_own" on public.roadmap_favorites;
create policy "roadmap_favorites_select_own"
on public.roadmap_favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "roadmap_favorites_insert_own" on public.roadmap_favorites;
create policy "roadmap_favorites_insert_own"
on public.roadmap_favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "roadmap_favorites_update_own" on public.roadmap_favorites;
create policy "roadmap_favorites_update_own"
on public.roadmap_favorites
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "roadmap_favorites_delete_own" on public.roadmap_favorites;
create policy "roadmap_favorites_delete_own"
on public.roadmap_favorites
for delete
to authenticated
using (auth.uid() = user_id);
