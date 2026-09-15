-- Robotaxi Connect ONLY. Apply to a NEW Supabase project, never PAN-Viewer.
begin;
do $$ begin
  if to_regclass('public.profiles') is not null or to_regclass('public.companies') is not null then
    raise exception 'Refusing installation into a non-empty application database';
  end if;
end $$;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.app_role as enum ('ADMIN','ADMIN_EMPLOYEE','COMPANY_USER','PROVIDER_USER');
create type public.company_status as enum ('NEW','PENDING_APPROVAL','APPROVED','CONTACTED','QUALIFIED','INTERESTED','LOI','REFERRED','OFFER','CUSTOMER','LOST','ARCHIVED');
create type public.referral_status as enum ('DRAFT','SENT','RECEIVED','IN_DISCUSSION','OFFER','WON','LOST','CANCELLED');
create type public.contract_status as enum ('DRAFT','SENT','SIGNED','ACTIVE','EXPIRED','TERMINATED','ARCHIVED');
create type public.contract_type as enum ('BROKERAGE','SALES_PARTNER','LOI','NDA','REFERRAL','OTHER');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  first_name text not null default '' check (length(first_name) <= 100),
  last_name text not null default '' check (length(last_name) <= 100),
  locale text not null default 'de' check (locale in ('de','en')),
  role public.app_role not null default 'COMPANY_USER',
  deactivated_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 200),
  street text not null check (length(trim(street)) between 1 and 200),
  house_number text not null check (length(trim(house_number)) between 1 and 30),
  postal_code text not null check (length(trim(postal_code)) between 1 and 20),
  city text not null check (length(trim(city)) between 1 and 100),
  country text not null check (length(trim(country)) between 2 and 100),
  phone text not null check (length(trim(phone)) between 3 and 50),
  email text not null check (length(email) between 3 and 254 and email like '%@%'),
  website text check (website is null or website ~ '^https?://'),
  company_type text not null check (company_type in ('TAXI','RENTAL','RIDE_HAILING','MOBILITY','FLEET','OTHER')),
  status public.company_status not null default 'PENDING_APPROVAL',
  locale text not null default 'de' check (locale in ('de','en')),
  legal_version text, consent_at timestamptz,
  approved_at timestamptz, approved_by uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  user_id uuid not null unique references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id,user_id)
);
create table public.fleet_profiles (
  id uuid primary key default gen_random_uuid(), company_id uuid not null unique references public.companies(id),
  current_vehicles integer not null default 0 check (current_vehicles between 0 and 1000000),
  potential_vehicles integer not null default 0 check (potential_vehicles between 0 and 1000000),
  timeline text not null default 'OPEN' check (timeline in ('ASAP','2027','2028','2029','LATER','OPEN')),
  requirements text check (length(requirements) <= 5000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.company_private (
  id uuid primary key default gen_random_uuid(), company_id uuid not null unique references public.companies(id),
  internal_notes text not null default '' check (length(internal_notes) <= 10000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.company_contacts (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  name text not null check (length(trim(name)) between 1 and 200),
  email text not null check (email like '%@%' and length(email) <= 254),
  phone text not null default '' check (length(phone) <= 50), position text not null default '' check (length(position) <= 200),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.providers (
  id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name)) between 2 and 200),
  legal_name text not null check (length(trim(legal_name)) between 2 and 200),
  website text check (website is null or website ~ '^https?://'),
  country text not null check (length(country) between 2 and 100),
  solution text not null check (length(solution) between 1 and 5000),
  notes text check (length(notes) <= 10000), active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.provider_contacts (
  id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.providers(id),
  name text not null check (length(trim(name)) between 1 and 200),
  email text not null check (email like '%@%' and length(email) <= 254),
  phone text not null default '' check (length(phone) <= 50), position text not null default '' check (length(position) <= 200),
  locale text not null default 'de' check (locale in ('de','en')),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id,provider_id)
);
create table public.referrals (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  provider_id uuid not null references public.providers(id), provider_name text not null,
  provider_contact_id uuid not null,
  estimated_vehicles integer not null check (estimated_vehicles between 1 and 1000000),
  status public.referral_status not null default 'DRAFT',
  customer_visible boolean not null default false, customer_visible_notes text check (length(customer_visible_notes) <= 5000),
  desired_start date, sent_at timestamptz,
  created_by uuid not null references public.profiles(id),
  request_id uuid not null unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(provider_contact_id,provider_id) references public.provider_contacts(id,provider_id)
);
create table public.referral_terms (
  id uuid primary key default gen_random_uuid(), referral_id uuid not null unique references public.referrals(id),
  company_id uuid not null references public.companies(id),
  customer_protection_months integer not null default 0 check (customer_protection_months between 0 and 120),
  commission_initial numeric(5,2) not null default 0 check (commission_initial between 0 and 100),
  commission_recurring numeric(5,2) not null default 0 check (commission_recurring between 0 and 100),
  commission_fixed numeric(14,2) not null default 0 check (commission_fixed >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  internal_notes text check (length(internal_notes) <= 10000),
  shared_fields text[] not null, disclosure jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (commission_fixed = 0 or (commission_initial = 0 and commission_recurring = 0))
);
create table public.contracts (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  provider_id uuid references public.providers(id), referral_id uuid references public.referrals(id),
  contract_number text not null unique check (length(contract_number) between 1 and 100),
  contract_type public.contract_type not null, title text not null check (length(title) between 2 and 200),
  status public.contract_status not null default 'DRAFT', valid_from date, valid_until date, signed_at timestamptz,
  customer_visible boolean not null default false, customer_visible_notes text check (length(customer_visible_notes) <= 5000),
  storage_path text, created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until >= valid_from),
  check (storage_path is null or storage_path like 'companies/' || company_id::text || '/contracts/%')
);
create table public.contract_terms (
  id uuid primary key default gen_random_uuid(), contract_id uuid not null unique references public.contracts(id),
  company_id uuid not null references public.companies(id),
  customer_protection_months integer not null default 0 check (customer_protection_months between 0 and 120),
  commission_initial numeric(5,2) not null default 0 check (commission_initial between 0 and 100),
  commission_recurring numeric(5,2) not null default 0 check (commission_recurring between 0 and 100),
  commission_fixed numeric(14,2) not null default 0 check (commission_fixed >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  internal_notes text check (length(internal_notes) <= 10000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (commission_fixed = 0 or (commission_initial = 0 and commission_recurring = 0))
);
create table public.documents (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  contract_id uuid references public.contracts(id), title text not null check (length(title) between 2 and 200),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf','image/png','image/jpeg')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  customer_visible boolean not null default false, archived_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (storage_path like 'companies/' || company_id::text || '/documents/%' or storage_path like 'companies/' || company_id::text || '/contracts/%')
);
create table public.activities (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  actor_user_id uuid not null references public.profiles(id),
  kind text not null check (kind in ('NOTE','CALL','MEETING','EMAIL')),
  body text not null check (length(trim(body)) between 1 and 10000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references public.profiles(id),
  action text not null, entity_type text not null, entity_id uuid not null,
  company_id uuid references public.companies(id), metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table public.email_logs (
  id uuid primary key default gen_random_uuid(), company_id uuid references public.companies(id),
  recipient text not null, template text not null check (template in ('registration_received','account_approved','referral_provider','referral_company','contract_added','document_added')),
  locale text not null check (locale in ('de','en')), payload jsonb not null default '{}',
  dedupe_key text not null unique, status text not null default 'QUEUED' check (status in ('QUEUED','PROCESSING','SENT','FAILED')),
  attempt_count integer not null default 0, external_message_id text, error_code text,
  available_at timestamptz not null default now(), locked_until timestamptz, lock_token uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.email_attempts (
  id uuid primary key default gen_random_uuid(), email_log_id uuid not null references public.email_logs(id),
  attempt_number integer not null, status text not null check (status in ('STARTED','SENT','FAILED')),
  external_message_id text, error_code text, created_at timestamptz not null default now(), completed_at timestamptz
);
create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
  company_id uuid references public.companies(id), kind text not null check (kind in ('EXPORT','DELETE','DEACTIVATE')),
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','COMPLETED','DECLINED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table private.rate_limits (key text primary key, hits integer not null, expires_at timestamptz not null);

create index companies_status_created_idx on public.companies(status,created_at desc);
create index members_company_idx on public.company_members(company_id);
create index company_contacts_company_idx on public.company_contacts(company_id);
create index provider_contacts_provider_idx on public.provider_contacts(provider_id);
create index referrals_company_idx on public.referrals(company_id,created_at desc);
create index referrals_provider_idx on public.referrals(provider_id,status);
create index contracts_company_idx on public.contracts(company_id,status);
create index documents_company_idx on public.documents(company_id,archived_at);
create index activities_company_idx on public.activities(company_id,created_at desc);
create index audit_company_idx on public.audit_logs(company_id,created_at desc);
create index email_queue_idx on public.email_logs(status,available_at);
create index email_attempts_log_idx on public.email_attempts(email_log_id,created_at desc);
create index privacy_user_idx on public.privacy_requests(user_id);

create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role in ('ADMIN','ADMIN_EMPLOYEE') and deactivated_at is null)
$$;
create function private.is_member(cid uuid, approved boolean default true) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.company_members m join public.profiles p on p.id=m.user_id join public.companies c on c.id=m.company_id
    where m.company_id=cid and m.user_id=(select auth.uid()) and p.deactivated_at is null and p.role='COMPANY_USER'
    and c.status <> 'ARCHIVED' and (not approved or c.approved_at is not null))
$$;
create function private.require_admin() returns void language plpgsql security definer set search_path = '' as $$
begin if not private.is_admin() then raise exception 'FORBIDDEN' using errcode='42501'; end if; end $$;
create function private.throttle(scope text, max_hits integer, seconds integer) returns void language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
  insert into private.rate_limits(key,hits,expires_at) values (auth.uid()::text || ':' || scope,1,now()+make_interval(secs=>seconds))
  on conflict(key) do update set hits=case when private.rate_limits.expires_at < now() then 1 else private.rate_limits.hits+1 end,
    expires_at=case when private.rate_limits.expires_at < now() then excluded.expires_at else private.rate_limits.expires_at end returning hits into n;
  if n > max_hits then raise exception 'RATE_LIMITED'; end if;
end $$;
create function private.touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at=now(); return new; end $$;
create function private.audit_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare rowdata jsonb; previous jsonb; cid uuid; changed jsonb;
begin
  rowdata=to_jsonb(new); previous=case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  cid=case when tg_table_name='companies' then (rowdata->>'id')::uuid else (rowdata->>'company_id')::uuid end;
  select coalesce(jsonb_agg(k),'[]'::jsonb) into changed from jsonb_object_keys(rowdata) k where rowdata->k is distinct from previous->k and k <> 'updated_at';
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,company_id,metadata)
  values(auth.uid(),tg_table_name || '.' || lower(tg_op),tg_table_name,(rowdata->>'id')::uuid,cid,
    jsonb_build_object('changed_fields',changed,'previous_status',previous->>'status','status',rowdata->>'status'));
  return new;
end $$;
create function private.immutable() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'IMMUTABLE_RECORD' using errcode='42501'; end $$;
create trigger audit_immutable before update or delete on public.audit_logs for each row execute function private.immutable();

do $$ declare t text; begin
  foreach t in array array['profiles','companies','company_members','fleet_profiles','company_private','company_contacts','providers','provider_contacts','referrals','referral_terms','contracts','contract_terms','documents','activities','email_logs','privacy_requests'] loop
    execute format('create trigger touch before update on public.%I for each row execute function private.touch()',t);
    execute format('create trigger audit after insert or update on public.%I for each row execute function private.audit_change()',t);
  end loop;
  foreach t in array array['profiles','companies','company_members','fleet_profiles','company_private','company_contacts','providers','provider_contacts','referrals','referral_terms','contracts','contract_terms','documents','activities','email_logs','email_attempts','audit_logs','privacy_requests'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('create policy admin_read on public.%I for select to authenticated using (private.is_admin())',t);
  end loop;
end $$;
create policy profile_self on public.profiles for select to authenticated using (id=(select auth.uid()) and deactivated_at is null);
create policy members_self on public.company_members for select to authenticated using (user_id=(select auth.uid()) and private.is_member(company_id,false));
create policy companies_own on public.companies for select to authenticated using (private.is_member(id,false));
create policy fleet_own on public.fleet_profiles for select to authenticated using (private.is_member(company_id,false));
create policy referrals_own on public.referrals for select to authenticated using (customer_visible and private.is_member(company_id));
create policy contracts_own on public.contracts for select to authenticated using (customer_visible and status <> 'ARCHIVED' and private.is_member(company_id));
create policy documents_own on public.documents for select to authenticated using (
  customer_visible and archived_at is null and private.is_member(company_id)
  and (contract_id is null or exists(select 1 from public.contracts c where c.id=contract_id and c.company_id=documents.company_id and c.customer_visible and c.status <> 'ARCHIVED'))
);
create policy privacy_own on public.privacy_requests for select to authenticated using (user_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=auth.uid() and p.deactivated_at is null));
-- All writes use explicitly authorized RPCs. No direct table write grants, even for admins.

create function private.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,first_name,last_name,locale) values(new.id,left(coalesce(new.raw_user_meta_data->>'first_name',''),100),left(coalesce(new.raw_user_meta_data->>'last_name',''),100),case when new.raw_user_meta_data->>'locale'='en' then 'en' else 'de' end);
  return new;
end $$;
create trigger robotaxi_auth_profile after insert on auth.users for each row execute function private.create_profile();

create function private.enqueue(cid uuid, target text, template_name text, lang text, data jsonb, dedupe text) returns void language sql security definer set search_path = '' as $$
  insert into public.email_logs(company_id,recipient,template,locale,payload,dedupe_key) values(cid,target,template_name,lang,data,dedupe) on conflict(dedupe_key) do nothing
$$;
create function public.save_company(input jsonb, company_uuid uuid default null) returns uuid language plpgsql security definer set search_path = '' as $$
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
    update public.companies set name=trim(input->>'name'),street=trim(input->>'street'),house_number=trim(input->>'house_number'),postal_code=trim(input->>'postal_code'),city=trim(input->>'city'),country=trim(input->>'country'),phone=trim(input->>'phone'),website=nullif(input->>'website',''),company_type=input->>'company_type',email=case when admin then input->>'email' else email end where id=cid;
    if not found then raise exception 'NOT_FOUND'; end if;
  end if;
  insert into public.fleet_profiles(company_id,current_vehicles,potential_vehicles,timeline,requirements)
  values(cid,coalesce((input->>'current_vehicles')::integer,0),coalesce((input->>'potential_vehicles')::integer,0),coalesce(input->>'timeline','OPEN'),input->>'requirements')
  on conflict(company_id) do update set current_vehicles=excluded.current_vehicles,potential_vehicles=excluded.potential_vehicles,timeline=excluded.timeline,requirements=excluded.requirements;
  return cid;
end $$;

create function public.approve_company(cid uuid) returns void language plpgsql security definer set search_path = '' as $$
declare c public.companies;
begin
  perform private.require_admin();
  update public.companies set status='APPROVED',approved_at=now(),approved_by=auth.uid() where id=cid and approved_at is null and status <> 'ARCHIVED' returning * into c;
  if not found then return; end if;
  perform private.enqueue(cid,c.email,'account_approved',c.locale,'{}','approved:' || cid);
end $$;
create function public.set_company_status(cid uuid, next_status public.company_status) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if next_status='APPROVED' then perform public.approve_company(cid); return; end if;
  update public.companies set status=next_status where id=cid;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

create function public.save_admin_record(kind text, input jsonb, record_id uuid default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare rid uuid;
begin
  perform private.require_admin(); perform private.throttle('admin_edit',300,3600);
  if kind='provider' then
    if record_id is null then
      insert into public.providers(name,legal_name,website,country,solution,notes,active) values(input->>'name',input->>'legal_name',nullif(input->>'website',''),input->>'country',input->>'solution',input->>'notes',coalesce((input->>'active')::boolean,true)) returning id into rid;
    else
      update public.providers set name=input->>'name',legal_name=input->>'legal_name',website=nullif(input->>'website',''),country=input->>'country',solution=input->>'solution',notes=input->>'notes',active=(input->>'active')::boolean where id=record_id returning id into rid;
    end if;
  elsif kind='company_contact' then
    if record_id is null then
      insert into public.company_contacts(company_id,name,email,phone,position) values((input->>'company_id')::uuid,input->>'name',input->>'email',input->>'phone',input->>'position') returning id into rid;
    else
      update public.company_contacts set name=input->>'name',email=input->>'email',phone=input->>'phone',position=input->>'position' where id=record_id returning id into rid;
    end if;
  elsif kind='provider_contact' then
    if record_id is null then
      insert into public.provider_contacts(provider_id,name,email,phone,position,locale) values((input->>'provider_id')::uuid,input->>'name',input->>'email',input->>'phone',input->>'position',input->>'locale') returning id into rid;
    else
      update public.provider_contacts set name=input->>'name',email=input->>'email',phone=input->>'phone',position=input->>'position',locale=input->>'locale' where id=record_id returning id into rid;
    end if;
  elsif kind='company_note' then
    insert into public.company_private(company_id,internal_notes) values((input->>'company_id')::uuid,input->>'internal_notes') on conflict(company_id) do update set internal_notes=excluded.internal_notes returning id into rid;
  elsif kind='activity' then
    insert into public.activities(company_id,actor_user_id,kind,body) values((input->>'company_id')::uuid,auth.uid(),input->>'kind',input->>'body') returning id into rid;
  else raise exception 'INVALID_RECORD_TYPE';
  end if;
  if rid is null then raise exception 'NOT_FOUND'; end if;
  return rid;
end $$;

create function public.create_referral(input jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid; rid uuid; c public.companies; p public.providers; pc public.provider_contacts; f public.fleet_profiles; fields text[]; disclosure jsonb='{}';
begin
  perform private.require_admin();
  -- Serialize duplicate submissions before checking the idempotency key.
  perform pg_advisory_xact_lock(hashtextextended(input->>'request_id',0));
  select id into rid from public.referrals where request_id=(input->>'request_id')::uuid;
  if rid is not null then return rid; end if;
  perform private.throttle('referral',60,3600);
  cid=(input->>'company_id')::uuid;
  select * into c from public.companies where id=cid and approved_at is not null and status <> 'ARCHIVED';
  if not found then raise exception 'COMPANY_NOT_APPROVED'; end if;
  select * into p from public.providers where id=(input->>'provider_id')::uuid and active;
  if not found then raise exception 'INVALID_PROVIDER'; end if;
  select * into pc from public.provider_contacts where id=(input->>'provider_contact_id')::uuid and provider_id=p.id and archived_at is null;
  if not found then raise exception 'INVALID_CONTACT'; end if;
  select * into f from public.fleet_profiles where company_id=cid;
  select array_agg(value) into fields from jsonb_array_elements_text(input->'shared_fields');
  if coalesce(cardinality(fields),0)=0 or not fields <@ array['name','location','fleet','contact','requirements']::text[] then raise exception 'INVALID_SHARED_FIELDS'; end if;
  if 'name'=any(fields) then disclosure=disclosure || jsonb_build_object('name',c.name); end if;
  if 'location'=any(fields) then disclosure=disclosure || jsonb_build_object('city',c.city,'country',c.country); end if;
  if 'fleet'=any(fields) then disclosure=disclosure || jsonb_build_object('current_vehicles',f.current_vehicles,'potential_vehicles',(input->>'estimated_vehicles')::integer); end if;
  if 'contact'=any(fields) then disclosure=disclosure || jsonb_build_object('email',c.email,'phone',c.phone); end if;
  if 'requirements'=any(fields) then disclosure=disclosure || jsonb_build_object('requirements',f.requirements); end if;
  insert into public.referrals(company_id,provider_id,provider_name,provider_contact_id,estimated_vehicles,status,customer_visible,desired_start,sent_at,created_by,request_id)
  values(cid,p.id,p.name,pc.id,(input->>'estimated_vehicles')::integer,'SENT',coalesce((input->>'customer_visible')::boolean,false),nullif(input->>'desired_start','')::date,now(),auth.uid(),(input->>'request_id')::uuid) returning id into rid;
  insert into public.referral_terms(referral_id,company_id,customer_protection_months,commission_initial,commission_recurring,commission_fixed,currency,internal_notes,shared_fields,disclosure)
  values(rid,cid,(input->>'customer_protection_months')::integer,(input->>'commission_initial')::numeric,(input->>'commission_recurring')::numeric,(input->>'commission_fixed')::numeric,coalesce(input->>'currency','EUR'),input->>'internal_notes',fields,disclosure);
  update public.companies set status='REFERRED' where id=cid;
  perform private.enqueue(cid,pc.email,'referral_provider',pc.locale,jsonb_build_object('referral_id',rid,'disclosure',disclosure),'referral-provider:' || rid);
  perform private.enqueue(cid,c.email,'referral_company',c.locale,jsonb_build_object('referral_id',rid),'referral-company:' || rid);
  return rid;
end $$;

create function private.referral_transition(a public.referral_status,b public.referral_status) returns boolean language sql immutable as $$
  select a=b or case a
    when 'DRAFT' then b in ('SENT','CANCELLED')
    when 'SENT' then b in ('RECEIVED','IN_DISCUSSION','LOST','CANCELLED')
    when 'RECEIVED' then b in ('IN_DISCUSSION','OFFER','LOST','CANCELLED')
    when 'IN_DISCUSSION' then b in ('OFFER','WON','LOST','CANCELLED')
    when 'OFFER' then b in ('WON','LOST','CANCELLED') else false end
$$;
create function public.update_referral(rid uuid, next_status public.referral_status, visible boolean, customer_notes text) returns void language plpgsql security definer set search_path = '' as $$
declare r public.referrals;
begin
  perform private.require_admin();
  select * into r from public.referrals where id=rid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if not private.referral_transition(r.status,next_status) then raise exception 'INVALID_TRANSITION'; end if;
  update public.referrals set status=next_status,customer_visible=visible,customer_visible_notes=customer_notes where id=rid;
end $$;

create function public.save_contract(input jsonb, contract_uuid uuid default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare rid uuid; cid uuid; refid uuid; pid uuid; c public.companies; previous_visible boolean=false;
begin
  perform private.require_admin(); perform private.throttle('contract',120,3600);
  cid=(input->>'company_id')::uuid; refid=nullif(input->>'referral_id','')::uuid; pid=nullif(input->>'provider_id','')::uuid;
  if refid is not null and not exists(select 1 from public.referrals where id=refid and company_id=cid and (pid is null or provider_id=pid)) then raise exception 'REFERRAL_MISMATCH'; end if;
  if contract_uuid is null then
    insert into public.contracts(company_id,provider_id,referral_id,contract_number,contract_type,title,status,valid_from,valid_until,signed_at,customer_visible,customer_visible_notes,created_by)
    values(cid,pid,refid,input->>'contract_number',(input->>'contract_type')::public.contract_type,input->>'title',(input->>'status')::public.contract_status,nullif(input->>'valid_from','')::date,nullif(input->>'valid_until','')::date,nullif(input->>'signed_at','')::timestamptz,(input->>'customer_visible')::boolean,input->>'customer_visible_notes',auth.uid()) returning id into rid;
  else
    select customer_visible into previous_visible from public.contracts where id=contract_uuid and company_id=cid for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    update public.contracts set provider_id=pid,referral_id=refid,contract_number=input->>'contract_number',contract_type=(input->>'contract_type')::public.contract_type,title=input->>'title',status=(input->>'status')::public.contract_status,valid_from=nullif(input->>'valid_from','')::date,valid_until=nullif(input->>'valid_until','')::date,signed_at=nullif(input->>'signed_at','')::timestamptz,customer_visible=(input->>'customer_visible')::boolean,customer_visible_notes=input->>'customer_visible_notes' where id=contract_uuid returning id into rid;
  end if;
  insert into public.contract_terms(contract_id,company_id,customer_protection_months,commission_initial,commission_recurring,commission_fixed,currency,internal_notes)
  values(rid,cid,(input->>'customer_protection_months')::integer,(input->>'commission_initial')::numeric,(input->>'commission_recurring')::numeric,(input->>'commission_fixed')::numeric,input->>'currency',input->>'internal_notes')
  on conflict(contract_id) do update set customer_protection_months=excluded.customer_protection_months,commission_initial=excluded.commission_initial,commission_recurring=excluded.commission_recurring,commission_fixed=excluded.commission_fixed,currency=excluded.currency,internal_notes=excluded.internal_notes;
  if not previous_visible and (input->>'customer_visible')::boolean then
    select * into c from public.companies where id=cid;
    perform private.enqueue(cid,c.email,'contract_added',c.locale,jsonb_build_object('contract_id',rid),'contract:' || rid);
  end if;
  return rid;
end $$;

create function public.attach_document(input jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare rid uuid; cid uuid; conid uuid; c public.companies;
begin
  perform private.require_admin(); perform private.throttle('upload',100,3600);
  cid=(input->>'company_id')::uuid; conid=nullif(input->>'contract_id','')::uuid;
  if conid is not null and not exists(select 1 from public.contracts where id=conid and company_id=cid) then raise exception 'CONTRACT_MISMATCH'; end if;
  if conid is not null and input->>'mime_type' <> 'application/pdf' then raise exception 'PDF_REQUIRED'; end if;
  if not exists(select 1 from storage.objects where bucket_id='company-files' and name=input->>'storage_path') then raise exception 'FILE_NOT_FOUND'; end if;
  insert into public.documents(company_id,contract_id,title,storage_path,mime_type,size_bytes,customer_visible,created_by)
  values(cid,conid,input->>'title',input->>'storage_path',input->>'mime_type',(input->>'size_bytes')::integer,(input->>'customer_visible')::boolean,auth.uid()) returning id into rid;
  if conid is not null then update public.contracts set storage_path=input->>'storage_path' where id=conid; end if;
  if (input->>'customer_visible')::boolean and (conid is null or exists(select 1 from public.contracts where id=conid and customer_visible and status <> 'ARCHIVED')) then
    select * into c from public.companies where id=cid;
    perform private.enqueue(cid,c.email,'document_added',c.locale,jsonb_build_object('document_id',rid),'document:' || rid);
  end if;
  return rid;
end $$;
create function public.set_document_visibility(did uuid, visible boolean, archive boolean default false) returns void language plpgsql security definer set search_path = '' as $$
declare d public.documents; c public.companies;
begin
  perform private.require_admin();
  update public.documents set customer_visible=visible,archived_at=case when archive then now() else null end where id=did returning * into d;
  if not found then raise exception 'NOT_FOUND'; end if;
  if visible and not archive and (d.contract_id is null or exists(select 1 from public.contracts where id=d.contract_id and customer_visible and status <> 'ARCHIVED')) then
    select * into c from public.companies where id=d.company_id;
    perform private.enqueue(c.id,c.email,'document_added',c.locale,jsonb_build_object('document_id',did),'document:' || did);
  end if;
end $$;

create function public.update_profile(first text, last text, lang text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  update public.profiles set first_name=first,last_name=last,locale=lang where id=auth.uid() and deactivated_at is null;
end $$;
create function public.request_privacy(request_kind text) returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid; rid uuid;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='COMPANY_USER' and deactivated_at is null) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  perform private.throttle('privacy',5,86400);
  select company_id into cid from public.company_members where user_id=auth.uid();
  insert into public.privacy_requests(user_id,company_id,kind) values(auth.uid(),cid,request_kind) returning id into rid;
  if request_kind='DEACTIVATE' then update public.profiles set deactivated_at=now() where id=auth.uid(); end if;
  return rid;
end $$;
create function public.resolve_privacy(rid uuid, next_status text) returns void language plpgsql security definer set search_path = '' as $$
begin perform private.require_admin(); update public.privacy_requests set status=next_status where id=rid; end $$;

-- Private file access checks metadata as well as tenant membership.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('company-files','company-files',false,10485760,array['application/pdf','image/png','image/jpeg']);
create policy robotaxi_file_read on storage.objects for select to authenticated using (
  bucket_id='company-files' and (private.is_admin() or exists(select 1 from public.documents d where d.storage_path=name and d.customer_visible and d.archived_at is null and private.is_member(d.company_id)
    and (d.contract_id is null or exists(select 1 from public.contracts c where c.id=d.contract_id and c.company_id=d.company_id and c.customer_visible and c.status <> 'ARCHIVED'))))
);
create policy robotaxi_file_insert on storage.objects for insert to authenticated with check (
  bucket_id='company-files' and private.is_admin() and exists(select 1 from public.companies c where storage.objects.name like 'companies/' || c.id::text || '/documents/%' or storage.objects.name like 'companies/' || c.id::text || '/contracts/%')
);
-- DELETE only for unattached upload compensation, never for attached business records.
create policy robotaxi_orphan_cleanup on storage.objects for delete to authenticated using (
  bucket_id='company-files' and private.is_admin() and not exists(select 1 from public.documents d where d.storage_path=name)
);

-- Harden default function permissions; only public RPCs are callable by users.
revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.is_admin(),private.is_member(uuid,boolean) to authenticated;
revoke execute on all functions in schema public from public,anon;
grant execute on function public.save_company(jsonb,uuid),public.approve_company(uuid),public.set_company_status(uuid,public.company_status),public.save_admin_record(text,jsonb,uuid),public.create_referral(jsonb),public.update_referral(uuid,public.referral_status,boolean,text),public.save_contract(jsonb,uuid),public.attach_document(jsonb),public.set_document_visibility(uuid,boolean,boolean),public.update_profile(text,text,text),public.request_privacy(text),public.resolve_privacy(uuid,text) to authenticated;
commit;
