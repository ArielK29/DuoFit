import test from 'node:test';
import assert from 'node:assert/strict';
import { birthProblem, INTRO_SLIDES } from './signupFlow.ts';

const on = new Date(2026, 10, 3);

test('birthProblem: a real adult date has no problem', () => {
  assert.equal(birthProblem('15', '6', '1990', on), null);
  assert.equal(birthProblem('3', '11', '2008', on), null); // turns 18 today
});

test('birthProblem: empty or impossible dates ask for a real date', () => {
  assert.equal(birthProblem('', '', '', on), 'הזן תאריך לידה תקין: יום, חודש ושנה');
  assert.equal(birthProblem('31', '2', '1990', on), 'הזן תאריך לידה תקין: יום, חודש ושנה');
  assert.equal(birthProblem('1', '1', '1800', on), 'הזן תאריך לידה תקין: יום, חודש ושנה');
});

test('birthProblem: under 18 is told kindly and clearly, one day before the birthday still counts as under 18', () => {
  assert.equal(birthProblem('4', '11', '2008', on), 'האפליקציה מיועדת לבני 18 ומעלה בלבד');
  assert.equal(birthProblem('1', '1', '2012', on), 'האפליקציה מיועדת לבני 18 ומעלה בלבד');
});

test('INTRO_SLIDES: three short slides, each with a title and one line', () => {
  assert.equal(INTRO_SLIDES.length, 3);
  for (const slide of INTRO_SLIDES) {
    assert.ok(slide.title.length >= 4 && slide.title.length <= 40, slide.title);
    assert.ok(slide.text.length >= 10 && slide.text.length <= 120, slide.text);
  }
});
