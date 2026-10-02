import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { Check, ChevronLeft, Flame } from 'lucide-react-native';
import { formatKg } from '@lib/progress';
import { theme } from '@styles/theme';

const WEEKDAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

interface StreakCardProps {
  weeks: number;
  activeDays: boolean[]; // Sunday first, true if a workout was completed that day
}

// Real: consecutive weeks that met the weekly goal + which days of this week
// had a completed workout.
export const StreakCard: React.FC<StreakCardProps> = ({ weeks, activeDays }) => (
  <View style={[styles.card, styles.streakCard]}>
    <View style={styles.flameWrap}>
      <Flame color={theme.colors.magenta} fill={theme.colors.magenta} size={84} strokeWidth={1.5} />
      <View style={styles.flameNumberWrap}>
        <Text style={styles.flameNumber}>{weeks}</Text>
      </View>
    </View>
    <Text style={styles.streakLabel}>שבועות ברצף ביעד</Text>
    <View style={styles.daysRow}>
      {WEEKDAY_LETTERS.map((letter, index) => (
        <View key={letter} style={styles.dayColumn}>
          <Text style={styles.dayLetter}>{letter}</Text>
          <View style={[styles.dayDot, activeDays[index] && styles.dayDotActive]}>
            {activeDays[index] && <Check color={theme.colors.black} size={12} strokeWidth={3.5} />}
          </View>
        </View>
      ))}
    </View>
  </View>
);

interface WeightCardProps {
  kg: number;
  goalKg: number;
  progress: number; // 0..1
  isExample: boolean;
  onLog: () => void;
}

export const WeightCard: React.FC<WeightCardProps> = ({ kg, goalKg, progress, isExample, onLog }) => (
  <View style={[styles.card, styles.weightCard]}>
    <View style={styles.weightBody}>
      <Text style={styles.weightLabel}>{isExample ? 'המשקל שלך · לדוגמה' : 'המשקל שלך'}</Text>
      <Text style={styles.weightValue}>{`${formatKg(kg)} ק"ג`}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(4, progress * 100)}%` }]} />
      </View>
      <Text style={styles.goalLabel}>יעד</Text>
      <Text style={styles.goalValue}>{`${formatKg(goalKg).replace('.0', '')} ק"ג`}</Text>
    </View>
    <Pressable style={styles.logButton} onPress={onLog} accessibilityLabel="רשום משקל">
      <Text style={styles.logText}>רשום משקל</Text>
      <ChevronLeft color={theme.colors.black} size={20} strokeWidth={2.5} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.xl * 1.5,
    overflow: 'hidden',
  },
  streakCard: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  flameWrap: {
    width: 84,
    height: 92,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  flameNumberWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 22,
  },
  flameNumber: {
    fontSize: 26,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.black,
  },
  streakLabel: {
    fontSize: 15,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.magenta,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dayColumn: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dayLetter: {
    fontSize: 10,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  dayDot: {
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotActive: {
    backgroundColor: theme.colors.magenta,
  },
  weightCard: {
    justifyContent: 'space-between',
  },
  weightBody: {
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  weightLabel: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  weightValue: {
    fontSize: 30,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
    marginVertical: theme.spacing.sm,
  },
  track: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  fill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.text,
  },
  goalLabel: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  goalValue: {
    fontSize: 26,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    backgroundColor: theme.colors.magenta,
    paddingHorizontal: theme.spacing.lg,
  },
  logText: {
    fontSize: 16,
    fontFamily: theme.typography.button.fontFamily,
    color: theme.colors.black,
  },
});
