-- Read-only aggregate numbers for the Mission Control analyst agent (ORACLE). Not applied yet.
-- One function that returns only counts (no rows, no names, no locations, no ids), so an agent never needs
-- to run free-form SQL against production to answer "how many invitations / acceptances / shared workouts".
--  * Lives in the non-exposed `private` schema, so the API (PostgREST) cannot call it.
--  * security invoker, search_path = '', execute revoked from public, anon and authenticated: only the owner
--    role (the Supabase MCP / SQL editor) can run it.
-- Invitation windows use the day the invitation was SENT (not the day it was answered).
-- "Both checked in" counts a workout once both members checked in; its window is the later check-in.

create schema if not exists private;

create or replace function private.agent_metrics_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'generated_at', now(),
    'members_total', (select count(*) from public.profiles),
    'invites_sent', jsonb_build_object(
      'total',    (select count(*) from public.messages where kind = 'invite'),
      'last_24h', (select count(*) from public.messages where kind = 'invite' and created_at >= now() - interval '1 day'),
      'last_7d',  (select count(*) from public.messages where kind = 'invite' and created_at >= now() - interval '7 days')
    ),
    'invites_accepted', jsonb_build_object(
      'total',    (select count(*) from public.messages where kind = 'invite' and invite ->> 'status' = 'accepted'),
      'last_24h', (select count(*) from public.messages where kind = 'invite' and invite ->> 'status' = 'accepted' and created_at >= now() - interval '1 day'),
      'last_7d',  (select count(*) from public.messages where kind = 'invite' and invite ->> 'status' = 'accepted' and created_at >= now() - interval '7 days')
    ),
    'invites_declined', jsonb_build_object(
      'total',    (select count(*) from public.messages where kind = 'invite' and invite ->> 'status' = 'declined'),
      'last_24h', (select count(*) from public.messages where kind = 'invite' and invite ->> 'status' = 'declined' and created_at >= now() - interval '1 day'),
      'last_7d',  (select count(*) from public.messages where kind = 'invite' and invite ->> 'status' = 'declined' and created_at >= now() - interval '7 days')
    ),
    'workouts_cancelled_total', (select count(*) from public.workouts where cancelled_at is not null),
    'workouts_both_checked_in', jsonb_build_object(
      'total',    (select count(*) from public.workouts
                    where cancelled_at is null and host_checked_in_at is not null and guest_checked_in_at is not null),
      'last_24h', (select count(*) from public.workouts
                    where cancelled_at is null and host_checked_in_at is not null and guest_checked_in_at is not null
                      and greatest(host_checked_in_at, guest_checked_in_at) >= now() - interval '1 day'),
      'last_7d',  (select count(*) from public.workouts
                    where cancelled_at is null and host_checked_in_at is not null and guest_checked_in_at is not null
                      and greatest(host_checked_in_at, guest_checked_in_at) >= now() - interval '7 days')
    )
  );
$$;

revoke execute on function private.agent_metrics_summary() from public, anon, authenticated;
