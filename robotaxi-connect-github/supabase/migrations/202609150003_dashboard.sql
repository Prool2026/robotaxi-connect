begin;
create function public.admin_dashboard() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_admin();
  return jsonb_build_object(
    'total',(select count(*) from public.companies),
    'new',(select count(*) from public.companies where created_at > now()-interval '30 days'),
    'pending',(select count(*) from public.companies where approved_at is null and status <> 'ARCHIVED'),
    'qualified',(select count(*) from public.companies where status in ('QUALIFIED','INTERESTED','LOI','REFERRED','OFFER','CUSTOMER')),
    'potential',(select coalesce(sum(f.potential_vehicles),0) from public.fleet_profiles f join public.companies c on c.id=f.company_id where c.status <> 'ARCHIVED'),
    'active_referrals',(select count(*) from public.referrals where status in ('SENT','RECEIVED','IN_DISCUSSION','OFFER')),
    'won',(select count(*) from public.referrals where status='WON'),
    'open_contracts',(select count(*) from public.contracts where status in ('DRAFT','SENT')),
    'pipeline',(select coalesce(jsonb_object_agg(currency,total),'{}') from (select t.currency,sum(t.commission_fixed) total from public.referral_terms t join public.referrals r on r.id=t.referral_id where r.status in ('SENT','RECEIVED','IN_DISCUSSION','OFFER') group by t.currency) s),
    'statuses',(select coalesce(jsonb_object_agg(status,total),'{}') from (select status,count(*) total from public.referrals group by status) s)
  );
end $$;
revoke execute on function public.admin_dashboard() from public,anon;
grant execute on function public.admin_dashboard() to authenticated;
commit;
