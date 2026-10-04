-- Applied to the `duofit` Supabase project on 2026-10-04 (harden_profiles_and_avatars).
-- Defense in depth on top of RLS (profiles keeps its three own-row policies).
-- 1. Signed-out visitors (anon) never need to touch profiles.
revoke all on table public.profiles from anon;
-- 2. RLS does not cover TRUNCATE / REFERENCES / TRIGGER, so remove them from signed-in users too.
revoke truncate, references, trigger on table public.profiles from authenticated;

-- 3. Input limits so nobody can store huge values through the API.
alter table public.profiles add constraint profiles_display_name_len check (char_length(display_name) between 1 and 60);
alter table public.profiles add constraint profiles_bio_len check (bio is null or char_length(bio) <= 500);
alter table public.profiles add constraint profiles_activities_len check (cardinality(favorite_activities) <= 20);

-- Keep sign-up working when the email prefix is longer than the new name limit.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)), 60)
  );
  return new;
end;
$$;

-- 4. Avatar uploads: images only, max 5 MB (the app always uploads a JPEG).
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';
