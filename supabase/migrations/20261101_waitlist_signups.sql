-- Applied to the `duofit` Supabase project on 2026-11-01 (waitlist_signups).
-- Public waitlist for the landing page (/welcome). Visitors (anon, or a signed-in member) may only INSERT an e-mail;
-- nobody can read, change or delete rows through the API. The owner reads the list from the dashboard / service role.
-- Known limit: anyone can submit any address, so there is no proof the address belongs to the sender and no rate limit yet.
-- If spam appears, put the insert behind an Edge Function with a captcha.
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint waitlist_signups_email_format check (
    email = lower(email)
    and char_length(email) between 5 and 254
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  )
);

create unique index waitlist_signups_email_key on public.waitlist_signups (email);

alter table public.waitlist_signups enable row level security;

-- Start from nothing, then grant only what the form needs: insert of the email column.
revoke all on table public.waitlist_signups from anon, authenticated;
grant insert (email) on table public.waitlist_signups to anon, authenticated;

create policy waitlist_signups_insert on public.waitlist_signups
  for insert to anon, authenticated
  with check (char_length(email) <= 254);
