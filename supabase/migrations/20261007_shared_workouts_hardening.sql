-- Applied to the `duofit` Supabase project on 2026-10-07 (shared_workouts_hardening).
-- Review findings for the shared workouts:
--  * an invitation must start between 1 hour ago and 90 days ahead (no `infinity`, no "now" tricks that
--    make the check-in window meaningless, no dates that break the partner's screen);
--  * workouts for invitations accepted BEFORE the workouts table existed are created once (last 30 days).

create or replace function public.messages_validate_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  starts timestamptz;
begin
  if new.kind = 'invite' then
    if (new.invite ->> 'status') is distinct from 'pending' then
      raise exception 'a new invitation must be pending';
    end if;
    if coalesce(length(new.invite ->> 'activity'), 0) not between 1 and 100
       or coalesce(length(new.invite ->> 'location'), 0) not between 1 and 100 then
      raise exception 'invitation activity and location must be 1-100 characters';
    end if;
    begin
      starts := (new.invite ->> 'scheduledAt')::timestamptz;
    exception when others then
      raise exception 'invitation scheduledAt is not a valid date';
    end;
    if starts < now() - interval '1 hour' or starts > now() + interval '90 days' then
      raise exception 'invitation must start between 1 hour ago and 90 days ahead';
    end if;
    if octet_length(new.invite::text) > 1000 then
      raise exception 'invitation is too large';
    end if;
  end if;

  if (select count(*) from public.messages m
      where m.sender_id = new.sender_id and m.created_at > now() - interval '1 minute') >= 30 then
    raise exception 'too many messages, slow down';
  end if;

  if not exists (select 1 from public.messages m
                 where m.conversation_id = new.conversation_id and m.sender_id <> new.sender_id)
     and (select count(*) from public.messages m
          where m.conversation_id = new.conversation_id and m.sender_id = new.sender_id) >= 10 then
    raise exception 'wait for a reply before sending more messages';
  end if;

  return new;
end;
$$;

-- One-time backfill (own work as the table owner; the trigger only fires for NEW acceptances).
insert into public.workouts (id, host_id, guest_id, activity, location, scheduled_at)
select m.id,
       m.sender_id,
       case when c.user_a = m.sender_id then c.user_b else c.user_a end,
       m.invite ->> 'activity',
       m.invite ->> 'location',
       (m.invite ->> 'scheduledAt')::timestamptz
from public.messages m
join public.conversations c on c.id = m.conversation_id
where m.kind = 'invite'
  and m.invite ->> 'status' = 'accepted'
  and (m.invite ->> 'scheduledAt')::timestamptz > now() - interval '30 days'
  and (m.invite ->> 'scheduledAt')::timestamptz < now() + interval '90 days'
on conflict (id) do nothing;
