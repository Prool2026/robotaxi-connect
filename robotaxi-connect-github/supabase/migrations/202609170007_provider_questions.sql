begin;
do $$ begin if public.robotaxi_identity()<>'robotaxi-connect/v1' then raise exception 'WRONG_PROJECT'; end if; end $$;
alter table public.provider_accounts add column qualification jsonb not null default '{}'::jsonb check(jsonb_typeof(qualification)='object' and octet_length(qualification::text)<=100000);
create or replace function public.save_provider_account(input jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=auth.uid() and p.role='PROVIDER_USER' and p.deactivated_at is null and u.email_confirmed_at is not null) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  perform private.throttle('provider_profile',30,3600);
  if input ? 'qualification' then
    if jsonb_typeof(input->'qualification') is distinct from 'object' then raise exception 'INVALID_INPUT'; end if;
    if exists(select 1 from jsonb_each(input->'qualification') e where jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2500 or e.key not in ('use_cases','vehicles','requirements','training_support','availability_approvals','partnership')) then raise exception 'INVALID_INPUT'; end if;
  end if;
  if length(trim(coalesce(input->>'company_name',''))) < 2 or coalesce(input->>'email','') not like '%@%' then raise exception 'INVALID_INPUT'; end if;
  insert into public.provider_accounts(user_id,company_name,email,phone,address,website,solution,markets,qualification)
  values(auth.uid(),trim(input->>'company_name'),trim(input->>'email'),coalesce(input->>'phone',''),coalesce(input->>'address',''),coalesce(input->>'website',''),coalesce(input->>'solution',''),coalesce(input->>'markets',''),coalesce(input->'qualification','{}'::jsonb))
  on conflict(user_id) do update set company_name=excluded.company_name,email=excluded.email,phone=excluded.phone,address=excluded.address,website=excluded.website,solution=excluded.solution,markets=excluded.markets,qualification=excluded.qualification,updated_at=now();
end $$;
commit;
