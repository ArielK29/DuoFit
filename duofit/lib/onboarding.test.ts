import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addCustomActivity,
  customActivities, MAX_ACTIVITIES, PROFILE_ACTIVITIES, PROFILE_STEPS, stepProblem, toggleActivity } from './onboarding.ts';

test('PROFILE_STEPS: three steps, each asks one thing: gender, sports, level', () => {
  assert.deepEqual(PROFILE_STEPS, ['gender', 'activities', 'level']);
});

test('PROFILE_ACTIVITIES: a good list of sports, no duplicates, the old names still there', () => {
  assert.ok(PROFILE_ACTIVITIES.length >= 14);
  assert.equal(new Set(PROFILE_ACTIVITIES).size, PROFILE_ACTIVITIES.length);
  for (const name of ['ריצה', 'כושר גופני', 'יוגה', 'רכיבה על אופניים', 'שחייה', 'כדורגל', 'כוח', 'קליסטניקס', 'כדורסל']) {
    assert.ok(PROFILE_ACTIVITIES.includes(name), name);
  }
  assert.ok(PROFILE_ACTIVITIES.every((name) => name.length >= 2 && name.length <= 30));
});

test('toggleActivity: adds, removes, and stops at the maximum of five', () => {
  assert.deepEqual(toggleActivity(['ריצה'], 'יוגה'), ['ריצה', 'יוגה']);
  assert.deepEqual(toggleActivity(['ריצה', 'יוגה'], 'ריצה'), ['יוגה']);
  const full = ['א1', 'א2', 'א3', 'א4', 'א5'];
  assert.equal(MAX_ACTIVITIES, 5);
  assert.deepEqual(toggleActivity(full, 'חדש'), full);
  assert.deepEqual(toggleActivity(full, 'א3'), ['א1', 'א2', 'א4', 'א5']);
});

test('stepProblem: says what is missing on the current step, nothing when it is fine', () => {
  const empty = { gender: null, activities: [] as string[], fitnessLevel: null };
  assert.equal(stepProblem('gender', empty), 'בחר מגדר');
  assert.equal(stepProblem('gender', { ...empty, gender: 'M' }), null);
  assert.equal(stepProblem('activities', empty), 'בחר לפחות ספורט אחד');
  assert.equal(stepProblem('activities', { ...empty, activities: ['ריצה'] }), null);
  assert.equal(stepProblem('level', empty), 'בחר את הרמה שלך');
  assert.equal(stepProblem('level', { ...empty, fitnessLevel: 'Beginner' }), null);
});

test('addCustomActivity: a sport of his own is added, trimmed, within the limits', () => {
  assert.deepEqual(addCustomActivity(['ריצה'], '  סקווש  '), { activities: ['ריצה', 'סקווש'] });
  assert.deepEqual(addCustomActivity([], 'Muay  Thai'), { activities: ['Muay Thai'] });
  assert.ok('problem' in addCustomActivity([], 'א'));
  assert.ok('problem' in addCustomActivity([], 'x'.repeat(31)));
  assert.ok('problem' in addCustomActivity([], '<script>'));
  assert.ok('problem' in addCustomActivity(['סקווש'], 'סקווש'));
  assert.ok('problem' in addCustomActivity(['ריצה', 'כוח', 'יוגה', 'שחייה', 'כדורגל'], 'סקווש'));
});

test('customActivities: only the sports that are not on the list', () => {
  assert.deepEqual(customActivities(['ריצה', 'סקווש', 'כוח']), ['סקווש']);
  assert.deepEqual(customActivities([]), []);
});
