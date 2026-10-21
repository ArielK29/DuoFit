import React from 'react';
import * as ReactNative from 'react-native';
import { capFontScaling } from '@lib/fontScale';

// Makes every Text and TextInput in the app follow the system text size only up to MAX_FONT_SCALE (see lib/fontScale.ts). React Native's
// Text is a plain function component, so a defaultProps cap does not work any more; instead the two exports are replaced once, at
// start-up, by thin wrappers (all the screens read them from 'react-native' when they render). Call it once, before the first render.
let applied = false;

export function limitFontScaling(): void {
  if (applied) return;
  applied = true;
  const OriginalText = ReactNative.Text;
  const OriginalTextInput = ReactNative.TextInput;
  const CappedText = (props: React.ComponentProps<typeof ReactNative.Text>) => <OriginalText {...capFontScaling(props)} />;
  const CappedTextInput = (props: React.ComponentProps<typeof ReactNative.TextInput>) => <OriginalTextInput {...capFontScaling(props)} />;
  try {
    Object.defineProperty(ReactNative, 'Text', { configurable: true, enumerable: true, get: () => CappedText });
    Object.defineProperty(ReactNative, 'TextInput', { configurable: true, enumerable: true, get: () => CappedTextInput });
    if (__DEV__) console.log('[font-cap]', (ReactNative.Text as unknown) === CappedText ? 'on' : 'NOT applied');
  } catch {
    // If this runtime does not allow it, the app simply keeps following the system size (nothing breaks).
  }
}
