begin;
create temporary table nika_test_ids as select gen_random_uuid() as a, gen_random_uuid() as b;
select set_config('nika.test_a',(select a::text from nika_test_ids),true), set_config('nika.test_b',(select b::text from nika_test_ids),true);
insert into auth.users(id) select a from nika_test_ids union all select b from nika_test_ids;
insert into public.nika_user_state(user_id,payload) select a,'{"version":2,"marker":"A"}'::jsonb from nika_test_ids union all select b,'{"version":2,"marker":"B"}'::jsonb from nika_test_ids;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('nika.test_a'),'role','authenticated','user_metadata',jsonb_build_object('role','admin'))::text,true);
set local role authenticated;
do $test$
declare n int;
begin
 select count(*) into n from public.nika_user_state;
 if n <> 1 then raise exception 'RLS READ FAILED'; end if;
 update public.nika_user_state set payload='{"version":2,"marker":"changed"}', revision=revision+1 where user_id=current_setting('nika.test_b')::uuid;
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'RLS UPDATE FAILED'; end if;
 delete from public.nika_user_state where user_id=current_setting('nika.test_b')::uuid;
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'RLS DELETE FAILED'; end if;
 begin
  update public.nika_user_state set user_id=current_setting('nika.test_b')::uuid,revision=revision+1;
  raise exception 'OWNER REASSIGNMENT FAILED';
 exception when insufficient_privilege or check_violation then null;
 end;
 update public.nika_user_state set payload='{"version":2,"marker":"saved"}', revision=1 where revision=0;
 get diagnostics n = row_count;
 if n <> 1 then raise exception 'OWN UPDATE FAILED'; end if;
 update public.nika_user_state set payload='{"version":2,"marker":"stale"}', revision=1 where revision=0;
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'CAS FAILED'; end if;
 begin
  update public.nika_user_state set revision=revision+2;
  raise exception 'REVISION GUARD FAILED';
 exception when check_violation then null;
 end;
end $test$;
reset role;
set local role anon;
do $test$
begin
 begin
  perform * from public.nika_user_state;
  raise exception 'ANONYMOUS READ FAILED';
 exception when insufficient_privilege then null;
 end;
end $test$;
reset role;
select 'PASS: own read/write, other-user read/update/delete denied, owner reassignment denied, stale writes rejected, forged admin metadata ignored, anonymous access denied' as result;
rollback;
