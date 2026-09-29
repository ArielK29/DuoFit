import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { ProgressRing } from '@components/ProgressRing';
import { theme } from '@styles/theme';

interface StreakDisplayProps {
  days: number;
  goal: number;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ days, goal }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.value}>
          {days}
          <Text style={styles.goal}>/{goal}</Text>
        </Text>
        <Text style={styles.label}>ימים ברצף</Text>
      </View>
      <ProgressRing
        size={88}
        strokeWidth={10}
        progress={goal > 0 ? days / goal : 0}
        color={theme.colors.cyan}
        trackColor={theme.colors.surfaceHover}
      >
        <Zap color={theme.colors.cyan} size={28} strokeWidth={2} />
      </ProgressRing>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  textBlock: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 40,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  goal: {
    fontSize: 18,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.textTertiary,
  },
  label: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
