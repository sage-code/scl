-- 003_delete_own_roadmap_account.sql
-- Allow an authenticated user to delete their own account and cascade related roadmap data.

create or replace function public.delete_current_user_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.users
  where id = auth.uid();
end;
$$;

revoke all on function public.delete_current_user_account() from public;
grant execute on function public.delete_current_user_account() to authenticated;
