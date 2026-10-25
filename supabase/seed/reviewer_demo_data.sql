-- Sample data for the App Review accounts (checklist A9b). NOT a migration: run it by hand, once, in the Supabase SQL Editor
-- (or ask Claude to run it) AFTER the two accounts exist. It never creates accounts and never contains a password.
--
-- Before running, replace the two placeholders below with the e-mail addresses of YOUR two accounts, both made by you in the app:
--   __REVIEWER_EMAIL__   the account whose login goes into the App Store Connect "Sign-in information" field
--   __COMPANION_EMAIL__  a second account you own ("FriendFit team"), so the reviewer sees a real second member, a chat and a shared workout
-- (Real members only: no invented people. Both accounts are yours and are described as such in the review notes.)
--
-- What it fills: both profiles (complete, so each finds the other in Discover), a chat with two messages and a workout invitation
-- that is already accepted (so a shared workout exists), one community post from each, the weight log, the weekly goal and the
-- plank record for the reviewer. Safe to read first; it stops with a clear message if anything is missing or already seeded.
do $seed$
declare
  reviewer_email text := '__REVIEWER_EMAIL__';
  companion_email text := '__COMPANION_EMAIL__';
  r uuid;
  c uuid;
  a uuid;   -- ordered pair: user_a < user_b (the chat table requires it)
  b uuid;
  conv uuid;
  inv uuid := gen_random_uuid();
  this_week date := date_trunc('week', now())::date;
begin
  if reviewer_email like '\_\_%' or companion_email like '\_\_%' then
    raise exception 'Replace __REVIEWER_EMAIL__ and __COMPANION_EMAIL__ with the two e-mail addresses first.';
  end if;
  select id into r from auth.users where lower(email) = lower(reviewer_email);
  select id into c from auth.users where lower(email) = lower(companion_email);
  if r is null or c is null then
    raise exception 'One of the two accounts does not exist yet (reviewer found: %, companion found: %). Create it in the app first.', r is not null, c is not null;
  end if;
  if r = c then raise exception 'The two addresses must be two different accounts.'; end if;
  if exists (select 1 from public.conversations where (user_a = r and user_b = c) or (user_a = c and user_b = r)) then
    raise exception 'These two accounts already have a chat: the data was seeded before. Nothing was changed.';
  end if;

  -- 1. Complete profiles (a profile is "complete", and so findable in Discover, with gender, level and at least one activity)
  update public.profiles set display_name = 'מבחן App Review', bio = 'חשבון בדיקה עבור סוקרי Apple.', gender = 'F',
         fitness_level = 'Intermediate', favorite_activities = array['ריצה', 'כוח']
   where id = r;
  update public.profiles set display_name = 'צוות FriendFit', bio = 'חשבון של צוות FriendFit, כדי שתוכלו לנסות שיחה והזמנה לאימון.', gender = 'M',
         fitness_level = 'Intermediate', favorite_activities = array['ריצה', 'כוח', 'רכיבה']
   where id = c;

  -- 2. A chat, with two messages and an accepted workout invitation (the same path the app takes: pending, then accepted)
  if r < c then a := r; b := c; else a := c; b := r; end if;
  insert into public.conversations (user_a, user_b) values (a, b) returning id into conv;
  insert into public.messages (conversation_id, sender_id, kind, body, created_at)
    values (conv, c, 'text', 'היי! ברוכים הבאים ל-FriendFit. רוצים לנסות לקבוע אימון?', now() - interval '2 hours'),
           (conv, r, 'text', 'שלום, נשמע מצוין. מתי נוח?', now() - interval '90 minutes');
  insert into public.messages (id, conversation_id, sender_id, kind, invite, created_at)
    values (inv, conv, c, 'invite',
            jsonb_build_object('activity', 'ריצה', 'location', 'פארק הירקון', 'scheduledAt', (now() + interval '2 days')::text, 'status', 'pending'),
            now() - interval '1 hour');
  update public.messages set invite = jsonb_set(invite, '{status}', '"accepted"') where id = inv;

  -- 3. One community post from each
  insert into public.posts (user_id, activity, body, created_at)
    values (c, 'ריצה', 'ריצת בוקר קלה לפני העבודה. מי מצטרף בסוף השבוע?', now() - interval '5 hours'),
           (r, 'כוח', 'אימון כוח קצר בבית. מרגישים מעולה אחרי.', now() - interval '3 hours');

  -- 4. Progress of the reviewer: weekly goal, weight log (four weigh-ins), plank record and this week's plank time
  insert into public.progress_settings (user_id, weekly_goal, goal_weight_kg, plank_best_seconds)
    values (r, 3, 62.0, 90)
    on conflict (user_id) do update set weekly_goal = excluded.weekly_goal, goal_weight_kg = excluded.goal_weight_kg, plank_best_seconds = excluded.plank_best_seconds;
  insert into public.weight_entries (user_id, kg, logged_at)
    values (r, 66.4, now() - interval '21 days'), (r, 65.8, now() - interval '14 days'), (r, 65.1, now() - interval '7 days'), (r, 64.6, now() - interval '1 day');
  insert into public.plank_weekly (user_id, week_start, seconds)
    values (r, this_week, 90)
    on conflict (user_id, week_start) do update set seconds = excluded.seconds;

  raise notice 'Done. Reviewer %, companion %, chat %, shared workout from invitation %.', r, c, conv, inv;
end;
$seed$;
