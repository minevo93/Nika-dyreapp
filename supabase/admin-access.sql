-- One application administrator; no project/database administration privileges.
create table nika_private.app_administrator (
 singleton boolean primary key default true check (singleton),
 user_id uuid not null unique references auth.users(id) on delete cascade
);
alter table nika_private.app_administrator enable row level security;
revoke all on nika_private.app_administrator from public, anon, authenticated;
create function nika_private.account_access() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if not exists(select 1 from nika_private.app_administrator where user_id=auth.uid()) then
  return jsonb_build_object('role','member');
 end if;
 return jsonb_build_object('role','admin',
  'accounts',(select count(*) from auth.users),
  'savedAccounts',(select count(*) from public.nika_user_state));
end;
$$;
revoke all on function nika_private.account_access() from public, anon, authenticated;
grant usage on schema nika_private to authenticated;
grant execute on function nika_private.account_access() to authenticated;
create function public.nika_account_access() returns jsonb
language sql stable security invoker set search_path = '' as $$
 select nika_private.account_access();
$$;
revoke all on function public.nika_account_access() from public, anon, authenticated;
grant execute on function public.nika_account_access() to authenticated;
