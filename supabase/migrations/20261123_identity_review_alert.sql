-- E-mail alert to the reviewers when an identity check arrives (plan: docs/IDENTITY-REVIEW-ARMY-PLAN.md, stage 1).
--
-- When a member's check becomes `pending` (new check, or a new video after a rejection or a new photo), a trigger notes it in
-- `identity_alerts` and asks the Edge Function `notify-identity` to mail the reviewers ONE message ("N checks are waiting").
-- The mail has no names, no video and no file link. The call is asynchronous (pg_net) and wrapped so a failure here can never make
-- the member's check fail. `notified_at` marks alerts that were mailed (set by the function with the service role).
--
-- Nobody signed in (member or admin) can read or write `identity_alerts`: no grants, and an explicit deny policy. Only the trigger
-- (security definer) and the service role touch it.

create table public.identity_alerts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);
alter table public.identity_alerts enable row level security;
revoke all on table public.identity_alerts from anon;
revoke all on table public.identity_alerts from authenticated;
create policy identity_alerts_none on public.identity_alerts for select to authenticated using (false);
create index identity_alerts_unnotified_idx on public.identity_alerts (created_at) where notified_at is null;

create extension if not exists pg_net with schema extensions;

create function private.identity_checks_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending'
     and (tg_op = 'INSERT' or old.status is distinct from 'pending' or new.submitted_at is distinct from old.submitted_at) then
    begin
      insert into public.identity_alerts (user_id) values (new.user_id)
      on conflict (user_id) do update set created_at = now(), notified_at = null;
      perform net.http_post(
        url := 'https://wtheyjuqpidgrgehplgw.supabase.co/functions/v1/notify-identity',
        body := '{}'::jsonb,
        headers := jsonb_build_object('Content-Type', 'application/json'),
        timeout_milliseconds := 5000
      );
    exception when others then
      null;
    end;
  end if;
  return new;
end;
$$;

revoke execute on function private.identity_checks_alert() from public, anon, authenticated;

create trigger identity_checks_alert_after after insert or update on public.identity_checks
  for each row execute function private.identity_checks_alert();
