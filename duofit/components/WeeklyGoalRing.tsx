import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { ProgressRing } from '@components/ProgressRing';
import { theme } from '@styles/theme';

interface WeeklyGoalRingProps {
  completed: number;
  goal: number;
}

function getEncouragement(completed: number, goal: number): string {
  const remaining = goal - completed;
  if (remaining <= 0) return 'עברת את היעד השבוע! כל הכבוד';
  if (remaining === 1) return 'עוד אימון אחד ליעד';
  return `עוד ${remaining} אימונים ליעד`;
}

// Home hero card — real weekly workout count vs goal, per the FitMatch
// reference (its icon is a dumbbell, not a flame; the flame/streak lives in
// the top-bar badge and the "ביחד ברצף" section instead).
export const WeeklyGoalRing: React.FC<WeeklyGoalRingProps> = ({ completed, goal }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.value}>
          {completed}
          <Text style={styles.goal}>/{goal}</Text>
        </Text>
        <Text style={styles.label}>אימונים השבוע</Text>
        <Text style={styles.encouragement}>{getEncouragement(completed, goal)}</Text>
      </View>
      <ProgressRing
        size={88}
        strokeWidth={10}
        progress={goal > 0 ? completed / goal : 0}
        color={theme.colors.cyan}
        trackColor={theme.colors.surfaceHover}
      >
        <Dumbbell color={theme.colors.cyan} size={28} strokeWidth={2} />
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
  encouragement: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.magenta,
    marginTop: theme.spacing.xs,
  },
});
