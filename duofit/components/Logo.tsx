import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { theme } from '@styles/theme';

interface LogoProps {
  size?: number;
}

// Two overlapping circles in the brand's two accent colors — visualizes
// "Duo" (two, joining/overlapping) + "Fit" (the dumbbell icon in each).
export const Logo: React.FC<LogoProps> = ({ size = 88 }) => {
  const circleSize = size * 0.72;
  const overlap = circleSize * 0.32;
  const iconSize = circleSize * 0.42;

  const styles = StyleSheet.create({
    container: {
      width: circleSize * 2 - overlap,
      height: circleSize,
      justifyContent: 'center',
    },
    circle: {
      position: 'absolute',
      width: circleSize,
      height: circleSize,
      borderRadius: circleSize / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    circleLeft: {
      left: 0,
      backgroundColor: theme.colors.magenta,
    },
    circleRight: {
      left: circleSize - overlap,
      backgroundColor: theme.colors.cyan,
    },
  });

  return (
    <View style={styles.container}>
      <View style={[styles.circle, styles.circleLeft]}>
        <Dumbbell color={theme.colors.black} size={iconSize} strokeWidth={2} />
      </View>
      <View style={[styles.circle, styles.circleRight]}>
        <Dumbbell color={theme.colors.black} size={iconSize} strokeWidth={2} />
      </View>
    </View>
  );
};
