import React from 'react';
import { Pressable, StyleSheet, ViewStyle, PressableProps } from 'react-native';
import { theme } from '@styles/theme';

interface CardProps extends PressableProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

// Shared card container per 02-COMPONENT-STATES.md — default/selected states.
// "Hover" from the spec is a pointer-only state and has no touch equivalent,
// so it's intentionally not implemented here. Always a Pressable (even
// without onPress) so callers get a single, consistent element type.
export const Card: React.FC<CardProps> = ({ children, style, onPress, ...props }) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && onPress && styles.cardPressed, style]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      {...props}
    >
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  cardPressed: {
    borderColor: theme.colors.cyan,
  },
});
