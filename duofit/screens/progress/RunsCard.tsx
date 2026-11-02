import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Activity } from 'lucide-react-native';
import { CardShell, pillStyles } from '@screens/progress/CardShell';
import { HEALTH_GOALS, MOCK_HEALTH, MOCK_RUNS } from '@constants/mockHealth';
import type { HealthSnapshot } from '@lib/healthKit';
import { paceText, recentRuns, runDurationText } from '@lib/healthData';
import { theme } from '@styles/theme';

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

const RUNS_SHOWN = 5;

interface RunRow {
  key: string;
  date: Date;
  title: string;
  duration: string;
  pace: string;
}

// "ריצות": running workouts from Apple Health when it is connected (`snapshot`); otherwise labelled example
// runs. The pill shows the same monthly distance as Home.
export const RunsCard: React.FC<{ snapshot?: HealthSnapshot | null }> = ({ snapshot = null }) => {
  const now = new Date();
  const monthName = now.toLocaleDateString('he-IL', { month: 'long' });
  const isExample = snapshot === null;
  const monthKm = snapshot ? snapshot.monthKm : MOCK_HEALTH.runKm;

  const rows: RunRow[] = snapshot
    ? recentRuns(snapshot.runs, RUNS_SHOWN).map((run) => ({
        key: run.id,
        date: new Date(run.startedAt),
        title: `${run.km} ק"מ`,
        duration: runDurationText(run.durationSec),
        pace: paceText(run.km, run.durationSec),
      }))
    : MOCK_RUNS.map((run) => ({
        key: String(run.daysAgo),
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - run.daysAgo),
        title: `${run.km} ק"מ · ${run.company}`,
        duration: run.duration,
        pace: run.pace,
      }));

  return (
    <CardShell
      title="ריצות"
      isExample={isExample}
      chip={
        <View style={pillStyles.pill}>
          <Text style={pillStyles.pillMuted}>
            {monthName}{' '}
            <Text style={pillStyles.pillText}>{`${monthKm}/${HEALTH_GOALS.runKm}`}</Text> ק&quot;מ
          </Text>
        </View>
      }
    >
      {rows.length === 0 && (
        <Text style={styles.empty}>אין ריצות ב-60 הימים האחרונים ב-Apple Health. ריצה שתתועד באפל ווטש או באפליקציית ריצה תופיע כאן.</Text>
      )}
      {rows.map((run, index) => {
        const date = run.date;
        return (
          <View key={run.key} style={[styles.row, index > 0 && styles.rowDivider]}>
            <View style={styles.iconTile}>
              <Activity color={theme.colors.cyan} size={24} strokeWidth={2} />
            </View>
            <View style={styles.info}>
              <Text style={styles.distance}>{run.title}</Text>
              <Text style={styles.date}>{`${WEEKDAY_LETTERS[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}`}</Text>
            </View>
            <View style={styles.stats}>
              <Text style={styles.duration}>{run.duration}</Text>
              <Text style={styles.pace}>{run.pace === '—' ? '—' : `${run.pace} לק"מ`}</Text>
            </View>
          </View>
        );
      })}
    </CardShell>
  );
};

const styles = StyleSheet.create({
  empty: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
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
