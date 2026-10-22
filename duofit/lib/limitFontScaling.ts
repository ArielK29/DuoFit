import { createElement, type ComponentType } from 'react';
import { capFontScaling } from './fontScale.ts';

type Exports = Record<string, unknown>;

// Replaces Text and TextInput on the given module object by thin wrappers that follow the system text size only up to MAX_FONT_SCALE
// (see lib/fontScale.ts). React Native's Text is a plain function component, so a defaultProps cap does not work any more.
// The object MUST be the real module.exports of 'react-native': `import * as RN` gives Babel's interop COPY for this module (it has no
// __esModule flag), and replacing properties on a copy changes nothing for the screens, which read from the real one. Returns false
// when the module cannot be changed (the app then keeps following the system size; nothing breaks).
export function installFontCap(target: Exports): boolean {
  const OriginalText = target.Text as ComponentType<Record<string, unknown>> | undefined;
  const OriginalTextInput = target.TextInput as ComponentType<Record<string, unknown>> | undefined;
  if (!OriginalText || !OriginalTextInput) return false;
  const CappedText = (props: Record<string, unknown>) => createElement(OriginalText, capFontScaling(props));
  const CappedTextInput = (props: Record<string, unknown>) => createElement(OriginalTextInput, capFontScaling(props));
  try {
    Object.defineProperty(target, 'Text', { configurable: true, enumerable: true, get: () => CappedText });
    Object.defineProperty(target, 'TextInput', { configurable: true, enumerable: true, get: () => CappedTextInput });
    return true;
  } catch {
    return false;
  }
}

// Call once, before the first render.
let applied = false;

export function limitFontScaling(): void {
  if (applied) return;
  applied = true;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const reactNative = require('react-native') as Exports;
  const ok = installFontCap(reactNative);
  // eslint-disable-next-line no-console
  if (__DEV__) console.log('[font-cap]', ok ? 'on' : 'NOT applied');
}
