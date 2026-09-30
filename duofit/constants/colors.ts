// DuoFit Color Palette - Dark Mode Only
// Reference: ../01-DESIGN-TOKENS.json

export const colors = {
  dark: {
    // Primary
    black: '#050505',
    offWhite: '#F5F5F5',

    // Accent
    magenta: '#FF00A8',
    cyan: '#00E5FF',

    // Surface
    bg: '#050505',
    surface: '#0D0D0D',
    surfaceHover: '#1A1A1A',

    // Text
    text: '#F5F5F5',
    textSecondary: '#A8A8A8',
    // Lightened from the original #606060 (issue #9: WCAG AA requires >=4.5:1
    // for normal text — #606060 only hit ~3.2:1 against bg/surface). #8C8C8C
    // clears 4.5:1 against bg, surface, AND surfaceHover.
    textTertiary: '#8C8C8C',

    // Semantic
    success: '#00E5FF',
    error: '#FF00A8',
    warning: '#FFB800',
    info: '#00E5FF',
  },
};
