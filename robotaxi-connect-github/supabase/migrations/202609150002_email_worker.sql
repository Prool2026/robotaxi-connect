begin;
-- Worker-only RPCs. Leasing is atomic across multiple Railway worker processes.
create function public.claim_email_batch(batch_size integer default 10) returns setof public.email_logs language plpgsql security definer set search_path = '' as $$
begin
  return query
  update public.email_logs e set status='PROCESSING',locked_until=now()+interval '5 minutes',lock_token=gen_random_uuid(),attempt_count=attempt_count+1
  where e.id in (
    select q.id from public.email_logs q where ((q.status in ('QUEUED','FAILED') and q.available_at <= now()) or (q.status='PROCESSING' and q.locked_until < now())) and q.attempt_count < 8
    order by q.created_at for update skip locked limit least(greatest(batch_size,1),25)
  ) returning e.*;
end $$;
create function public.start_email_attempt(log_id uuid, token uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare rid uuid;
begin
  insert into public.email_attempts(email_log_id,attempt_number,status)
  select id,attempt_count,'STARTED' from public.email_logs where id=log_id and lock_token=token and status='PROCESSING' and locked_until > now() returning id into rid;
  if rid is null then raise exception 'STALE_LEASE'; end if;
  return rid;
end $$;
create function public.finish_email_attempt(log_id uuid, token uuid, attempt_id uuid, message_id text default null, failure text default null) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.email_logs set status=case when failure is null then 'SENT' else 'FAILED' end,external_message_id=message_id,error_code=left(failure,100),locked_until=null,lock_token=null,
    available_at=now()+make_interval(secs=>least(3600,(power(2,attempt_count)*30)::integer)) where id=log_id and lock_token=token;
  if not found then raise exception 'STALE_LEASE'; end if;
  update public.email_attempts set status=case when failure is null then 'SENT' else 'FAILED' end,external_message_id=message_id,error_code=left(failure,100),completed_at=now() where id=attempt_id and email_log_id=log_id;
end $$;
revoke execute on function public.claim_email_batch(integer),public.start_email_attempt(uuid,uuid),public.finish_email_attempt(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_email_batch(integer),public.start_email_attempt(uuid,uuid),public.finish_email_attempt(uuid,uuid,uuid,text,text) to service_role;
-- Service role can operate the queue; no browser or web-request service client exists.
grant all on public.email_logs,public.email_attempts to service_role;
commit;
