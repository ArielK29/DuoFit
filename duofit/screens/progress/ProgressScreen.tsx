import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Button } from '@components/Button';
import { HeaderActions } from '@components/HeaderActions';
import { HealthConnectCard } from '@components/HealthConnectCard';
import { StickyActionBar, STICKY_BAR_CLEARANCE } from '@components/StickyActionBar';
import { useWorkoutStore } from '@hooks/useWorkoutStore';
import { useHealthData } from '@hooks/useHealthData';
import { useToday } from '@hooks/useToday';
import { useRunStore } from '@hooks/useRunStore';
import { useProgressStore, EXAMPLE_GOAL_WEIGHT } from '@hooks/useProgressStore';
import { RunsCard } from '@screens/progress/RunsCard';
import { GoalSheet, WeightSheet } from '@screens/progress/ProgressSheets';
import { StepsCard } from '@screens/progress/StepsCard';
import { StreakCard, WeightCard } from '@screens/progress/SummaryCards';
import { WeightTrendCard } from '@screens/progress/WeightTrendCard';
import { WorkoutsCard } from '@screens/progress/WorkoutsCard';
import { buildExampleWeights, computeGoalStreakWeeks, goalProgress, toWeightPoints } from '@lib/progress';
import { useLayout } from '@lib/useLayout';
import { theme } from '@styles/theme';

function startOfDay(iso: string): number {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function ProgressScreen() {
  const { isSmall } = useLayout();
  const scheduledWorkouts = useWorkoutStore((state) => state.scheduledWorkouts);
  const { weeklyGoal, goalWeight, weightLog } = useProgressStore();
  const health = useHealthData();
  useToday(); // the week and the charts roll over at 00:00
  const { setWeeklyGoal, logWeight } = useProgressStore.getState();

  const [weightSheetVisible, setWeightSheetVisible] = useState(false);
  const [goalSheetVisible, setGoalSheetVisible] = useState(false);

  const now = new Date();
  const recordedRuns = useRunStore((state) => state.runs);
  // Shared workouts checked in, plus runs recorded in the app: each is a day of training.
  const completedIso = [
    ...scheduledWorkouts.filter((workout) => workout.checkedIn).map((workout) => workout.scheduledAt),
    ...recordedRuns.map((run) => run.startedAt),
  ];

  // Streak + this week's days (real)
  const streakWeeks = computeGoalStreakWeeks(completedIso, weeklyGoal, now);
  const activeDates = new Set(completedIso.map(startOfDay));
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const activeDays = Array.from({ length: 7 }, (_, index) =>
    activeDates.has(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index).getTime())
  );

  // Weight: real log, or an example journey until the first entry
  const isExampleWeight = weightLog.length === 0;
  const weightPoints = isExampleWeight ? buildExampleWeights(now) : toWeightPoints(weightLog);
  const goalKg = goalWeight ?? EXAMPLE_GOAL_WEIGHT;
  const startKg = weightPoints[0].kg;
  const currentKg = weightPoints[weightPoints.length - 1].kg;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>התקדמות</Text>
          <HeaderActions />
        </View>

        {health.mode === 'example' && (
          <View style={styles.previewPill}>
            <Text style={styles.previewPillText}>תצוגה מקדימה — צעדים וריצות לדוגמה</Text>
          </View>
        )}

        <View style={[styles.summaryRow, isSmall && styles.summaryColumn]}>
          <WeightCard
            kg={currentKg}
            goalKg={goalKg}
            progress={goalProgress(startKg, currentKg, goalKg)}
            isExample={isExampleWeight}
            onLog={() => setWeightSheetVisible(true)}
            showLogButton={false}
          />
          <StreakCard weeks={streakWeeks} activeDays={activeDays} />
        </View>

        <WorkoutsCard completedIso={completedIso} goal={weeklyGoal} onEditGoal={() => setGoalSheetVisible(true)} />
        <WeightTrendCard points={weightPoints} goalKg={goalKg} isExample={isExampleWeight} />
        {health.mode === 'connect' && (
          <HealthConnectCard loading={health.loading} failed={health.failed} onConnect={health.connect} />
        )}
        <StepsCard snapshot={health.mode === 'live' ? health.snapshot : null} loading={health.mode === 'loading'} />
        <RunsCard snapshot={health.mode === 'live' ? health.snapshot : null} loading={health.mode === 'loading'} />
      </ScrollView>

      {/* Logging a weight is the main action here, so it sits in the thumb zone. */}
      <StickyActionBar>
        <View style={styles.stickyAction}>
          <Button label="רשום משקל" variant="primary" size="lg" onPress={() => setWeightSheetVisible(true)} />
        </View>
      </StickyActionBar>

      <WeightSheet
        visible={weightSheetVisible}
        currentKg={currentKg}
        goalKg={goalKg}
        onSave={logWeight}
        onClose={() => setWeightSheetVisible(false)}
      />
      <GoalSheet
        visible={goalSheetVisible}
        goal={weeklyGoal}
        onSave={setWeeklyGoal}
        onClose={() => setGoalSheetVisible(false)}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 34,
    fontFamily: theme.typography.h1.fontFamily,
    color: theme.colors.text,
  },
  previewPill: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  previewPillText: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  // Small phones stack the weight and streak cards so neither is squeezed.
  summaryColumn: {
    flexDirection: 'column',
  },
  stickyAction: {
    flex: 1,
  },
});
