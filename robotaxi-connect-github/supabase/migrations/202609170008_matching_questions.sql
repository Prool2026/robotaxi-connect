begin;
do $$ begin if public.robotaxi_identity()<>'robotaxi-connect/v1' then raise exception 'WRONG_PROJECT'; end if; end $$;
alter table public.fleet_profiles add column qualification jsonb not null default '{}'::jsonb check(jsonb_typeof(qualification)='object' and octet_length(qualification::text)<=100000);
create or replace function public.save_provider_account(input jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=auth.uid() and p.role='PROVIDER_USER' and p.deactivated_at is null and u.email_confirmed_at is not null) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  perform private.throttle('provider_profile',30,3600);
  if input ? 'qualification' then
    if jsonb_typeof(input->'qualification') is distinct from 'object' then raise exception 'INVALID_INPUT'; end if;
    if exists(select 1 from jsonb_each(input->'qualification') e where jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2500 or e.key not in ('use_cases','vehicles','requirements','training_support','availability_approvals','partnership','business_model','odd','supervision','operator_tasks','minimum_fleet','integration')) then raise exception 'INVALID_INPUT'; end if;
  end if;
  if length(trim(coalesce(input->>'company_name',''))) < 2 or coalesce(input->>'email','') not like '%@%' then raise exception 'INVALID_INPUT'; end if;
  insert into public.provider_accounts(user_id,company_name,email,phone,address,website,solution,markets,qualification)
  values(auth.uid(),trim(input->>'company_name'),trim(input->>'email'),coalesce(input->>'phone',''),coalesce(input->>'address',''),coalesce(input->>'website',''),coalesce(input->>'solution',''),coalesce(input->>'markets',''),coalesce(input->'qualification','{}'::jsonb))
  on conflict(user_id) do update set company_name=excluded.company_name,email=excluded.email,phone=excluded.phone,address=excluded.address,website=excluded.website,solution=excluded.solution,markets=excluded.markets,qualification=excluded.qualification,updated_at=now();
end $$;
create or replace function public.save_company(input jsonb, company_uuid uuid default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid; mail text; lang text; admin boolean;
begin
  if input ? 'qualification' then
    if jsonb_typeof(input->'qualification') is distinct from 'object' then raise exception 'INVALID_INPUT'; end if;
    if exists(select 1 from jsonb_each(input->'qualification') e where jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2500 or e.key not in ('regions','trip_types','depot','own_vehicles','local_operator','pilot_size')) then raise exception 'INVALID_INPUT'; end if;
  end if;
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
  insert into public.fleet_profiles(company_id,current_vehicles,potential_vehicles,timeline,requirements,qualification)
  values(cid,coalesce((input->>'current_vehicles')::integer,0),coalesce((input->>'potential_vehicles')::integer,0),coalesce(input->>'timeline','OPEN'),input->>'requirements',coalesce(input->'qualification','{}'::jsonb))
  on conflict(company_id) do update set current_vehicles=excluded.current_vehicles,potential_vehicles=excluded.potential_vehicles,timeline=excluded.timeline,requirements=excluded.requirements,qualification=case when input ? 'qualification' then excluded.qualification else public.fleet_profiles.qualification end;
  return cid;
end $$;



commit;
