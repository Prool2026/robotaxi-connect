begin;
-- Non-sensitive marker checked by the web app before any Auth or business request.
create function public.robotaxi_identity() returns text language sql immutable set search_path = '' as $$ select 'robotaxi-connect/v1'::text $$;
revoke execute on function public.robotaxi_identity() from public;
grant execute on function public.robotaxi_identity() to anon,authenticated,service_role;

create function public.add_company_member(cid uuid, member_email text) returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid; c public.companies; lang text;
begin
  perform private.require_admin(); perform private.throttle('member',30,3600);
  select p.id,p.locale into uid,lang from public.profiles p join auth.users u on u.id=p.id where lower(u.email)=lower(trim(member_email)) and u.email_confirmed_at is not null and p.deactivated_at is null and p.role='COMPANY_USER';
  if uid is null then raise exception 'USER_NOT_AVAILABLE'; end if;
  select * into c from public.companies where id=cid and status <> 'ARCHIVED';
  if not found then raise exception 'NOT_FOUND'; end if;
  insert into public.company_members(company_id,user_id) values(cid,uid);
  if c.approved_at is not null then perform private.enqueue(cid,member_email,'account_approved',lang,'{}','member-approved:' || cid || ':' || uid); end if;
end $$;
revoke execute on function public.add_company_member(uuid,text) from public,anon;
grant execute on function public.add_company_member(uuid,text) to authenticated;
commit;
