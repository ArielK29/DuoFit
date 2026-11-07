-- Support requests: a member sends a request about anything in the app (a bug, the account, safety, a suggestion);
-- the owner (an admin from app_admins) reads and handles it. Not a chat: one message, a status, an optional note.
--
-- Rules (CLAUDE.md "Database, Permissions & RLS"):
--  * RLS on, explicit policies `to authenticated`, nothing for anon.
--  * A member inserts only topic, message and app_version (column grants); the owner, the time and the status are set by the
--    server (defaults) and cannot be forged. A member reads only his own requests.
--  * An admin reads all and may change only status and admin_note; handled_at is stamped by a trigger.
--  * Length limits on the text, at most 5 requests per member per 24 hours (trigger).
--  * A request disappears with the account (on delete cascade), so the delete-account function needs no change.

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic text not null check (topic in ('bug', 'account', 'safety', 'suggestion', 'other')),
  message text not null check (char_length(btrim(message)) between 10 and 2000),
  app_version text check (app_version is null or char_length(app_version) <= 32),
  status text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

create index support_requests_user_created_idx on public.support_requests (user_id, created_at desc);
create index support_requests_status_created_idx on public.support_requests (status, created_at desc);

alter table public.support_requests enable row level security;

revoke all on table public.support_requests from public;
revoke all on table public.support_requests from anon;
revoke all on table public.support_requests from authenticated;
grant select on table public.support_requests to authenticated;
grant insert (topic, message, app_version) on table public.support_requests to authenticated;
grant update (status, admin_note) on table public.support_requests to authenticated;

-- A member sees his own requests; an admin sees all of them.
create policy support_requests_select on public.support_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- user_id comes from the default (auth.uid()); the check makes sure nobody files a request in another name.
create policy support_requests_insert_own on public.support_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'new' and admin_note is null and handled_at is null);

-- Only an admin changes a request (status and note, by the column grant).
create policy support_requests_update_admin on public.support_requests
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create function private.support_requests_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  recent int;
begin
  if tg_op = 'INSERT' then
    select count(*) into recent
    from public.support_requests
    where user_id = new.user_id and created_at > now() - interval '24 hours';
    if recent >= 5 then
      raise exception 'support_rate_limit';
    end if;
    new.message := btrim(new.message);
  else
    -- The time the request was handled follows its status.
    if new.status = 'done' and old.status <> 'done' then
      new.handled_at := now();
    elsif new.status <> 'done' then
      new.handled_at := null;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function private.support_requests_guard() from public, anon, authenticated;

create trigger support_requests_guard_insert
  before insert on public.support_requests
  for each row execute function private.support_requests_guard();

create trigger support_requests_guard_update
  before update on public.support_requests
  for each row execute function private.support_requests_guard();
