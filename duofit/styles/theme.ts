// DuoFit Theme Configuration
// Dark-only mode (no light mode support)

import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

export const theme = {
  colors: colors.dark,
  spacing,
  borderRadius,
  typography,

  // Animation timing (from 05-MOTION-SPECS.md)
  animation: {
    fast: 100,     // 100ms micro-interactions
    standard: 150, // 150ms button states
    page: 300,     // 300ms page transitions (ease-out)
    long: 400,     // 400ms longer animations
  },

  // Easing functions
  easing: {
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
  },

  // Z-index stack
  zIndex: {
    base: 0,
    dropdown: 100,
    modal: 1000,
    toast: 2000,
    tooltip: 2100,
  },

  // Shadows (dark mode)
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.6)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.7)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.8)',
  },
};

export type Theme = typeof theme;
