import test from 'node:test';
import assert from 'node:assert/strict';
import { ageOn, isAdult, parseBirthDate, formatBirthDate, pickGesture, pickChallengeCode, GESTURES, canUseApp, parseVerificationStatus } from './identity.ts';

const today = new Date(2026, 9, 29); // 29 Oct 2026 (month is 0-based)

test('ageOn: counts whole years and only counts the birthday on the day itself', () => {
  assert.equal(ageOn(new Date(2008, 9, 29), today), 18); // 18th birthday is today
  assert.equal(ageOn(new Date(2008, 9, 30), today), 17); // turns 18 tomorrow
  assert.equal(ageOn(new Date(1990, 0, 1), today), 36);
});

test('isAdult: exactly 18 today is allowed, one day short is not', () => {
  assert.equal(isAdult(new Date(2008, 9, 29), today), true);
  assert.equal(isAdult(new Date(2008, 9, 30), today), false);
});

test('isAdult: a birth date in the future is never an adult', () => {
  assert.equal(isAdult(new Date(2027, 0, 1), today), false);
});

test('isAdult: leap-day birthdays are adults on 1 March of the 18th year when the year has no 29 Feb', () => {
  const born = new Date(2008, 1, 29); // 29 Feb 2008
  assert.equal(isAdult(born, new Date(2026, 1, 28)), false);
  assert.equal(isAdult(born, new Date(2026, 2, 1)), true);
});

test('parseBirthDate: accepts a real date as day, month, year and rejects impossible or implausible ones', () => {
  assert.deepEqual(parseBirthDate('29', '10', '1990'), new Date(1990, 9, 29));
  assert.equal(parseBirthDate('31', '2', '1990'), null); // no 31 Feb
  assert.equal(parseBirthDate('0', '5', '1990'), null);
  assert.equal(parseBirthDate('5', '13', '1990'), null);
  assert.equal(parseBirthDate('5', '5', '1890'), null); // older than 120 years
  assert.equal(parseBirthDate('', '5', '1990'), null);
  assert.equal(parseBirthDate('ab', '5', '1990'), null);
});

test('formatBirthDate: yyyy-mm-dd with zero padding, as the database stores it', () => {
  assert.equal(formatBirthDate(new Date(1990, 0, 5)), '1990-01-05');
});

test('pickGesture: always one of the known gestures, and the random source picks the index', () => {
  assert.ok(GESTURES.length >= 4);
  assert.equal(pickGesture(() => 0), GESTURES[0]);
  assert.equal(pickGesture(() => 0.999999), GESTURES[GESTURES.length - 1]);
  const ids = new Set(GESTURES.map((g) => g.id));
  assert.equal(ids.size, GESTURES.length); // ids are unique
});

test('parseVerificationStatus: unknown values fall back to none so nobody is let in by accident', () => {
  assert.equal(parseVerificationStatus('approved'), 'approved');
  assert.equal(parseVerificationStatus('pending'), 'pending');
  assert.equal(parseVerificationStatus('rejected'), 'rejected');
  assert.equal(parseVerificationStatus('whatever'), 'none');
  assert.equal(parseVerificationStatus(null), 'none');
  assert.equal(parseVerificationStatus(undefined), 'none');
});

test('canUseApp: only an approved member gets in; pending, rejected and none stay at the gate', () => {
  assert.equal(canUseApp('approved'), true);
  assert.equal(canUseApp('pending'), false);
  assert.equal(canUseApp('rejected'), false);
  assert.equal(canUseApp('none'), false);
});

test('pickChallengeCode: always exactly three digits, never starting with 0, and follows the random source', () => {
  assert.equal(pickChallengeCode(() => 0), '100');
  assert.equal(pickChallengeCode(() => 0.999999), '999');
  for (let i = 0; i < 200; i++) assert.match(pickChallengeCode(), /^[1-9][0-9]{2}$/);
});
