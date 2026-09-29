import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { theme } from '@styles/theme';

// Per 05-MOTION-SPECS.md "Skeleton Loader Animation": left-to-right shimmer,
// 1.5s per cycle, continuous, linear. Shared so every loading state in the
// app uses the same timing (issue #10's "consistent app-wide" requirement).
const SHIMMER_DURATION_MS = 1500;
const SWEEP_WIDTH_RATIO = 0.6; // gradient bar width relative to the container

interface SkeletonLoaderProps {
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ style }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: SHIMMER_DURATION_MS, easing: Easing.linear }), -1, false);
  }, [progress]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const sweepWidth = containerWidth * SWEEP_WIDTH_RATIO;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (containerWidth + sweepWidth) - sweepWidth }],
  }));

  return (
    <View style={[styles.base, style]} onLayout={handleLayout}>
      {containerWidth > 0 && (
        <Animated.View style={[styles.sweep, { width: sweepWidth }, animatedStyle]}>
          <LinearGradient
            colors={[theme.colors.surface, theme.colors.surfaceHover, theme.colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
