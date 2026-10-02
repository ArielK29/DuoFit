import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Activity } from 'lucide-react-native';
import { CardShell, pillStyles } from '@screens/progress/CardShell';
import { MOCK_HEALTH, MOCK_RUNS } from '@constants/mockHealth';
import { theme } from '@styles/theme';

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

// "ריצות": example runs until a development build can read the phone's
// fitness data. The pill shows the same monthly distance as Home.
export const RunsCard: React.FC = () => {
  const now = new Date();
  const monthName = now.toLocaleDateString('he-IL', { month: 'long' });

  return (
    <CardShell
      title="ריצות"
      isExample
      chip={
        <View style={pillStyles.pill}>
          <Text style={pillStyles.pillMuted}>
            {monthName}{' '}
            <Text style={pillStyles.pillText}>{`${MOCK_HEALTH.runKm}/${MOCK_HEALTH.runKmGoal}`}</Text> ק&quot;מ
          </Text>
        </View>
      }
    >
      {MOCK_RUNS.map((run, index) => {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - run.daysAgo);
        return (
          <View key={run.daysAgo} style={[styles.row, index > 0 && styles.rowDivider]}>
            <View style={styles.iconTile}>
              <Activity color={theme.colors.cyan} size={24} strokeWidth={2} />
            </View>
            <View style={styles.info}>
              <Text style={styles.distance}>{`${run.km} ק"מ · ${run.company}`}</Text>
              <Text style={styles.date}>{`${WEEKDAY_LETTERS[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}`}</Text>
            </View>
            <View style={styles.stats}>
              <Text style={styles.duration}>{run.duration}</Text>
              <Text style={styles.pace}>{`${run.pace} לק"מ`}</Text>
            </View>
          </View>
        );
      })}
    </CardShell>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceHover,
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(0,229,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  distance: {
    fontSize: 17,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
  },
  date: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  stats: {
    alignItems: 'flex-start',
  },
  duration: {
    fontSize: 20,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  pace: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
  },
});
