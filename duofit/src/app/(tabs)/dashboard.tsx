import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Activity, Check, Flame, Footprints, LogOut, Route, Users, Zap } from 'lucide-react-native';
import { StatCarousel, StatPage } from '@components/StatCarousel';
import { WeeklyGoalRing } from '@components/WeeklyGoalRing';
import { WeekStrip } from '@components/WeekStrip';
import { UpcomingWorkoutCard } from '@components/UpcomingWorkoutCard';
import { PartnerStreakCard } from '@components/PartnerStreakCard';
import { Button } from '@components/Button';
import { useAuth } from '@hooks/useAuth';
import { useWorkoutStore, ScheduledWorkout } from '@hooks/useWorkoutStore';
import { getActivityStyle } from '@lib/activityStyles';
import { theme } from '@styles/theme';

// Target thresholds shown alongside the real numbers below — not mock data,
// just static goals until a goal-setting feature exists.
const WEEKLY_GOAL = 3;
const MONTHLY_GOAL = 12;
const PARTNERS_GOAL = 5;
const STREAK_GOAL = 7;
const RECENT_ACTIVITY_LIMIT = 5;
const PLAN_WINDOW_DAYS = 7;

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

// Example numbers only — steps/calories/running need Health Connect
// (Android) / HealthKit (iOS), which aren't available in Expo Go. Replace
// with real sensor data once the app moves to a development build.
const MOCK_HEALTH = {
  steps: 8432,
  stepsGoal: 10000,
  calories: 2140,
  caloriesGoal: 2600,
  runKm: 17.2,
  runKmGoal: 25,
};

