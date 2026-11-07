import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRunFromText } from './runOcr.ts';

test('parseRunFromText: distance and h:mm:ss time from a typical running app screen', () => {
  const lines = ['Outdoor Run', '5.02', 'KM', 'Time', '00:31:45', 'Avg Pace', '6:20 /km'];
  assert.deepEqual(parseRunFromText(lines), { km: 5.02, minutes: 32 });
});

test('parseRunFromText: Hebrew units and a decimal comma', () => {
  assert.deepEqual(parseRunFromText(['מרחק', '8,35 ק"מ', 'משך', '47:10']), { km: 8.35, minutes: 47 });
  assert.equal(parseRunFromText(['10.0 ק״מ']).km, 10);
  assert.equal(parseRunFromText(['3 קילומטר']).km, 3);
});

test('parseRunFromText: the number and its unit on separate lines are joined', () => {
  assert.equal(parseRunFromText(['12.4', 'km']).km, 12.4);
});

test('parseRunFromText: miles become kilometres', () => {
  assert.equal(parseRunFromText(['3.11 mi']).km, 5.01);
});

test('parseRunFromText: a pace is not a time, and the phone clock is not a time when a real duration is there', () => {
  assert.deepEqual(parseRunFromText(['10:24', '5.0 km', '5:30 /km', '27:30']), { km: 5, minutes: 28 });
  assert.equal(parseRunFromText(['5:12 min/km', '5.0 km']).minutes, undefined);
});

test('parseRunFromText: a time with words (1h 5m, 45 min)', () => {
  assert.equal(parseRunFromText(['1h 5m']).minutes, 65);
  assert.equal(parseRunFromText(['45 min']).minutes, 45);
  assert.equal(parseRunFromText(['1:05:00']).minutes, 65);
});

test('parseRunFromText: nothing readable gives nothing; absurd numbers are ignored', () => {
  assert.deepEqual(parseRunFromText([]), {});
  assert.deepEqual(parseRunFromText(['hello world']), {});
  assert.equal(parseRunFromText(['250 km']).km, undefined);
});

test('parseRunFromText: a distance written under its label without a unit (the label says what it is)', () => {
  assert.equal(parseRunFromText(['Distance', '5.20']).km, 5.2);
  assert.equal(parseRunFromText(['מרחק', '8,4']).km, 8.4);
  assert.equal(parseRunFromText(['Distance 3.5']).km, 3.5);
  assert.equal(parseRunFromText(['Calories', '392']).km, undefined);
});

test('parseRunFromText: a clock the reader split with spaces or dots ("00 42 15", "1.05.30") is still a duration', () => {
  assert.deepEqual(parseRunFromText(['5.20 km', '00 42 15']), { km: 5.2, minutes: 42 });
  assert.deepEqual(parseRunFromText(['10.0 km', '1.05.30']), { km: 10, minutes: 66 });
});

test('parseRunFromText: letters the reader mistook for digits inside a clock or a distance are fixed', () => {
  assert.deepEqual(parseRunFromText(['5.2O km', '4O:15']), { km: 5.2, minutes: 40 });
});

test('parseRunFromText: garbage text gives nothing', () => {
  assert.deepEqual(parseRunFromText(['HO 00 00 11 TOП', 'e e o bob e e e e v bAL D E VIULIU HSINIS Z9:60 26']), {});
});

test('parseRunFromText: calories after their unit, after their label, in Hebrew, and absurd ones are ignored', () => {
  assert.equal(parseRunFromText(['5.02 km', '00:31:45', '392 kcal']).kcal, 392);
  assert.equal(parseRunFromText(['Active Calories 126', '2.4 km']).kcal, 126);
  assert.equal(parseRunFromText(['קלוריות: 210', '4 ק"מ']).kcal, 210);
  assert.equal(parseRunFromText(['350 קלוריות']).kcal, 350);
  assert.equal(parseRunFromText(['9999 kcal']).kcal, undefined);
  assert.equal(parseRunFromText(['5 km', '30:00']).kcal, undefined);
});

test('parseRunFromText: a word that merely ends in cal is not calories', () => {
  assert.equal(parseRunFromText(['Local 5 km', 'Medical 30:00']).kcal, undefined);
});
