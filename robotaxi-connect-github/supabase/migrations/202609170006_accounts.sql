begin;
do $$ begin
  if public.robotaxi_identity() <> 'robotaxi-connect/v1' then raise exception 'WRONG_PROJECT'; end if;
end $$;

-- Technology users manage only their own submission; internal providers stay private.
create table public.provider_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  company_name text not null default '' check(length(company_name)<=200),
  email text not null default '' check(length(email)<=254),
  phone text not null default '' check(length(phone)<=50),
  address text not null default '' check(length(address)<=500),
  website text not null default '' check(website='' or website ~ '^https?://'),
  solution text not null default '' check(length(solution)<=5000),
  markets text not null default '' check(length(markets)<=2000),
  updated_at timestamptz not null default now()
);
alter table public.provider_accounts enable row level security;
grant select on public.provider_accounts to authenticated;
create policy own_provider_account on public.provider_accounts for select to authenticated using (
  user_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and deactivated_at is null)
);
create policy admin_provider_accounts on public.provider_accounts for select to authenticated using(private.is_admin());
create or replace function private.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,first_name,last_name,locale,role)
  values(new.id,left(coalesce(new.raw_user_meta_data->>'first_name',''),100),left(coalesce(new.raw_user_meta_data->>'last_name',''),100),
    case when new.raw_user_meta_data->>'locale'='en' then 'en' else 'de' end,
    case when new.raw_user_meta_data->>'account_type'='technology' then 'PROVIDER_USER'::public.app_role else 'COMPANY_USER'::public.app_role end);
  if new.raw_user_meta_data->>'account_type'='technology' then
    insert into public.provider_accounts(user_id,email) values(new.id,coalesce(new.email,''));
  end if;
  return new;
end $$;
create function public.save_provider_account(input jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=auth.uid() and p.role='PROVIDER_USER' and p.deactivated_at is null and u.email_confirmed_at is not null) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  perform private.throttle('provider_profile',30,3600);
  if length(trim(coalesce(input->>'company_name',''))) < 2 or coalesce(input->>'email','') not like '%@%' then raise exception 'INVALID_INPUT'; end if;
  insert into public.provider_accounts(user_id,company_name,email,phone,address,website,solution,markets)
  values(auth.uid(),trim(input->>'company_name'),trim(input->>'email'),coalesce(input->>'phone',''),coalesce(input->>'address',''),coalesce(input->>'website',''),coalesce(input->>'solution',''),coalesce(input->>'markets',''))
  on conflict(user_id) do update set company_name=excluded.company_name,email=excluded.email,phone=excluded.phone,address=excluded.address,website=excluded.website,solution=excluded.solution,markets=excluded.markets,updated_at=now();
end $$;

-- A deletion is tied to the caller, never to a user ID supplied by the browser.
create table private.account_deletions(user_id uuid primary key, company_id uuid, created_at timestamptz not null default now());
create table private.account_purge_context(tx bigint primary key, user_id uuid not null);
alter table private.account_deletions enable row level security;
alter table private.account_purge_context enable row level security;
create function private.recent_password_login() returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=auth.uid() and p.role in ('COMPANY_USER','PROVIDER_USER') and u.email_confirmed_at is not null) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if not exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) a
    where a->>'method'='password' and (a->>'timestamp')::numeric > extract(epoch from now()-interval '10 minutes')) then raise exception 'REAUTH_REQUIRED' using errcode='42501'; end if;
end $$;
create function private.in_account_purge() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from private.account_purge_context where tx=txid_current() and user_id=auth.uid())
$$;
create or replace function private.immutable() returns trigger language plpgsql set search_path='' as $$
begin
  if private.in_account_purge() then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  raise exception 'IMMUTABLE_RECORD' using errcode='42501';
end $$;
-- Internal audit rows contain actor IDs. Do not create new actor references during erasure.
create or replace function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
declare rowdata jsonb; previous jsonb; cid uuid; changed jsonb;
begin
  if private.in_account_purge() then return new; end if;
  rowdata=to_jsonb(new); previous=case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  cid=case when tg_table_name='companies' then (rowdata->>'id')::uuid else (rowdata->>'company_id')::uuid end;
  select coalesce(jsonb_agg(k),'[]'::jsonb) into changed from jsonb_object_keys(rowdata) k where rowdata->k is distinct from previous->k and k<>'updated_at';
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,company_id,metadata)
  values(auth.uid(),tg_table_name||'.'||lower(tg_op),tg_table_name,(rowdata->>'id')::uuid,cid,jsonb_build_object('changed_fields',changed,'previous_status',previous->>'status','status',rowdata->>'status'));
  return new;
