// DuoFit Typography
// Reference: ../01-DESIGN-TOKENS.json
// Fonts: Anton, Heebo (Hebrew), Space Grotesk, JetBrains Mono

export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    fontFamily: 'Anton',
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    fontFamily: 'Anton',
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    fontFamily: 'Space Grotesk',
  },

  // Body
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    fontFamily: 'Heebo',
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    fontFamily: 'Heebo',
  },

  // Labels & Buttons
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    fontFamily: 'Space Grotesk',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    fontFamily: 'Heebo',
  },

  // Monospace (for codes, etc)
  mono: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    fontFamily: 'JetBrains Mono',
  },
};
