-- Applied to the `duofit` Supabase project on 2026-10-07 (chat_conversations_messages).
-- 1:1 chat between members (issue #65, stage 2). Group chats and the shared workouts
-- table come in later stages. Workout invitations travel as a special message kind.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- The pair is stored in a fixed order so one pair has exactly one conversation.
  constraint conversations_pair_ordered check (user_a < user_b),
  constraint conversations_pair_unique unique (user_a, user_b)
);
create index conversations_user_b_idx on public.conversations (user_b);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('text', 'invite')),
  body text check (char_length(body) between 1 and 2000),
  -- {"activity": "...", "location": "...", "scheduledAt": "ISO", "status": "pending|accepted|declined"}
  invite jsonb check (jsonb_typeof(invite) = 'object'),
  created_at timestamptz not null default now(),
  constraint messages_shape check (
    (kind = 'text' and body is not null and invite is null)
    or (kind = 'invite' and invite is not null and body is null)
  )
);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index messages_sender_idx on public.messages (sender_id);

create table public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_reads_user_idx on public.conversation_reads (user_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_reads enable row level security;

-- Least privilege: no anon access, no TRUNCATE/REFERENCES/TRIGGER, only the verbs each table needs.
revoke all on public.conversations, public.messages, public.conversation_reads from anon;
revoke all on public.conversations, public.messages, public.conversation_reads from authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant update (invite) on public.messages to authenticated;   -- only to answer an invitation
grant select, insert, update on public.conversation_reads to authenticated;

-- conversations: only the two members; you can only create a conversation you are part of.
create policy conversations_select_members on public.conversations
  for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));
create policy conversations_insert_member on public.conversations
  for insert to authenticated
  with check ((select auth.uid()) in (user_a, user_b));

-- messages: members read; members write as themselves; only the OTHER member answers an invitation.
create policy messages_select_members on public.messages
  for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id and (select auth.uid()) in (c.user_a, c.user_b)
  ));
create policy messages_insert_member on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and (select auth.uid()) in (c.user_a, c.user_b)
    )
  );
create policy messages_update_invite_by_recipient on public.messages
  for update to authenticated
  using (
    kind = 'invite'
    and sender_id <> (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and (select auth.uid()) in (c.user_a, c.user_b)
    )
  )
  with check (
    kind = 'invite'
    and sender_id <> (select auth.uid())
  );

-- The recipient may only flip the invitation status (pending -> accepted/declined), nothing else.
create function public.messages_guard_invite_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.conversation_id is distinct from old.conversation_id
     or new.sender_id is distinct from old.sender_id
     or new.kind is distinct from old.kind
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'only the invitation status can change';
  end if;
  if (new.invite - 'status') is distinct from (old.invite - 'status') then
    raise exception 'only the invitation status can change';
  end if;
  if old.invite ->> 'status' is distinct from 'pending'
     or new.invite ->> 'status' not in ('accepted', 'declined') then
    raise exception 'an invitation can only be answered once (accepted or declined)';
  end if;
  return new;
end;
$$;
revoke execute on function public.messages_guard_invite_update() from public, anon, authenticated;
create trigger messages_guard_invite_update
  before update on public.messages
  for each row execute function public.messages_guard_invite_update();

-- read markers: own rows, and only in conversations you belong to.
create policy conversation_reads_select_own on public.conversation_reads
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy conversation_reads_insert_own on public.conversation_reads
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_reads.conversation_id and (select auth.uid()) in (c.user_a, c.user_b)
    )
  );
create policy conversation_reads_update_own on public.conversation_reads
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Live delivery: new messages are pushed to the members through Supabase Realtime (which respects RLS).
alter publication supabase_realtime add table public.messages;
