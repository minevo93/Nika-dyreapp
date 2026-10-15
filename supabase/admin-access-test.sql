begin;
select set_config('request.jwt.claim.sub',(select user_id::text from nika_private.app_administrator),true);
set local role authenticated;
do $$ begin
 if public.nika_account_access()->>'role' <> 'admin' then raise exception 'Admin denied'; end if;
 begin
  insert into nika_private.app_administrator(singleton,user_id) values(true,auth.uid());
  raise exception 'Registry writable';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000009',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000009","role":"authenticated","user_metadata":{"role":"admin"}}',true);
set local role authenticated;
do $$ begin
 if public.nika_account_access() <> '{"role":"member"}'::jsonb then raise exception 'Member escalated'; end if;
 if (select count(*) from public.nika_user_state) <> 0 then raise exception 'Private data leaked'; end if;
 begin
  select user_id from nika_private.app_administrator;
  raise exception 'Registry readable';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform public.nika_account_access();
  raise exception 'Anonymous access allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: sole admin, member denial, metadata spoof denial, registry write denial, private data isolation, anonymous denial' as result;
