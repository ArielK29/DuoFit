import test from 'node:test';
import assert from 'node:assert/strict';
import { checkText, BLOCKED_MESSAGE } from './contentFilter.ts';

const blocked = (text: string) => checkText(text).ok === false;
const allowed = (text: string) => checkText(text).ok === true;

test('ordinary training talk is allowed, in Hebrew and English', () => {
  for (const text of [
    'מתאים לי 💪', 'בוא נקבע לריצה מחר בשש', 'איפה נפגשים? בפארק הירקון', 'אני מאחר/ת 10 דקות', 'תודה!',
    'רוצה למצוא שותף לאימוני כוח', 'Let us meet at the gym at 7', 'great workout today', '', '   ',
  ]) assert.equal(allowed(text), true, text);
});

test('clearly abusive words are blocked, whatever the case, punctuation or repeated letters', () => {
  for (const text of ['you are a whore', 'WHORE', 'w.h.o.r.e', 'whooore', 'w h o r e', 'what a cunt', 'kill yourself', 'KYS']) {
    assert.equal(blocked(text), true, text);
  }
  for (const text of ['בן זונה', 'אתה בן זונה!', 'שרמוטה', 'ש-ר-מ-ו-ט-ה', 'שרמוטההה', 'לך תמות', 'מפגר']) {
    assert.equal(blocked(text), true, text);
  }
});

test('Hebrew prefixes and vowel marks do not hide a word', () => {
  assert.equal(blocked('הזונה'), true, 'the-whore');
  assert.equal(blocked('וזונה'), true);
  assert.equal(blocked('והזונה'), true, 'two prefixes: and-the-whore');
  assert.equal(blocked('מפגרימ'), true, 'a final letter written as a normal one');
  assert.equal(blocked('כושים'), true);
  assert.equal(blocked('שָׁרְמוּטָה'), true, 'with niqqud');
  assert.equal(blocked('ש​רמוטה'), true, 'zero-width space inside the word');
});

test('words that merely contain a blocked word, and neutral words, are not blocked', () => {
  for (const text of ['מפגש', 'הומו', 'לסבית', 'אנטי-תמותה', 'classic', 'Scunthorpe', 'cuntry side', 'assess', 'shitake mushrooms', 'ערבית', 'כושר', 'כושרים']) {
    assert.equal(allowed(text), true, text);
  }
});

test('the result says why in plain Hebrew and never repeats the word back', () => {
  const result = checkText('you whore');
  assert.equal(result.ok, false);
  assert.match(BLOCKED_MESSAGE, /[֐-׿]/);
  assert.doesNotMatch(BLOCKED_MESSAGE, /whore/i);
  assert.equal((result as { message: string }).message, BLOCKED_MESSAGE);
});

test('long texts are checked too, and a blocked word anywhere blocks the whole text', () => {
  const long = `${'מילה '.repeat(500)}שרמוטה${' עוד'.repeat(100)}`;
  assert.equal(blocked(long), true);
  assert.equal(allowed('מילה '.repeat(2000)), true);
});

test('non-strings never throw', () => {
  assert.equal(allowed(undefined as unknown as string), true);
  assert.equal(allowed(null as unknown as string), true);
});
