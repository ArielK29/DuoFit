import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Activity } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { useRunStore } from '@hooks/useRunStore';
import { CardShell, pillStyles } from '@screens/progress/CardShell';
import { HEALTH_GOALS, MOCK_HEALTH, MOCK_RUNS } from '@constants/mockHealth';
import type { HealthSnapshot } from '@lib/healthKit';
import { activityKind, bestMonthKm, paceText, recentRuns, runDurationText } from '@lib/healthData';
import { theme } from '@styles/theme';

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

const RUNS_SHOWN = 5;

interface RunRow {
  key: string;
  date: Date;
  title: string;
  duration: string;
  pace: string;
  // Calories the member gave for this workout (a watch, a treadmill screen), shown next to the date.
  kcal?: number;
}

// "ריצות": running workouts from Apple Health when it is connected (`snapshot`); otherwise labelled example
// runs. The pill shows the same monthly distance as Home.
export const RunsCard: React.FC<{ snapshot?: HealthSnapshot | null; loading?: boolean }> = ({ snapshot = null, loading = false }) => {
  const router = useRouter();
  const recorded = useRunStore((state) => state.runs);
  const now = new Date();
  const monthName = now.toLocaleDateString('he-IL', { month: 'long' });
  // Runs recorded in the app (GPS or typed in) always count; the example runs show only when there is nothing real at all.
  // While the real numbers are on their way show nothing made up (recorded runs are already on the phone and show at once).
  const waiting = loading && snapshot === null && recorded.length === 0;
  const isExample = snapshot === null && recorded.length === 0 && !waiting;
  const monthKm = isExample ? MOCK_HEALTH.runKm : bestMonthKm(snapshot ? snapshot.monthKm : null, recorded, now);

  // A walk saved in the app is named a walk; Apple Health running workouts are runs.
  const recordedIds = new Set(recorded.map((run) => run.id));
  const rows: RunRow[] = !isExample
    ? recentRuns([...(snapshot ? snapshot.runs : []), ...recorded], RUNS_SHOWN).map((run) => ({
        key: run.id,
        date: new Date(run.startedAt),
        title: recordedIds.has(run.id) && activityKind(run.km, run.durationSec) === 'walk' ? `${run.km} ק"מ · הליכה` : `${run.km} ק"מ`,
        duration: runDurationText(run.durationSec),
        pace: paceText(run.km, run.durationSec),
        kcal: run.kcal,
      }))
    : MOCK_RUNS.map((run) => ({
        key: String(run.daysAgo),
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - run.daysAgo),
        title: `${run.km} ק"מ · ${run.company}`,
        duration: run.duration,
        pace: run.pace,
      }));

  if (waiting) {
    return (
      <CardShell title="הליכות וריצות">
        <View style={styles.startRun}>
          <Button label="התחל הליכה או ריצה" variant="primary" onPress={() => router.push('/run')} />
        </View>
        <Text style={styles.empty}>טוען את הנתונים שלך...</Text>
      </CardShell>
    );
  }

  return (
    <CardShell
      title="הליכות וריצות"
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
      <View style={styles.startRun}>
        <Button label="התחל הליכה או ריצה" variant="primary" onPress={() => router.push('/run')} />
      </View>
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
              <Text style={styles.date}>{`${WEEKDAY_LETTERS[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}${run.kcal ? ` · ${run.kcal} קלוריות` : ''}`}</Text>
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
  startRun: {
    marginBottom: theme.spacing.sm,
  },
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
