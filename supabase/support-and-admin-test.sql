begin;
insert into auth.users(id,email,email_confirmed_at,last_sign_in_at) values
 ('00000000-0000-4000-8000-000000000101','support-owner@example.invalid',now(),now()),
 ('00000000-0000-4000-8000-000000000102','support-other@example.invalid',now(),now()),
 ('00000000-0000-4000-8000-000000000103','support-admin@example.invalid',now(),now());
-- Temporary designated administrator; the entire test is rolled back.
update nika_private.app_administrator set user_id='00000000-0000-4000-8000-000000000103';
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000101',true);
set local role authenticated;
do $$ declare r jsonb; begin
 begin perform public.nika_support('users');raise exception 'Member read users';exception when insufficient_privilege then null;end;
 begin perform public.nika_support('threads');raise exception 'Member read inbox';exception when insufficient_privilege then null;end;
 begin perform public.nika_support('messages','{"userId":"00000000-0000-4000-8000-000000000102"}');raise exception 'Other conversation read';exception when insufficient_privilege then null;end;
 begin perform public.nika_support('send','{"userId":"00000000-0000-4000-8000-000000000102","message":"blocked","clientId":"00000000-0000-4000-8000-000000000111"}');raise exception 'Other conversation written';exception when insufficient_privilege then null;end;
 begin perform 1 from nika_private.support_messages;raise exception 'Direct messages read';exception when insufficient_privilege then null;end;
 begin update nika_private.support_threads set status='closed';raise exception 'Direct threads written';exception when insufficient_privilege then null;end;
 perform public.nika_support('send','{"message":"<script>text only</script>","clientId":"00000000-0000-4000-8000-000000000111","fromAdmin":true}');
 perform public.nika_support('send','{"message":"duplicate","clientId":"00000000-0000-4000-8000-000000000111"}');
 r:=public.nika_support('messages');
 if jsonb_array_length(r->'messages')<>1 or (r->'messages'->0->>'fromAdmin')::boolean then raise exception 'Duplicate or sender spoof';end if;
 if r->'messages'->0->>'message'<>'<script>text only</script>' then raise exception 'Message changed';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000103',true);
set local role authenticated;
do $$ declare r jsonb; begin
 r:=public.nika_support('users','{"search":"support-owner@example.invalid"}');
 if jsonb_array_length(r->'users')<>1 or r->'users'->0?'encrypted_password' then raise exception 'User listing failed';end if;
 if (public.nika_support('threads')->>'total')::integer<1 then raise exception 'Inbox failed';end if;
 r:=public.nika_support('messages','{"userId":"00000000-0000-4000-8000-000000000101"}');
 if jsonb_array_length(r->'messages')<>1 then raise exception 'Admin read failed';end if;
 perform public.nika_support('send','{"userId":"00000000-0000-4000-8000-000000000101","message":"Synthetic reply","clientId":"00000000-0000-4000-8000-000000000112"}');
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000101',true);
set local role authenticated;
do $$ declare r jsonb; oldest bigint; i integer; begin
 r:=public.nika_support('messages');
 if jsonb_array_length(r->'messages')<>2 or not (r->'messages'->1->>'fromAdmin')::boolean then raise exception 'Reply failed';end if;
 oldest:=(r->'messages'->1->>'id')::bigint;
 if jsonb_array_length(public.nika_support('messages',jsonb_build_object('before',oldest))->'messages')<>1 then raise exception 'Pagination failed';end if;
 perform public.nika_support('close');
 if public.nika_support('messages')->>'status'<>'closed' then raise exception 'Close failed';end if;
 for i in 1..9 loop perform public.nika_support('send',jsonb_build_object('message','Synthetic rate test','clientId',gen_random_uuid()));end loop;
 if public.nika_support('messages')->>'status'<>'open' then raise exception 'Reopen failed';end if;
 begin perform public.nika_support('send',jsonb_build_object('message','Rate blocked','clientId',gen_random_uuid()));raise exception 'Rate limit failed';exception when raise_exception then if sqlerrm<>'Too many messages' then raise;end if;end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.nika_support('messages');raise exception 'Anonymous allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'PASS: member isolation, direct access denied, admin allowlist, safe user columns, replies, pagination, sender spoof blocked, idempotency, rate limit, close/reopen and anonymous denial; synthetic fixtures rolled back' as result;
