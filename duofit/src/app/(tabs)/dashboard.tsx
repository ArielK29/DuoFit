import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Check, Dumbbell, Flame, Footprints, PhoneOff, Route, Trophy, Users, X, Zap } from 'lucide-react-native';
import { StatCarousel, StatPage } from '@components/StatCarousel';
import { HeroStatCard } from '@components/HeroStatCard';
import { WeekStrip } from '@components/WeekStrip';
import { UpcomingWorkoutCard } from '@components/UpcomingWorkoutCard';
import { PartnerStreakCard } from '@components/PartnerStreakCard';
import { SuggestedPartnerCard } from '@components/SuggestedPartnerCard';
import { NearbyPartnersRow } from '@components/NearbyPartnersRow';
import { Button } from '@components/Button';
import { NotificationBell } from '@components/NotificationBell';
import { StickyActionBar, STICKY_BAR_CLEARANCE } from '@components/StickyActionBar';
import { useAccountSheet } from '@hooks/useAccountSheet';
import { useAuth } from '@hooks/useAuth';
import { useWorkoutStore } from '@hooks/useWorkoutStore';
import { usePartnerMatching, PartnerWithDistance } from '@hooks/usePartnerMatching';
import { useCommunityStore } from '@hooks/useCommunityStore';
import { useProgressStore } from '@hooks/useProgressStore';
import { MOCK_HEALTH } from '@constants/mockHealth';
import { getActivityStyle } from '@lib/activityStyles';
import { computePlankRank, getPlankSeconds } from '@lib/plank';
import { computePartnerStreaks, computeStreak } from '@lib/streaks';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';

// Target thresholds shown alongside the real numbers below — not mock data.
const PARTNERS_GOAL = 5;
const RECENT_ACTIVITY_LIMIT = 5;
const NEARBY_PARTNERS_LIMIT = 3;
const PLAN_WINDOW_DAYS = 7;

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

// Example numbers only — screen time needs Android Digital Wellbeing / iOS
// Screen Time access (not available in Expo Go), and the plank challenge
// doesn't exist as a real feature yet.
const MOCK_WELLBEING = {
  realLifeHours: 4.2,
  screenTimeDropHours: 6.5,
};

function getWeeklyEncouragement(completed: number, goal: number): string {
  const remaining = goal - completed;
  if (remaining <= 0) return 'עברת את היעד השבוע! כל הכבוד';
  if (remaining === 1) return 'עוד אימון אחד ליעד';
  return `עוד ${remaining} אימונים ליעד`;
}

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

