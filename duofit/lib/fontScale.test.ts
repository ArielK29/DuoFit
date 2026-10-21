import test from 'node:test';
import assert from 'node:assert/strict';
import { capFontScaling, MAX_FONT_SCALE } from './fontScale.ts';

test('MAX_FONT_SCALE keeps the largest normal iOS text size (1.35) readable without breaking fixed-height controls', () => {
  assert.equal(MAX_FONT_SCALE, 1.35);
});

test('capFontScaling: text with no limit gets the cap', () => {
  assert.deepEqual(capFontScaling({ style: 1 }), { style: 1, maxFontSizeMultiplier: MAX_FONT_SCALE });
});

test('capFontScaling: a screen that asks for a smaller limit keeps it, a larger or invalid one is brought down to the cap', () => {
  assert.equal(capFontScaling({ maxFontSizeMultiplier: 1.1 }).maxFontSizeMultiplier, 1.1);
  assert.equal(capFontScaling({ maxFontSizeMultiplier: 3 }).maxFontSizeMultiplier, MAX_FONT_SCALE);
  assert.equal(capFontScaling({ maxFontSizeMultiplier: 'x' as unknown as number }).maxFontSizeMultiplier, MAX_FONT_SCALE);
  assert.equal(capFontScaling({ maxFontSizeMultiplier: null }).maxFontSizeMultiplier, MAX_FONT_SCALE);
});

test('capFontScaling: 0 means "do not scale at all" and is kept; the other props are not touched', () => {
  const props = { allowFontScaling: false, maxFontSizeMultiplier: 0, testID: 'a' };
  assert.deepEqual(capFontScaling(props), props);
});