// Elevation to lift cards off the background — Android reads `elevation`,
// iOS reads the shadow* trio.
const cardElevation = Platform.select({
  android: { elevation: 4 },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function startOfWeek(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

function formatDayAndTime(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  return `${WEEKDAY_LETTERS[date.getDay()]} ${time}`;
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

interface PartnerStreak {
  partnerId: string;
  partnerName: string;
  streak: number;
}

// Per-partner version of computeStreak, for the "ביחד ברצף" row.
function computePartnerStreaks(completedWorkouts: ScheduledWorkout[]): PartnerStreak[] {
  const byPartner = new Map<string, ScheduledWorkout[]>();
  completedWorkouts.forEach((workout) => {
    const list = byPartner.get(workout.partnerId) ?? [];
    list.push(workout);
    byPartner.set(workout.partnerId, list);
  });

  return Array.from(byPartner.entries())
    .map(([partnerId, workouts]) => ({
      partnerId,
      partnerName: workouts[0].partnerName,
      streak: computeStreak(workouts),
    }))
    .filter((entry) => entry.streak > 1)
    .sort((a, b) => b.streak - a.streak);
}

export default function Dashboard() {
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const scheduledWorkouts = useWorkoutStore((state) => state.scheduledWorkouts);

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const completedWorkouts = scheduledWorkouts
    .filter((workout) => workout.checkedIn)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const pendingWorkouts = scheduledWorkouts
    .filter((workout) => !workout.checkedIn)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const upcomingWorkout = pendingWorkouts[0];

  const planEnd = now.getTime() + PLAN_WINDOW_DAYS * 86400000;
  const weekPlan = pendingWorkouts
    .slice(1)
    .filter((workout) => new Date(workout.scheduledAt).getTime() <= planEnd);

  const workoutsThisWeek = completedWorkouts.filter(
    (workout) => new Date(workout.scheduledAt).getTime() >= weekStart
  ).length;
  const workoutsThisMonth = completedWorkouts.filter(
    (workout) => new Date(workout.scheduledAt).getTime() >= monthStart
  ).length;

  const streakDays = computeStreak(completedWorkouts);
  const partnersCount = new Set(scheduledWorkouts.map((workout) => workout.partnerId)).size;
  const partnerStreaks = computePartnerStreaks(completedWorkouts);
  const upcomingPartnerStreak = upcomingWorkout
    ? partnerStreaks.find((entry) => entry.partnerId === upcomingWorkout.partnerId)?.streak
    : undefined;

  const activeDates = new Set(completedWorkouts.map((workout) => startOfDay(new Date(workout.scheduledAt))));
  const recentActivity = completedWorkouts.slice(0, RECENT_ACTIVITY_LIMIT);

  const statPages: StatPage[] = [
    {
      key: 'health',
      badge: 'תצוגה מקדימה — נתונים לדוגמה',
      stats: [
        {
          value: MOCK_HEALTH.steps.toLocaleString('he-IL'),
          goal: '10K',
          label: 'צעדים היום',
          progress: MOCK_HEALTH.steps / MOCK_HEALTH.stepsGoal,
          color: theme.colors.magenta,
          icon: Footprints,
        },
        {
          value: MOCK_HEALTH.calories.toLocaleString('he-IL'),
          goal: '2.6K',
          label: 'קלוריות שרפת',
          progress: MOCK_HEALTH.calories / MOCK_HEALTH.caloriesGoal,
          color: theme.colors.warning,
          icon: Zap,
        },
        {
          value: String(MOCK_HEALTH.runKm),
          goal: String(MOCK_HEALTH.runKmGoal),
          label: 'ק"מ ריצה בחודש',
          progress: MOCK_HEALTH.runKm / MOCK_HEALTH.runKmGoal,
          color: theme.colors.cyan,
          icon: Route,
        },
      ],
    },
    {
      key: 'workouts',
      stats: [
        {
          value: String(workoutsThisMonth),
          goal: String(MONTHLY_GOAL),
          label: 'אימונים החודש',
          progress: workoutsThisMonth / MONTHLY_GOAL,
          color: theme.colors.magenta,
          icon: Activity,
        },
        {
          value: String(partnersCount),
          goal: String(PARTNERS_GOAL),
          label: 'שותפים',
          progress: partnersCount / PARTNERS_GOAL,
          color: theme.colors.text,
          icon: Users,
        },
        {
          value: String(streakDays),
          goal: String(STREAK_GOAL),
          label: 'ימים ברצף',
          progress: streakDays / STREAK_GOAL,
          color: theme.colors.cyan,
          icon: Flame,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <Text style={styles.wordmark}>DuoFit</Text>
          <View style={styles.topBarLeft}>
            <View style={styles.streakPill}>
              <Flame color={theme.colors.magenta} size={16} strokeWidth={2} />
              <Text style={styles.streakPillText}>{streakDays}</Text>
            </View>
            <View style={styles.avatar}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarInitial}>{user?.name?.[0] ?? '?'}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.weekStripWrapper}>
          <WeekStrip activeDates={activeDates} />
        </View>

        <WeeklyGoalRing completed={workoutsThisWeek} goal={WEEKLY_GOAL} />

        <View style={styles.statsWrapper}>
          <StatCarousel pages={statPages} />
        </View>

        {upcomingWorkout && (
          <UpcomingWorkoutCard
            workout={upcomingWorkout}
            partnerStreak={upcomingPartnerStreak}
            onCheckInPress={() => router.push({ pathname: '/check-in', params: { workoutId: upcomingWorkout.id } })}
            onMessagePress={() =>
              router.push({
                pathname: '/conversation',
                params: { partnerId: upcomingWorkout.partnerId, partnerName: upcomingWorkout.partnerName },
              })
            }
          />
        )}

        {partnerStreaks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ביחד ברצף</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partnerStreaksRow}>
              {partnerStreaks.map((entry) => (
                <PartnerStreakCard key={entry.partnerId} partnerName={entry.partnerName} streak={entry.streak} />
              ))}
            </ScrollView>
          </View>
        )}

        {weekPlan.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>התוכנית לשבוע הקרוב</Text>
            <View style={[styles.planCard, cardElevation]}>
              {weekPlan.map((workout, index) => {
                const date = new Date(workout.scheduledAt);
                const ActivityIcon = getActivityStyle(workout.activity).icon;
                return (
                  <Pressable
                    key={workout.id}
                    style={[styles.planRow, index > 0 && styles.planRowDivider]}
                    onPress={() => router.push({ pathname: '/check-in', params: { workoutId: workout.id } })}
                  >
                    <View style={styles.planDay}>
                      <Text style={styles.planDayLetter}>{WEEKDAY_LETTERS[date.getDay()]}</Text>
                      <Text style={styles.planDayDate}>{`${date.getDate()}.${date.getMonth() + 1}`}</Text>
                    </View>
                    <View style={styles.planTextWrap}>
                      <View style={styles.planTitleRow}>
                        <ActivityIcon color={theme.colors.text} size={14} strokeWidth={2} />
                        <Text style={styles.planTitle}>
                          {workout.activity} · {date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={styles.planSubtitle}>
                        עם {workout.partnerName} · {workout.location}
                      </Text>
                    </View>
                    <View style={styles.planCheck}>
                      <Check color={theme.colors.black} size={14} strokeWidth={3} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פעילות אחרונה</Text>
          {recentActivity.length > 0 ? (
            recentActivity.map((workout) => {
              const activityStyle = getActivityStyle(workout.activity);
              const ActivityIcon = activityStyle.icon;
              return (
                <View key={workout.id} style={[styles.activityRow, cardElevation]}>
                  <View style={[styles.activityIconTile, { backgroundColor: activityStyle.color }]}>
                    <ActivityIcon color={theme.colors.black} size={24} strokeWidth={2} />
                  </View>
                  <View style={styles.activityTextWrap}>
                    <Text style={styles.activityTitle}>
                      {workout.activity} עם {workout.partnerName}
                    </Text>
                    <Text style={styles.activitySubtitle}>{workout.location}</Text>
                  </View>
                  <Text style={styles.activityTime}>{formatDayAndTime(workout.scheduledAt)}</Text>
                </View>
              );
            })
          ) : (
            <View style={[styles.emptyHistory, cardElevation]}>
              <Text style={styles.emptyHistoryText}>עדיין אין לך אימונים שהושלמו</Text>
              <Button label="התחל להתאמן עכשיו" variant="primary" onPress={() => router.push('/discover')} />
            </View>
          )}
        </View>

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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  wordmark: {
    fontSize: 26,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  streakPillText: {
    fontSize: 16,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.cyan,
  },
  weekStripWrapper: {
    marginBottom: theme.spacing.lg,
  },
  statsWrapper: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    width: '100%',
    fontSize: 20,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.md,
  },
  partnerStreaksRow: {
    gap: theme.spacing.sm,
  },
  planCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 64,
    paddingVertical: theme.spacing.md,
  },
  planRowDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceHover,
  },
  planDay: {
    width: 40,
    alignItems: 'center',
  },
  planDayLetter: {
    fontSize: 18,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
  },
  planDayDate: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  planTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  planTitle: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  planSubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  planCheck: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  activityIconTile: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  activityTitle: {
    fontSize: 15,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
    textAlign: 'right',
  },
  activitySubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
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
