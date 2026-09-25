import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  PressableProps
} from 'react-native';
import { theme } from '@styles/theme';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  ...props
}) => {
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.surfaceHover;
    if (variant === 'primary') return theme.colors.magenta;
    if (variant === 'secondary') return theme.colors.surface;
    if (variant === 'danger') return theme.colors.error;
    return theme.colors.magenta;
  };

  const getTextColor = () => {
    if (variant === 'secondary') return theme.colors.text;
    return theme.colors.black;
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return theme.spacing.sm;
      case 'lg': return theme.spacing.lg;
      case 'md':
      default:
        return theme.spacing.md;
    }
  };

  const styles = StyleSheet.create({
    button: {
      backgroundColor: getBackgroundColor(),
      paddingVertical: getPadding(),
      paddingHorizontal: getPadding() * 1.5,
      borderRadius: theme.borderRadius.md,
      minHeight: 48, // Touch target minimum
      justifyContent: 'center',
      alignItems: 'center',
      opacity: disabled ? 0.6 : 1,
    },
    text: {
      color: getTextColor(),
      fontSize: 16,
      fontWeight: 'normal',
      fontFamily: theme.typography.button.fontFamily,
      textAlign: 'center',
    },
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && { opacity: 0.8 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </Pressable>
  );
};
