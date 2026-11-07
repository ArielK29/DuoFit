import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAppVersion, supportErrorMessage, supportMessageProblem, supportStatusLabel, supportTopicLabel, SUPPORT_TOPICS } from './support.ts';

test('supportMessageProblem: empty, too short, fine and too long', () => {
  assert.ok(supportMessageProblem('   '));
  assert.ok(supportMessageProblem('קצר'));
  assert.equal(supportMessageProblem('הצעדים לא זזים במסך הבית'), null);
  assert.equal(supportMessageProblem('x'.repeat(2000)), null);
  assert.ok(supportMessageProblem('x'.repeat(2001)));
});

test('supportMessageProblem: spaces around the text do not count', () => {
  assert.ok(supportMessageProblem('   קצר   '));
  assert.equal(supportMessageProblem('   הצעדים לא זזים   '), null);
});

test('supportTopicLabel and supportStatusLabel: every known value has a Hebrew name, unknown ones fall back', () => {
  for (const topic of SUPPORT_TOPICS) assert.ok(supportTopicLabel(topic.key).length > 0);
  assert.equal(supportTopicLabel('weird'), 'משהו אחר');
  assert.equal(supportStatusLabel('new'), 'התקבלה');
  assert.equal(supportStatusLabel('in_progress'), 'בטיפול');
  assert.equal(supportStatusLabel('done'), 'טופלה');
  assert.equal(supportStatusLabel('weird'), 'התקבלה');
});

test('supportErrorMessage: the daily limit, no connection, anything else', () => {
  assert.match(supportErrorMessage({ message: 'support_rate_limit' }), /5 פניות ביום/);
  assert.match(supportErrorMessage(new Error('Network request failed')), /חיבור/);
  assert.match(supportErrorMessage(null), /לא הצלחנו/);
});

test('formatAppVersion: version with build, version alone, nothing, and the 32 character limit', () => {
  assert.equal(formatAppVersion('1.0.1', '34'), '1.0.1 (34)');
  assert.equal(formatAppVersion('1.0.1', null), '1.0.1');
  assert.equal(formatAppVersion(null, '34'), null);
  assert.equal(formatAppVersion('1'.repeat(40), '1')?.length, 32);
});
