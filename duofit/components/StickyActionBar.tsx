import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@styles/theme';

interface StickyActionBarProps {
  children: React.ReactNode;
}

// Primary actions pinned to the bottom of a screen, right above the tab bar, so
// they sit in the thumb zone. A fade keeps scrolling content readable behind it.
// Screens that use it add ~112px of bottom padding to their scroll content.
export const STICKY_BAR_CLEARANCE = 112;

export const StickyActionBar: React.FC<StickyActionBarProps> = ({ children }) => (
  <View style={styles.wrap} pointerEvents="box-none">
    <LinearGradient
      colors={['rgba(5,5,5,0)', theme.colors.bg]}
      locations={[0, 0.45]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
    <View style={styles.row}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
});
