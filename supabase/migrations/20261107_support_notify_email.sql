-- E-mail to the owner for every new support request.
--
-- After a request is inserted, a trigger asks the Edge Function `notify-support` (supabase/functions/notify-support) to mail
-- everything that was not mailed yet. The call is asynchronous (pg_net) and wrapped so that a failure here can never make
-- the member's request fail. `notified_at` marks the requests that were mailed (the function sets it; members cannot,
-- because they have no update grant on the table).

alter table public.support_requests add column notified_at timestamptz;

create extension if not exists pg_net with schema extensions;

create function private.support_requests_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    perform net.http_post(
      url := 'https://wtheyjuqpidgrgehplgw.supabase.co/functions/v1/notify-support',
      body := jsonb_build_object('id', new.id),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      timeout_milliseconds := 5000
    );
  exception when others then
    null;
  end;
  return new;
end;
$$;

revoke execute on function private.support_requests_notify() from public, anon, authenticated;

create trigger support_requests_notify_insert
  after insert on public.support_requests
  for each row execute function private.support_requests_notify();
