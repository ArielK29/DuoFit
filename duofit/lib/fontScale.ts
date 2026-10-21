// The biggest text size the app follows. iOS "Larger Accessibility Sizes" go to about 3.1x and Android to 2x; at that size the fixed-height
// controls and the headings break (a title wraps one letter per line, the week strip is cut). 1.35 is the largest normal iOS size
// (xxxLarge): text still grows for people who need it, and the layout holds.
export const MAX_FONT_SCALE = 1.35;

// The props of a Text or TextInput with the cap applied. A smaller limit set by a screen is kept (0 = do not scale at all).
export function capFontScaling<T extends { maxFontSizeMultiplier?: number | null }>(props: T): T & { maxFontSizeMultiplier: number } {
  const own = props.maxFontSizeMultiplier;
  const limit = typeof own === 'number' && Number.isFinite(own) && own >= 0 ? Math.min(own, MAX_FONT_SCALE) : MAX_FONT_SCALE;
  return { ...props, maxFontSizeMultiplier: limit };
}
