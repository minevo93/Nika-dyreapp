-- Source for the remote private_user_state migration. No user records are seeded.
begin;
create table public.nika_user_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null,
 revision bigint not null default 0 check (revision >= 0),
 updated_at timestamptz not null default now(),
 constraint object_payload check (jsonb_typeof(payload) = 'object' and coalesce(payload->>'version', '') = '2' and octet_length(payload::text) <= 2097152)
);
alter table public.nika_user_state enable row level security;
revoke all on public.nika_user_state from public, anon, authenticated;
grant select, insert, update, delete on public.nika_user_state to authenticated;
create policy own_read on public.nika_user_state for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.nika_user_state for insert to authenticated with check ((select auth.uid()) = user_id and revision = 0);
create policy own_update on public.nika_user_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.nika_user_state for delete to authenticated using ((select auth.uid()) = user_id);
create schema if not exists nika_private;
revoke all on schema nika_private from public, anon, authenticated;
create function nika_private.guard_state_update() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if new.user_id <> old.user_id or new.revision <> old.revision + 1 then
   raise exception 'Invalid owner or revision' using errcode = '23514';
 end if;
 new.updated_at = now();
 return new;
end;
$$;
revoke all on function nika_private.guard_state_update() from public, anon, authenticated;
create trigger guard_state_update before update on public.nika_user_state for each row execute function nika_private.guard_state_update();
comment on table public.nika_user_state is 'Private per-user animal data. Family labels confer no permissions. No administrator roles.';
commit;