end $$;
-- Preserve shared-company records while removing references to a departed user.
do $$ declare r record; begin
  for r in select c.conname,t.relname,a.attname from pg_constraint c join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace join pg_attribute a on a.attrelid=t.oid and a.attnum=c.conkey[1]
    where c.contype='f' and c.confrelid='public.profiles'::regclass and n.nspname='public'
      and t.relname not in ('company_members','privacy_requests','provider_accounts') loop
    execute format('alter table public.%I alter column %I drop not null',r.relname,r.attname);
    execute format('alter table public.%I drop constraint %I',r.relname,r.conname);
    execute format('alter table public.%I add constraint %I foreign key (%I) references public.profiles(id) on delete set null',r.relname,r.conname,r.attname);
  end loop;
end $$;

-- The Edge Function uses its private service credential for Storage API removal.
-- Do not grant users read access to internal documents just to enable erasure.
create function public.account_deletion_files(uid uuid) returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(o.name),'[]'::jsonb) from storage.objects o join private.account_deletions d
 on d.user_id=uid and d.company_id is not null and o.name like 'companies/'||d.company_id::text||'/%'
 where o.bucket_id='company-files'
$$;
revoke execute on function public.account_deletion_files(uuid) from public,anon,authenticated;
grant execute on function public.account_deletion_files(uuid) to service_role;
create function private.reject_deleting_company() returns trigger language plpgsql security definer set search_path='' as $$
declare cid uuid; rowdata jsonb;
begin
 if private.in_account_purge() then return new; end if;
 rowdata=to_jsonb(new);
 cid=case when tg_table_name='companies' then (rowdata->>'id')::uuid else (rowdata->>'company_id')::uuid end;
 if cid is not null then
  perform pg_advisory_xact_lock(hashtextextended(cid::text,0));
  if exists(select 1 from private.account_deletions where company_id=cid) then raise exception 'ACCOUNT_DELETION_IN_PROGRESS'; end if;
 end if;
 return new;
end $$;
do $$ declare t text; begin
 foreach t in array array['companies','company_members','fleet_profiles','company_private','company_contacts','referrals','referral_terms','contracts','contract_terms','documents','activities','email_logs','privacy_requests'] loop
  execute format('create trigger account_deletion_guard before insert or update on public.%I for each row execute function private.reject_deleting_company()',t);
 end loop;
end $$;
create function private.guard_file_during_deletion() returns trigger language plpgsql security definer set search_path='' as $$
declare cid uuid;
begin
 if new.bucket_id='company-files' and new.name ~ '^companies/[0-9a-f-]{36}/' then
  cid=split_part(new.name,'/',2)::uuid;
  perform pg_advisory_xact_lock(hashtextextended(cid::text,0));
  if exists(select 1 from private.account_deletions where company_id=cid) then raise exception 'ACCOUNT_DELETION_IN_PROGRESS'; end if;
 end if;
 return new;
end $$;
create trigger account_deletion_storage_guard before insert or update on storage.objects for each row execute function private.guard_file_during_deletion();

create function public.prepare_account_deletion() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid=auth.uid(); cid uuid;
begin
 perform private.recent_password_login();
 perform private.throttle('delete_account',10,3600);
 select company_id into cid from public.company_members where user_id=uid;
 if cid is not null then
  perform pg_advisory_xact_lock(hashtextextended(cid::text,0));
  if exists(select 1 from public.company_members where company_id=cid and user_id<>uid) then cid=null; end if;
 end if;
 insert into private.account_deletions(user_id,company_id) values(uid,cid) on conflict(user_id) do update set company_id=excluded.company_id;
 select company_id into cid from private.account_deletions where user_id=uid;
 return jsonb_build_object('deletes_company',cid is not null);
