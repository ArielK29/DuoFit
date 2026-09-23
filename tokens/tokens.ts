/**
 * DuoFit · Design Tokens · TypeScript
 * v2.0 · Auto-generatable from design-tokens.json
 *
 * Import into React Native components:
 *   import { colors, fonts, space, radii } from './tokens';
 */

export const colors = {
  // Base
  bg:       '#050505', // Void Black — primary background
  surface:  '#0D0D0D', // Card surfaces
  line:     '#1A1A1A', // Hairline borders
  concrete: '#3A3A3A', // Inactive icons
  muted:    '#7A7A7A', // Secondary text
  ink:      '#F5F5F5', // Primary text (never pure white)

  // Brand
  primary: '#FF00A8', // Signal Magenta — actions, CTAs
  accent:  '#00E5FF', // Volt Cyan — Streak & Check-in only

  // Semantic aliases
  streak:  '#00E5FF',
  success: '#00E5FF',
  error:   '#FF00A8',

  // With alpha (for glows/overlays)
  cyanA:    'rgba(0, 229, 255, 0.4)',
  magentaA: 'rgba(255, 0, 168, 0.4)',
  overlay:  'rgba(0, 0, 0, 0.7)',
} as const;

export const fonts = {
  display:       'Anton',   // Latin only — wordmark, Streak/stat numbers, short English microcopy
  displayHebrew: 'Heebo',   // Hebrew headings (weight 800-900). Anton has no Hebrew glyphs.
  body:          'Space Grotesk',   // UI text
  mono:          'JetBrains Mono',  // Metadata, timestamps
} as const;

export const weights = {
  regular: '400' as const,
  medium:  '500' as const,
  bold:    '700' as const,
};

export const type = {
  xs:   10,
  sm:   12,
  base: 14,
  lg:   16,
  xl:   20,
  '2xl': 28,
  '3xl': 44,
  hero: 108, // Streak number
} as const;

export const leading = {
  tight:   1.1,
  normal:  1.5,
  relaxed: 1.6,
} as const;

export const tracking = {
  tight:   -0.02,
  normal:  0,
  wide:    0.05,
  wider:   0.15,
  widest:  0.28,
} as const;

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
} as const;

export const radii = {
  none: 0,
  sm:   4,
  md:   8,
  full: 9999, // avatars only
} as const;

export const borders = {
  hairline: { width: 1, color: colors.line },
  focus:    { width: 2, color: colors.accent },
} as const;

export const shadows = {
  streakGlow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6, // Android
  },
  magentaGlow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

export const motion = {
  duration: {
    instant:   0,
    fast:      150,
    base:      300,
    slow:      500,
    splash:    800,
    celebrate: 1200,
  },
  easing: {
    standard:   [0.2, 0, 0, 1] as const,
    decelerate: [0, 0, 0, 1] as const,
    accelerate: [0.3, 0, 1, 1] as const,
    sharp:      [0.4, 0, 0.6, 1] as const,
  },
} as const;

export const sizes = {
  touchTarget: 44, // WCAG minimum
  icon: { sm: 16, md: 20, lg: 24, xl: 32 },
  avatar: { xs: 32, sm: 40, md: 48, lg: 60, xl: 96 },
} as const;

export const z = {
  base:    0,
  sticky:  10,
  overlay: 100,
  modal:   200,
  toast:   300,
} as const;

export const opacity = {
  disabled: 0.4,
} as const;

// Typography presets (paste into <Text style={type.hero}>)
export const typePresets = {
  hero: {
    fontFamily: fonts.display,
    fontSize: type.hero,
    lineHeight: type.hero * leading.tight,
    color: colors.accent,
    letterSpacing: type.hero * tracking.tight,
  },
  // Hebrew headings (default — this is a Hebrew-first UI). For a heading
  // that is guaranteed Latin-only (rare), swap fontFamily to fonts.display.
  h1: {
    fontFamily: fonts.displayHebrew,
    fontWeight: '900' as const,
    fontSize: type['3xl'],
    lineHeight: type['3xl'] * leading.tight,
    color: colors.ink,
  },
  h2: {
    fontFamily: fonts.displayHebrew,
    fontWeight: '800' as const,
    fontSize: type['2xl'],
    lineHeight: type['2xl'] * leading.tight,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: type.base,
    lineHeight: type.base * leading.normal,
    color: colors.ink,
  },
  emphasis: {
    fontFamily: fonts.body,
    fontSize: type.lg,
    fontWeight: weights.bold,
    lineHeight: type.lg * leading.normal,
    color: colors.ink,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: type.sm,
    lineHeight: type.sm * leading.normal,
    color: colors.muted,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: type.xs,
    fontWeight: weights.bold,
    letterSpacing: type.xs * tracking.wider,
    color: colors.accent,
    textTransform: 'uppercase' as const,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: type.sm,
    letterSpacing: type.sm * tracking.wide,
    color: colors.muted,
  },
} as const;

export type TokenColor = keyof typeof colors;
export type TokenSpace = keyof typeof space;
export type TokenRadius = keyof typeof radii;
