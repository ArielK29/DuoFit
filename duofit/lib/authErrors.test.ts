import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage } from './authErrors.ts';

test('authErrorMessage: the same-password error from a reset is its own clear message, not "weak password"', () => {
  const sameByCode = authErrorMessage({ code: 'same_password', message: 'New password should be different from the old password.' });
  const sameByText = authErrorMessage({ message: 'New password should be different from the old password.' });
  assert.match(sameByCode, /שונה/);
  assert.equal(sameByText, sameByCode);
  assert.notEqual(sameByCode, authErrorMessage({ code: 'weak_password', message: 'Password should be at least 8 characters.' }));
});

test('authErrorMessage: a session that ended while resetting asks for a new link', () => {
  assert.match(authErrorMessage({ message: 'Auth session missing!' }), /קישור/);
  assert.match(authErrorMessage({ code: 'session_not_found', message: 'Session from session_id claim in JWT does not exist' }), /קישור/);
});

test('authErrorMessage: known cases keep working and nothing leaks in English', () => {
  assert.equal(authErrorMessage({ message: 'Invalid login credentials' }), 'אימייל או סיסמה שגויים');
  assert.match(authErrorMessage({ code: 'weak_password', message: 'Password should be at least 8 characters.' }), /8/);
  for (const e of [null, undefined, { message: 'boom' }, { message: 'Auth session missing!' }]) {
    assert.ok(!/[A-Za-z]{3,}/.test(authErrorMessage(e as any)), String(e));
  }
});