end $$;
create function public.finish_account_deletion() returns void language plpgsql security definer set search_path='' as $$
declare uid uuid=auth.uid(); cid uuid; member_cid uuid; mail text;
begin
 perform private.recent_password_login();
 select company_id into cid from private.account_deletions where user_id=uid for update;
 if not found then raise exception 'DELETION_NOT_PREPARED'; end if;
 select email into mail from auth.users where id=uid;
 select company_id into member_cid from public.company_members where user_id=uid;
 if member_cid is not null then
  perform pg_advisory_xact_lock(hashtextextended(member_cid::text,0));
  if cid is null and not exists(select 1 from public.company_members where company_id=member_cid and user_id<>uid) then raise exception 'MEMBERSHIP_CHANGED'; end if;
 end if;
 if cid is not null then
  perform pg_advisory_xact_lock(hashtextextended(cid::text,0));
  if exists(select 1 from public.company_members where company_id=cid and user_id<>uid) then raise exception 'MEMBERSHIP_CHANGED'; end if;
  if exists(select 1 from storage.objects where bucket_id='company-files' and name like 'companies/'||cid::text||'/%') then raise exception 'FILES_REMAIN'; end if;
 end if;
 insert into private.account_purge_context(tx,user_id) values(txid_current(),uid);
 delete from public.email_attempts where email_log_id in(select id from public.email_logs where company_id=cid or lower(recipient)=lower(mail));
 delete from public.email_logs where company_id=cid or lower(recipient)=lower(mail);
 if cid is not null then
  delete from public.documents where company_id=cid;
  delete from public.contract_terms where company_id=cid;
  delete from public.contracts where company_id=cid;
  delete from public.referral_terms where company_id=cid;
  delete from public.referrals where company_id=cid;
  delete from public.activities where company_id=cid;
  delete from public.company_contacts where company_id=cid;
  delete from public.fleet_profiles where company_id=cid;
  delete from public.company_private where company_id=cid;
 end if;
 delete from public.privacy_requests where user_id=uid or company_id=cid;
 delete from public.audit_logs where actor_user_id=uid or company_id=cid or (entity_type='profiles' and entity_id=uid);
 delete from public.company_members where user_id=uid;
 if cid is not null then delete from public.companies where id=cid; end if;
 delete from public.provider_accounts where user_id=uid;
 delete from public.profiles where id=uid;
 delete from private.rate_limits where key like uid::text||':%';
 delete from auth.users where id=uid;
 delete from private.account_deletions where user_id=uid;
 delete from private.account_purge_context where tx=txid_current();
end $$;
revoke all on public.provider_accounts from anon;
revoke execute on function public.save_provider_account(jsonb),public.prepare_account_deletion(),public.finish_account_deletion() from public,anon;
grant execute on function public.save_provider_account(jsonb),public.prepare_account_deletion(),public.finish_account_deletion() to authenticated;
revoke execute on function private.recent_password_login(),private.in_account_purge(),private.reject_deleting_company(),private.guard_file_during_deletion() from public,anon,authenticated;
grant execute on function private.in_account_purge() to authenticated;
create or replace function public.save_company(input jsonb, company_uuid uuid default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid; mail text; lang text; admin boolean;
begin
  admin=private.is_admin();
  if not admin and not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=auth.uid() and p.role='COMPANY_USER' and p.deactivated_at is null and u.email_confirmed_at is not null) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  perform private.throttle('save_company',30,3600);
  if company_uuid is null then
    if not admin and exists(select 1 from public.company_members where user_id=auth.uid()) then raise exception 'ALREADY_REGISTERED'; end if;
    if not admin and (coalesce((input->>'consent')::boolean,false)=false or coalesce(input->>'legal_version','')='') then raise exception 'CONSENT_REQUIRED'; end if;
    select email into mail from auth.users where id=auth.uid();
    lang=case when input->>'locale'='en' then 'en' else 'de' end;
    insert into public.companies(name,street,house_number,postal_code,city,country,phone,email,website,company_type,locale,status,legal_version,consent_at,created_by)
    values(trim(input->>'name'),trim(input->>'street'),trim(input->>'house_number'),trim(input->>'postal_code'),trim(input->>'city'),trim(input->>'country'),trim(input->>'phone'),case when admin then input->>'email' else mail end,nullif(input->>'website',''),input->>'company_type',lang,case when admin then 'NEW'::public.company_status else 'PENDING_APPROVAL'::public.company_status end,input->>'legal_version',case when not admin then now() end,auth.uid()) returning id into cid;
    if not admin then
      insert into public.company_members(company_id,user_id) values(cid,auth.uid());
      insert into public.company_contacts(company_id,name,email,phone) select cid,trim(first_name || ' ' || last_name),mail,input->>'phone' from public.profiles where id=auth.uid();
      perform private.enqueue(cid,mail,'registration_received',lang,'{}','registration:' || cid);
    end if;
  else
    cid=company_uuid;
    if not admin and not private.is_member(cid,false) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
    update public.companies set name=trim(input->>'name'),street=trim(input->>'street'),house_number=trim(input->>'house_number'),postal_code=trim(input->>'postal_code'),city=trim(input->>'city'),country=trim(input->>'country'),phone=trim(input->>'phone'),website=nullif(input->>'website',''),company_type=input->>'company_type',email=case when admin then input->>'email' else coalesce(nullif(input->>'email',''),email) end where id=cid;
    if not found then raise exception 'NOT_FOUND'; end if;
  end if;
  insert into public.fleet_profiles(company_id,current_vehicles,potential_vehicles,timeline,requirements)
  values(cid,coalesce((input->>'current_vehicles')::integer,0),coalesce((input->>'potential_vehicles')::integer,0),coalesce(input->>'timeline','OPEN'),input->>'requirements')
  on conflict(company_id) do update set current_vehicles=excluded.current_vehicles,potential_vehicles=excluded.potential_vehicles,timeline=excluded.timeline,requirements=excluded.requirements;
  return cid;
end $$;


commit;
