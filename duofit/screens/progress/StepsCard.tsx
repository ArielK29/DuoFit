import React, { useState } from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { BarChart, Bar } from '@components/BarChart';
import { CardShell, pillStyles } from '@screens/progress/CardShell';
import { MOCK_HEALTH } from '@constants/mockHealth';
import type { HealthSnapshot } from '@lib/healthKit';
import { isLastWeekSummaryTime, isWeekSummaryTime, percentChange, weekAverage, weekTotal } from '@lib/healthData';
import { healthSourceName } from '@lib/healthSource';
import { theme } from '@styles/theme';

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
const MIN_CHART_MAX = 13000;

// "צעדים": this week from Apple Health when it is connected (`snapshot`); otherwise labelled example
// data (days before today use fixed example counts, today uses the same number as Home, later days are empty).
export const StepsCard: React.FC<{ snapshot?: HealthSnapshot | null; loading?: boolean }> = ({ snapshot = null, loading = false }) => {
  const now = new Date();
  const todayIndex = now.getDay();
  const { stepsGoal } = MOCK_HEALTH;
  // Without Apple Health there is nothing to show (no example numbers): an empty week and an invitation to connect.
  const isExample = false;
  const noData = snapshot === null;
  const steps = snapshot ? snapshot.todaySteps : 0;

  const values = snapshot
    ? snapshot.weekSteps
    : WEEKDAY_LETTERS.map(() => 0);
  const average = weekAverage(values, now);
  const total = weekTotal(values, now);
  // The week summary shows only on Saturday night; the comparison with last week only when Apple Health gave it (a snapshot from
  // an older build or a failed read has no such number).
  const showWeekSummary = isWeekSummaryTime(now);
  // Sunday: the total of the week that just ended (from Apple Health; nothing is shown when it could not be read).
  const lastWeekTotal = isLastWeekSummaryTime(now) ? snapshot?.lastWeekTotal ?? null : null;
  const change = snapshot?.lastWeekSameDays !== undefined ? percentChange(total, snapshot.lastWeekSameDays) : null;
  const changeText = change === null ? '' : change === 0 ? ' · כמו בשבוע שעבר' : change > 0 ? ` · עלייה של ${change}% מהשבוע שעבר` : ` · ירידה של ${Math.abs(change)}% מהשבוע שעבר`;
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
        <Text style={styles.value}>{noData ? '–' : shownSteps.toLocaleString('he-IL')}</Text>
        <Text style={styles.remaining}>
          {noData
            ? `חבר ${healthSourceName(Platform.OS)} כדי לראות את הצעדים שלך`
            : `${isToday ? 'היום' : `יום ${WEEKDAY_LETTERS[shownDay]}`} · ${remaining > 0 ? `עוד ${remaining.toLocaleString('he-IL')} ליעד` : 'עברת את היעד'}`}
        </Text>
      </View>
      {lastWeekTotal !== null && lastWeekTotal > 0 && (
        <Text style={styles.weekTotal}>{`סה"כ בשבוע שעבר: ${lastWeekTotal.toLocaleString('he-IL')} צעדים`}</Text>
      )}
      {showWeekSummary && (
        <Text style={styles.weekTotal}>{`סה"כ השבוע: ${total.toLocaleString('he-IL')} צעדים${changeText}`}</Text>
      )}
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
