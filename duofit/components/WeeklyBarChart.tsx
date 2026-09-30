import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@styles/theme';

const CHART_HEIGHT = 100;
const MIN_BAR_HEIGHT = 4;

export interface WeekBucket {
  label: string;
  count: number;
}

interface WeeklyBarChartProps {
  weeks: WeekBucket[];
  goal: number;
}

// Simple bar chart, real workout counts per week (no charting library needed
// for something this small) — per FitMatch's "workout frequency" chart.
export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ weeks, goal }) => {
  const maxValue = Math.max(goal, ...weeks.map((week) => week.count), 1);

  return (
    <View>
      <View style={styles.chartArea}>
        {weeks.map((week, index) => {
          const met = week.count >= goal;
          const barHeight = Math.max(MIN_BAR_HEIGHT, (week.count / maxValue) * CHART_HEIGHT);
          return (
            <View key={index} style={styles.barColumn}>
              <View
                style={[styles.bar, { height: barHeight }, met ? styles.barMet : styles.barBelow]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labelsRow}>
        {weeks.map((week, index) => (
          <Text key={index} style={styles.label}>
            {week.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 10,
    borderRadius: theme.borderRadius.sm,
  },
  barMet: {
    backgroundColor: theme.colors.cyan,
  },
  barBelow: {
    backgroundColor: theme.colors.surfaceHover,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
});
