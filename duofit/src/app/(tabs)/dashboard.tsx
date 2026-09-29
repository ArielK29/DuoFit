import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, LogOut, Users, Zap } from 'lucide-react-native';
import { ProgressRing } from '@components/ProgressRing';
import { useAuth } from '@hooks/useAuth';
import { theme } from '@styles/theme';

// Static placeholder data. This screen is a visual mockup only (per issue #2)
// — there is no backend yet (#15) and no completed check-ins to show real
// numbers for, so every value here is an example, not live data.
const MOCK_STATS = {
  streakDays: 4,
  streakGoal: 7,
  workouts: 12,
  workoutsGoal: 15,
  partners: 3,
  partnersGoal: 5,
};

const MOCK_HISTORY = [
  { id: '1', title: 'ריצה עם דניאל', date: 'אתמול' },
  { id: '2', title: 'כושר גופני עם נועה', date: 'לפני 3 ימים' },
  { id: '3', title: 'יוגה עם תומר', date: 'לפני שבוע' },
];

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

export default function Dashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.previewBadge}>
          <Text style={styles.previewBadgeText}>תצוגה מקדימה — נתוני דוגמה</Text>
        </View>

        <Text style={styles.title}>לוח הבקרה שלי</Text>

        <View style={[styles.heroCard, cardElevation]}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroValue}>
              {MOCK_STATS.streakDays}
              <Text style={styles.heroGoal}>/{MOCK_STATS.streakGoal}</Text>
            </Text>
            <Text style={styles.heroLabel}>ימים ברצף השבוע</Text>
          </View>
          <ProgressRing
            size={88}
            strokeWidth={10}
            progress={MOCK_STATS.streakDays / MOCK_STATS.streakGoal}
            color={theme.colors.cyan}
            trackColor={theme.colors.surfaceHover}
          >
            <Zap color={theme.colors.cyan} size={28} strokeWidth={2} />
          </ProgressRing>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, cardElevation]}>
            <Text style={styles.statValue}>
              {MOCK_STATS.workouts}
              <Text style={styles.statGoal}>/{MOCK_STATS.workoutsGoal}</Text>
            </Text>
            <Text style={styles.statLabel}>אימונים החודש</Text>
            <ProgressRing
              size={52}
              strokeWidth={6}
              progress={MOCK_STATS.workouts / MOCK_STATS.workoutsGoal}
              color={theme.colors.magenta}
              trackColor={theme.colors.surfaceHover}
            >
              <Activity color={theme.colors.magenta} size={18} strokeWidth={2} />
            </ProgressRing>
          </View>

          <View style={[styles.statCard, cardElevation]}>
            <Text style={styles.statValue}>
              {MOCK_STATS.partners}
              <Text style={styles.statGoal}>/{MOCK_STATS.partnersGoal}</Text>
            </Text>
            <Text style={styles.statLabel}>שותפים פעילים</Text>
            <ProgressRing
              size={52}
              strokeWidth={6}
              progress={MOCK_STATS.partners / MOCK_STATS.partnersGoal}
              color={theme.colors.text}
              trackColor={theme.colors.surfaceHover}
            >
              <Users color={theme.colors.text} size={18} strokeWidth={2} />
            </ProgressRing>
          </View>
        </View>

        <Text style={styles.sectionLabel}>היסטוריית אימונים</Text>
        {MOCK_HISTORY.map((item) => (
          <View key={item.id} style={[styles.historyRow, cardElevation]}>
            <View style={styles.historyIconWrap}>
              <Activity color={theme.colors.textSecondary} size={20} strokeWidth={2} />
            </View>
            <View style={styles.historyTextWrap}>
              <Text style={styles.historyTitle}>{item.title}</Text>
              <Text style={styles.historyDate}>{item.date}</Text>
            </View>
          </View>
        ))}

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
  title: {
    width: '100%',
    fontSize: 28,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.lg,
  },
  heroCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  heroTextBlock: {
    alignItems: 'flex-end',
  },
  heroValue: {
    fontSize: 40,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.text,
  },
  heroGoal: {
    fontSize: 18,
    fontFamily: theme.typography.display.fontFamily,
    color: theme.colors.textTertiary,
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
