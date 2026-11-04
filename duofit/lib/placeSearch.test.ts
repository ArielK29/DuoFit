import test from 'node:test';
import assert from 'node:assert/strict';
import { customPlace, filterPlaces, privatePlaceProblem } from './placeSearch.ts';

const names = ['הולמס פלייס דיזנגוף', 'פארק הירקון', 'חוף גורדון'];

test('filterPlaces: empty search shows everything, otherwise the names that contain the text', () => {
  assert.deepEqual(filterPlaces(names, ''), names);
  assert.deepEqual(filterPlaces(names, '  '), names);
  assert.deepEqual(filterPlaces(names, 'פארק'), ['פארק הירקון']);
  assert.deepEqual(filterPlaces(names, 'xyz'), []);
});

test('filterPlaces: ignores letter case for Latin names', () => {
  assert.deepEqual(filterPlaces(['Holmes Place'], 'holmes'), ['Holmes Place']);
});

test('customPlace: any other place the member types is allowed, trimmed and at most 100 characters', () => {
  assert.equal(customPlace('  מגרש הכדורסל בשכונה  ', names), 'מגרש הכדורסל בשכונה');
  assert.equal(customPlace('', names), null);
  assert.equal(customPlace('   ', names), null);
  assert.equal(customPlace('א'.repeat(101), names), null);
  assert.equal(customPlace('א'.repeat(100), names), 'א'.repeat(100));
});

test('customPlace: a name that is already in the list is not offered as "another place"', () => {
  assert.equal(customPlace('פארק הירקון', names), null);
  assert.equal(customPlace(' פארק הירקון ', names), null);
});

test('privatePlaceProblem: a place that sounds private (a home, a flat, a room, a private address) is refused', () => {
  for (const text of ['הבית שלי', 'אצלי בדירה', 'דירה ברחוב הרצל 5', 'בבית של דנה', 'חדר בבניין', 'אצל חבר', 'my house', 'at my apartment', 'הבית של דנה', 'בית פרטי']) {
    assert.ok(privatePlaceProblem(text), text);
  }
});

test('privatePlaceProblem: public places pass, and so do names that merely contain the letters', () => {
  for (const text of ['פארק הירקון', 'חוף גורדון', 'מגרש כדורסל בשכונה', 'חדר כושר הולמס', 'מסלול ריצה בפארק רעננה', 'טיילת תל אביב']) {
    assert.equal(privatePlaceProblem(text), null, text);
  }
});
