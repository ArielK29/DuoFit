import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { BarChart, Bar } from '@components/BarChart';
import { CardShell, pillStyles } from '@screens/progress/CardShell';
import { MOCK_HEALTH, MOCK_STEPS_BEFORE_TODAY } from '@constants/mockHealth';
import { theme } from '@styles/theme';

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
const CHART_MAX = 13000;

// "צעדים": example data until a development build can read Health Connect /
// HealthKit. Days before today use fixed example counts, today uses the same
// number as Home, and upcoming days are empty.
export const StepsCard: React.FC = () => {
  const todayIndex = new Date().getDay();
  const { steps, stepsGoal } = MOCK_HEALTH;

  const values = WEEKDAY_LETTERS.map((_, index) =>
    index < todayIndex ? MOCK_STEPS_BEFORE_TODAY[index] : index === todayIndex ? steps : 0
  );
  const counted = values.slice(0, todayIndex + 1);
  const average = Math.round(counted.reduce((sum, value) => sum + value, 0) / counted.length);
  const remaining = Math.max(0, stepsGoal - steps);

  const bars: Bar[] = values.map((value, index) => ({
    label: WEEKDAY_LETTERS[index],
    value,
    color: value >= stepsGoal ? theme.colors.cyan : `${theme.colors.textTertiary}66`,
  }));

  return (
    <CardShell
      title="צעדים"
      isExample
      chip={
        <View style={pillStyles.pill}>
          <Text style={pillStyles.pillMuted}>
            ממוצע <Text style={pillStyles.pillText}>{average.toLocaleString('he-IL')}</Text>
          </Text>
        </View>
      }
    >
      <View style={styles.summary}>
        <Text style={styles.value}>{steps.toLocaleString('he-IL')}</Text>
        <Text style={styles.remaining}>
          {remaining > 0 ? `היום · עוד ${remaining.toLocaleString('he-IL')} ליעד` : 'היום · עברת את היעד'}
        </Text>
      </View>
      <BarChart
        bars={bars}
        max={CHART_MAX}
        ticks={[0, CHART_MAX / 3, (2 * CHART_MAX) / 3, CHART_MAX]}
        formatTick={(value) => `${Math.round(value / 1000)}K`}
        goal={stepsGoal}
        goalLabel="יעד 10K"
        goalColor={theme.colors.magenta}
        height={190}
      />
    </CardShell>
  );
};

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  value: {
    fontSize: 44,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  remaining: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
});
