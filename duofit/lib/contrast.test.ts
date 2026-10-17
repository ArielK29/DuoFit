import test from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, luminance } from './contrast.ts';
import { colors } from '../constants/colors.ts';

const c = colors.dark;
const AA = 4.5;

test('contrastRatio: the WCAG reference values', () => {
  assert.equal(contrastRatio('#000000', '#FFFFFF'), 21);
  assert.equal(contrastRatio('#FFFFFF', '#FFFFFF'), 1);
  assert.equal(contrastRatio('#FFFFFF', '#000000'), contrastRatio('#000000', '#FFFFFF'), 'order does not matter');
  assert.ok(Math.abs(contrastRatio('#767676', '#FFFFFF') - 4.54) < 0.01, 'the well-known AA grey');
  assert.ok(Math.abs(luminance('#FF0000') - 0.2126) < 1e-9);
  assert.throws(() => luminance('red'));
});

test('body text colours reach WCAG AA (4.5:1) on every surface they are drawn on', () => {
  for (const background of [c.bg, c.surface, c.surfaceHover]) {
    for (const [name, colour] of [['text', c.text], ['textSecondary', c.textSecondary], ['textTertiary', c.textTertiary]] as const) {
      const ratio = contrastRatio(colour, background);
      assert.ok(ratio >= AA, `${name} on ${background} is ${ratio.toFixed(2)}`);
    }
  }
});

test('accent and status colours used as text reach AA on the page and card backgrounds', () => {
  for (const background of [c.bg, c.surface]) {
    for (const [name, colour] of [['magenta', c.magenta], ['cyan', c.cyan], ['warning', c.warning], ['error', c.error], ['success', c.success]] as const) {
      const ratio = contrastRatio(colour, background);
      assert.ok(ratio >= AA, `${name} on ${background} is ${ratio.toFixed(2)}`);
    }
  }
});

test('buttons: the label colour reaches AA on every button background', () => {
  // components/Button.tsx: primary = magenta, danger = error, both with black text; secondary = surface with text colour.
  assert.ok(contrastRatio(c.black, c.magenta) >= AA, `black on magenta ${contrastRatio(c.black, c.magenta).toFixed(2)}`);
  assert.ok(contrastRatio(c.black, c.error) >= AA, `black on error ${contrastRatio(c.black, c.error).toFixed(2)}`);
  assert.ok(contrastRatio(c.text, c.surface) >= AA);
});

test('the edge of a card against the page is a visible shape (3:1 is not required for decoration, but text on it must hold)', () => {
  // Cards are surface (#0D0D0D) on bg (#050505) with a 1px border of surfaceHover: only text contrast is a rule here.
  assert.ok(contrastRatio(c.textSecondary, c.surfaceHover) >= AA);
});
