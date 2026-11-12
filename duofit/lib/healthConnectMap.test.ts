import test from 'node:test';
import assert from 'node:assert/strict';
import { fullWeekRanges, isRunningType, runningSessions, sessionToRun, weekDayRanges } from './healthConnectMap.ts';

test('isRunningType: running and treadmill running count, walking and cycling do not', () => {
  assert.equal(isRunningType(56), true);
  assert.equal(isRunningType(57), true);
  assert.equal(isRunningType(79), false); // walking
  assert.equal(isRunningType(8), false); // biking
});

test('weekDayRanges: Wednesday gives Sunday to Wednesday, each day midnight to midnight, today ends at "now"', () => {
  const now = new Date(2026, 10, 11, 15, 30); // Wednesday 11 Nov 2026
  const ranges = weekDayRanges(now);
  assert.equal(ranges.length, 4);
  assert.equal(ranges[0].start.getDay(), 0);
  assert.equal(ranges[0].start.getDate(), 8);
  assert.equal(ranges[0].end.getTime(), ranges[1].start.getTime());
  assert.equal(ranges[3].end.getTime(), now.getTime());
});

test('weekDayRanges: on Sunday only today, from midnight to now (and never an end before the start)', () => {
  const now = new Date(2026, 10, 8, 0, 0, 5);
  const ranges = weekDayRanges(now);
  assert.equal(ranges.length, 1);
  assert.ok(ranges[0].end.getTime() > ranges[0].start.getTime());
});

test('fullWeekRanges: seven consecutive local days', () => {
  const ranges = fullWeekRanges(new Date(2026, 10, 1));
  assert.equal(ranges.length, 7);
  for (let i = 1; i < 7; i += 1) assert.equal(ranges[i].start.getTime(), ranges[i - 1].end.getTime());
});

test('fullWeekRanges: the day the clocks change is still one calendar day (no lost or doubled hour)', () => {
  // 25 Oct 2026 is the end of summer time in Israel and Europe.
  const ranges = fullWeekRanges(new Date(2026, 9, 25));
  for (const range of ranges) {
    assert.equal(range.end.getDate() === range.start.getDate() + 1 || range.end.getDate() === 1, true);
  }
});

test('runningSessions: keeps only runs, newest first, and respects the limit', () => {
  const sessions = [
    { startTime: '2026-11-01T06:00:00Z', endTime: '2026-11-01T06:30:00Z', exerciseType: 56 },
    { startTime: '2026-11-03T06:00:00Z', endTime: '2026-11-03T06:30:00Z', exerciseType: 79 },
    { startTime: '2026-11-05T06:00:00Z', endTime: '2026-11-05T06:40:00Z', exerciseType: 57 },
    { startTime: '2026-11-04T06:00:00Z', endTime: '2026-11-04T06:20:00Z', exerciseType: 56 },
  ];
  const all = runningSessions(sessions, 10);
  assert.deepEqual(all.map((s) => s.startTime), ['2026-11-05T06:00:00Z', '2026-11-04T06:00:00Z', '2026-11-01T06:00:00Z']);
  assert.equal(runningSessions(sessions, 2).length, 2);
  assert.deepEqual(runningSessions([], 5), []);
});

test('sessionToRun: distance in km, duration in seconds, a stable id; a broken end time never gives a negative duration', () => {
  const run = sessionToRun({ startTime: '2026-11-05T06:00:00Z', endTime: '2026-11-05T06:30:00Z', exerciseType: 56 }, 5200, 3);
  assert.equal(run.durationSec, 1800);
  assert.ok(Math.abs(run.km - 5.2) < 0.05);
  assert.ok(run.id.endsWith('-3'));
  assert.equal(run.startedAt, '2026-11-05T06:00:00.000Z');
  const broken = sessionToRun({ startTime: '2026-11-05T06:30:00Z', endTime: '2026-11-05T06:00:00Z', exerciseType: 56 }, 0, 0);
  assert.equal(broken.durationSec, 0);
});
