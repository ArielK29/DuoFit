import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { Scale } from 'lucide-react-native';
import { useWorkoutStore } from '@hooks/useWorkoutStore';
import { WeekStrip } from '@components/WeekStrip';
import { WeeklyBarChart, WeekBucket } from '@components/WeeklyBarChart';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';

const WEEKS_SHOWN = 8;
const WEEKLY_GOAL = 3;

// Mock preview only — DuoFit has no weight-tracking feature/data model yet,
// same "תצוגה מקדימה" convention already used for Dashboard/Discover mock data.
const MOCK_WEIGHT = { current: 79.4, goal: 76 };

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function buildWeeklyBuckets(scheduledAtList: string[]): WeekBucket[] {
  const today = startOfWeek(new Date());
  const buckets: WeekBucket[] = [];

  for (let i = WEEKS_SHOWN - 1; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const count = scheduledAtList.filter((iso) => {
      const date = new Date(iso);
      return date >= weekStart && date < weekEnd;
    }).length;

    buckets.push({ label: `${weekStart.getDate()}.${weekStart.getMonth() + 1}`, count });
  }

  return buckets;
}

export function ProgressScreen() {
  const scheduledWorkouts = useWorkoutStore((state) => state.scheduledWorkouts);
  const completedWorkouts = scheduledWorkouts.filter((workout) => workout.checkedIn);
  const activeDates = new Set(
    completedWorkouts.map((workout) => {
      const d = new Date(workout.scheduledAt);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    })
  );

  const weeklyBuckets = buildWeeklyBuckets(completedWorkouts.map((workout) => workout.scheduledAt));
  const weeksMetGoal = weeklyBuckets.filter((week) => week.count >= WEEKLY_GOAL).length;

  const handleLogWeight = () => {
    Alert.alert('בקרוב', 'מעקב משקל יהיה זמין בעתיד');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>ההתקדמות שלי</Text>

        <View style={styles.previewBadge}>
          <Text style={styles.previewBadgeText}>תצוגה מקדימה — משקל לדוגמה</Text>
        </View>

        <Card style={styles.weightCard}>
          <View style={styles.weightHeader}>
            <Scale color={theme.colors.textSecondary} size={18} strokeWidth={2} />
            <Text style={styles.weightLabel}>המשקל שלך</Text>
          </View>
          <Text style={styles.weightValue}>{MOCK_WEIGHT.current} ק"ג</Text>
          <View style={styles.weightBarTrack}>
            <View
              style={[
                styles.weightBarFill,
                { width: `${Math.min(100, (MOCK_WEIGHT.goal / MOCK_WEIGHT.current) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.weightGoalText}>יעד: {MOCK_WEIGHT.goal} ק"ג</Text>
          <View style={styles.logWeightButton}>
            <Button label="רשום משקל" variant="secondary" onPress={handleLogWeight} />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>רצף שבועי</Text>
          <WeekStrip activeDates={activeDates} />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>אימונים בשבוע (8 שבועות אחרונים)</Text>
          <WeeklyBarChart weeks={weeklyBuckets} goal={WEEKLY_GOAL} />
          <Text style={styles.consistencyText}>
            עמדת ביעד ב-{weeksMetGoal} מתוך {WEEKS_SHOWN} השבועות האחרונים
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    paddingVertical: theme.spacing.xl,
  },
  title: {
    width: '100%',
    fontSize: 28,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.md,
  },
  previewBadge: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  previewBadgeText: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
  },
  weightCard: {
    marginBottom: theme.spacing.md,
  },
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  weightLabel: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  weightValue: {
    fontSize: 32,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  weightBarTrack: {
    height: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  weightBarFill: {
    height: '100%',
    backgroundColor: theme.colors.cyan,
  },
  weightGoalText: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.md,
  },
  logWeightButton: {
    alignSelf: 'stretch',
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    width: '100%',
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.md,
  },
  consistencyText: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});
