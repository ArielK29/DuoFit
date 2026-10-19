import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BLOCKED_TERMS } from './contentFilter.ts';

// The server filter (supabase/migrations/20261018_server_content_filter.sql) must block exactly what the app blocks.
const sql = fs.readFileSync(new URL('../../supabase/migrations/20261018_server_content_filter.sql', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

function serverTerms(): string[] {
  const start = sql.indexOf('insert into private.blocked_terms');
  const end = sql.indexOf('on conflict', start);
  assert.ok(start >= 0 && end > start, 'the insert is in the migration');
  return [...sql.slice(start, end).matchAll(/\('([^']+)'\)/g)].map((m) => m[1]);
}

test('the server word list equals the app word list', () => {
  const server = serverTerms();
  assert.deepEqual([...server].sort(), [...BLOCKED_TERMS].sort());
  assert.equal(new Set(server).size, server.length, 'no duplicates');
});

test('every term is lower case and within the table limits (2 to 60 characters)', () => {
  for (const term of BLOCKED_TERMS) {
    assert.equal(term, term.toLowerCase(), term);
    assert.ok(term.length >= 2 && term.length <= 60, term);
  }
});

test('the migration keeps the safety rules: row-level security on the list, no API role can run the functions, definer functions have an empty search path', () => {
  assert.match(sql, /alter table private\.blocked_terms enable row level security/);
  assert.match(sql, /revoke all on private\.blocked_terms from public, anon, authenticated/);
  for (const fn of ['filter_simplify(text)', 'filter_forms(text)', 'contains_blocked_term(text)', 'reject_blocked_text()']) {
    assert.ok(sql.includes(`revoke execute on function private.${fn} from public, anon, authenticated`), fn);
  }
  const definers = sql.split('security definer').length - 1;
  const emptyPaths = sql.split("set search_path = ''").length - 1;
  assert.ok(definers >= 2 && emptyPaths >= definers, 'every function sets an empty search path');
  assert.doesNotMatch(sql, /grant .* to (anon|authenticated|public)/i);
});
