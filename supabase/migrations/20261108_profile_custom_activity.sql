-- A member can write a sport of his own on the profile (besides the list), up to 30 characters: the app limits each one to 30,
-- the database limits the whole list so the text can never grow (CLAUDE.md rule 9), and the same blocked-words filter that
-- guards the name and the bio now guards the sports too.

alter table public.profiles
  add constraint profiles_favorite_activities_length check (char_length(array_to_string(favorite_activities, ',')) <= 640);

drop trigger filter_blocked_text on public.profiles;
create trigger filter_blocked_text
  before insert or update on public.profiles
  for each row execute function private.reject_blocked_text('display_name', 'bio', 'favorite_activities');
