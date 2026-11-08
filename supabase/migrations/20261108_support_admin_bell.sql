-- A new support request also rings the bell of every admin inside the app (the e-mail is sent by the same trigger, see
-- 20261107_support_notify_email.sql). Uses the existing private.notify(), which also ignores a notification to oneself (an
-- admin who files a test request himself gets no bell) and limits unread notifications of the same kind from the same member.

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('invite_received', 'invite_accepted', 'invite_declined', 'workout_cancelled', 'post_comment', 'support_request'));

create or replace function private.support_requests_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_id uuid;
  topic_label text;
begin
  -- 1. The e-mail (asynchronous, through the edge function).
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

  -- 2. The bell inside the app, for every admin.
  begin
    topic_label := case new.topic
      when 'bug' then 'תקלה באפליקציה'
      when 'account' then 'החשבון שלי'
      when 'safety' then 'בטיחות ודיווח'
      when 'suggestion' then 'הצעה לשיפור'
      else 'משהו אחר'
    end;
    for admin_id in select user_id from public.app_admins loop
      perform private.notify(admin_id, 'support_request', new.user_id, new.id, topic_label);
    end loop;
  exception when others then
    null;
  end;
  return new;
end;
$$;

revoke execute on function private.support_requests_notify() from public, anon, authenticated;
