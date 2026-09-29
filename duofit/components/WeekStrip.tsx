import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@styles/theme';

const WEEKDAY_LABELS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getCurrentWeekDates(): Date[] {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });
}

interface WeekStripProps {
  activeDates: Set<number>; // startOfDay() timestamps with a completed workout
}

// Weekly day strip, per the FitMatch reference layout — restyled with DuoFit's
// own dark palette instead of FitMatch's light theme.
export const WeekStrip: React.FC<WeekStripProps> = ({ activeDates }) => {
  const today = startOfDay(new Date());
  const week = getCurrentWeekDates();

  return (
    <View style={styles.row}>
      {week.map((date) => {
        const dayStart = startOfDay(date);
        const isToday = dayStart === today;
        const isActive = activeDates.has(dayStart);

        return (
          <View key={dayStart} style={styles.dayColumn}>
            <Text style={styles.label}>{WEEKDAY_LABELS[date.getDay()]}</Text>
            <View style={[styles.circle, isToday && styles.circleToday, isActive && styles.circleActive]}>
              <Text style={[styles.dayNumber, isActive && styles.dayNumberActive]}>{date.getDate()}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleToday: {
    borderWidth: 1,
    borderColor: theme.colors.textTertiary,
    borderStyle: 'dashed',
  },
  circleActive: {
    backgroundColor: theme.colors.cyan,
    borderWidth: 0,
  },
  dayNumber: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.textSecondary,
  },
  dayNumberActive: {
    color: theme.colors.black,
  },
});
