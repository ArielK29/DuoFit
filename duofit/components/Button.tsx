import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  PressableProps
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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

  // 05-MOTION-SPECS.md "Press/Active State": scale 1 -> 0.98 in 100ms ease-out.
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { onPressIn, onPressOut, ...pressableProps } = props;

  const styles = StyleSheet.create({
    button: {
      backgroundColor: getBackgroundColor(),
      paddingVertical: getPadding(),
      paddingHorizontal: getPadding() * 1.5,
      borderRadius: theme.borderRadius.md,
      minHeight: 48, // Touch target minimum
      overflow: 'hidden', // keeps the Android ripple inside the rounded corners
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
    <Animated.View style={pressStyle}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.8 },
        ]}
        onPress={onPress}
        onPressIn={(event) => {
          scale.set(withTiming(0.98, { duration: 100, easing: Easing.out(Easing.ease) }));
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.set(withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) }));
          onPressOut?.(event);
        }}
        android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
        disabled={disabled || loading}
        accessibilityRole="button"
        {...pressableProps}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <Text style={styles.text}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
};
