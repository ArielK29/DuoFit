import { I18nManager, Platform } from 'react-native';

// This app forces RTL. With RTL on, React Native swaps `left` and `right` for
// absolutely-positioned elements, so `left: 16` lands on the visual RIGHT.
// These helpers pick the right key at runtime, so a pin meant for the visual
// left/right edge ends up there whether or not the OS is in RTL mode.
const swapped = I18nManager.isRTL && I18nManager.getConstants().doLeftAndRightSwapInRTL;

export const visualLeft = (offset: number) => (swapped ? { right: offset } : { left: offset });
export const visualRight = (offset: number) => (swapped ? { left: offset } : { right: offset });

// Bare (non-wrapped) text that should sit at the visual RIGHT edge for Hebrew.
// Android quirk: under the app's forced RTL, `textAlign: 'left'` is what lands on
// the right there (verified on a device). Everywhere else (web, iOS) the default
// "natural" alignment of Hebrew text is already right, so no override is applied -
// a hard-coded 'left' would push the text to the wrong side on those platforms.
export const visualRightText = Platform.OS === 'android' ? ({ textAlign: 'left' } as const) : ({} as const);
