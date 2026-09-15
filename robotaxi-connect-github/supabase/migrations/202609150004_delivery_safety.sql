begin;
alter table public.email_logs add column retryable boolean not null default true;
create or replace function public.claim_email_batch(batch_size integer default 10) returns setof public.email_logs language plpgsql security definer set search_path = '' as $$
begin
  -- Resend idempotency keys expire after 24h. Ambiguous older attempts need reconciliation.
  update public.email_logs set status='FAILED',retryable=false,error_code='DELIVERY_RECONCILIATION_REQUIRED',locked_until=null,lock_token=null
    where status in ('QUEUED','PROCESSING','FAILED') and retryable and attempt_count>0 and created_at < now()-interval '23 hours' and (locked_until is null or locked_until < now());
  return query update public.email_logs e set status='PROCESSING',locked_until=now()+interval '5 minutes',lock_token=gen_random_uuid(),attempt_count=attempt_count+1
  where e.id in (select q.id from public.email_logs q where q.retryable and ((q.status in ('QUEUED','FAILED') and q.available_at <= now()) or (q.status='PROCESSING' and q.locked_until < now())) and q.attempt_count < 8 order by q.created_at for update skip locked limit least(greatest(batch_size,1),25)) returning e.*;
end $$;
create or replace function public.finish_email_attempt(log_id uuid, token uuid, attempt_id uuid, message_id text default null, failure text default null) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.email_logs set status=case when failure is null then 'SENT' else 'FAILED' end,external_message_id=message_id,error_code=left(failure,100),locked_until=null,lock_token=null,
    retryable=not (coalesce(failure,'') ~ '^EMAIL_HTTP_4' and failure <> 'EMAIL_HTTP_429'),
    available_at=now()+make_interval(secs=>least(3600,(power(2,attempt_count)*30)::integer)) where id=log_id and lock_token=token;
  if not found then raise exception 'STALE_LEASE'; end if;
  update public.email_attempts set status=case when failure is null then 'SENT' else 'FAILED' end,external_message_id=message_id,error_code=left(failure,100),completed_at=now() where id=attempt_id and email_log_id=log_id;
end $$;
commit;
