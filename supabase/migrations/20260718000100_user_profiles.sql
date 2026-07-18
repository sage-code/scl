-- 20260718000100_user_profiles.sql
-- Create user profile table + trigger from auth.users.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  handle text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.user_profiles enable row level security;

drop policy if exists "profiles_read_authenticated" on public.user_profiles;
create policy "profiles_read_authenticated"
on public.user_profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert_own" on public.user_profiles;
create policy "profiles_insert_own"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.user_profiles;
create policy "profiles_update_own"
on public.user_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
