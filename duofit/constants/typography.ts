// DuoFit Typography
// Reference: ../01-DESIGN-TOKENS.json
// Fonts: Anton, Heebo (Hebrew), Space Grotesk, JetBrains Mono
//
// `fontFamily` values below must match the exact constant names loaded via
// useFonts() in src/app/_layout.tsx (from the @expo-google-fonts/* packages). Each family
// name already encodes its weight (e.g. Heebo_600SemiBold), so `fontWeight`
// is kept at 'normal' alongside it — setting a numeric fontWeight next to a
// weight-specific custom font can make iOS/Android substitute a synthetic or
// system fallback face instead of using the loaded font file.
//
// Anton is Latin-only and has no Hebrew glyphs (01-DESIGN-TOKENS.json
// `display` token), so it must never be used for Hebrew-facing text. h1/h2
// render Hebrew headings, so they use the `display-hebrew` token (Heebo at
// the heavy 800-900 weight range it specifies) instead. Anton_400Regular
// stays loaded and is kept below as `display`, matching the `display` token's
// documented Latin-only role (wordmark / streak / stat numbers / short
// English microcopy) — nothing currently renders with it, but it's ready for
// that future use rather than being dead weight with no home.

export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: 'normal',
    lineHeight: 40,
    fontFamily: 'Heebo_800ExtraBold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'normal',
    lineHeight: 32,
    fontFamily: 'Heebo_800ExtraBold',
  },
  h3: {
    fontSize: 20,
    fontWeight: 'normal',
    lineHeight: 28,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },

  // Body
  body: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24,
    fontFamily: 'Heebo_400Regular',
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
    fontFamily: 'Heebo_400Regular',
  },
  // Emphasized variant of bodySmall — e.g. a highlighted phone-number readout
  // that used to rely on a numeric fontWeight for emphasis before custom
  // fonts were loaded. Uses an actual bold font file, not a synthetic weight.
  bodySmallBold: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
    fontFamily: 'Heebo_700Bold',
  },

  // Labels & Buttons
  button: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  label: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
    fontFamily: 'Heebo_500Medium',
  },
  // Emphasized variant of label — e.g. the selected state of a chip/pill,
  // where the unselected state uses `label` and needs visible extra weight.
  labelBold: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
    fontFamily: 'Heebo_700Bold',
  },

  // Monospace (for codes, etc)
  mono: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  // Emphasized variant of mono — e.g. an OTP code entry box that used to rely
  // on a numeric fontWeight for emphasis before custom fonts were loaded.
  monoBold: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
    fontFamily: 'JetBrainsMono_700Bold',
  },

  // Latin-only display face (01-DESIGN-TOKENS.json `display` token). Not yet
  // used anywhere — reserved for wordmark / streak / stat numbers / short
  // English microcopy, per the token's description. Never use for Hebrew text.
  display: {
    fontSize: 32,
    fontWeight: 'normal',
    lineHeight: 40,
    fontFamily: 'Anton_400Regular',
  },
};