export default function Dashboard() {
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const scheduledWorkouts = useWorkoutStore((state) => state.scheduledWorkouts);
  // Plank rank follows the record set in the Community challenge (an example
  // value until the first real attempt).
  const plankBestSeconds = useCommunityStore((state) => state.plankBestSeconds);
  const plankSeconds = getPlankSeconds(plankBestSeconds);
  const plankRank = plankSeconds === null ? null : computePlankRank(plankSeconds);
  const weeklyGoal = useProgressStore((state) => state.weeklyGoal);

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
  // Real "no-shows": workouts scheduled earlier this month whose time has
  // passed without a check-in.
  const noShowsThisMonth = pendingWorkouts.filter((workout) => {
    const time = new Date(workout.scheduledAt).getTime();
    return time >= monthStart && time < now.getTime();
  }).length;

  const streakDays = computeStreak(completedWorkouts);
  const partnersCount = new Set(scheduledWorkouts.map((workout) => workout.partnerId)).size;
  const partnerStreaks = computePartnerStreaks(completedWorkouts);
  const upcomingPartnerStreak = upcomingWorkout
    ? partnerStreaks.find((entry) => entry.partnerId === upcomingWorkout.partnerId)?.streak
    : undefined;

  const activeDates = new Set(completedWorkouts.map((workout) => startOfDay(new Date(workout.scheduledAt))));
  const recentActivity = completedWorkouts.slice(0, RECENT_ACTIVITY_LIMIT);

  // Daily suggested partner: prefer people the user hasn't scheduled with
  // yet, rotating by calendar day so the pick is stable within a day.
  const { candidates, isLoading: partnersLoading } = usePartnerMatching();
  const scheduledPartnerIds = new Set(scheduledWorkouts.map((workout) => workout.partnerId));
  const freshCandidates = candidates.filter((candidate) => !scheduledPartnerIds.has(candidate.id));
  const suggestionPool = freshCandidates.length > 0 ? freshCandidates : candidates;
  const dayIndex = Math.floor(startOfDay(now) / 86400000);
  const suggestedPartner =
    suggestionPool.length > 0 ? suggestionPool[dayIndex % suggestionPool.length] : undefined;
  const suggestedSharedActivity = suggestedPartner?.activities.find((activity) =>
    user?.favoriteActivities.includes(activity)
  );
  const nearbyPartners = candidates
    .filter((candidate) => candidate.id !== suggestedPartner?.id)
    .slice(0, NEARBY_PARTNERS_LIMIT);

  const openPartner = (partner: PartnerWithDistance) =>
    router.push({
      pathname: '/partner-profile',
      params: { partnerId: partner.id, distanceKm: partner.distanceKm.toFixed(1) },
    });
  const invitePartner = (partner: PartnerWithDistance) =>
    router.push({
      pathname: '/schedule-workout',
      params: { partnerId: partner.id, partnerName: partner.name, activity: partner.activities[0] ?? 'אימון משותף' },
    });

  const statPages: StatPage[] = [
    {
      key: 'workouts',
      hero: (
        <HeroStatCard
          value={String(workoutsThisWeek)}
          suffix={`/${weeklyGoal}`}
          label="אימונים השבוע"
          subtext={getWeeklyEncouragement(workoutsThisWeek, weeklyGoal)}
          progress={workoutsThisWeek / weeklyGoal}
          color={theme.colors.cyan}
          icon={Dumbbell}
        />
      ),
      stats: [
        {
          value: MOCK_HEALTH.steps.toLocaleString('he-IL'),
          goal: '10K',
          label: 'צעדים היום',
          progress: MOCK_HEALTH.steps / MOCK_HEALTH.stepsGoal,
          color: theme.colors.magenta,
          icon: Footprints,
          isExample: true,
        },
        {
          value: MOCK_HEALTH.calories.toLocaleString('he-IL'),
          goal: '2.6K',
          label: 'קלוריות שרפת',
          progress: MOCK_HEALTH.calories / MOCK_HEALTH.caloriesGoal,
          color: theme.colors.warning,
          icon: Zap,
          isExample: true,
        },
        {
          value: String(MOCK_HEALTH.runKm),
          goal: String(MOCK_HEALTH.runKmGoal),
          label: 'ק"מ ריצה בחודש',
          progress: MOCK_HEALTH.runKm / MOCK_HEALTH.runKmGoal,
          color: theme.colors.cyan,
          icon: Route,
          isExample: true,
        },
      ],
    },
    {
      key: 'wellbeing',
      hero: (
        <HeroStatCard
          value={String(MOCK_WELLBEING.realLifeHours)}
          suffix=" שע'"
          label="Real Life Time השבוע"
          subtext={`↓ ${MOCK_WELLBEING.screenTimeDropHours} שעות מסך פחות משבוע שעבר`}
          subtextColor={theme.colors.cyan}
          progress={0.7}
          color={theme.colors.cyan}
          icon={PhoneOff}
          isExample
        />
      ),
      stats: [
        {
          value: plankRank === null ? '—' : `#${plankRank}`,
          label: 'באתגר הפלאנק',
          progress: 0.6,
          color: theme.colors.cyan,
          icon: Trophy,
          isExample: plankBestSeconds === null && plankSeconds !== null,
        },
        {
          value: String(noShowsThisMonth),
          label: 'הברזות החודש',
          progress: 1,
          color: noShowsThisMonth === 0 ? theme.colors.cyan : theme.colors.magenta,
          icon: noShowsThisMonth === 0 ? Check : X,
        },
        {
          value: String(partnersCount),
          label: 'אנשים פגשת',
          progress: Math.min(1, partnersCount / PARTNERS_GOAL),
          color: theme.colors.warning,
          icon: Users,
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
            <NotificationBell />
            <View style={styles.streakPill}>
              <Flame color={theme.colors.magenta} size={16} strokeWidth={2} />
              <Text style={styles.streakPillText}>{streakDays}</Text>
            </View>
            <Pressable
              style={styles.avatar}
              onPress={() => useAccountSheet.getState().open()}
              accessibilityRole="button"
              accessibilityLabel="החשבון שלי"
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarInitial}>{user?.name?.[0] ?? '?'}</Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.weekStripWrapper}>
          <WeekStrip activeDates={activeDates} />
        </View>

        <View style={styles.statsWrapper}>
          <StatCarousel pages={statPages} />
        </View>

        {upcomingWorkout && (
          <UpcomingWorkoutCard
            workout={upcomingWorkout}
            partnerStreak={upcomingPartnerStreak}
            showCheckIn={false}
            onCheckInPress={() => router.push({ pathname: '/check-in', params: { workoutId: upcomingWorkout.id } })}
            onMessagePress={() =>
              router.push({
                pathname: '/conversation',
                params: { partnerId: upcomingWorkout.partnerId, partnerName: upcomingWorkout.partnerName },
              })
            }
          />
        )}

        {!partnersLoading && suggestedPartner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>שותף מוצע היום</Text>
            <Text style={styles.sectionHint}>מתוך מאגר שותפים לדוגמה</Text>
            <SuggestedPartnerCard
              partner={suggestedPartner}
              sharedActivity={suggestedSharedActivity}
              onViewProfile={() => openPartner(suggestedPartner)}
              onInvite={() => invitePartner(suggestedPartner)}
            />
          </View>
        )}

        {!partnersLoading && nearbyPartners.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>שותפים קרובים אליך</Text>
            <NearbyPartnersRow partners={nearbyPartners} onOpen={openPartner} onInvite={invitePartner} />
          </View>
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

      </ScrollView>

      {upcomingWorkout && (
        <StickyActionBar>
          <View style={styles.stickyAction}>
            <Button
              label="סיימתי את האימון"
              variant="primary"
              size="lg"
              onPress={() => router.push({ pathname: '/check-in', params: { workoutId: upcomingWorkout.id } })}
            />
          </View>
        </StickyActionBar>
      )}
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
    paddingTop: theme.spacing.xl,
    paddingBottom: STICKY_BAR_CLEARANCE,
  },
  stickyAction: {
    flex: 1,
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
    ...visualRightText,
    marginBottom: theme.spacing.md,
  },
  sectionHint: {
    width: '100%',
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    ...visualRightText,
    marginTop: -theme.spacing.sm,
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
