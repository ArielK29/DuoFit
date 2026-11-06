import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { BarChart, Bar } from '@components/BarChart';
import { CardShell, pillStyles } from '@screens/progress/CardShell';
import { MOCK_HEALTH, MOCK_STEPS_BEFORE_TODAY } from '@constants/mockHealth';
import type { HealthSnapshot } from '@lib/healthKit';
import { weekAverage, weekTotal } from '@lib/healthData';
import { theme } from '@styles/theme';

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
const MIN_CHART_MAX = 13000;

// "צעדים": this week from Apple Health when it is connected (`snapshot`); otherwise labelled example
// data (days before today use fixed example counts, today uses the same number as Home, later days are empty).
export const StepsCard: React.FC<{ snapshot?: HealthSnapshot | null; loading?: boolean }> = ({ snapshot = null, loading = false }) => {
  const now = new Date();
  const todayIndex = now.getDay();
  const { stepsGoal } = MOCK_HEALTH;
  const isExample = snapshot === null;
  const steps = snapshot ? snapshot.todaySteps : MOCK_HEALTH.steps;

  const values = snapshot
    ? snapshot.weekSteps
    : WEEKDAY_LETTERS.map((_, index) =>
        index < todayIndex ? MOCK_STEPS_BEFORE_TODAY[index] : index === todayIndex ? steps : 0
      );
  const average = weekAverage(values, now);
  const total = weekTotal(values, now);
  // The day whose steps are shown (today until the member taps another bar).
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const shownDay = selectedDay !== null && selectedDay <= todayIndex ? selectedDay : todayIndex;
  const shownSteps = values[shownDay] ?? 0;
  // The chart grows when a very active day does not fit the usual scale (ticks stay in whole thousands).
  const chartMax = Math.max(MIN_CHART_MAX, Math.ceil(Math.max(...values) / 3000) * 3000);
  const remaining = Math.max(0, stepsGoal - shownSteps);
  const isToday = shownDay === todayIndex;

  const bars: Bar[] = values.map((value, index) => ({
    label: WEEKDAY_LETTERS[index],
    value,
    color: value >= stepsGoal ? theme.colors.cyan : `${theme.colors.textTertiary}66`,
  }));

  if (loading) {
    return (
      <CardShell title="צעדים">
        <Text style={styles.remaining}>טוען את הנתונים שלך...</Text>
      </CardShell>
    );
  }

  return (
    <CardShell
      title="צעדים"
      isExample={isExample}
      chip={
        <View style={pillStyles.pill}>
          <Text style={pillStyles.pillMuted}>
            ממוצע <Text style={pillStyles.pillText}>{average.toLocaleString('he-IL')}</Text>
          </Text>
        </View>
      }
    >
      <View style={styles.summary}>
        <Text style={styles.value}>{shownSteps.toLocaleString('he-IL')}</Text>
        <Text style={styles.remaining}>
          {`${isToday ? 'היום' : `יום ${WEEKDAY_LETTERS[shownDay]}`} · ${remaining > 0 ? `עוד ${remaining.toLocaleString('he-IL')} ליעד` : 'עברת את היעד'}`}
        </Text>
      </View>
      <Text style={styles.weekTotal}>{`סה"כ השבוע: ${total.toLocaleString('he-IL')} צעדים`}</Text>
      <BarChart
        accessibilityLabel={`צעדים לפי יום, יעד ${stepsGoal.toLocaleString('he-IL')}. היום ${steps.toLocaleString('he-IL')}`}
        selectedIndex={shownDay}
        onSelect={(index) => index <= todayIndex && setSelectedDay(index)}
        formatValue={(value) => value.toLocaleString('he-IL')}
        barAccessibilityLabel={(index) => `יום ${WEEKDAY_LETTERS[index]}, ${(values[index] ?? 0).toLocaleString('he-IL')} צעדים`}
        bars={bars}
        max={chartMax}
        ticks={[0, chartMax / 3, (2 * chartMax) / 3, chartMax]}
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
    lineHeight: 62,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  weekTotal: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  remaining: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
});
