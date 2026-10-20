-- Server side of the content filter (App Store guideline 1.2), the same rules as duofit/lib/contentFilter.ts, so it
-- also holds for anyone who talks to the API directly. APPLIED to the `duofit` Supabase project on 2026-10-20 after the owner
-- approved the word list (issue #125). In the applied copy the invisible-character class of the regular expression is written with
-- \u escapes (E'[\u0591-\u05C7...]') so that no invisible character has to be copied by hand; it is the same set of characters.
-- Test (rolled back; every line good after applying): supabase/tests/server_content_filter_test.sql.
-- The list below must stay equal to BLOCKED_TERMS in lib/contentFilter.ts (a test checks it).
--
-- Rules: whole words only, after lower-casing, removing vowel marks and zero-width characters, mapping Hebrew final
-- letters to the normal ones, collapsing repeated letters, joining a run of three or more single letters
-- ("w.h.o.r.e"), and trying a word again without up to two Hebrew prefix letters (ה ו ב כ ל מ ש).
-- A blocked text is rejected with the error text 'content_not_allowed'. Existing rows are not touched; on update only
-- a column that actually changed is checked.
--
-- Everything lives in the non-exposed `private` schema. The word table has row-level security on and no policy, so
-- no API role can read it. The functions are security definer with search_path = '' (they must read that table),
-- and execute is revoked from public, anon and authenticated; a trigger needs no execute privilege to fire.

create schema if not exists private;

create table if not exists private.blocked_terms (
  term text primary key check (term = lower(term) and char_length(btrim(term)) between 2 and 60)
);
alter table private.blocked_terms enable row level security;
revoke all on private.blocked_terms from public, anon, authenticated;

insert into private.blocked_terms (term) values
  ('בן זונה'), ('בת זונה'), ('זונה'), ('זונות'), ('שרמוטה'), ('שרמוטות'), ('כוס אמק'), ('כוס אמא שלך'), ('לך תמות'), ('תמות כבר'),
  ('מפגר'), ('מפגרת'), ('מפגרים'), ('ערבוש'), ('ערבושים'), ('כושי'), ('כושים'),
  ('whore'), ('whores'), ('slut'), ('sluts'), ('cunt'), ('cunts'), ('nigger'), ('niggers'), ('nigga'), ('faggot'), ('faggots'), ('retard'), ('retards'),
  ('kys'), ('kill yourself'), ('kill your self'), ('nudes'), ('send nudes')
on conflict (term) do nothing;

-- Hebrew final letters to the normal ones, then repeated letters collapsed ("whooore" -> "whore").
create or replace function private.filter_simplify(w text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(translate(w, 'ךםןףץ', 'כמנפצ'), '(.)\1+', '\1', 'g');
$$;

-- The word itself, then the word with up to two Hebrew prefix letters removed (only while more than 3 letters remain).
create or replace function private.filter_forms(token text)
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  forms text[] := array[token];
  rest text := token;
  i int;
begin
  for i in 1..2 loop
    if char_length(rest) > 3 and position(substr(rest, 1, 1) in 'הובכלמש') > 0 then
      rest := substr(rest, 2);
      forms := forms || rest;
    else
      exit;
    end if;
  end loop;
  return forms;
end;
$$;

create or replace function private.contains_blocked_term(input text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  base text;
  raw text[];
  toks text[] := '{}';
  n int;
  i int;
  j int;
  m int;
  s int;
  k int;
  term record;
  words text[];
  matched boolean;
begin
  if input is null or btrim(input) = '' then
    return false;
  end if;

  base := lower(normalize(input, nfkc));
  base := regexp_replace(base, '[֑-ׇ​-‏‪-‮⁠﻿]', '', 'g');
  raw := array_remove(regexp_split_to_array(base, '[^a-z0-9א-ת]+'), '');
  n := coalesce(array_length(raw, 1), 0);

  -- Join a run of three or more single letters ("w.h.o.r.e", "ש-ר-מ-ו-ט-ה") into one word.
  i := 1;
  while i <= n loop
    j := i;
    while j <= n and char_length(raw[j]) = 1 loop
      j := j + 1;
    end loop;
    if j - i >= 3 then
      toks := toks || (select string_agg(x, '') from unnest(raw[i:j - 1]) as x);
      i := j;
    else
      toks := toks || raw[i];
      i := i + 1;
    end if;
  end loop;

  toks := array(select private.filter_simplify(x) from unnest(toks) with ordinality as t(x, ord) order by ord);
  m := coalesce(array_length(toks, 1), 0);
  if m = 0 then
    return false;
  end if;

  for term in select t.term from private.blocked_terms t loop
    words := string_to_array(private.filter_simplify(term.term), ' ');
    for s in 1..m loop
      matched := words[1] = any (private.filter_forms(toks[s]));
      k := 2;
      while matched and k <= array_length(words, 1) loop
        matched := s + k - 1 <= m and toks[s + k - 1] = words[k];
        k := k + 1;
      end loop;
      if matched then
        return true;
      end if;
    end loop;
  end loop;
  return false;
end;
$$;

-- Trigger: reject a blocked text in the columns named as trigger arguments.
create or replace function private.reject_blocked_text()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  col text;
  newval text;
  oldval text;
begin
  foreach col in array tg_argv loop
    newval := to_jsonb(new) ->> col;
    oldval := case when tg_op = 'UPDATE' then to_jsonb(old) ->> col else null end;
    if tg_op = 'INSERT' or newval is distinct from oldval then
      if private.contains_blocked_term(newval) then
        raise exception 'content_not_allowed' using errcode = 'P0001';
      end if;
    end if;
  end loop;
  return new;
end;
$$;

revoke execute on function private.filter_simplify(text) from public, anon, authenticated;
revoke execute on function private.filter_forms(text) from public, anon, authenticated;
revoke execute on function private.contains_blocked_term(text) from public, anon, authenticated;
revoke execute on function private.reject_blocked_text() from public, anon, authenticated;

drop trigger if exists filter_blocked_text on public.posts;
create trigger filter_blocked_text before insert or update on public.posts
  for each row execute function private.reject_blocked_text('body');

drop trigger if exists filter_blocked_text on public.comments;
create trigger filter_blocked_text before insert or update on public.comments
  for each row execute function private.reject_blocked_text('body');

drop trigger if exists filter_blocked_text on public.messages;
create trigger filter_blocked_text before insert or update on public.messages
  for each row execute function private.reject_blocked_text('body');

drop trigger if exists filter_blocked_text on public.group_messages;
create trigger filter_blocked_text before insert or update on public.group_messages
  for each row execute function private.reject_blocked_text('body');

drop trigger if exists filter_blocked_text on public.groups;
create trigger filter_blocked_text before insert or update on public.groups
  for each row execute function private.reject_blocked_text('name');

drop trigger if exists filter_blocked_text on public.profiles;
create trigger filter_blocked_text before insert or update on public.profiles
  for each row execute function private.reject_blocked_text('display_name', 'bio');
