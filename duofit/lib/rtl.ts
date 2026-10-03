import { I18nManager } from 'react-native';

// This app forces RTL. With RTL on, React Native swaps `left` and `right` for
// absolutely-positioned elements, so `left: 16` lands on the visual RIGHT.
// These helpers pick the right key at runtime, so a pin meant for the visual
// left/right edge ends up there whether or not the OS is in RTL mode.
const swapped = I18nManager.isRTL && I18nManager.getConstants().doLeftAndRightSwapInRTL;

export const visualLeft = (offset: number) => (swapped ? { right: offset } : { left: offset });
export const visualRight = (offset: number) => (swapped ? { left: offset } : { right: offset });
