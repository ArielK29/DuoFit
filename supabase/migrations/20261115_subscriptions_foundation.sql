-- DRAFT 2026-11-15, NOT APPLIED. Apply only after the owner says yes (then save as applied, see CLAUDE.md "Before merging any database change").
-- Subscriptions foundation (docs/superpowers/plans/2026-11-15-subscriptions-foundation.md):
--   1. public.subscriptions: the member's paid tier. Written ONLY by the revenuecat-webhook Edge Function (service role); a member can read their own row.
--   2. private helpers: tier_of(uid) and invite_limit(tier).
--   3. trigger: a limit of NEW INVITATIONS per rolling 7 days by tier (free 5, plus 40, pro 70). Chat messages are not counted.
-- SAFE TO APPLY BEFORE THE NEW BUILD: the limit is behind a switch (public.app_flags, key invite_cap_enabled) that is OFF, so applying changes nothing for
-- the current testers. Turn it ON only when the paywall build is out:
--   update public.app_flags set enabled = true where key = 'invite_cap_enabled';
-- KEEP the numbers in sync with duofit/lib/entitlements.ts (TIER_LIMITS).

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. subscriptions
-- ---------------------------------------------------------------------------------------------------------------------
create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier text not null,
  product_id text not null,
  -- trial: free trial; active: paid; grace: billing problem, Apple still retrying; cancelled: will not renew, valid until expires_at
  status text not null default 'active',
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint subscriptions_tier_check check (tier in ('plus', 'pro')),
  constraint subscriptions_status_check check (status in ('trial', 'active', 'grace', 'cancelled')),
  constraint subscriptions_product_length check (char_length(product_id) between 1 and 200)
);

alter table public.subscriptions enable row level security;

-- Start from nothing, then give a member only the right to READ their own row. No insert/update/delete from the app, ever:
-- otherwise a member could write themselves a Pro row.
revoke all on table public.subscriptions from anon, authenticated;
grant select on table public.subscriptions to authenticated;

create policy subscriptions_select_own on public.subscriptions
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. Helpers (private schema, not exposed through the API; only the trigger below calls them)
-- ---------------------------------------------------------------------------------------------------------------------
-- The tier of a member right now: a valid (not expired) paid row, otherwise free.
create function private.tier_of(uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select s.tier from public.subscriptions s where s.user_id = uid and s.expires_at > now()),
    'free'
  );
$$;
revoke execute on function private.tier_of(uuid) from public, anon, authenticated;

-- New invitations allowed in a rolling 7 days.
create function private.invite_limit(tier text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case tier when 'pro' then 70 when 'plus' then 40 else 5 end;
$$;
revoke execute on function private.invite_limit(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- 3. Weekly cap for new invitations
-- ---------------------------------------------------------------------------------------------------------------------
-- public.app_flags already exists (identity migration, applied 2026-11-01).
insert into public.app_flags (key, enabled) values ('invite_cap_enabled', false)
on conflict (key) do nothing;

create index messages_invites_sender_created_idx
  on public.messages (sender_id, created_at desc)
  where kind = 'invite';

create function private.messages_invite_weekly_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lim integer;
  used integer;
begin
  if new.kind is distinct from 'invite' then
    return new;
  end if;
  if not coalesce((select f.enabled from public.app_flags f where f.key = 'invite_cap_enabled'), false) then
    return new;
  end if;

  lim := private.invite_limit(private.tier_of(new.sender_id));
  select count(*) into used
  from public.messages m
  where m.sender_id = new.sender_id and m.kind = 'invite' and m.created_at > now() - interval '7 days';

  if used >= lim then
    raise exception 'invite limit reached' using errcode = 'P0001', hint = lim::text;
  end if;
  return new;
end;
$$;
revoke execute on function private.messages_invite_weekly_cap() from public, anon, authenticated;

create trigger messages_invite_weekly_cap
  before insert on public.messages
  for each row execute function private.messages_invite_weekly_cap();
