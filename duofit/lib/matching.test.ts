import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMatchPercent, filterPartners } from './matching.ts';

const partner = (over: Record<string, unknown> = {}) => ({
  id: 'p', name: 'דנה', gender: 'F', bio: '', fitnessLevel: 'Intermediate', activities: ['ריצה'], ...over,
}) as any;
const user = (over: Record<string, unknown> = {}) => ({
  id: 'u', email: 'a@b.co', name: 'אבי', favoriteActivities: [] as string[], createdAt: '', fitnessLevel: 'Advanced', ...over,
}) as any;

test('computeMatchPercent: 60 base, +12 per shared activity (at most two), nothing shared adds nothing', () => {
  const me = user({ favoriteActivities: ['ריצה', 'כוח', 'יוגה'], fitnessLevel: 'Intermediate' });
  assert.equal(computeMatchPercent(partner({ activities: ['צלילה'] }), null, me), 68, 'none shared: 60 + same level 8');
  assert.equal(computeMatchPercent(partner({ activities: ['ריצה'] }), null, me), 80, 'one shared');
  assert.equal(computeMatchPercent(partner({ activities: ['ריצה', 'כוח'] }), null, me), 92, 'two shared');
  assert.equal(computeMatchPercent(partner({ activities: ['ריצה', 'כוח', 'יוגה'] }), null, me), 92, 'a third adds nothing');
});

test('computeMatchPercent: fitness level gap 0, 1 or 2 adds 8, 4 or 0', () => {
  const me = user({ fitnessLevel: 'Beginner' });
  assert.equal(computeMatchPercent(partner({ fitnessLevel: 'Beginner', activities: [] }), null, me), 68);
  assert.equal(computeMatchPercent(partner({ fitnessLevel: 'Intermediate', activities: [] }), null, me), 64);
  assert.equal(computeMatchPercent(partner({ fitnessLevel: 'Advanced', activities: [] }), null, me), 60);
  const advanced = user({ fitnessLevel: 'Advanced' });
  assert.equal(computeMatchPercent(partner({ fitnessLevel: 'Beginner', activities: [] }), null, advanced), 60, 'the gap counts both ways');
});

test('computeMatchPercent: distance under 2 km adds 6, under 5 km adds 3, farther or unknown adds nothing (edges are exclusive)', () => {
  const me = user({ fitnessLevel: 'Beginner' });
  const p = partner({ fitnessLevel: 'Advanced', activities: [] }); // 60 with no level bonus
  assert.equal(computeMatchPercent(p, 1.99, me), 66);
  assert.equal(computeMatchPercent(p, 2, me), 63);
  assert.equal(computeMatchPercent(p, 4.99, me), 63);
  assert.equal(computeMatchPercent(p, 5, me), 60);
  assert.equal(computeMatchPercent(p, null, me), 60);
});

test('computeMatchPercent: a missing user or a user without a level counts as a one-step gap', () => {
  assert.equal(computeMatchPercent(partner({ activities: ['ריצה'] }), null, null), 64);
  assert.equal(computeMatchPercent(partner({ activities: ['ריצה'] }), null, user({ fitnessLevel: undefined, favoriteActivities: ['ריצה'] })), 76);
});

test('computeMatchPercent: the best case stays below 100 and the result never drops under 60', () => {
  const me = user({ favoriteActivities: ['ריצה', 'כוח'], fitnessLevel: 'Intermediate' });
  assert.equal(computeMatchPercent(partner({ activities: ['ריצה', 'כוח'] }), 0.5, me), 98);
  for (const km of [null, 0, 3, 50]) {
    assert.ok(computeMatchPercent(partner({ fitnessLevel: 'Advanced', activities: [] }), km, user({ fitnessLevel: 'Beginner' })) >= 60);
  }
});

const filters = (over: Record<string, unknown> = {}) => ({ gender: 'all', maxAge: 40, radiusKm: 15, activities: [], ...over }) as any;
const row = (id: string, over: Record<string, unknown> = {}) => ({ ...partner({ id }), distanceKm: null, ...over }) as any;
const ids = (list: { id: string }[]) => list.map((p) => p.id);

test('filterPartners: no filters keeps everyone, and an empty list stays empty', () => {
  assert.deepEqual(ids(filterPartners([row('a'), row('b')], filters())), ['a', 'b']);
  assert.deepEqual(filterPartners([], filters()), []);
});

test('filterPartners: gender', () => {
  const list = [row('m', { gender: 'M' }), row('f', { gender: 'F' }), row('o', { gender: 'Other' })];
  assert.deepEqual(ids(filterPartners(list, filters({ gender: 'M' }))), ['m']);
  assert.deepEqual(ids(filterPartners(list, filters({ gender: 'F' }))), ['f']);
  assert.deepEqual(ids(filterPartners(list, filters({ gender: 'all' }))), ['m', 'f', 'o']);
});

test('filterPartners: age limit is inclusive, and a member with no age is never hidden by it', () => {
  const list = [row('young', { age: 25 }), row('edge', { age: 30 }), row('old', { age: 31 }), row('none')];
  assert.deepEqual(ids(filterPartners(list, filters({ maxAge: 30 }))), ['young', 'edge', 'none']);
});

test('filterPartners: radius is inclusive, and a member with no known distance is never hidden by it', () => {
  const list = [row('near', { distanceKm: 1 }), row('edge', { distanceKm: 5 }), row('far', { distanceKm: 5.01 }), row('unknown', { distanceKm: null })];
  assert.deepEqual(ids(filterPartners(list, filters({ radiusKm: 5 }))), ['near', 'edge', 'unknown']);
});

test('filterPartners: activities match on any overlap, and all filters must hold together', () => {
  const list = [
    row('run', { activities: ['ריצה'] }),
    row('both', { activities: ['יוגה', 'כוח'] }),
    row('none', { activities: ['כדורסל'] }),
    row('noacts', { activities: [] }),
  ];
  assert.deepEqual(ids(filterPartners(list, filters({ activities: ['ריצה', 'כוח'] }))), ['run', 'both']);
  const combined = [
    row('x', { gender: 'F', age: 25, distanceKm: 2, activities: ['ריצה'] }),
    row('y', { gender: 'M', age: 25, distanceKm: 2, activities: ['ריצה'] }),
  ];
  assert.deepEqual(ids(filterPartners(combined, filters({ gender: 'F', maxAge: 30, radiusKm: 3, activities: ['ריצה'] }))), ['x']);
});
