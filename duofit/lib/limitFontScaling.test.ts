import test from 'node:test';
import assert from 'node:assert/strict';
import type { ReactElement } from 'react';
import { installFontCap } from './limitFontScaling.ts';
import { MAX_FONT_SCALE } from './fontScale.ts';

// react-native's index exports plain objects with getters; the cap has to replace them on THAT object (the one every screen reads from).
function fakeReactNative() {
  const Text = () => null;
  const TextInput = () => null;
  const exports = {
    get Text() {
      return Text;
    },
    get TextInput() {
      return TextInput;
    },
    View: () => null,
  };
  return { exports, Text, TextInput };
}

test('installFontCap: Text and TextInput read from the module now render the original with the cap', () => {
  const { exports, Text, TextInput } = fakeReactNative();
  assert.equal(installFontCap(exports), true);
  assert.notEqual(exports.Text, Text, 'the export was replaced');
  const element = (exports.Text as unknown as (p: object) => ReactElement<{ maxFontSizeMultiplier: number }>)({ style: 1 });
  assert.equal(element.type, Text);
  assert.equal(element.props.maxFontSizeMultiplier, MAX_FONT_SCALE);
  const input = (exports.TextInput as unknown as (p: object) => ReactElement<{ maxFontSizeMultiplier: number }>)({});
  assert.equal(input.type, TextInput);
  assert.equal(input.props.maxFontSizeMultiplier, MAX_FONT_SCALE);
});

test('installFontCap: other exports are untouched, and a module without Text is left alone', () => {
  const { exports } = fakeReactNative();
  const view = exports.View;
  installFontCap(exports);
  assert.equal(exports.View, view);
  assert.equal(installFontCap({ View: () => null }), false);
});

test('installFontCap: a frozen module (properties that cannot be replaced) reports failure instead of throwing', () => {
  const frozen = Object.freeze({ Text: () => null, TextInput: () => null });
  assert.equal(installFontCap(frozen), false);
});
