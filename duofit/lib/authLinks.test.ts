import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmationLinkMessage, describeAuthLink, invalidLinkExits, parseAuthLink, recoveryLinkMessage, validateNewPassword } from './authLinks.ts';

const HAS_HEBREW = /[\u0590-\u05FF]/;
const NO_LATIN_WORDS = (text: string) => !/[A-Za-z]{3,}/.test(text);

test('parseAuthLink: a recovery link with tokens in the fragment (the app deep link and the web page)', () => {
  const fragment = '#access_token=AAA.bbb.ccc&refresh_token=rrr123&expires_in=3600&token_type=bearer&type=recovery';
  for (const base of ['duofit://reset-password', 'https://duofit.example/reset-password', 'exp://192.168.1.5:8081/--/reset-password']) {
    assert.deepEqual(parseAuthLink(base + fragment), { kind: 'session', accessToken: 'AAA.bbb.ccc', refreshToken: 'rrr123', type: 'recovery' }, base);
  }
});

test('parseAuthLink: a one-time code in the query (the other Supabase flow)', () => {
  assert.deepEqual(parseAuthLink('duofit://reset-password?code=abc-123_XYZ'), { kind: 'code', code: 'abc-123_XYZ' });
});

test('parseAuthLink: errors from Supabase, in the fragment or in the query, and whether the link expired', () => {
  const expired = parseAuthLink('duofit://reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
  assert.deepEqual(expired, { kind: 'error', code: 'otp_expired', expired: true });
  const other = parseAuthLink('https://x.example/reset-password?error=server_error&error_code=unexpected_failure');
  assert.deepEqual(other, { kind: 'error', code: 'unexpected_failure', expired: false });
  const noCode = parseAuthLink('duofit://reset-password#error=access_denied');
  assert.deepEqual(noCode, { kind: 'error', code: null, expired: false });
  // either signal alone is enough to say "expired"
  assert.equal((parseAuthLink('duofit://r#error=access_denied&error_code=otp_expired') as { expired: boolean }).expired, true, 'by code');
  assert.equal((parseAuthLink('duofit://r#error=access_denied&error_description=Token+has+Expired') as { expired: boolean }).expired, true, 'by description');
  assert.equal((parseAuthLink('duofit://r#error=access_denied&error_code=other&error_description=Something+else') as { expired: boolean }).expired, false);
});

test('parseAuthLink: an error wins over tokens, tokens win over a code', () => {
  assert.equal(parseAuthLink('duofit://r#error=x&access_token=a&refresh_token=b').kind, 'error');
  assert.equal(parseAuthLink('duofit://r?code=c#access_token=a&refresh_token=b').kind, 'session');
});

test('parseAuthLink: anything incomplete or unrelated is "none" and never throws', () => {
  for (const url of [undefined, null, '', '   ', 'duofit://reset-password', 'not a url', 'duofit://reset-password#access_token=a', 'duofit://reset-password#refresh_token=b', 'duofit://reset-password?code=', 'duofit://reset-password#', '#access_token=a&refresh_token=']) {
    assert.deepEqual(parseAuthLink(url as any), { kind: 'none' }, String(url));
  }
  assert.deepEqual(parseAuthLink(42 as any), { kind: 'none' });
});

test('parseAuthLink: percent-encoded values are decoded', () => {
  const link = parseAuthLink('duofit://r#access_token=a%2Bb%3Dc&refresh_token=r%20x&type=recovery');
  assert.deepEqual(link, { kind: 'session', accessToken: 'a+b=c', refreshToken: 'r x', type: 'recovery' });
});

test('recoveryLinkMessage: plain Hebrew for every bad link, nothing for a good one, no raw server text', () => {
  const expired = recoveryLinkMessage({ kind: 'error', code: 'otp_expired', expired: true });
  const broken = recoveryLinkMessage({ kind: 'error', code: 'unexpected_failure', expired: false });
  const none = recoveryLinkMessage({ kind: 'none' });
  assert.match(expired, /פג תוקף/);
  assert.notEqual(expired, broken);
  for (const text of [expired, broken, none]) { assert.match(text, HAS_HEBREW); assert.ok(NO_LATIN_WORDS(text), text); assert.match(text, /קישור/); }
  assert.equal(recoveryLinkMessage({ kind: 'session', accessToken: 'a', refreshToken: 'b', type: 'recovery' }), '');
  assert.equal(recoveryLinkMessage({ kind: 'code', code: 'c' }), '');
});

test('confirmationLinkMessage: sign-up links get their own plain Hebrew, never the password-reset wording', () => {
  const expired = confirmationLinkMessage({ kind: 'error', code: 'otp_expired', expired: true });
  const broken = confirmationLinkMessage({ kind: 'error', code: 'unexpected_failure', expired: false });
  const none = confirmationLinkMessage({ kind: 'none' });
  assert.match(expired, /פג תוקף/);
  assert.notEqual(expired, broken);
  for (const text of [expired, broken, none]) {
    assert.match(text, HAS_HEBREW);
    assert.ok(NO_LATIN_WORDS(text), text);
    assert.doesNotMatch(text, /איפוס|סיסמה חדשה/, 'not the reset wording');
    assert.match(text, /התחבר/, 'tells the member what to do next');
  }
  assert.equal(confirmationLinkMessage({ kind: 'session', accessToken: 'a', refreshToken: 'b', type: 'signup' }), '');
  assert.equal(confirmationLinkMessage({ kind: 'code', code: 'c' }), '');
});

test('validateNewPassword: Hebrew message for each mistake, null when fine', () => {
  assert.match(validateNewPassword('', '')!, /הזן סיסמה/);
  assert.match(validateNewPassword('short7!', 'short7!')!, /8/);
  assert.match(validateNewPassword('long-enough-1', 'long-enough-2')!, /זהות/);
  assert.match(validateNewPassword('        ', '        ')!, /רווחים/);
  assert.equal(validateNewPassword('long-enough-1', 'long-enough-1'), null);
  assert.equal(validateNewPassword('12345678', '12345678'), null, 'exactly the minimum length is fine');
  assert.equal(validateNewPassword('אבגדהוזחט', 'אבגדהוזחט'), null, 'any characters count');
});
test('invalidLinkExits: a signed-in member only gets a way back into the app (sign-in and forgot-password are closed to them)', () => {
  for (const flow of ['reset', 'confirm'] as const) {
    assert.deepEqual(invalidLinkExits(true, flow), [{ label: 'חזרה לאפליקציה', href: '/' }], flow);
  }
});

test('invalidLinkExits: a signed-out member gets the way to a new link and to sign-in', () => {
  assert.deepEqual(invalidLinkExits(false, 'reset'), [
    { label: 'בקש קישור חדש', href: '/forgot-password' },
    { label: 'חזרה להתחברות', href: '/login' },
  ]);
  assert.deepEqual(invalidLinkExits(false, 'confirm'), [{ label: 'להתחברות', href: '/login' }]);
});

test('describeAuthLink: shows the shape of a link for the developer log and never a secret value', () => {
  const url = 'exp://10.0.0.14.nip.io:8081/--/reset-password#access_token=SECRETTOKEN123&refresh_token=SECRETREFRESH&type=recovery&expires_in=3600';
  const text = describeAuthLink(url);
  assert.doesNotMatch(text, /SECRET/);
  assert.match(text, /reset-password/);
  assert.match(text, /access_token/);
  assert.match(text, /hash/);
  assert.match(text, /type=recovery/);
});

test('describeAuthLink: no link, and a link without any fragment, are both described plainly', () => {
  assert.match(describeAuthLink(null), /no link/);
  assert.match(describeAuthLink('exp://10.0.0.14.nip.io:8081/--/reset-password'), /no fragment/);
  assert.doesNotMatch(describeAuthLink('exp://h/--/x?code=SECRETCODE'), /SECRETCODE/);
});
