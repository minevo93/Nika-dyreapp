begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-4000-8000-000000001001','nika-owner-test@example.invalid',now()),
 ('00000000-0000-4000-8000-000000001002','nika-member-test@example.invalid',now()),
 ('00000000-0000-4000-8000-000000001003','nika-outsider-test@example.invalid',now());
set local role authenticated;
do $$
declare code text; result jsonb;
begin
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000001001',true);
 result:=public.nika_family('create','{"name":"Testfamilie","displayName":"Eier","payload":{"version":2}}');
 if result->'family'->>'isOwner'<>'true' then raise exception 'Create failed'; end if;
 code:=public.nika_family('invite')->>'code';
 perform public.nika_family('revoke');
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000001002',true);
 begin
  perform public.nika_family('join',jsonb_build_object('code',code,'displayName','Medlem'));
  raise exception 'TEST revoked invite accepted' using errcode='XX000';
 exception when raise_exception then null; end;
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000001001',true);
 code:=public.nika_family('invite')->>'code';
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000001002',true);
 result:=public.nika_family('join',jsonb_build_object('code',code,'displayName','Medlem'));
 if result->'family'->>'isOwner'<>'false' then raise exception 'Member role failed'; end if;
 if jsonb_array_length(result->'family'->'members')<>2 then raise exception 'Membership failed'; end if;
 perform public.nika_family('save','{"revision":0,"payload":{"version":2,"test":true}}');
 if public.nika_family('load')->'payload'->>'test'<>'true' then raise exception 'Shared save failed'; end if;
 begin
  perform public.nika_family('save','{"revision":0,"payload":{"version":2}}');
  raise exception 'TEST stale save accepted' using errcode='XX000';
 exception when serialization_failure then null; end;
 begin
  perform public.nika_family('invite'); raise exception 'TEST member invited' using errcode='XX000';
 exception when insufficient_privilege then null; end;
 begin
  perform public.nika_family('delete'); raise exception 'TEST member deleted' using errcode='XX000';
 exception when insufficient_privilege then null; end;
 begin
  perform 1 from nika_private.families; raise exception 'TEST direct read' using errcode='XX000';
 exception when insufficient_privilege then null; end;
 if (select count(*) from public.nika_user_state)<>0 then raise exception 'Private data leaked'; end if;
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000001003',true);
 begin
  perform public.nika_family('join',jsonb_build_object('code',code,'displayName','Utenfor'));
  raise exception 'TEST reused invite' using errcode='XX000';
 exception when raise_exception then null; end;
 begin
  perform public.nika_family('load'); raise exception 'TEST outsider read' using errcode='XX000';
 exception when insufficient_privilege then null; end;
 begin
  perform public.nika_family('save','{"revision":1,"payload":{"version":2}}'); raise exception 'TEST outsider write' using errcode='XX000';
 exception when insufficient_privilege then null; end;
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000001001',true);
 perform public.nika_family('remove','{"userId":"00000000-0000-4000-8000-000000001002"}');
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000001002',true);
 begin
  perform public.nika_family('load'); raise exception 'TEST removed member read' using errcode='XX000';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform public.nika_family('context'); raise exception 'TEST anonymous access' using errcode='XX000';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: creation, sharing, invite revocation and single use, CAS conflict, member/outsider/anonymous denial, removal and personal isolation' as result;
