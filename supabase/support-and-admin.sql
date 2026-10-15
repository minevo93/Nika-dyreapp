-- Private support conversations. Only their owner and the designated app administrator can read them.
create table if not exists nika_private.support_threads (
 user_id uuid primary key references auth.users(id) on delete cascade,
 status text not null default 'open' check(status in ('open','closed')),
 updated_at timestamptz not null default now(),
 user_read_at timestamptz,
 admin_read_at timestamptz
);
create table if not exists nika_private.support_messages (
 id bigint generated always as identity primary key,
 user_id uuid not null references nika_private.support_threads(user_id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 from_admin boolean not null,
 message text not null check(char_length(message) between 1 and 2000),
 client_id uuid not null,
 created_at timestamptz not null default clock_timestamp(),
 unique(sender_id,client_id)
);
create index if not exists support_messages_thread_id on nika_private.support_messages(user_id,id desc);
create index if not exists support_messages_sender_time on nika_private.support_messages(sender_id,created_at desc);
alter table nika_private.support_threads enable row level security;
alter table nika_private.support_messages enable row level security;
revoke all on nika_private.support_threads,nika_private.support_messages from public,anon,authenticated;
revoke all on sequence nika_private.support_messages_id_seq from public,anon,authenticated;
create or replace function nika_private.support_action(action text,body jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 caller uuid:=auth.uid(); administrator boolean; owner_id uuid; content text; request_id uuid;
 result jsonb; before_id bigint; page_offset integer; search_text text;
begin
 if caller is null or not exists(select 1 from auth.users where id=caller and email_confirmed_at is not null) then
  raise exception 'Authentication required' using errcode='42501';
 end if;
 select exists(select 1 from nika_private.app_administrator where user_id=caller) into administrator;
 if body is null or jsonb_typeof(body)<>'object' or octet_length(body::text)>12000 then raise exception 'Invalid request'; end if;
 if action in ('users','threads') and not administrator then raise exception 'Administrator required' using errcode='42501'; end if;
 if action='users' then
  page_offset:=greatest(0,least(100000,coalesce((body->>'offset')::integer,0)));
  search_text:=left(trim(coalesce(body->>'search','')),100);
  select jsonb_build_object('total',(select count(*) from auth.users),
   'active30Days',(select count(*) from auth.users where last_sign_in_at>=now()-interval '30 days'),
   'matching',(select count(*) from auth.users where search_text='' or position(lower(search_text) in lower(coalesce(email,'')))>0),
   'users',coalesce((select jsonb_agg(row_to_json(u)) from
    (select id,email,created_at as "createdAt",last_sign_in_at as "lastSignInAt",email_confirmed_at is not null as verified
     from auth.users where search_text='' or position(lower(search_text) in lower(coalesce(email,'')))>0
     order by created_at desc,id limit 50 offset page_offset) u),'[]'::jsonb)) into result;
  return result;
 elsif action='threads' then
  page_offset:=greatest(0,least(100000,coalesce((body->>'offset')::integer,0)));
  select jsonb_build_object('total',(select count(*) from nika_private.support_threads),
   'threads',coalesce((select jsonb_agg(row_to_json(t)) from
    (select s.user_id as "userId",u.email,s.status,s.updated_at as "updatedAt",
     (select count(*) from nika_private.support_messages m where m.user_id=s.user_id and not m.from_admin and (s.admin_read_at is null or m.created_at>s.admin_read_at)) as unread
     from nika_private.support_threads s join auth.users u on u.id=s.user_id
     order by s.updated_at desc,s.user_id limit 50 offset page_offset) t),'[]'::jsonb)) into result;
  return result;
 end if;
 owner_id:=coalesce(nullif(body->>'userId','')::uuid,caller);
 if owner_id<>caller and not administrator then raise exception 'Access denied' using errcode='42501'; end if;
 if action='messages' then
  before_id:=coalesce((body->>'before')::bigint,9223372036854775807);
  select jsonb_build_object('messages',coalesce((select jsonb_agg(row_to_json(m) order by m.id) from
   (select id,from_admin as "fromAdmin",message,created_at as "createdAt" from nika_private.support_messages
    where user_id=owner_id and id<before_id order by id desc limit 50) m),'[]'::jsonb),
   'status',coalesce((select status from nika_private.support_threads where user_id=owner_id),'open')) into result;
  if not(body?'before') then
   if administrator and owner_id<>caller then update nika_private.support_threads set admin_read_at=now() where user_id=owner_id;
   else update nika_private.support_threads set user_read_at=now() where user_id=owner_id; end if;
  end if;
  return result;
 elsif action='send' then
  content:=trim(coalesce(body->>'message','')); request_id:=(body->>'clientId')::uuid;
  if char_length(content)<1 or char_length(content)>2000 or request_id is null then raise exception 'Invalid message'; end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text,891));
  if exists(select 1 from nika_private.support_messages where sender_id=caller and client_id=request_id) then return jsonb_build_object('sent',true); end if;
  if (select count(*) from nika_private.support_messages where sender_id=caller and created_at>now()-interval '1 minute')>=10 then raise exception 'Too many messages' using errcode='P0001'; end if;
  if owner_id<>caller and not exists(select 1 from nika_private.support_threads where user_id=owner_id) then raise exception 'Conversation not found'; end if;
  insert into nika_private.support_threads(user_id) values(owner_id) on conflict(user_id) do nothing;
  insert into nika_private.support_messages(user_id,sender_id,from_admin,message,client_id) values(owner_id,caller,administrator and owner_id<>caller,content,request_id);
  update nika_private.support_threads set status='open',updated_at=clock_timestamp() where user_id=owner_id;
  return jsonb_build_object('sent',true);
 elsif action='close' then
  update nika_private.support_threads set status='closed',updated_at=clock_timestamp() where user_id=owner_id;
  return jsonb_build_object('closed',true);
 end if;
 raise exception 'Unknown action';
end;
$$;
revoke all on function nika_private.support_action(text,jsonb) from public,anon,authenticated;
grant execute on function nika_private.support_action(text,jsonb) to authenticated;
create or replace function public.nika_support(action text,body jsonb default '{}'::jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select nika_private.support_action(action,body); $$;
revoke all on function public.nika_support(text,jsonb) from public,anon,authenticated;
grant execute on function public.nika_support(text,jsonb) to authenticated;
