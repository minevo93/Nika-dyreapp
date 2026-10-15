-- Families are separate workspaces. Personal records retain their existing RLS.
create table nika_private.families (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 60),
 payload jsonb not null check(jsonb_typeof(payload)='object' and coalesce(payload->>'version','')='2' and octet_length(payload::text)<=2097152),
 revision bigint not null default 0 check(revision>=0),
 updated_at timestamptz not null default now()
);
create table nika_private.family_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 family_id uuid not null references nika_private.families(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 60)
);
create index family_members_family on nika_private.family_members(family_id);
create table nika_private.family_invites (
 token_hash bytea primary key,
 family_id uuid not null unique references nika_private.families(id) on delete cascade,
 expires_at timestamptz not null
);
alter table nika_private.families enable row level security;
alter table nika_private.family_members enable row level security;
alter table nika_private.family_invites enable row level security;
revoke all on nika_private.families,nika_private.family_members,nika_private.family_invites from public,anon,authenticated;
create function nika_private.family_request(action text, body jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); fam nika_private.families%rowtype; fid uuid; token text; label text; target uuid; data jsonb;
begin
 if actor is null or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null) then
  raise exception 'Logg inn med en bekreftet konto.' using errcode='42501';
 end if;
 -- Serialize membership changes, creation and joining for this account.
 perform pg_advisory_xact_lock(hashtextextended(actor::text,1));
 select family_id into fid from nika_private.family_members where user_id=actor;
 if action='create' then
  if fid is not null then raise exception 'Du er allerede med i en familie.'; end if;
  label:=btrim(body->>'displayName');
  if label is null or length(label) not between 1 and 60 then raise exception 'Skriv navnet ditt.'; end if;
  insert into nika_private.families(owner_id,name,payload) values(actor,btrim(body->>'name'),body->'payload') returning id into fid;
  insert into nika_private.family_members values(actor,fid,label);
 elsif action='join' then
  if fid is not null then raise exception 'Du er allerede med i en familie.'; end if;
  token:=lower(btrim(body->>'code'));label:=btrim(body->>'displayName');
  if token is null or token !~ '^[a-f0-9]{64}$' or label is null or length(label) not between 1 and 60 then raise exception 'Kontroller navn og invitasjonskode.'; end if;
  select family_id into fid from nika_private.family_invites where token_hash=extensions.digest(convert_to(token,'UTF8'),'sha256') and expires_at>now();
  if fid is null then raise exception 'Koden er ugyldig eller utløpt.'; end if;
  perform 1 from nika_private.families where id=fid for update;
  -- Recheck after taking the lock: a code is valid for one new member only.
  delete from nika_private.family_invites where family_id=fid and token_hash=extensions.digest(convert_to(token,'UTF8'),'sha256') and expires_at>now();
  if not found then raise exception 'Koden er ugyldig eller allerede brukt.'; end if;
  if (select count(*) from nika_private.family_members where family_id=fid)>=12 then raise exception 'Familien har allerede 12 medlemmer.'; end if;
  insert into nika_private.family_members values(actor,fid,label);
 end if;
 if fid is null then
  if action='context' then return jsonb_build_object('family',null); end if;
  raise exception 'Du har ikke tilgang til en delt familie.' using errcode='42501';
 end if;
 select * into fam from nika_private.families where id=fid for update;
 -- A removal may have committed while waiting for the family lock.
 if not exists(select 1 from nika_private.family_members where user_id=actor and family_id=fid) then raise exception 'Tilgangen er avsluttet.' using errcode='42501'; end if;
 if action='load' then return jsonb_build_object('payload',fam.payload,'revision',fam.revision); end if;
 if action='save' then
  if fam.revision is distinct from (body->>'revision')::bigint then raise exception 'Familien har nyere endringer. Eksporter dine endringer før du henter siste versjon.' using errcode='40001'; end if;
  update nika_private.families set payload=body->'payload',revision=revision+1,updated_at=now() where id=fid returning revision into fam.revision;
  return jsonb_build_object('revision',fam.revision);
 elsif action in ('invite','revoke','remove','delete') then
  if fam.owner_id<>actor then raise exception 'Bare familieeieren kan gjøre dette.' using errcode='42501'; end if;
  if action='invite' then
   token:=encode(extensions.gen_random_bytes(32),'hex');
   delete from nika_private.family_invites where family_id=fid;
   insert into nika_private.family_invites values(extensions.digest(convert_to(token,'UTF8'),'sha256'),fid,now()+interval '24 hours');
   return jsonb_build_object('code',token,'expiresAt',now()+interval '24 hours');
  elsif action='revoke' then delete from nika_private.family_invites where family_id=fid;
  elsif action='remove' then
   target:=(body->>'userId')::uuid;
   if target=actor then raise exception 'Eieren kan ikke fjerne seg selv. Avslutt delingen i stedet.'; end if;
   delete from nika_private.family_members where user_id=target and family_id=fid;
  elsif action='delete' then
   delete from nika_private.families where id=fid;
   return jsonb_build_object('family',null);
  end if;
 elsif action='leave' then
  if fam.owner_id=actor then raise exception 'Eieren må avslutte delingen.'; end if;
  delete from nika_private.family_members where user_id=actor;
  return jsonb_build_object('family',null);
 elsif action='rename' then
  label:=btrim(body->>'displayName');
  update nika_private.family_members set display_name=label where user_id=actor;
 elsif action not in ('context','create','join') then raise exception 'Ukjent familiehandling.';
 end if;
 return jsonb_build_object('family',jsonb_build_object('id',fid,'name',fam.name,'isOwner',fam.owner_id=actor,'revision',fam.revision,
  'members',(select jsonb_agg(jsonb_build_object('id',user_id,'name',display_name,'isOwner',user_id=fam.owner_id) order by display_name) from nika_private.family_members where family_id=fid),
  'hasInvitation',exists(select 1 from nika_private.family_invites where family_id=fid and expires_at>now())));
end;
$$;
revoke all on function nika_private.family_request(text,jsonb) from public,anon,authenticated;
grant execute on function nika_private.family_request(text,jsonb) to authenticated;
create function public.nika_family(action text,body jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$ select nika_private.family_request(action,body); $$;
revoke all on function public.nika_family(text,jsonb) from public,anon,authenticated;
grant execute on function public.nika_family(text,jsonb) to authenticated;
