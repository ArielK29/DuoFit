-- Applied to the `duofit` Supabase project on 2026-10-05 (avatars_select_policy_and_function_privileges).
-- Storage upsert (replacing an existing avatar) needs INSERT + SELECT + UPDATE on storage.objects.
-- The app uploads avatars with upsert: true, so add the missing SELECT policy (own folder only).
create policy avatars_owner_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- handle_new_user is a SECURITY DEFINER trigger function in an exposed schema; nobody should be able to call it through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
