import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, LogOut, Users } from 'lucide-react-native';
import { ProgressRing } from '@components/ProgressRing';
import { StreakDisplay } from '@components/StreakDisplay';
import { WeekStrip } from '@components/WeekStrip';
import { UpcomingWorkoutCard } from '@components/UpcomingWorkoutCard';
import { Button } from '@components/Button';
import { useAuth } from '@hooks/useAuth';
import { useWorkoutStore, ScheduledWorkout } from '@hooks/useWorkoutStore';
import { theme } from '@styles/theme';

// Target thresholds shown alongside the real numbers below — not mock data,
// just static goals until a goal-setting feature exists.
const STREAK_GOAL = 7;
const WORKOUTS_GOAL = 12;
const PARTNERS_GOAL = 5;

// Elevation to lift cards off the background, matching the reference design's
// floating-card look — Android reads `elevation`, iOS reads the shadow* trio.
const cardElevation = Platform.select({
  android: { elevation: 4 },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);

  if (diffDays === 0) return 'היום';
  if (diffDays === 1) return 'אתמול';
  if (diffDays > 1 && diffDays < 7) return `לפני ${diffDays} ימים`;
  if (diffDays >= 7 && diffDays < 14) return 'לפני שבוע';
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
}

// Longest run of consecutive calendar days ending at the most recent
// check-in — simple streak definition, no "did you break it today" logic.
function computeStreak(workouts: ScheduledWorkout[]): number {
  if (workouts.length === 0) return 0;

  const dayKeys = Array.from(
    new Set(workouts.map((workout) => new Date(workout.scheduledAt).toDateString()))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 1;
  for (let i = 1; i < dayKeys.length; i++) {
    const diff = (new Date(dayKeys[i - 1]).getTime() - new Date(dayKeys[i]).getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export default function Dashboard() {
  const router = useRouter();
  const scheduledWorkouts = useWorkoutStore((state) => state.scheduledWorkouts);

  const completedWorkouts = scheduledWorkouts
    .filter((workout) => workout.checkedIn)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const upcomingWorkout = scheduledWorkouts
    .filter((workout) => !workout.checkedIn)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const streakDays = computeStreak(completedWorkouts);
  const partnersCount = new Set(scheduledWorkouts.map((workout) => workout.partnerId)).size;
  const hasHistory = completedWorkouts.length > 0;

  const activeDates = new Set(
    completedWorkouts.map((workout) => {
      const d = new Date(workout.scheduledAt);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    })
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>לוח הבקרה שלי</Text>

        <View style={styles.weekStripWrapper}>
          <WeekStrip activeDates={activeDates} />
        </View>

        <StreakDisplay days={streakDays} goal={STREAK_GOAL} />

        <View style={styles.statsRow}>
          <View style={[styles.statCard, cardElevation]}>
            <Text style={styles.statValue}>
              {completedWorkouts.length}
              <Text style={styles.statGoal}>/{WORKOUTS_GOAL}</Text>
            </Text>
            <Text style={styles.statLabel}>אימונים החודש</Text>
            <ProgressRing
              size={52}
              strokeWidth={6}
              progress={completedWorkouts.length / WORKOUTS_GOAL}
              color={theme.colors.magenta}
              trackColor={theme.colors.surfaceHover}
            >
              <Activity color={theme.colors.magenta} size={18} strokeWidth={2} />
            </ProgressRing>
          </View>

          <View style={[styles.statCard, cardElevation]}>
            <Text style={styles.statValue}>
              {partnersCount}
              <Text style={styles.statGoal}>/{PARTNERS_GOAL}</Text>
            </Text>
            <Text style={styles.statLabel}>שותפים פעילים</Text>
            <ProgressRing
              size={52}
              strokeWidth={6}
              progress={partnersCount / PARTNERS_GOAL}
              color={theme.colors.text}
              trackColor={theme.colors.surfaceHover}
            >
              <Users color={theme.colors.text} size={18} strokeWidth={2} />
            </ProgressRing>
          </View>
        </View>

        {upcomingWorkout && (
          <UpcomingWorkoutCard
            workout={upcomingWorkout}
            onPress={() => router.push({ pathname: '/check-in', params: { workoutId: upcomingWorkout.id } })}
          />
        )}

        <Text style={styles.sectionLabel}>היסטוריית אימונים</Text>
        {hasHistory ? (
          completedWorkouts.map((workout) => (
            <View key={workout.id} style={[styles.historyRow, cardElevation]}>
              <View style={styles.historyIconWrap}>
                <Activity color={theme.colors.textSecondary} size={20} strokeWidth={2} />
              </View>
              <View style={styles.historyTextWrap}>
                <Text style={styles.historyTitle}>
                  {workout.activity} עם {workout.partnerName}
                </Text>
                <Text style={styles.historyDate}>{formatRelativeDate(workout.scheduledAt)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyHistory, cardElevation]}>
            <Text style={styles.emptyHistoryText}>עדיין אין לך אימונים שהושלמו</Text>
            <Button label="התחל להתאמן עכשיו" variant="primary" onPress={() => router.push('/discover')} />
          </View>
        )}

        {__DEV__ && (
          <Pressable
            onPress={() => {
              useAuth.getState().logout();
              router.replace('/login');
            }}
            style={styles.backButton}
          >
            <LogOut color={theme.colors.magenta} size={20} strokeWidth={2} />
            <Text style={styles.backButtonText}>התנתק (לבדיקות)</Text>
          </Pressable>
        )}
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
    marginBottom: theme.spacing.lg,
  },
  weekStripWrapper: {
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  statValue: {
    fontSize: 22,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  statGoal: {
    fontSize: 13,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.textTertiary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  sectionLabel: {
    width: '100%',
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  historyTitle: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
  },
  historyDate: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  emptyHistory: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyHistoryText: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  backButtonText: {
    color: theme.colors.magenta,
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
  },
});
