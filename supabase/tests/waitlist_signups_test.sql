-- Waitlist test. Run with the Supabase MCP execute_sql after any change to public.waitlist_signups.
-- Everything runs in one transaction and ends with an exception, so nothing is kept.
-- Expected: every line says "(good)" or matches its "expect" value. Any "BAD" = fix before merging.
do $$
declare
  res text := '';
  n int;
begin
  set local role anon;

  begin
    insert into public.waitlist_signups (email) values ('waitlist-test@example.invalid');
    res := res || '1 anon inserts a valid e-mail: ok (good)' || E'\n';
  exception when others then
    res := res || '1 anon inserts a valid e-mail: BLOCKED (BAD) ' || sqlerrm || E'\n';
  end;

  begin
    insert into public.waitlist_signups (email) values ('waitlist-test@example.invalid');
    res := res || '2 duplicate e-mail: ALLOWED (BAD)' || E'\n';
  exception when unique_violation then
    res := res || '2 duplicate e-mail: rejected (good)' || E'\n';
  end;

  begin
    insert into public.waitlist_signups (email) values ('not-an-email');
    res := res || '3 bad format: ALLOWED (BAD)' || E'\n';
  exception when check_violation then
    res := res || '3 bad format: rejected (good)' || E'\n';
  end;

  begin
    insert into public.waitlist_signups (email) values ('UPPER@Example.invalid');
    res := res || '4 upper case: ALLOWED (BAD)' || E'\n';
  exception when check_violation then
    res := res || '4 upper case: rejected (good)' || E'\n';
  end;

  begin
    insert into public.waitlist_signups (email) values (repeat('a', 250) || '@b.co');
    res := res || '5 255+ characters: ALLOWED (BAD)' || E'\n';
  exception when check_violation or insufficient_privilege then
    res := res || '5 255+ characters: rejected (good)' || E'\n';
  end;

  begin
    perform 1 from public.waitlist_signups limit 1;
    res := res || '6 anon reads the list: ALLOWED (BAD)' || E'\n';
  exception when insufficient_privilege then
    res := res || '6 anon reads the list: denied (good)' || E'\n';
  end;

  begin
    update public.waitlist_signups set email = 'x@y.zz';
    res := res || '7 anon updates: ALLOWED (BAD)' || E'\n';
  exception when insufficient_privilege then
    res := res || '7 anon updates: denied (good)' || E'\n';
  end;

  begin
    delete from public.waitlist_signups;
    res := res || '8 anon deletes: ALLOWED (BAD)' || E'\n';
  exception when insufficient_privilege then
    res := res || '8 anon deletes: denied (good)' || E'\n';
  end;

  begin
    insert into public.waitlist_signups (id, email) values (gen_random_uuid(), 'other@example.invalid');
    res := res || '9 anon sets its own id/created_at columns: ALLOWED (BAD)' || E'\n';
  exception when insufficient_privilege then
    res := res || '9 anon sets columns other than email: denied (good)' || E'\n';
  end;

  reset role;
  select count(*) into n from public.waitlist_signups where email = 'waitlist-test@example.invalid';
  res := res || '10 rows stored for the test e-mail (expect 1): ' || n || E'\n';

  raise exception E'\n%', res;
end $$;
